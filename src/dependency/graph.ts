import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { requirePro } from '../license/gumroad';
import { t } from '../i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluginMeta {
  name: string;
  base: string[];
  orderAfter: string[];
  orderBefore: string[];
}

interface GraphIssue {
  type: 'circular' | 'missing' | 'ordering';
  message: string;
  plugins: string[];
}

interface GraphData {
  plugins: PluginMeta[];
  loadOrder: string[];
  issues: GraphIssue[];
}

// ---------------------------------------------------------------------------
// Annotation parsing
// ---------------------------------------------------------------------------

/**
 * Parses a single plugin JS file and extracts dependency-related annotations.
 */
function parsePluginFile(filePath: string): PluginMeta | undefined {
  const content = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath, '.js');

  // Only look at the first annotation block (/*: ... */)
  const blockMatch = content.match(/\/\*:([\s\S]*?)\*\//);
  if (!blockMatch) return undefined;

  const block = blockMatch[1];
  const base: string[] = [];
  const orderAfter: string[] = [];
  const orderBefore: string[] = [];

  for (const line of block.split('\n')) {
    const trimmed = line.replace(/^\s*\*?\s*/, '');
    const tagMatch = trimmed.match(/^@(\w+)\s+(.*)/);
    if (!tagMatch) continue;

    const [, tag, value] = tagMatch;
    const v = value.trim();
    if (!v) continue;

    if (tag === 'base') base.push(v);
    else if (tag === 'orderAfter') orderAfter.push(v);
    else if (tag === 'orderBefore') orderBefore.push(v);
  }

  return { name, base, orderAfter, orderBefore };
}

/**
 * Reads the load order from `js/plugins.js`.
 */
function readLoadOrder(pluginsJsPath: string): string[] {
  if (!fs.existsSync(pluginsJsPath)) return [];

  const content = fs.readFileSync(pluginsJsPath, 'utf-8');
  // plugins.js defines `var $plugins = [ ... ];`
  const match = content.match(/\$plugins\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];

  try {
    const arr: { name: string }[] = JSON.parse(match[1]);
    return arr.map((p) => p.name);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Graph analysis
// ---------------------------------------------------------------------------

/**
 * Builds the dependency graph data from a project folder.
 */
function buildGraphData(projectRoot: string): GraphData {
  const pluginsDir = path.join(projectRoot, 'js', 'plugins');
  const pluginsJsPath = path.join(projectRoot, 'js', 'plugins.js');

  const plugins: PluginMeta[] = [];
  const nameSet = new Set<string>();

  if (fs.existsSync(pluginsDir)) {
    for (const file of fs.readdirSync(pluginsDir)) {
      if (!file.endsWith('.js')) continue;
      const meta = parsePluginFile(path.join(pluginsDir, file));
      if (meta) {
        plugins.push(meta);
        nameSet.add(meta.name);
      }
    }
  }

  const loadOrder = readLoadOrder(pluginsJsPath);
  const issues: GraphIssue[] = [];

  // Detect missing dependencies
  for (const plugin of plugins) {
    for (const dep of plugin.base) {
      if (!nameSet.has(dep)) {
        issues.push({
          type: 'missing',
          message: `"${plugin.name}" requires @base "${dep}" which is not installed`,
          plugins: [plugin.name, dep],
        });
      }
    }
  }

  // Detect circular dependencies (using @base edges)
  detectCycles(plugins, issues);

  // Detect ordering violations against actual load order
  if (loadOrder.length > 0) {
    const orderIndex = new Map<string, number>();
    loadOrder.forEach((n, i) => orderIndex.set(n, i));

    for (const plugin of plugins) {
      const myIdx = orderIndex.get(plugin.name);
      if (myIdx === undefined) continue;

      for (const dep of [...plugin.base, ...plugin.orderAfter]) {
        const depIdx = orderIndex.get(dep);
        if (depIdx !== undefined && depIdx > myIdx) {
          issues.push({
            type: 'ordering',
            message: `"${plugin.name}" should load after "${dep}" but is listed before it in plugins.js`,
            plugins: [plugin.name, dep],
          });
        }
      }

      for (const dep of plugin.orderBefore) {
        const depIdx = orderIndex.get(dep);
        if (depIdx !== undefined && depIdx < myIdx) {
          issues.push({
            type: 'ordering',
            message: `"${plugin.name}" should load before "${dep}" but is listed after it in plugins.js`,
            plugins: [plugin.name, dep],
          });
        }
      }
    }
  }

  return { plugins, loadOrder, issues };
}

/**
 * Simple DFS cycle detection over @base edges.
 */
function detectCycles(plugins: PluginMeta[], issues: GraphIssue[]): void {
  const adj = new Map<string, string[]>();
  for (const p of plugins) {
    adj.set(p.name, [...p.base]);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart);
      cycle.push(node);
      issues.push({
        type: 'circular',
        message: `Circular dependency: ${cycle.join(' → ')}`,
        plugins: cycle,
      });
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const dep of adj.get(node) ?? []) {
      dfs(dep);
    }

    path.pop();
    stack.delete(node);
  }

  for (const p of plugins) {
    dfs(p.name);
  }
}

// ---------------------------------------------------------------------------
// Webview
// ---------------------------------------------------------------------------

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Creates or reveals the dependency graph webview panel.
 */
export function showDependencyGraph(context: vscode.ExtensionContext): void {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage(t('noWorkspaceFolder'));
    return;
  }

  const projectRoot = folders[0].uri.fsPath;
  const data = buildGraphData(projectRoot);

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    currentPanel.webview.html = getWebviewContent(data);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'rmmzDependencyGraph',
    t('graph.panelTitle'),
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  currentPanel.webview.html = getWebviewContent(data);

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  }, null, context.subscriptions);
}

/**
 * Registers the dependency graph command.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rmmz.showDependencyGraph', () => {
      if (!requirePro('Dependency Graph')) return;
      showDependencyGraph(context);
    })
  );
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

function getWebviewContent(data: GraphData): string {
  const graphJson = JSON.stringify(data);

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plugin Dependency Graph</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1e1e2e;
      color: #cdd6f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    #header {
      padding: 12px 20px;
      background: #181825;
      border-bottom: 1px solid #313244;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    #header h1 {
      font-size: 14px;
      font-weight: 600;
    }
    #header .stat {
      font-size: 12px;
      color: #a6adc8;
    }
    #issues-panel {
      max-height: 120px;
      overflow-y: auto;
      background: #181825;
      border-bottom: 1px solid #313244;
    }
    .issue {
      padding: 6px 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .issue .badge {
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-circular { background: #f38ba8; color: #1e1e2e; }
    .badge-missing  { background: #fab387; color: #1e1e2e; }
    .badge-ordering { background: #f9e2af; color: #1e1e2e; }
    #graph-container {
      width: 100vw;
      height: calc(100vh - 48px);
      overflow: hidden;
      cursor: grab;
    }
    #graph-container.has-issues {
      height: calc(100vh - 48px - 120px);
    }
    #graph-container.panning {
      cursor: grabbing;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    #zoom-controls {
      position: fixed;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 4px;
      z-index: 10;
    }
    #zoom-controls button {
      width: 32px;
      height: 32px;
      border: 1px solid #313244;
      border-radius: 6px;
      background: #181825;
      color: #cdd6f4;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #zoom-controls button:hover {
      background: #313244;
    }
    #zoom-level {
      font-size: 11px;
      color: #6c7086;
      line-height: 32px;
      padding: 0 6px;
    }
    .node rect {
      fill: #313244;
      stroke: #45475a;
      stroke-width: 1;
      rx: 6;
      ry: 6;
      cursor: default;
    }
    .node rect.has-issue {
      stroke: #f38ba8;
      stroke-width: 2;
    }
    .node text {
      fill: #cdd6f4;
      font-size: 13px;
      font-family: inherit;
      pointer-events: none;
    }
    .node .order-label {
      fill: #6c7086;
      font-size: 10px;
    }
    .edge-base {
      stroke: #f38ba8;
      stroke-width: 2;
      fill: none;
      marker-end: url(#arrow-base);
    }
    .edge-orderAfter {
      stroke: #89b4fa;
      stroke-width: 1.5;
      stroke-dasharray: 6 3;
      fill: none;
      marker-end: url(#arrow-after);
    }
    .edge-orderBefore {
      stroke: #a6e3a1;
      stroke-width: 1.5;
      stroke-dasharray: 6 3;
      fill: none;
      marker-end: url(#arrow-before);
    }
    #legend {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: #181825;
      border: 1px solid #313244;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
    }
    #legend div {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    #legend div:last-child { margin-bottom: 0; }
    .legend-line {
      width: 24px;
      height: 0;
      border-top-width: 2px;
      border-top-style: solid;
    }
    .legend-base   { border-color: #f38ba8; }
    .legend-after  { border-color: #89b4fa; border-top-style: dashed; }
    .legend-before { border-color: #a6e3a1; border-top-style: dashed; }
    .no-plugins {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80vh;
      color: #6c7086;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="header">
    <h1>Plugin Dependency Graph</h1>
    <span class="stat" id="stat"></span>
  </div>
  <div id="issues-panel"></div>
  <div id="graph-container">
    <svg id="graph"></svg>
  </div>
  <div id="zoom-controls">
    <button id="zoom-in" title="Zoom In">+</button>
    <button id="zoom-out" title="Zoom Out">−</button>
    <button id="zoom-fit" title="Fit to View">⊡</button>
    <span id="zoom-level">100%</span>
  </div>
  <div id="legend">
    <div><span class="legend-line legend-base"></span> @base (required)</div>
    <div><span class="legend-line legend-after"></span> @orderAfter</div>
    <div><span class="legend-line legend-before"></span> @orderBefore</div>
  </div>

  <script>
  (function() {
    const data = ${graphJson};
    const plugins = data.plugins;
    const loadOrder = data.loadOrder;
    const issues = data.issues;

    // Stats
    const totalEdges = plugins.reduce(
      (s, p) => s + p.base.length + p.orderAfter.length + p.orderBefore.length, 0
    );
    document.getElementById('stat').textContent =
      plugins.length + ' plugins, ' + totalEdges + ' dependencies, ' + issues.length + ' issues';

    // Issues panel
    const issuesPanel = document.getElementById('issues-panel');
    if (issues.length > 0) {
      document.getElementById('graph-container').classList.add('has-issues');
      for (const issue of issues) {
        const div = document.createElement('div');
        div.className = 'issue';
        const badge = document.createElement('span');
        badge.className = 'badge badge-' + issue.type;
        badge.textContent = issue.type;
        div.appendChild(badge);
        const text = document.createElement('span');
        text.textContent = issue.message;
        div.appendChild(text);
        issuesPanel.appendChild(div);
      }
    }

    if (plugins.length === 0) {
      document.getElementById('graph-container').innerHTML =
        '<div class="no-plugins">No plugins with annotation blocks found in js/plugins/</div>';
      return;
    }

    // Collect all referenced plugin names (including external ones)
    const allNames = new Set();
    for (const p of plugins) {
      allNames.add(p.name);
      for (const d of [...p.base, ...p.orderAfter, ...p.orderBefore]) allNames.add(d);
    }
    const nameList = Array.from(allNames);

    // Build adjacency for layering (edges point from dependency to dependent)
    const inDegree = {};
    const children = {};
    for (const n of nameList) { inDegree[n] = 0; children[n] = []; }

    for (const p of plugins) {
      for (const dep of [...p.base, ...p.orderAfter]) {
        if (children[dep]) children[dep].push(p.name);
        inDegree[p.name] = (inDegree[p.name] || 0) + 1;
      }
      for (const dep of p.orderBefore) {
        children[p.name] = children[p.name] || [];
        children[p.name].push(dep);
        inDegree[dep] = (inDegree[dep] || 0) + 1;
      }
    }

    // Assign layers via topological sort (Kahn's algorithm)
    const layers = {};
    const queue = [];
    for (const n of nameList) {
      if (!inDegree[n] || inDegree[n] === 0) { queue.push(n); layers[n] = 0; }
    }

    while (queue.length > 0) {
      const node = queue.shift();
      for (const child of (children[node] || [])) {
        layers[child] = Math.max(layers[child] || 0, layers[node] + 1);
        inDegree[child]--;
        if (inDegree[child] === 0) queue.push(child);
      }
    }

    // Handle any remaining (part of a cycle) — give them max layer + 1
    const maxLayer = Math.max(0, ...Object.values(layers).filter(v => v !== undefined));
    for (const n of nameList) {
      if (layers[n] === undefined) layers[n] = maxLayer + 1;
    }

    // Group by layer
    const layerGroups = {};
    for (const n of nameList) {
      const l = layers[n];
      if (!layerGroups[l]) layerGroups[l] = [];
      layerGroups[l].push(n);
    }

    // Layout parameters
    const nodeW = 180;
    const nodeH = 44;
    const padX = 40;
    const padY = 60;
    const marginTop = 30;
    const marginLeft = 30;

    // Compute positions
    const positions = {};
    const issuePlugins = new Set(issues.flatMap(i => i.plugins));
    const localPlugins = new Set(plugins.map(p => p.name));
    const loadOrderIdx = {};
    loadOrder.forEach((n, i) => { loadOrderIdx[n] = i; });

    const sortedLayers = Object.keys(layerGroups).map(Number).sort((a, b) => a - b);
    let svgW = 0;
    let svgH = 0;

    for (const l of sortedLayers) {
      const group = layerGroups[l];
      const rowWidth = group.length * (nodeW + padX) - padX;
      const startX = marginLeft + Math.max(0, (600 - rowWidth) / 2);
      const y = marginTop + l * (nodeH + padY);

      for (let i = 0; i < group.length; i++) {
        const x = startX + i * (nodeW + padX);
        positions[group[i]] = { x, y };
        svgW = Math.max(svgW, x + nodeW + marginLeft);
      }
      svgH = Math.max(svgH, y + nodeH + marginTop + 40);
    }

    svgW = Math.max(svgW, 400);
    svgH = Math.max(svgH, 200);

    // Render SVG
    const svg = document.getElementById('graph');
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', svgH);

    const ns = 'http://www.w3.org/2000/svg';

    // Defs for arrow markers
    const defs = document.createElementNS(ns, 'defs');
    for (const [id, color] of [['arrow-base','#f38ba8'],['arrow-after','#89b4fa'],['arrow-before','#a6e3a1']]) {
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', id);
      marker.setAttribute('viewBox', '0 0 10 7');
      marker.setAttribute('refX', '10');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto-start-reverse');
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', '0 0, 10 3.5, 0 7');
      poly.setAttribute('fill', color);
      marker.appendChild(poly);
      defs.appendChild(marker);
    }
    svg.appendChild(defs);

    // Draw edges
    function drawEdge(fromName, toName, cls) {
      const from = positions[fromName];
      const to = positions[toName];
      if (!from || !to) return;

      const line = document.createElementNS(ns, 'path');
      const x1 = from.x + nodeW / 2;
      const y1 = from.y + nodeH;
      const x2 = to.x + nodeW / 2;
      const y2 = to.y;

      const midY = (y1 + y2) / 2;
      const d = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + midY + ', ' + x2 + ' ' + midY + ', ' + x2 + ' ' + y2;
      line.setAttribute('d', d);
      line.setAttribute('class', cls);
      svg.appendChild(line);
    }

    for (const p of plugins) {
      for (const dep of p.base)       drawEdge(dep, p.name, 'edge-base');
      for (const dep of p.orderAfter) drawEdge(dep, p.name, 'edge-orderAfter');
      for (const dep of p.orderBefore) drawEdge(p.name, dep, 'edge-orderBefore');
    }

    // Draw nodes
    for (const name of nameList) {
      const pos = positions[name];
      if (!pos) continue;

      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'node');
      g.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');

      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('width', nodeW);
      rect.setAttribute('height', nodeH);
      if (issuePlugins.has(name)) rect.setAttribute('class', 'has-issue');
      if (!localPlugins.has(name)) {
        rect.style.strokeDasharray = '4 2';
        rect.style.opacity = '0.6';
      }
      g.appendChild(rect);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', nodeW / 2);
      text.setAttribute('y', nodeH / 2 + (loadOrderIdx[name] !== undefined ? -2 : 4));
      text.setAttribute('text-anchor', 'middle');
      text.textContent = name;
      g.appendChild(text);

      if (loadOrderIdx[name] !== undefined) {
        const orderText = document.createElementNS(ns, 'text');
        orderText.setAttribute('class', 'order-label');
        orderText.setAttribute('x', nodeW / 2);
        orderText.setAttribute('y', nodeH / 2 + 14);
        orderText.setAttribute('text-anchor', 'middle');
        orderText.textContent = '#' + (loadOrderIdx[name] + 1) + ' in load order';
        g.appendChild(orderText);
      }

      svg.appendChild(g);
    }
    // ── Zoom & Pan ──────────────────────────────────────────────────
    const container = document.getElementById('graph-container');
    const zoomLevelEl = document.getElementById('zoom-level');
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    function updateViewBox() {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const vw = cw / scale;
      const vh = ch / scale;
      svg.setAttribute('viewBox', panX + ' ' + panY + ' ' + vw + ' ' + vh);
      zoomLevelEl.textContent = Math.round(scale * 100) + '%';
    }

    function zoomAt(factor, cx, cy) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      // Convert screen coords to SVG coords
      const svgX = panX + cx / scale;
      const svgY = panY + cy / scale;
      const newScale = Math.max(0.1, Math.min(5, scale * factor));
      // Adjust pan so the point under cursor stays fixed
      panX = svgX - cx / newScale;
      panY = svgY - cy / newScale;
      scale = newScale;
      updateViewBox();
    }

    // Initialize viewBox to fit content
    function fitToView() {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (svgW <= 0 || svgH <= 0) return;
      scale = Math.min(cw / svgW, ch / svgH, 2);
      panX = -(cw / scale - svgW) / 2;
      panY = 0;
      updateViewBox();
    }

    // Mouse wheel zoom
    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, cx, cy);
    }, { passive: false });

    // Pan with mouse drag
    container.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      container.classList.add('panning');
    });

    window.addEventListener('mousemove', function(e) {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panX -= dx / scale;
      panY -= dy / scale;
      startX = e.clientX;
      startY = e.clientY;
      updateViewBox();
    });

    window.addEventListener('mouseup', function() {
      isPanning = false;
      container.classList.remove('panning');
    });

    // Button controls
    document.getElementById('zoom-in').addEventListener('click', function() {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      zoomAt(1.3, cw / 2, ch / 2);
    });
    document.getElementById('zoom-out').addEventListener('click', function() {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      zoomAt(1 / 1.3, cw / 2, ch / 2);
    });
    document.getElementById('zoom-fit').addEventListener('click', fitToView);

    // Initial fit
    fitToView();
  })();
  </script>
</body>
</html>`;
}
