// Type definitions for rmmz_core.js v1.10.0
// RPG Maker MZ core module
// Definitions generated from the RMMZ source code.

// ---------------------------------------------------------------------------
// JsExtensions - augment standard prototypes
// ---------------------------------------------------------------------------

interface Array<T> {
    clone(): T[];
    contains(element: T): boolean;
    equals(array: T[]): boolean;
    remove(element: T): T[];
}

interface Math {
    randomInt(max: number): number;
}

interface Number {
    clamp(min: number, max: number): number;
    mod(n: number): number;
    padZero(length: number): string;
}

interface String {
    contains(string: string): boolean;
    format(...args: unknown[]): string;
    padZero(length: number): string;
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

declare class Utils {
    private constructor();

    static readonly RPGMAKER_NAME: string;
    static readonly RPGMAKER_VERSION: string;

    static checkRMVersion(version: string): boolean;
    static isOptionValid(name: string): boolean;
    static isNwjs(): boolean;
    static isMobileDevice(): boolean;
    static isMobileSafari(): boolean;
    static isAndroidChrome(): boolean;
    static isLocal(): boolean;
    static canUseWebGL(): boolean;
    static canUseWebAudioAPI(): boolean;
    static canUseCssFontLoading(): boolean;
    static canUseIndexedDB(): boolean;
    static canPlayOgg(): boolean;
    static canPlayWebm(): boolean;
    static encodeURI(str: string): string;
    static extractFileName(filename: string): string;
    static escapeHtml(str: string): string;
    static containsArabic(str: string): boolean;
    static setEncryptionInfo(hasImages: boolean, hasAudio: boolean, key: string): void;
    static hasEncryptedImages(): boolean;
    static hasEncryptedAudio(): boolean;
    static decryptArrayBuffer(source: ArrayBuffer): ArrayBuffer;

    static _audioElement: HTMLAudioElement | null;
    static _videoElement: HTMLVideoElement | null;
    static _hasEncryptedImages: boolean;
    static _hasEncryptedAudio: boolean;
    static _encryptionKey: string;
}

// ---------------------------------------------------------------------------
// Graphics
// ---------------------------------------------------------------------------

declare class Graphics {
    private constructor();

    static frameCount: number;
    static boxWidth: number;
    static boxHeight: number;

    static readonly app: PIXI.Application;
    static readonly effekseer: any;
    static width: number;
    static height: number;
    static defaultScale: number;

    static initialize(): boolean;
    static setTickHandler(handler: (deltaTime: number) => void): void;
    static startGameLoop(): void;
    static stopGameLoop(): void;
    static setStage(stage: Stage): void;
    static startLoading(): void;
    static endLoading(): boolean;
    static printError(name: string, message: string, error?: Error | null): void;
    static showRetryButton(retry: () => void): void;
    static eraseError(): void;
    static pageToCanvasX(x: number): number;
    static pageToCanvasY(y: number): number;
    static isInsideCanvas(x: number, y: number): boolean;
    static showScreen(): void;
    static hideScreen(): void;
    static resize(width: number, height: number): void;

    static _width: number;
    static _height: number;
    static _defaultScale: number;
    static _realScale: number;
    static _errorPrinter: HTMLDivElement | null;
    static _tickHandler: ((deltaTime: number) => void) | null;
    static _canvas: HTMLCanvasElement | null;
    static _fpsCounter: Graphics.FPSCounter | null;
    static _loadingSpinner: HTMLDivElement | null;
    static _stretchEnabled: boolean;
    static _app: PIXI.Application | null;
    static _effekseer: any;
    static _wasLoading: boolean;

    static _createAllElements(): void;
    static _updateAllElements(): void;
    static _onTick(deltaTime: number): void;
    static _canRender(): boolean;
    static _updateRealScale(): void;
    static _stretchWidth(): number;
    static _stretchHeight(): number;
    static _makeErrorHtml(name?: string, message?: string): string;
    static _defaultStretchMode(): boolean;
    static _createErrorPrinter(): void;
    static _updateErrorPrinter(): void;
    static _createCanvas(): void;
    static _updateCanvas(): void;
    static _updateVideo(): void;
    static _createLoadingSpinner(): void;
    static _createFPSCounter(): void;
    static _centerElement(element: HTMLElement): void;
    static _disableContextMenu(): void;
    static _applyCanvasFilter(): void;
    static _clearCanvasFilter(): void;
    static _setupEventHandlers(): void;
    static _onWindowResize(): void;
    static _onKeyDown(event: KeyboardEvent): void;
    static _switchFPSCounter(): void;
    static _switchStretchMode(): void;
    static _switchFullScreen(): void;
    static _isFullScreen(): boolean;
    static _requestFullScreen(): void;
    static _cancelFullScreen(): void;
    static _createPixiApp(): void;
    static _setupPixi(): void;
    static _createEffekseerContext(): void;
}

declare namespace Graphics {
    class FPSCounter {
        fps: number;
        duration: number;

        initialize(): void;
        startTick(): void;
        endTick(): void;
        switchMode(): void;

        _tickCount: number;
        _frameTime: number;
        _frameStart: number;
        _lastLoop: number;
        _showFps: boolean;
        _boxDiv: HTMLDivElement;
        _labelDiv: HTMLDivElement;
        _numberDiv: HTMLDivElement;

        _createElements(): void;
        _update(): void;
    }
}

// ---------------------------------------------------------------------------
// Point
// ---------------------------------------------------------------------------

declare class Point extends PIXI.Point {
    constructor(x?: number, y?: number);
    initialize(x?: number, y?: number): void;
}

// ---------------------------------------------------------------------------
// Rectangle
// ---------------------------------------------------------------------------

declare class Rectangle extends PIXI.Rectangle {
    constructor(x?: number, y?: number, width?: number, height?: number);
    initialize(x?: number, y?: number, width?: number, height?: number): void;
}

// ---------------------------------------------------------------------------
// Bitmap
// ---------------------------------------------------------------------------

declare class Bitmap {
    constructor(width?: number, height?: number);
    initialize(width?: number, height?: number): void;

    fontFace: string;
    fontSize: number;
    fontBold: boolean;
    fontItalic: boolean;
    textColor: string;
    outlineColor: string;
    outlineWidth: number;

    readonly url: string;
    readonly baseTexture: PIXI.BaseTexture;
    readonly image: HTMLImageElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly width: number;
    readonly height: number;
    readonly rect: Rectangle;

    smooth: boolean;
    paintOpacity: number;

    static load(url: string): Bitmap;
    static snap(stage: Stage): Bitmap;

    isReady(): boolean;
    isError(): boolean;
    destroy(): void;
    resize(width: number, height: number): void;
    blt(source: Bitmap, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw?: number, dh?: number): void;
    getPixel(x: number, y: number): string;
    getAlphaPixel(x: number, y: number): number;
    clearRect(x: number, y: number, width: number, height: number): void;
    clear(): void;
    fillRect(x: number, y: number, width: number, height: number, color: string): void;
    fillAll(color: string): void;
    strokeRect(x: number, y: number, width: number, height: number, color: string): void;
    gradientFillRect(x: number, y: number, width: number, height: number, color1: string, color2: string, vertical?: boolean): void;
    drawCircle(x: number, y: number, radius: number, color: string): void;
    drawText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align?: string): void;
    measureTextWidth(text: string): number;
    addLoadListener(listner: (bitmap: Bitmap) => void): void;
    retry(): void;

    _canvas: HTMLCanvasElement | null;
    _context: CanvasRenderingContext2D | null;
    _baseTexture: PIXI.BaseTexture | null;
    _image: HTMLImageElement | null;
    _url: string;
    _paintOpacity: number;
    _smooth: boolean;
    _loadListeners: Array<(bitmap: Bitmap) => void>;
    _loadingState: "none" | "loading" | "loaded" | "error";

    _makeFontNameText(): string;
    _drawTextOutline(text: string, tx: number, ty: number, maxWidth: number): void;
    _drawTextBody(text: string, tx: number, ty: number, maxWidth: number): void;
    _createCanvas(width: number, height: number): void;
    _ensureCanvas(): void;
    _destroyCanvas(): void;
    _createBaseTexture(source: HTMLCanvasElement | HTMLImageElement): void;
    _updateScaleMode(): void;
    _startLoading(): void;
    _startDecrypting(): void;
    _onXhrLoad(xhr: XMLHttpRequest): void;
    _onLoad(): void;
    _callLoadListeners(): void;
    _onError(): void;
}

// ---------------------------------------------------------------------------
// Sprite
// ---------------------------------------------------------------------------

declare class Sprite extends PIXI.Sprite {
    constructor(bitmap?: Bitmap);
    initialize(bitmap?: Bitmap): void;

    spriteId: number;

    dy: number;
    ry: number;

    bitmap: Bitmap | null;
    width: number;
    height: number;
    opacity: number;
    blendMode: number;

    static _emptyBaseTexture: PIXI.BaseTexture | null;
    static _counter: number;

    destroy(): void;
    update(): void;
    hide(): void;
    show(): void;
    updateVisibility(): void;
    move(x: number, y: number): void;
    setFrame(x: number, y: number, width: number, height: number): void;
    setHue(hue: number): void;
    getBlendColor(): [number, number, number, number];
    setBlendColor(color: [number, number, number, number]): void;
    getColorTone(): [number, number, number, number];
    setColorTone(tone: [number, number, number, number]): void;

    _bitmap: Bitmap | null;
    _frame: Rectangle;
    _hue: number;
    _blendColor: [number, number, number, number];
    _colorTone: [number, number, number, number];
    _colorFilter: ColorFilter | null;
    _blendMode: number;
    _hidden: boolean;
    _refreshFrame: boolean;

    _onBitmapChange(): void;
    _onBitmapLoad(bitmapLoaded: Bitmap): void;
    _refresh(): void;
    _createColorFilter(): void;
    _updateColorFilter(): void;
}

// ---------------------------------------------------------------------------
// Tilemap
// ---------------------------------------------------------------------------

declare class Tilemap extends PIXI.Container {
    constructor();
    initialize(): void;

    tileWidth: number;
    tileHeight: number;
    origin: Point;
    flags: number[];
    animationCount: number;
    animationFrame: number;
    horizontalWrap: boolean;
    verticalWrap: boolean;

    width: number;
    height: number;

    static readonly TILE_ID_B: number;
    static readonly TILE_ID_C: number;
    static readonly TILE_ID_D: number;
    static readonly TILE_ID_E: number;
    static readonly TILE_ID_A5: number;
    static readonly TILE_ID_A1: number;
    static readonly TILE_ID_A2: number;
    static readonly TILE_ID_A3: number;
    static readonly TILE_ID_A4: number;
    static readonly TILE_ID_MAX: number;

    static readonly FLOOR_AUTOTILE_TABLE: number[][][][];
    static readonly WALL_AUTOTILE_TABLE: number[][][][];
    static readonly WATERFALL_AUTOTILE_TABLE: number[][][][];

    static isVisibleTile(tileId: number): boolean;
    static isAutotile(tileId: number): boolean;
    static getAutotileKind(tileId: number): number;
    static getAutotileShape(tileId: number): number;
    static makeAutotileId(kind: number, shape: number): number;
    static isSameKindTile(tileID1: number, tileID2: number): boolean;
    static isTileA1(tileId: number): boolean;
    static isTileA2(tileId: number): boolean;
    static isTileA3(tileId: number): boolean;
    static isTileA4(tileId: number): boolean;
    static isTileA5(tileId: number): boolean;
    static isWaterTile(tileId: number): boolean;
    static isWaterfallTile(tileId: number): boolean;
    static isGroundTile(tileId: number): boolean;
    static isShadowingTile(tileId: number): boolean;
    static isRoofTile(tileId: number): boolean;
    static isWallTopTile(tileId: number): boolean;
    static isWallSideTile(tileId: number): boolean;
    static isWallTile(tileId: number): boolean;
    static isFloorTypeAutotile(tileId: number): boolean;
    static isWallTypeAutotile(tileId: number): boolean;
    static isWaterfallTypeAutotile(tileId: number): boolean;

    destroy(): void;
    setData(width: number, height: number, data: number[]): void;
    isReady(): boolean;
    update(): void;
    setBitmaps(bitmaps: Bitmap[]): void;
    refresh(): void;
    updateTransform(): void;

    _width: number;
    _height: number;
    _margin: number;
    _mapWidth: number;
    _mapHeight: number;
    _mapData: number[] | null;
    _bitmaps: Bitmap[];
    _lowerLayer: Tilemap.CombinedLayer;
    _upperLayer: Tilemap.CombinedLayer;
    _needsRepaint: boolean;
    _needsBitmapsUpdate: boolean;
    _lastAnimationFrame: number;
    _lastStartX: number;
    _lastStartY: number;

    _createLayers(): void;
    _updateBitmaps(): void;
    _addAllSpots(startX: number, startY: number): void;
    _addSpot(startX: number, startY: number, x: number, y: number): void;
    _addSpotTile(tileId: number, dx: number, dy: number): void;
    _addTile(layer: Tilemap.CombinedLayer, tileId: number, dx: number, dy: number): void;
    _addNormalTile(layer: Tilemap.CombinedLayer, tileId: number, dx: number, dy: number): void;
    _addAutotile(layer: Tilemap.CombinedLayer, tileId: number, dx: number, dy: number): void;
    _addTableEdge(layer: Tilemap.CombinedLayer, tileId: number, dx: number, dy: number): void;
    _addShadow(layer: Tilemap.CombinedLayer, shadowBits: number, dx: number, dy: number): void;
    _readMapData(x: number, y: number, z: number): number;
    _isHigherTile(tileId: number): boolean;
    _isTableTile(tileId: number): boolean;
    _isOverpassPosition(mx: number, my: number): boolean;
    _sortChildren(): void;
    _compareChildOrder(a: PIXI.DisplayObject, b: PIXI.DisplayObject): number;
}

declare namespace Tilemap {
    class Layer extends PIXI.Container {
        constructor();
        initialize(): void;

        static readonly MAX_GL_TEXTURES: number;
        static readonly VERTEX_STRIDE: number;
        static readonly MAX_SIZE: number;

        destroy(): void;
        setBitmaps(bitmaps: Bitmap[]): void;
        clear(): void;
        size(): number;
        addRect(setNumber: number, sx: number, sy: number, dx: number, dy: number, w: number, h: number): void;
        render(renderer: PIXI.Renderer): void;
        isReady(): boolean;

        _elements: number[][];
        _indexBuffer: PIXI.Buffer | null;
        _indexArray: Float32Array;
        _vertexBuffer: PIXI.Buffer | null;
        _vertexArray: Float32Array;
        _vao: PIXI.Geometry | null;
        _needsTexturesUpdate: boolean;
        _needsVertexUpdate: boolean;
        _images: (HTMLImageElement | HTMLCanvasElement)[];
        _state: any;

        _createVao(): void;
        _updateIndexBuffer(): void;
        _updateVertexBuffer(): void;
    }

    class CombinedLayer extends PIXI.Container {
        constructor();
        initialize(): void;

        destroy(): void;
        setBitmaps(bitmaps: Bitmap[]): void;
        clear(): void;
        size(): number;
        addRect(setNumber: number, sx: number, sy: number, dx: number, dy: number, w: number, h: number): void;
        isReady(): boolean;
    }

    class Renderer extends PIXI.ObjectRenderer {
        constructor(renderer: PIXI.Renderer);
        initialize(renderer: PIXI.Renderer): void;

        destroy(): void;
        getShader(): PIXI.Shader;
        contextChange(): void;
        updateTextures(renderer: PIXI.Renderer, images: (HTMLImageElement | HTMLCanvasElement)[]): void;
        bindTextures(renderer: PIXI.Renderer): void;

        _shader: PIXI.Shader | null;
        _images: (HTMLImageElement | HTMLCanvasElement)[];
        _internalTextures: PIXI.BaseTexture[];
        _clearBuffer: Uint8Array;

        _createShader(): PIXI.Shader;
        _createInternalTextures(): void;
        _destroyInternalTextures(): void;
    }
}

// ---------------------------------------------------------------------------
// TilingSprite
// ---------------------------------------------------------------------------

declare class TilingSprite extends PIXI.TilingSprite {
    constructor(bitmap?: Bitmap);
    initialize(bitmap?: Bitmap): void;

    origin: Point;

    bitmap: Bitmap | null;
    opacity: number;

    static _emptyBaseTexture: PIXI.BaseTexture | null;

    destroy(): void;
    update(): void;
    move(x: number, y: number, width: number, height: number): void;
    setFrame(x: number, y: number, width: number, height: number): void;
    updateTransform(): void;

    _bitmap: Bitmap | null;
    _width: number;
    _height: number;
    _frame: Rectangle;

    _onBitmapChange(): void;
    _onBitmapLoad(): void;
    _refresh(): void;
}

// ---------------------------------------------------------------------------
// ScreenSprite
// ---------------------------------------------------------------------------

declare class ScreenSprite extends PIXI.Container {
    constructor();
    initialize(): void;

    opacity: number;

    destroy(): void;
    setBlack(): void;
    setWhite(): void;
    setColor(r: number, g: number, b: number): void;

    _graphics: PIXI.Graphics;
    _red: number;
    _green: number;
    _blue: number;
}

// ---------------------------------------------------------------------------
// Window
// The RMMZ Window class for in-game UI windows.
// ---------------------------------------------------------------------------

declare class Window extends PIXI.Container {
    constructor();
    initialize(...args: any[]): void;

    origin: Point;
    active: boolean;
    frameVisible: boolean;
    cursorVisible: boolean;
    downArrowVisible: boolean;
    upArrowVisible: boolean;
    pause: boolean;

    windowskin: Bitmap;
    contents: Bitmap;
    contentsBack: Bitmap;
    width: number;
    height: number;
    padding: number;
    margin: number;
    opacity: number;
    backOpacity: number;
    contentsOpacity: number;
    openness: number;
    readonly innerWidth: number;
    readonly innerHeight: number;
    readonly innerRect: Rectangle;

    destroy(): void;
    update(): void;
    move(x: number, y: number, width: number, height: number): void;
    isOpen(): boolean;
    isClosed(): boolean;
    setCursorRect(x: number, y: number, width: number, height: number): void;
    moveCursorBy(x: number, y: number): void;
    moveInnerChildrenBy(x: number, y: number): void;
    setTone(r: number, g: number, b: number): void;
    addChildToBack(child: PIXI.DisplayObject): PIXI.DisplayObject;
    addInnerChild(child: PIXI.DisplayObject): PIXI.DisplayObject;
    updateTransform(): void;
    drawShape(graphics: PIXI.Graphics): void;

    _isWindow: boolean;
    _windowskin: Bitmap | null;
    _width: number;
    _height: number;
    _cursorRect: Rectangle;
    _openness: number;
    _animationCount: number;
    _padding: number;
    _margin: number;
    _colorTone: [number, number, number, number];
    _innerChildren: PIXI.DisplayObject[];
    _container: PIXI.Container;
    _backSprite: Sprite;
    _frameSprite: Sprite;
    _contentsBackSprite: Sprite;
    _cursorSprite: Sprite;
    _contentsSprite: Sprite;
    _downArrowSprite: Sprite;
    _upArrowSprite: Sprite;
    _pauseSignSprite: Sprite;
    _clientArea: Sprite;

    _createAllParts(): void;
    _createContainer(): void;
    _createBackSprite(): void;
    _createFrameSprite(): void;
    _createClientArea(): void;
    _createContentsBackSprite(): void;
    _createCursorSprite(): void;
    _createContentsSprite(): void;
    _createArrowSprites(): void;
    _createPauseSignSprites(): void;
    _onWindowskinLoad(): void;
    _refreshAllParts(): void;
    _refreshBack(): void;
    _refreshFrame(): void;
    _refreshCursor(): void;
    _setRectPartsGeometry(sprite: Sprite, srect: { x: number; y: number; width: number; height: number }, drect: { x: number; y: number; width: number; height: number }, m: number): void;
    _refreshArrows(): void;
    _refreshPauseSign(): void;
    _updateClientArea(): void;
    _updateFrame(): void;
    _updateContentsBack(): void;
    _updateCursor(): void;
    _makeCursorAlpha(): number;
    _updateContents(): void;
    _updateArrows(): void;
    _updatePauseSign(): void;
    _updateFilterArea(): void;
}

// ---------------------------------------------------------------------------
// WindowLayer
// ---------------------------------------------------------------------------

declare class WindowLayer extends PIXI.Container {
    constructor();
    initialize(): void;

    update(): void;
    render(renderer: PIXI.Renderer): void;
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

declare class Weather extends PIXI.Container {
    constructor();
    initialize(): void;

    type: "none" | "rain" | "storm" | "snow";
    power: number;
    origin: Point;

    destroy(): void;
    update(): void;

    _width: number;
    _height: number;
    _sprites: Sprite[];
    _rainBitmap: Bitmap;
    _stormBitmap: Bitmap;
    _snowBitmap: Bitmap;
    _dimmerSprite: ScreenSprite;

    _createBitmaps(): void;
    _createDimmer(): void;
    _updateDimmer(): void;
    _updateAllSprites(): void;
    _addSprite(): void;
    _removeSprite(): void;
    _updateSprite(sprite: Sprite): void;
    _updateRainSprite(sprite: Sprite): void;
    _updateStormSprite(sprite: Sprite): void;
    _updateSnowSprite(sprite: Sprite): void;
    _rebornSprite(sprite: Sprite): void;
}

// ---------------------------------------------------------------------------
// ColorFilter
// ---------------------------------------------------------------------------

declare class ColorFilter extends PIXI.Filter {
    constructor();
    initialize(): void;

    setHue(hue: number): void;
    setColorTone(tone: [number, number, number, number]): void;
    setBlendColor(color: [number, number, number, number]): void;
    setBrightness(brightness: number): void;

    _fragmentSrc(): string;
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

declare class Stage extends PIXI.Container {
    constructor();
    initialize(): void;

    destroy(): void;
}

// ---------------------------------------------------------------------------
// WebAudio
// ---------------------------------------------------------------------------

declare class WebAudio {
    constructor(url: string);
    initialize(url: string): void;

    readonly url: string;
    volume: number;
    pitch: number;
    pan: number;

    static initialize(): boolean;
    static setMasterVolume(value: number): void;

    static _context: AudioContext | null;
    static _masterGainNode: GainNode | null;
    static _masterVolume: number;

    static _createContext(): void;
    static _currentTime(): number;
    static _createMasterGainNode(): void;
    static _setupEventHandlers(): void;
    static _onUserGesture(): void;
    static _onVisibilityChange(): void;
    static _onHide(): void;
    static _onShow(): void;
    static _shouldMuteOnHide(): boolean;
    static _resetVolume(): void;
    static _fadeIn(duration: number): void;
    static _fadeOut(duration: number): void;

    clear(): void;
    isReady(): boolean;
    isError(): boolean;
    isPlaying(): boolean;
    play(loop: boolean, offset?: number): void;
    stop(): void;
    destroy(): void;
    fadeIn(duration: number): void;
    fadeOut(duration: number): void;
    seek(): number;
    addLoadListener(listner: () => void): void;
    addStopListener(listner: () => void): void;
    retry(): void;

    _data: Uint8Array | null;
    _fetchedSize: number;
    _fetchedData: Uint8Array[];
    _buffers: AudioBuffer[];
    _sourceNodes: AudioBufferSourceNode[];
    _gainNode: GainNode | null;
    _pannerNode: PannerNode | null;
    _totalTime: number;
    _sampleRate: number;
    _loop: boolean;
    _loopStart: number;
    _loopLength: number;
    _loopStartTime: number;
    _loopLengthTime: number;
    _startTime: number;
    _volume: number;
    _pitch: number;
    _pan: number;
    _endTimer: number | null;
    _loadListeners: Array<() => void>;
    _stopListeners: Array<() => void>;
    _lastUpdateTime: number;
    _isLoaded: boolean;
    _isError: boolean;
    _isPlaying: boolean;
    _decoder: any;
    _url: string;

    _startLoading(): void;
    _shouldUseDecoder(): boolean;
    _createDecoder(): void;
    _destroyDecoder(): void;
    _realUrl(): string;
    _startXhrLoading(url: string): void;
    _startFetching(url: string): void;
    _onXhrLoad(xhr: XMLHttpRequest): void;
    _onFetch(response: Response): void;
    _onError(): void;
    _onFetchProcess(value: Uint8Array): void;
    _updateBufferOnFetch(): void;
    _concatenateFetchedData(): void;
    _updateBuffer(): void;
    _readableBuffer(): ArrayBuffer;
    _decodeAudioData(arrayBuffer: ArrayBuffer): void;
    _onDecode(buffer: AudioBuffer): void;
    _refreshSourceNode(): void;
    _startPlaying(offset: number): void;
    _startAllSourceNodes(): void;
    _startSourceNode(index: number): void;
    _stopSourceNode(): void;
    _createPannerNode(): void;
    _createGainNode(): void;
    _createAllSourceNodes(): void;
    _createSourceNode(index: number): void;
    _removeNodes(): void;
    _createEndTimer(): void;
    _removeEndTimer(): void;
    _updatePanner(): void;
    _onLoad(): void;
    _readLoopComments(arrayBuffer: ArrayBuffer): void;
    _readMetaData(view: DataView, index: number, size: number): void;
    _readFourCharacters(view: DataView, index: number): string;
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

declare class Video {
    private constructor();

    static initialize(width: number, height: number): void;
    static resize(width: number, height: number): void;
    static play(src: string): void;
    static isPlaying(): boolean;
    static setVolume(volume: number): void;

    static _element: HTMLVideoElement | null;
    static _loading: boolean;
    static _volume: number;

    static _createElement(): void;
    static _onLoad(): void;
    static _onError(): void;
    static _onEnd(): void;
    static _updateVisibility(videoVisible: boolean): void;
    static _isVisible(): boolean;
    static _setupEventHandlers(): void;
    static _onUserGesture(): void;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

declare class Input {
    private constructor();

    static keyRepeatWait: number;
    static keyRepeatInterval: number;
    static keyMapper: Record<number, string>;
    static gamepadMapper: Record<number, string>;

    static readonly dir4: number;
    static readonly dir8: number;
    static readonly date: number;

    static initialize(): void;
    static clear(): void;
    static update(): void;
    static isPressed(keyName: string): boolean;
    static isTriggered(keyName: string): boolean;
    static isRepeated(keyName: string): boolean;
    static isLongPressed(keyName: string): boolean;
    static virtualClick(buttonName: string): void;

    static _currentState: Record<string, boolean>;
    static _previousState: Record<string, boolean>;
    static _gamepadStates: boolean[][];
    static _latestButton: string | null;
    static _pressedTime: number;
    static _dir4: number;
    static _dir8: number;
    static _preferredAxis: string;
    static _date: number;
    static _virtualButton: string | null;

    static _setupEventHandlers(): void;
    static _onKeyDown(event: KeyboardEvent): void;
    static _shouldPreventDefault(keyCode: number): boolean;
    static _onKeyUp(event: KeyboardEvent): void;
    static _onLostFocus(): void;
    static _pollGamepads(): void;
    static _updateGamepadState(gamepad: Gamepad): void;
    static _updateDirection(): void;
    static _signX(): number;
    static _signY(): number;
    static _makeNumpadDirection(x: number, y: number): number;
    static _isEscapeCompatible(keyName: string): boolean;
}

// ---------------------------------------------------------------------------
// TouchInput
// ---------------------------------------------------------------------------

interface TouchInputState {
    triggered: boolean;
    cancelled: boolean;
    moved: boolean;
    hovered: boolean;
    released: boolean;
    wheelX: number;
    wheelY: number;
}

declare class TouchInput {
    private constructor();

    static keyRepeatWait: number;
    static keyRepeatInterval: number;
    static moveThreshold: number;

    static readonly wheelX: number;
    static readonly wheelY: number;
    static readonly x: number;
    static readonly y: number;
    static readonly date: number;

    static initialize(): void;
    static clear(): void;
    static update(): void;
    static isClicked(): boolean;
    static isPressed(): boolean;
    static isTriggered(): boolean;
    static isRepeated(): boolean;
    static isLongPressed(): boolean;
    static isCancelled(): boolean;
    static isMoved(): boolean;
    static isHovered(): boolean;
    static isReleased(): boolean;

    static _mousePressed: boolean;
    static _screenPressed: boolean;
    static _pressedTime: number;
    static _clicked: boolean;
    static _newState: TouchInputState;
    static _currentState: TouchInputState;
    static _x: number;
    static _y: number;
    static _triggerX: number;
    static _triggerY: number;
    static _moved: boolean;
    static _date: number;

    static _createNewState(): TouchInputState;
    static _setupEventHandlers(): void;
    static _onMouseDown(event: MouseEvent): void;
    static _onLeftButtonDown(event: MouseEvent): void;
    static _onMiddleButtonDown(event: MouseEvent): void;
    static _onRightButtonDown(event: MouseEvent): void;
    static _onMouseMove(event: MouseEvent): void;
    static _onMouseUp(event: MouseEvent): void;
    static _onWheel(event: WheelEvent): void;
    static _onTouchStart(event: TouchEvent): void;
    static _onTouchMove(event: TouchEvent): void;
    static _onTouchEnd(event: TouchEvent): void;
    static _onTouchCancel(event: TouchEvent): void;
    static _onLostFocus(): void;
    static _onTrigger(x: number, y: number): void;
    static _onCancel(x: number, y: number): void;
    static _onMove(x: number, y: number): void;
    static _onHover(x: number, y: number): void;
    static _onRelease(x: number, y: number): void;
}

// ---------------------------------------------------------------------------
// JsonEx
// ---------------------------------------------------------------------------

declare class JsonEx {
    private constructor();

    static maxDepth: number;

    static stringify(object: unknown): string;
    static parse(json: string): any;
    static makeDeepCopy<T>(object: T): T;

    static _encode(value: unknown, depth: number): unknown;
    static _decode(value: unknown): unknown;
}
