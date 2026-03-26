// Type definitions for PIXI.js v5 (minimal stub for RMMZ)
// Only declares types used by RPG Maker MZ core classes.

declare namespace PIXI {
  class Application {
    renderer: Renderer;
    stage: Container;
    ticker: Ticker;
    destroy(removeView?: boolean): void;
  }

  class Renderer {
    readonly width: number;
    readonly height: number;
    resize(width: number, height: number): void;
    render(displayObject: DisplayObject): void;
  }

  class Ticker {
    add(fn: (deltaTime: number) => void, context?: unknown): Ticker;
    remove(fn: (deltaTime: number) => void, context?: unknown): Ticker;
    start(): void;
    stop(): void;
    readonly FPS: number;
    readonly deltaTime: number;
  }

  class DisplayObject {
    x: number;
    y: number;
    visible: boolean;
    alpha: number;
    rotation: number;
    scale: ObservablePoint;
    pivot: ObservablePoint;
    skew: ObservablePoint;
    worldVisible: boolean;
    worldAlpha: number;
    worldTransform: Matrix;
    parent: Container | null;
    filters: Filter[] | null;
    mask: DisplayObject | null;
    destroy(options?: { children?: boolean }): void;
    updateTransform(): void;
    getBounds(skipUpdate?: boolean, rect?: Rectangle): Rectangle;
  }

  class Container extends DisplayObject {
    children: DisplayObject[];
    sortableChildren: boolean;
    addChild<T extends DisplayObject>(child: T): T;
    addChildAt<T extends DisplayObject>(child: T, index: number): T;
    removeChild<T extends DisplayObject>(child: T): T;
    removeChildAt(index: number): DisplayObject;
    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[];
    sortChildren(): void;
    width: number;
    height: number;
  }

  class Sprite extends Container {
    constructor(texture?: Texture);
    texture: Texture;
    anchor: ObservablePoint;
    blendMode: number;
    tint: number;
    width: number;
    height: number;
  }

  class TilingSprite extends Sprite {
    constructor(texture: Texture, width?: number, height?: number);
    tilePosition: ObservablePoint;
    tileScale: ObservablePoint;
    clampMargin: number;
    uvRespectAnchor: boolean;
  }

  class Graphics extends Container {
    beginFill(color?: number, alpha?: number): Graphics;
    endFill(): Graphics;
    lineStyle(width?: number, color?: number, alpha?: number): Graphics;
    moveTo(x: number, y: number): Graphics;
    lineTo(x: number, y: number): Graphics;
    drawRect(x: number, y: number, width: number, height: number): Graphics;
    drawCircle(x: number, y: number, radius: number): Graphics;
    clear(): Graphics;
  }

  class Point {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x?: number, y?: number): void;
    clone(): Point;
    equals(p: Point): boolean;
  }

  class ObservablePoint {
    constructor(cb: () => void, scope: unknown, x?: number, y?: number);
    x: number;
    y: number;
    set(x?: number, y?: number): void;
  }

  class Rectangle {
    constructor(x?: number, y?: number, width?: number, height?: number);
    x: number;
    y: number;
    width: number;
    height: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    contains(x: number, y: number): boolean;
    clone(): Rectangle;
  }

  class Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
    set(a: number, b: number, c: number, d: number, tx: number, ty: number): Matrix;
    translate(x: number, y: number): Matrix;
    scale(x: number, y: number): Matrix;
    rotate(angle: number): Matrix;
    identity(): Matrix;
    clone(): Matrix;
  }

  class Texture {
    static readonly EMPTY: Texture;
    static readonly WHITE: Texture;
    static from(source: string | HTMLImageElement | HTMLCanvasElement | BaseTexture): Texture;
    baseTexture: BaseTexture;
    frame: Rectangle;
    orig: Rectangle;
    trim: Rectangle | null;
    width: number;
    height: number;
    update(): void;
    destroy(destroyBase?: boolean): void;
    clone(): Texture;
  }

  class BaseTexture {
    static from(source: string | HTMLImageElement | HTMLCanvasElement): BaseTexture;
    width: number;
    height: number;
    scaleMode: number;
    update(): void;
    destroy(): void;
  }

  class RenderTexture extends Texture {
    static create(options?: { width?: number; height?: number }): RenderTexture;
    resize(width: number, height: number, doNotResizeBaseTexture?: boolean): void;
  }

  class Filter {
    constructor(vertexSrc?: string, fragmentSrc?: string, uniforms?: Record<string, unknown>);
    uniforms: Record<string, unknown>;
    enabled: boolean;
  }

  class ColorMatrixFilter extends Filter {
    brightness(b: number, multiply?: boolean): void;
    hue(rotation: number, multiply?: boolean): void;
    saturate(amount?: number, multiply?: boolean): void;
    reset(): void;
  }

  namespace utils {
    function rgb2hex(rgb: [number, number, number]): number;
    function hex2rgb(hex: number, out?: [number, number, number]): [number, number, number];
    function hex2string(hex: number): string;
    function string2hex(string: string): number;
  }

  const BLEND_MODES: {
    NORMAL: number;
    ADD: number;
    MULTIPLY: number;
    SCREEN: number;
  };

  const SCALE_MODES: {
    NEAREST: number;
    LINEAR: number;
  };

  class ObjectRenderer {
    renderer: Renderer;
    constructor(renderer: Renderer);
    start(): void;
    stop(): void;
    flush(): void;
    render(object: DisplayObject): void;
    destroy(): void;
  }

  class Shader {
    constructor(program?: unknown, uniforms?: Record<string, unknown>);
    uniforms: Record<string, unknown>;
  }

  class Geometry {
    addAttribute(id: string, buffer?: Buffer | number[], size?: number, normalized?: boolean, type?: number, stride?: number, start?: number): Geometry;
    addIndex(buffer?: Buffer | number[]): Geometry;
    dispose(): void;
  }

  class Buffer {
    constructor(data?: ArrayBuffer | SharedArrayBuffer | number[], _static?: boolean, index?: boolean);
    update(data?: ArrayBuffer | number[]): void;
    dispose(): void;
  }
}
