// ============================================================================
// dom-rmmz.d.ts — Minimal DOM type declarations for RMMZ plugin development
// ============================================================================
//
// This file provides the subset of DOM / Web API types referenced by the RMMZ
// type definitions. The standard TypeScript "DOM" lib is intentionally excluded
// from the generated tsconfig because it declares global constructors for
// "Window" and "StorageManager" that conflict with the RMMZ classes of the
// same name.
//
// If your plugin needs additional DOM types not covered here, you can:
//   1. Add your own declarations in a local .d.ts file, or
//   2. Install @types/web or similar packages (accepting possible conflicts).
// ============================================================================

// ---------------------------------------------------------------------------
// Event hierarchy
// ---------------------------------------------------------------------------

interface EventInit {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

interface Event {
    readonly type: string;
    readonly target: EventTarget | null;
    readonly currentTarget: EventTarget | null;
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    readonly defaultPrevented: boolean;
    readonly timeStamp: number;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}

interface EventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event): boolean;
}

interface EventListener {
    (evt: Event): void;
}

interface EventListenerObject {
    handleEvent(object: Event): void;
}

type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

interface AddEventListenerOptions {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
}

interface EventListenerOptions {
    capture?: boolean;
}

interface UIEvent extends Event {
    readonly detail: number;
}

interface KeyboardEvent extends UIEvent {
    readonly key: string;
    readonly code: string;
    readonly keyCode: number;
    readonly charCode: number;
    readonly which: number;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
    readonly repeat: boolean;
    readonly location: number;
    getModifierState(key: string): boolean;
}

interface MouseEvent extends UIEvent {
    readonly clientX: number;
    readonly clientY: number;
    readonly pageX: number;
    readonly pageY: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly movementX: number;
    readonly movementY: number;
    readonly button: number;
    readonly buttons: number;
    readonly relatedTarget: EventTarget | null;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
    getModifierState(key: string): boolean;
}

interface WheelEvent extends MouseEvent {
    readonly deltaX: number;
    readonly deltaY: number;
    readonly deltaZ: number;
    readonly deltaMode: number;
}

interface Touch {
    readonly identifier: number;
    readonly target: EventTarget;
    readonly pageX: number;
    readonly pageY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly radiusX: number;
    readonly radiusY: number;
    readonly rotationAngle: number;
    readonly force: number;
}

interface TouchList {
    readonly length: number;
    item(index: number): Touch | null;
    [index: number]: Touch;
}

interface TouchEvent extends UIEvent {
    readonly touches: TouchList;
    readonly targetTouches: TouchList;
    readonly changedTouches: TouchList;
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
}

interface ErrorEvent extends Event {
    readonly message: string;
    readonly filename: string;
    readonly lineno: number;
    readonly colno: number;
    readonly error: any;
}

interface PromiseRejectionEvent extends Event {
    readonly promise: Promise<any>;
    readonly reason: any;
}

// ---------------------------------------------------------------------------
// DOM Node / Element hierarchy
// ---------------------------------------------------------------------------

interface Node extends EventTarget {
    readonly nodeName: string;
    readonly nodeType: number;
    readonly parentNode: Node | null;
    readonly childNodes: NodeList;
    readonly firstChild: Node | null;
    readonly lastChild: Node | null;
    readonly nextSibling: Node | null;
    readonly previousSibling: Node | null;
    textContent: string | null;
    appendChild<T extends Node>(node: T): T;
    removeChild<T extends Node>(node: T): T;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    cloneNode(deep?: boolean): Node;
    contains(other: Node | null): boolean;
}

interface NodeList {
    readonly length: number;
    item(index: number): Node | null;
    [index: number]: Node;
}

interface Element extends Node {
    readonly tagName: string;
    id: string;
    className: string;
    innerHTML: string;
    outerHTML: string;
    readonly clientWidth: number;
    readonly clientHeight: number;
    readonly scrollWidth: number;
    readonly scrollHeight: number;
    scrollTop: number;
    scrollLeft: number;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    hasAttribute(name: string): boolean;
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeList;
    getBoundingClientRect(): DOMRect;
    remove(): void;
}

interface DOMRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}

interface CSSStyleDeclaration {
    [index: number]: string;
    cssText: string;
    readonly length: number;
    getPropertyValue(property: string): string;
    setProperty(property: string, value: string | null, priority?: string): void;
    removeProperty(property: string): string;

    // Common properties used by RMMZ
    width: string;
    height: string;
    margin: string;
    padding: string;
    position: string;
    display: string;
    visibility: string;
    overflow: string;
    zIndex: string;
    opacity: string;
    transform: string;
    transition: string;
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontFamily: string;
    textAlign: string;
    border: string;
    outline: string;
    cursor: string;
    pointerEvents: string;
    userSelect: string;
    imageRendering: string;
    top: string;
    left: string;
    right: string;
    bottom: string;
}

// ---------------------------------------------------------------------------
// HTML Elements
// ---------------------------------------------------------------------------

interface HTMLElement extends Element {
    style: CSSStyleDeclaration;
    title: string;
    tabIndex: number;
    hidden: boolean;
    offsetWidth: number;
    offsetHeight: number;
    offsetTop: number;
    offsetLeft: number;
    focus(options?: { preventScroll?: boolean }): void;
    blur(): void;
    click(): void;

    // Event handlers
    onclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onkeydown: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
    onkeyup: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
}

interface HTMLDivElement extends HTMLElement {}

interface HTMLCanvasElement extends HTMLElement {
    width: number;
    height: number;
    getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
    getContext(contextId: "webgl" | "webgl2", options?: WebGLContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: string, options?: any): RenderingContext | null;
    toDataURL(type?: string, quality?: any): string;
    toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: any): void;
}

interface HTMLImageElement extends HTMLElement {
    alt: string;
    src: string;
    crossOrigin: string | null;
    width: number;
    height: number;
    readonly naturalWidth: number;
    readonly naturalHeight: number;
    readonly complete: boolean;
    onload: ((this: HTMLImageElement, ev: Event) => any) | null;
    onerror: ((this: HTMLImageElement, ev: Event | string) => any) | null;
    decode(): Promise<void>;
}

interface HTMLVideoElement extends HTMLElement {
    src: string;
    width: number;
    height: number;
    readonly duration: number;
    currentTime: number;
    volume: number;
    muted: boolean;
    readonly paused: boolean;
    readonly ended: boolean;
    loop: boolean;
    autoplay: boolean;
    controls: boolean;
    preload: string;
    readonly readyState: number;
    readonly videoWidth: number;
    readonly videoHeight: number;
    play(): Promise<void>;
    pause(): void;
    load(): void;
    onloadeddata: ((this: HTMLVideoElement, ev: Event) => any) | null;
    onerror: ((this: HTMLVideoElement, ev: Event | string) => any) | null;
    onended: ((this: HTMLVideoElement, ev: Event) => any) | null;
}

interface HTMLAudioElement extends HTMLElement {
    src: string;
    volume: number;
    muted: boolean;
    readonly paused: boolean;
    readonly ended: boolean;
    loop: boolean;
    autoplay: boolean;
    readonly duration: number;
    currentTime: number;
    play(): Promise<void>;
    pause(): void;
    load(): void;
}

interface HTMLInputElement extends HTMLElement {
    type: string;
    value: string;
    checked: boolean;
    disabled: boolean;
    placeholder: string;
    name: string;
    readOnly: boolean;
}

interface HTMLButtonElement extends HTMLElement {
    type: string;
    value: string;
    disabled: boolean;
    name: string;
}

interface HTMLSelectElement extends HTMLElement {
    value: string;
    selectedIndex: number;
    disabled: boolean;
    name: string;
    readonly options: HTMLCollectionOf<HTMLOptionElement>;
}

interface HTMLOptionElement extends HTMLElement {
    value: string;
    text: string;
    selected: boolean;
    disabled: boolean;
}

interface HTMLCollectionOf<T> {
    readonly length: number;
    item(index: number): T | null;
    [index: number]: T;
}

interface HTMLFormElement extends HTMLElement {
    action: string;
    method: string;
    submit(): void;
    reset(): void;
}

// ---------------------------------------------------------------------------
// Canvas 2D Rendering Context
// ---------------------------------------------------------------------------

interface CanvasRenderingContext2DSettings {
    alpha?: boolean;
    desynchronized?: boolean;
    willReadFrequently?: boolean;
}

interface CanvasRenderingContext2D {
    readonly canvas: HTMLCanvasElement;

    // State
    save(): void;
    restore(): void;

    // Transform
    scale(x: number, y: number): void;
    rotate(angle: number): void;
    translate(x: number, y: number): void;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    resetTransform(): void;

    // Compositing
    globalAlpha: number;
    globalCompositeOperation: string;

    // Image smoothing
    imageSmoothingEnabled: boolean;
    imageSmoothingQuality: string;

    // Fill and stroke styles
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;

    // Shadows
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;

    // Rects
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;

    // Paths
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    fill(fillRule?: string): void;
    stroke(): void;
    clip(fillRule?: string): void;
    isPointInPath(x: number, y: number, fillRule?: string): boolean;

    // Text
    font: string;
    textAlign: string;
    textBaseline: string;
    direction: string;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;

    // Drawing images
    drawImage(image: CanvasImageSource, dx: number, dy: number): void;
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;

    // Pixel manipulation
    createImageData(sw: number, sh: number): ImageData;
    createImageData(imagedata: ImageData): ImageData;
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
    putImageData(imagedata: ImageData, dx: number, dy: number): void;
    putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void;

    // Gradients and patterns
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
    createPattern(image: CanvasImageSource, repetition: string | null): CanvasPattern | null;

    // Line styles
    lineWidth: number;
    lineCap: string;
    lineJoin: string;
    miterLimit: number;
    lineDashOffset: number;
    setLineDash(segments: number[]): void;
    getLineDash(): number[];
}

type CanvasImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap;

interface TextMetrics {
    readonly width: number;
    readonly actualBoundingBoxAscent: number;
    readonly actualBoundingBoxDescent: number;
    readonly actualBoundingBoxLeft: number;
    readonly actualBoundingBoxRight: number;
}

interface CanvasGradient {
    addColorStop(offset: number, color: string): void;
}

interface CanvasPattern {
    setTransform(transform?: DOMMatrix2DInit): void;
}

interface DOMMatrix2DInit {
    a?: number; b?: number; c?: number; d?: number; e?: number; f?: number;
}

interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
}

interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
}

// ---------------------------------------------------------------------------
// WebGL (minimal — PIXI handles most WebGL interaction)
// ---------------------------------------------------------------------------

interface WebGLContextAttributes {
    alpha?: boolean;
    antialias?: boolean;
    depth?: boolean;
    desynchronized?: boolean;
    failIfMajorPerformanceCaveat?: boolean;
    powerPreference?: string;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    stencil?: boolean;
}

interface WebGLRenderingContext {}

type RenderingContext = CanvasRenderingContext2D | WebGLRenderingContext;

// ---------------------------------------------------------------------------
// XMLHttpRequest
// ---------------------------------------------------------------------------

interface XMLHttpRequest extends EventTarget {
    readonly readyState: number;
    readonly response: any;
    readonly responseText: string;
    responseType: string;
    readonly responseURL: string;
    readonly status: number;
    readonly statusText: string;
    timeout: number;
    withCredentials: boolean;

    onload: ((this: XMLHttpRequest, ev: Event) => any) | null;
    onerror: ((this: XMLHttpRequest, ev: Event) => any) | null;
    onprogress: ((this: XMLHttpRequest, ev: Event) => any) | null;
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;

    open(method: string, url: string, async?: boolean, username?: string | null, password?: string | null): void;
    send(body?: Document | BodyInit | null): void;
    abort(): void;
    setRequestHeader(name: string, value: string): void;
    getResponseHeader(name: string): string | null;
    getAllResponseHeaders(): string;
    overrideMimeType(mime: string): void;

    readonly UNSENT: number;
    readonly OPENED: number;
    readonly HEADERS_RECEIVED: number;
    readonly LOADING: number;
    readonly DONE: number;
}

declare var XMLHttpRequest: {
    prototype: XMLHttpRequest;
    new(): XMLHttpRequest;
    readonly UNSENT: number;
    readonly OPENED: number;
    readonly HEADERS_RECEIVED: number;
    readonly LOADING: number;
    readonly DONE: number;
};

// ---------------------------------------------------------------------------
// Fetch API
// ---------------------------------------------------------------------------

interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
}

interface Body {
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    json(): Promise<any>;
    text(): Promise<string>;
}

interface Response extends Body {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: Headers;
    readonly url: string;
    readonly redirected: boolean;
    readonly type: ResponseType;
    clone(): Response;
}

type ResponseType = "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";

interface RequestInit {
    body?: BodyInit | null;
    cache?: string;
    credentials?: string;
    headers?: HeadersInit;
    integrity?: string;
    keepalive?: boolean;
    method?: string;
    mode?: string;
    redirect?: string;
    referrer?: string;
    referrerPolicy?: string;
    signal?: AbortSignal | null;
}

type BodyInit = Blob | BufferSource | FormData | URLSearchParams | ReadableStream<Uint8Array> | string;
type HeadersInit = Headers | string[][] | Record<string, string>;
type BufferSource = ArrayBuffer | ArrayBufferView;

declare function fetch(input: string | Request, init?: RequestInit): Promise<Response>;

interface Request extends Body {
    readonly url: string;
    readonly method: string;
    readonly headers: Headers;
    clone(): Request;
}

// ---------------------------------------------------------------------------
// Web Audio API
// ---------------------------------------------------------------------------

interface BaseAudioContext extends EventTarget {
    readonly currentTime: number;
    readonly destination: AudioDestinationNode;
    readonly sampleRate: number;
    readonly state: string;
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
    createBufferSource(): AudioBufferSourceNode;
    createGain(): GainNode;
    createAnalyser(): AnalyserNode;
    createBiquadFilter(): BiquadFilterNode;
    createPanner(): PannerNode;
    createStereoPanner(): StereoPannerNode;
    decodeAudioData(audioData: ArrayBuffer, successCallback?: (buffer: AudioBuffer) => void, errorCallback?: () => void): Promise<AudioBuffer>;
}

interface AudioContext extends BaseAudioContext {
    close(): Promise<void>;
    resume(): Promise<void>;
    suspend(): Promise<void>;
}

declare var AudioContext: {
    prototype: AudioContext;
    new(contextOptions?: AudioContextOptions): AudioContext;
};

interface AudioContextOptions {
    latencyHint?: string | number;
    sampleRate?: number;
}

interface AudioNode extends EventTarget {
    readonly context: BaseAudioContext;
    readonly numberOfInputs: number;
    readonly numberOfOutputs: number;
    connect(destination: AudioNode, output?: number, input?: number): AudioNode;
    connect(destination: AudioParam, output?: number): void;
    disconnect(): void;
    disconnect(output: number): void;
    disconnect(destination: AudioNode): void;
}

interface AudioParam {
    value: number;
    readonly defaultValue: number;
    readonly minValue: number;
    readonly maxValue: number;
    setValueAtTime(value: number, startTime: number): AudioParam;
    linearRampToValueAtTime(value: number, endTime: number): AudioParam;
    exponentialRampToValueAtTime(value: number, endTime: number): AudioParam;
}

interface AudioDestinationNode extends AudioNode {}
interface AnalyserNode extends AudioNode {}
interface BiquadFilterNode extends AudioNode {}
interface StereoPannerNode extends AudioNode {
    readonly pan: AudioParam;
}

interface AudioBuffer {
    readonly duration: number;
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;
    getChannelData(channel: number): Float32Array;
}

interface AudioBufferSourceNode extends AudioNode {
    buffer: AudioBuffer | null;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    readonly playbackRate: AudioParam;
    onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null;
    start(when?: number, offset?: number, duration?: number): void;
    stop(when?: number): void;
}

interface GainNode extends AudioNode {
    readonly gain: AudioParam;
}

interface PannerNode extends AudioNode {
    panningModel: string;
    distanceModel: string;
    refDistance: number;
    maxDistance: number;
    rolloffFactor: number;
    coneInnerAngle: number;
    coneOuterAngle: number;
    coneOuterGain: number;
    setPosition(x: number, y: number, z: number): void;
    setOrientation(x: number, y: number, z: number): void;
    readonly positionX: AudioParam;
    readonly positionY: AudioParam;
    readonly positionZ: AudioParam;
}

// ---------------------------------------------------------------------------
// Blob / File
// ---------------------------------------------------------------------------

interface Blob {
    readonly size: number;
    readonly type: string;
    arrayBuffer(): Promise<ArrayBuffer>;
    slice(start?: number, end?: number, contentType?: string): Blob;
    text(): Promise<string>;
}

declare var Blob: {
    prototype: Blob;
    new(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
};

type BlobPart = BufferSource | Blob | string;

interface BlobPropertyBag {
    type?: string;
    endings?: string;
}

interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

interface URL {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    readonly origin: string;
    password: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    readonly searchParams: URLSearchParams;
    username: string;
    toString(): string;
    toJSON(): string;
}

declare var URL: {
    prototype: URL;
    new(url: string, base?: string): URL;
    createObjectURL(object: Blob): string;
    revokeObjectURL(url: string): void;
};

interface URLSearchParams {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
}

// ---------------------------------------------------------------------------
// AbortController / AbortSignal
// ---------------------------------------------------------------------------

interface AbortController {
    readonly signal: AbortSignal;
    abort(reason?: any): void;
}

declare var AbortController: {
    prototype: AbortController;
    new(): AbortController;
};

interface AbortSignal extends EventTarget {
    readonly aborted: boolean;
    readonly reason: any;
    onabort: ((this: AbortSignal, ev: Event) => any) | null;
}

// ---------------------------------------------------------------------------
// ReadableStream (minimal)
// ---------------------------------------------------------------------------

interface ReadableStream<R = any> {
    readonly locked: boolean;
    cancel(reason?: any): Promise<void>;
    getReader(): ReadableStreamDefaultReader<R>;
}

interface ReadableStreamDefaultReader<R = any> {
    readonly closed: Promise<undefined>;
    cancel(reason?: any): Promise<void>;
    read(): Promise<ReadableStreamDefaultReadResult<R>>;
    releaseLock(): void;
}

type ReadableStreamDefaultReadResult<T> =
    | { done: false; value: T }
    | { done: true; value?: undefined };

// ---------------------------------------------------------------------------
// FormData (minimal)
// ---------------------------------------------------------------------------

interface FormData {
    append(name: string, value: string | Blob, fileName?: string): void;
    delete(name: string): void;
    get(name: string): FormDataEntryValue | null;
    has(name: string): boolean;
    set(name: string, value: string | Blob, fileName?: string): void;
}

type FormDataEntryValue = File | string;

// ---------------------------------------------------------------------------
// Gamepad API
// ---------------------------------------------------------------------------

interface Gamepad {
    readonly axes: readonly number[];
    readonly buttons: readonly GamepadButton[];
    readonly connected: boolean;
    readonly id: string;
    readonly index: number;
    readonly mapping: string;
    readonly timestamp: number;
}

interface GamepadButton {
    readonly pressed: boolean;
    readonly touched: boolean;
    readonly value: number;
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

declare function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearTimeout(id?: number): void;
declare function setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearInterval(id?: number): void;
declare function requestAnimationFrame(callback: FrameRequestCallback): number;
declare function cancelAnimationFrame(handle: number): void;
declare function queueMicrotask(callback: VoidFunction): void;

type TimerHandler = string | Function;
type FrameRequestCallback = (time: number) => void;
type VoidFunction = () => void;

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

interface Console {
    assert(condition?: boolean, ...data: any[]): void;
    clear(): void;
    count(label?: string): void;
    debug(...data: any[]): void;
    dir(item?: any, options?: any): void;
    error(...data: any[]): void;
    group(...data: any[]): void;
    groupCollapsed(...data: any[]): void;
    groupEnd(): void;
    info(...data: any[]): void;
    log(...data: any[]): void;
    table(tabularData?: any, properties?: string[]): void;
    time(label?: string): void;
    timeEnd(label?: string): void;
    timeLog(label?: string, ...data: any[]): void;
    trace(...data: any[]): void;
    warn(...data: any[]): void;
}

declare var console: Console;

// ---------------------------------------------------------------------------
// Document and global DOM access
// ---------------------------------------------------------------------------

interface Document extends Node {
    readonly body: HTMLElement;
    readonly documentElement: HTMLElement;
    readonly head: HTMLElement;
    title: string;
    readonly hidden: boolean;
    readonly visibilityState: string;
    readonly fullscreenElement: Element | null;

    createElement(tagName: "canvas"): HTMLCanvasElement;
    createElement(tagName: "img"): HTMLImageElement;
    createElement(tagName: "video"): HTMLVideoElement;
    createElement(tagName: "audio"): HTMLAudioElement;
    createElement(tagName: "div"): HTMLDivElement;
    createElement(tagName: "input"): HTMLInputElement;
    createElement(tagName: "button"): HTMLButtonElement;
    createElement(tagName: "select"): HTMLSelectElement;
    createElement(tagName: "option"): HTMLOptionElement;
    createElement(tagName: "form"): HTMLFormElement;
    createElement(tagName: string): HTMLElement;

    createElementNS(namespaceURI: string, qualifiedName: string): Element;
    createTextNode(data: string): Node;
    createDocumentFragment(): DocumentFragment;

    getElementById(elementId: string): HTMLElement | null;
    getElementsByClassName(classNames: string): HTMLCollectionOf<Element>;
    getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>;
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeList;

    exitFullscreen(): Promise<void>;
}

interface DocumentFragment extends Node {}

declare var document: Document;

// ---------------------------------------------------------------------------
// Navigator (minimal)
// ---------------------------------------------------------------------------

interface Navigator {
    readonly language: string;
    readonly languages: readonly string[];
    readonly platform: string;
    readonly userAgent: string;
    readonly onLine: boolean;
    getGamepads(): (Gamepad | null)[];
}

declare var navigator: Navigator;

// ---------------------------------------------------------------------------
// Location (minimal)
// ---------------------------------------------------------------------------

interface Location {
    readonly href: string;
    readonly protocol: string;
    readonly host: string;
    readonly hostname: string;
    readonly port: string;
    readonly pathname: string;
    readonly search: string;
    readonly hash: string;
    readonly origin: string;
    reload(): void;
}

declare var location: Location;

// ---------------------------------------------------------------------------
// Global "window" object — typed as a plain object, NOT as the DOM Window
// interface, to avoid conflicting with the RMMZ Window class.
// Access browser globals (document, navigator, etc.) directly; they are
// declared as stand-alone vars above.
// ---------------------------------------------------------------------------

declare var window: typeof globalThis;

// ---------------------------------------------------------------------------
// FontFace API (used by RMMZ FontManager)
// ---------------------------------------------------------------------------

declare class FontFace {
    constructor(family: string, source: string | ArrayBuffer, descriptors?: FontFaceDescriptors);
    readonly family: string;
    readonly status: string;
    readonly loaded: Promise<FontFace>;
    load(): Promise<FontFace>;
}

interface FontFaceDescriptors {
    style?: string;
    weight?: string;
    stretch?: string;
    unicodeRange?: string;
    variant?: string;
    featureSettings?: string;
}

interface FontFaceSet extends EventTarget {
    add(font: FontFace): void;
    delete(font: FontFace): boolean;
    clear(): void;
    check(font: string, text?: string): boolean;
    readonly ready: Promise<FontFaceSet>;
    readonly status: string;
}

// ---------------------------------------------------------------------------
// Image constructor (used by RMMZ for new Image())
// ---------------------------------------------------------------------------

declare var Image: {
    prototype: HTMLImageElement;
    new(width?: number, height?: number): HTMLImageElement;
};

// ---------------------------------------------------------------------------
// Audio constructor (used by RMMZ for new Audio())
// ---------------------------------------------------------------------------

declare var Audio: {
    prototype: HTMLAudioElement;
    new(src?: string): HTMLAudioElement;
};

// ---------------------------------------------------------------------------
// Miscellaneous globals
// ---------------------------------------------------------------------------

declare function alert(message?: any): void;
declare function confirm(message?: string): boolean;
declare function prompt(message?: string, _default?: string): string | null;

declare function btoa(data: string): string;
declare function atob(data: string): string;

declare function encodeURIComponent(uriComponent: string | number | boolean): string;
declare function decodeURIComponent(encodedURIComponent: string): string;
declare function encodeURI(uri: string): string;
declare function decodeURI(encodedURI: string): string;

// localForage — used by RMMZ for web storage fallback
declare var localforage: any;

// nw.js — NW.js API used by RMMZ desktop builds
declare var nw: any;

// process — Node.js process global available in NW.js
declare var process: {
    mainModule?: { filename: string };
} | undefined;

// require — Node.js require available in NW.js
declare function require(id: string): any;
