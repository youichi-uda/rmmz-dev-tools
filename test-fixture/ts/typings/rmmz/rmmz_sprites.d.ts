// Type definitions for rmmz_sprites.js v1.10.0
// RPG Maker MZ sprite classes
// Definitions generated from the RMMZ source code.

// ---------------------------------------------------------------------------
// Sprite_Clickable
// ---------------------------------------------------------------------------

declare class Sprite_Clickable extends Sprite {
    constructor();
    initialize(): void;

    _pressed: boolean;
    _hovered: boolean;

    update(): void;
    processTouch(): void;
    isPressed(): boolean;
    isClickEnabled(): boolean;
    isBeingTouched(): boolean;
    hitTest(x: number, y: number): boolean;
    onMouseEnter(): void;
    onMouseExit(): void;
    onPress(): void;
    onClick(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Button
// ---------------------------------------------------------------------------

declare class Sprite_Button extends Sprite_Clickable {
    constructor(buttonType: string);
    initialize(buttonType: string): void;

    _buttonType: string;
    _clickHandler: (() => void) | null;
    _coldFrame: Rectangle | null;
    _hotFrame: Rectangle | null;

    setupFrames(): void;
    blockWidth(): number;
    blockHeight(): number;
    loadButtonImage(): void;
    buttonData(): { x: number; w: number };
    update(): void;
    checkBitmap(): void;
    updateFrame(): void;
    updateOpacity(): void;
    setColdFrame(x: number, y: number, width: number, height: number): void;
    setHotFrame(x: number, y: number, width: number, height: number): void;
    setClickHandler(method: (() => void) | null): void;
    onClick(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Character
// ---------------------------------------------------------------------------

declare class Sprite_Character extends Sprite {
    constructor(character: Game_Character);
    initialize(character: Game_Character): void;

    _character: Game_Character | null;
    _balloonDuration: number;
    _tilesetId: number;
    _upperBody: Sprite | null;
    _lowerBody: Sprite | null;
    _tileId: number;
    _characterName: string;
    _characterIndex: number;
    _isBigCharacter: boolean;
    _bushDepth: number;
    z: number;

    initMembers(): void;
    setCharacter(character: Game_Character): void;
    checkCharacter(character: Game_Character): boolean;
    update(): void;
    updateVisibility(): void;
    isTile(): boolean;
    isObjectCharacter(): boolean;
    isEmptyCharacter(): boolean;
    tilesetBitmap(tileId: number): Bitmap;
    updateBitmap(): void;
    isImageChanged(): boolean;
    setTileBitmap(): void;
    setCharacterBitmap(): void;
    updateFrame(): void;
    updateTileFrame(): void;
    updateCharacterFrame(): void;
    characterBlockX(): number;
    characterBlockY(): number;
    characterPatternX(): number;
    characterPatternY(): number;
    patternWidth(): number;
    patternHeight(): number;
    updateHalfBodySprites(): void;
    createHalfBodySprites(): void;
    updatePosition(): void;
    updateOther(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Battler
// ---------------------------------------------------------------------------

declare class Sprite_Battler extends Sprite_Clickable {
    constructor(battler?: Game_Actor | Game_Enemy);
    initialize(battler?: Game_Actor | Game_Enemy): void;

    _battler: Game_Actor | Game_Enemy | null;
    _damages: Sprite_Damage[];
    _homeX: number;
    _homeY: number;
    _offsetX: number;
    _offsetY: number;
    _targetOffsetX: number;
    _targetOffsetY: number;
    _movementDuration: number;
    _selectionEffectCount: number;

    initMembers(): void;
    setBattler(battler: Game_Actor | Game_Enemy): void;
    checkBattler(battler: Game_Actor | Game_Enemy): boolean;
    mainSprite(): Sprite;
    setHome(x: number, y: number): void;
    update(): void;
    updateVisibility(): void;
    updateMain(): void;
    updateBitmap(): void;
    updateFrame(): void;
    updateMove(): void;
    updatePosition(): void;
    updateDamagePopup(): void;
    updateSelectionEffect(): void;
    setupDamagePopup(): void;
    createDamageSprite(): void;
    destroyDamageSprite(sprite: Sprite_Damage): void;
    damageOffsetX(): number;
    damageOffsetY(): number;
    startMove(x: number, y: number, duration: number): void;
    onMoveEnd(): void;
    isEffecting(): boolean;
    isMoving(): boolean;
    inHomePosition(): boolean;
    onMouseEnter(): void;
    onPress(): void;
    onClick(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Actor
// ---------------------------------------------------------------------------

declare class Sprite_Actor extends Sprite_Battler {
    constructor(battler?: Game_Actor);
    initialize(battler?: Game_Actor): void;

    static MOTIONS: {
        [key: string]: { index: number; loop: boolean };
    };

    _actor: Game_Actor | null;
    _battlerName: string;
    _motion: { index: number; loop: boolean } | null;
    _motionCount: number;
    _pattern: number;
    _mainSprite: Sprite;
    _shadowSprite: Sprite;
    _weaponSprite: Sprite_Weapon;
    _stateSprite: Sprite_StateOverlay;

    initMembers(): void;
    mainSprite(): Sprite;
    createMainSprite(): void;
    createShadowSprite(): void;
    createWeaponSprite(): void;
    createStateSprite(): void;
    setBattler(battler: Game_Actor): void;
    moveToStartPosition(): void;
    setActorHome(index: number): void;
    update(): void;
    updateShadow(): void;
    updateMain(): void;
    setupMotion(): void;
    setupWeaponAnimation(): void;
    startMotion(motionType: string): void;
    updateTargetPosition(): void;
    shouldStepForward(): boolean;
    updateBitmap(): void;
    updateFrame(): void;
    updateMove(): void;
    updateMotion(): void;
    updateMotionCount(): void;
    motionSpeed(): number;
    refreshMotion(): void;
    startEntryMotion(): void;
    stepForward(): void;
    stepBack(): void;
    retreat(): void;
    onMoveEnd(): void;
    damageOffsetX(): number;
    damageOffsetY(): number;
}

// ---------------------------------------------------------------------------
// Sprite_Enemy
// ---------------------------------------------------------------------------

declare class Sprite_Enemy extends Sprite_Battler {
    constructor(battler: Game_Enemy);
    initialize(battler: Game_Enemy): void;

    _enemy: Game_Enemy | null;
    _appeared: boolean;
    _battlerName: string | null;
    _battlerHue: number;
    _effectType: string | null;
    _effectDuration: number;
    _shake: number;
    _stateIconSprite: Sprite_StateIcon;

    initMembers(): void;
    createStateIconSprite(): void;
    setBattler(battler: Game_Enemy): void;
    update(): void;
    updateBitmap(): void;
    loadBitmap(name: string): void;
    setHue(hue: number): void;
    updateFrame(): void;
    updatePosition(): void;
    updateStateSprite(): void;
    initVisibility(): void;
    setupEffect(): void;
    startEffect(effectType: string): void;
    startAppear(): void;
    startDisappear(): void;
    startWhiten(): void;
    startBlink(): void;
    startCollapse(): void;
    startBossCollapse(): void;
    startInstantCollapse(): void;
    updateEffect(): void;
    isEffecting(): boolean;
    revertToNormal(): void;
    updateWhiten(): void;
    updateBlink(): void;
    updateAppear(): void;
    updateDisappear(): void;
    updateCollapse(): void;
    updateBossCollapse(): void;
    updateInstantCollapse(): void;
    damageOffsetX(): number;
    damageOffsetY(): number;
}

// ---------------------------------------------------------------------------
// Sprite_Animation
// ---------------------------------------------------------------------------

declare class Sprite_Animation extends Sprite {
    constructor();
    initialize(): void;

    _targets: Sprite[];
    _animation: rm.types.Animation | null;
    _mirror: boolean;
    _delay: number;
    _previous: Sprite_Animation | null;
    _effect: any;
    _handle: any;
    _playing: boolean;
    _started: boolean;
    _frameIndex: number;
    _maxTimingFrames: number;
    _flashColor: number[];
    _flashDuration: number;
    _viewportSize: number;
    z: number;
    targetObjects: any[];

    initMembers(): void;
    destroy(options?: any): void;
    setup(
        targets: Sprite[],
        animation: rm.types.Animation,
        mirror: boolean,
        delay: number,
        previous: Sprite_Animation | null
    ): void;
    update(): void;
    canStart(): boolean;
    shouldWaitForPrevious(): boolean;
    updateEffectGeometry(): void;
    updateMain(): void;
    processSoundTimings(): void;
    processFlashTimings(): void;
    checkEnd(): void;
    updateFlash(): void;
    isPlaying(): boolean;
    setRotation(x: number, y: number, z: number): void;
    _render(renderer: any): void;
    setProjectionMatrix(renderer: any): void;
    setCameraMatrix(renderer: any): void;
    setViewport(renderer: any): void;
    targetPosition(renderer: any): Point;
    targetSpritePosition(sprite: Sprite): Point;
    resetViewport(renderer: any): void;
    onBeforeRender(renderer: any): void;
    onAfterRender(renderer: any): void;
}

// ---------------------------------------------------------------------------
// Sprite_AnimationMV
// ---------------------------------------------------------------------------

declare class Sprite_AnimationMV extends Sprite {
    constructor();
    initialize(): void;

    _targets: Sprite[];
    _animation: any;
    _mirror: boolean;
    _delay: number;
    _rate: number;
    _duration: number;
    _flashColor: number[];
    _flashDuration: number;
    _screenFlashDuration: number;
    _hidingDuration: number;
    _hue1: number;
    _hue2: number;
    _bitmap1: Bitmap | null;
    _bitmap2: Bitmap | null;
    _cellSprites: Sprite[];
    _screenFlashSprite: ScreenSprite | null;
    z: number;
    targetObjects: any[];

    initMembers(): void;
    setup(
        targets: Sprite[],
        animation: any,
        mirror: boolean,
        delay: number
    ): void;
    setupRate(): void;
    setupDuration(): void;
    update(): void;
    updateFlash(): void;
    updateScreenFlash(): void;
    absoluteX(): number;
    absoluteY(): number;
    updateHiding(): void;
    isPlaying(): boolean;
    loadBitmaps(): void;
    isReady(): boolean;
    createCellSprites(): void;
    createScreenFlashSprite(): void;
    updateMain(): void;
    updatePosition(): void;
    updateFrame(): void;
    currentFrameIndex(): number;
    updateAllCellSprites(frame: number[][]): void;
    updateCellSprite(sprite: Sprite, cell: number[]): void;
    processTimingData(timing: any): void;
    startFlash(color: number[], duration: number): void;
    startScreenFlash(color: number[], duration: number): void;
    startHiding(duration: number): void;
    onEnd(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Battleback
// ---------------------------------------------------------------------------

declare class Sprite_Battleback extends TilingSprite {
    constructor(type: number);
    initialize(type: number): void;

    adjustPosition(): void;
    battleback1Bitmap(): Bitmap;
    battleback2Bitmap(): Bitmap;
    battleback1Name(): string;
    battleback2Name(): string;
    overworldBattleback1Name(): string;
    overworldBattleback2Name(): string;
    normalBattleback1Name(): string;
    normalBattleback2Name(): string;
    terrainBattleback1Name(type: number): string | null;
    terrainBattleback2Name(type: number): string | undefined;
    defaultBattleback1Name(): string;
    defaultBattleback2Name(): string;
    shipBattleback1Name(): string;
    shipBattleback2Name(): string;
    autotileType(z: number): number;
}

// ---------------------------------------------------------------------------
// Sprite_Balloon
// ---------------------------------------------------------------------------

declare class Sprite_Balloon extends Sprite {
    constructor();
    initialize(): void;

    _target: Sprite | null;
    _balloonId: number;
    _duration: number;
    z: number;
    targetObject: any;

    initMembers(): void;
    loadBitmap(): void;
    setup(targetSprite: Sprite, balloonId: number): void;
    update(): void;
    updatePosition(): void;
    updateFrame(): void;
    speed(): number;
    waitTime(): number;
    frameIndex(): number;
    isPlaying(): boolean;
}

// ---------------------------------------------------------------------------
// Sprite_Damage
// ---------------------------------------------------------------------------

declare class Sprite_Damage extends Sprite {
    constructor();
    initialize(): void;

    _duration: number;
    _flashColor: number[];
    _flashDuration: number;
    _colorType: number;

    destroy(options?: any): void;
    setup(target: Game_Actor | Game_Enemy): void;
    setupCriticalEffect(): void;
    fontFace(): string;
    fontSize(): number;
    damageColor(): string;
    outlineColor(): string;
    outlineWidth(): number;
    createMiss(): void;
    createDigits(value: number): void;
    createChildSprite(width: number, height: number): Sprite;
    createBitmap(width: number, height: number): Bitmap;
    update(): void;
    updateChild(sprite: Sprite): void;
    updateFlash(): void;
    updateOpacity(): void;
    isPlaying(): boolean;
}

// ---------------------------------------------------------------------------
// Sprite_Gauge
// ---------------------------------------------------------------------------

declare class Sprite_Gauge extends Sprite {
    constructor();
    initialize(): void;

    _battler: Game_Actor | Game_Enemy | null;
    _statusType: string;
    _value: number;
    _maxValue: number;
    _targetValue: number;
    _targetMaxValue: number;
    _duration: number;
    _flashingCount: number;

    initMembers(): void;
    destroy(options?: any): void;
    createBitmap(): void;
    bitmapWidth(): number;
    bitmapHeight(): number;
    textHeight(): number;
    gaugeHeight(): number;
    gaugeX(): number;
    labelY(): number;
    labelFontFace(): string;
    labelFontSize(): number;
    valueFontFace(): string;
    valueFontSize(): number;
    setup(battler: Game_Actor | Game_Enemy, statusType: string): void;
    update(): void;
    updateBitmap(): void;
    updateTargetValue(value: number, maxValue: number): void;
    smoothness(): number;
    updateGaugeAnimation(): void;
    updateFlashing(): void;
    flashingColor1(): number[];
    flashingColor2(): number[];
    isValid(): boolean;
    currentValue(): number;
    currentMaxValue(): number;
    label(): string;
    gaugeBackColor(): string;
    gaugeColor1(): string;
    gaugeColor2(): string;
    labelColor(): string;
    labelOutlineColor(): string;
    labelOutlineWidth(): number;
    valueColor(): string;
    valueOutlineColor(): string;
    valueOutlineWidth(): number;
    redraw(): void;
    drawGauge(): void;
    drawGaugeRect(x: number, y: number, width: number, height: number): void;
    gaugeRate(): number;
    drawLabel(): void;
    setupLabelFont(): void;
    measureLabelWidth(): number;
    labelOpacity(): number;
    drawValue(): void;
    setupValueFont(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Name
// ---------------------------------------------------------------------------

declare class Sprite_Name extends Sprite {
    constructor();
    initialize(): void;

    _battler: Game_Actor | Game_Enemy | null;
    _name: string;
    _textColor: string;

    initMembers(): void;
    destroy(options?: any): void;
    createBitmap(): void;
    bitmapWidth(): number;
    bitmapHeight(): number;
    fontFace(): string;
    fontSize(): number;
    setup(battler: Game_Actor | Game_Enemy): void;
    update(): void;
    updateBitmap(): void;
    name(): string;
    textColor(): string;
    outlineColor(): string;
    outlineWidth(): number;
    redraw(): void;
    setupFont(): void;
}

// ---------------------------------------------------------------------------
// Sprite_StateIcon
// ---------------------------------------------------------------------------

declare class Sprite_StateIcon extends Sprite {
    constructor();
    initialize(): void;

    _battler: Game_Actor | Game_Enemy | null;
    _iconIndex: number;
    _animationCount: number;
    _animationIndex: number;

    initMembers(): void;
    loadBitmap(): void;
    setup(battler: Game_Actor | Game_Enemy): void;
    update(): void;
    animationWait(): number;
    updateIcon(): void;
    shouldDisplay(): boolean;
    updateFrame(): void;
}

// ---------------------------------------------------------------------------
// Sprite_StateOverlay
// ---------------------------------------------------------------------------

declare class Sprite_StateOverlay extends Sprite {
    constructor();
    initialize(): void;

    _battler: Game_Actor | Game_Enemy | null;
    _overlayIndex: number;
    _animationCount: number;
    _pattern: number;

    initMembers(): void;
    loadBitmap(): void;
    setup(battler: Game_Actor | Game_Enemy): void;
    update(): void;
    animationWait(): number;
    updatePattern(): void;
    updateFrame(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Weapon
// ---------------------------------------------------------------------------

declare class Sprite_Weapon extends Sprite {
    constructor();
    initialize(): void;

    _weaponImageId: number;
    _animationCount: number;
    _pattern: number;

    initMembers(): void;
    setup(weaponImageId: number): void;
    update(): void;
    animationWait(): number;
    updatePattern(): void;
    loadBitmap(): void;
    updateFrame(): void;
    isPlaying(): boolean;
}

// ---------------------------------------------------------------------------
// Sprite_Picture
// ---------------------------------------------------------------------------

declare class Sprite_Picture extends Sprite_Clickable {
    constructor(pictureId: number);
    initialize(pictureId: number): void;

    _pictureId: number;
    _pictureName: string;

    picture(): Game_Picture | null;
    update(): void;
    updateBitmap(): void;
    updateOrigin(): void;
    updatePosition(): void;
    updateScale(): void;
    updateTone(): void;
    updateOther(): void;
    loadBitmap(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Timer
// ---------------------------------------------------------------------------

declare class Sprite_Timer extends Sprite {
    constructor();
    initialize(): void;

    _seconds: number;

    destroy(options?: any): void;
    createBitmap(): void;
    fontFace(): string;
    fontSize(): number;
    update(): void;
    updateBitmap(): void;
    redraw(): void;
    timerText(): string;
    updatePosition(): void;
    updateVisibility(): void;
}

// ---------------------------------------------------------------------------
// Sprite_Destination
// ---------------------------------------------------------------------------

declare class Sprite_Destination extends Sprite {
    constructor();
    initialize(): void;

    _frameCount: number;

    destroy(options?: any): void;
    update(): void;
    createBitmap(): void;
    updatePosition(): void;
    updateAnimation(): void;
}

// ---------------------------------------------------------------------------
// Spriteset_Base
// ---------------------------------------------------------------------------

declare class Spriteset_Base extends Sprite {
    constructor();
    initialize(): void;

    _baseSprite: Sprite;
    _blackScreen: ScreenSprite;
    _baseColorFilter: ColorFilter;
    _pictureContainer: Sprite;
    _timerSprite: Sprite_Timer;
    _overallColorFilter: ColorFilter;
    _animationSprites: (Sprite_Animation | Sprite_AnimationMV)[];
    _effectsContainer: PIXI.Container;

    destroy(options?: any): void;
    loadSystemImages(): void;
    createLowerLayer(): void;
    createUpperLayer(): void;
    update(): void;
    createBaseSprite(): void;
    createBaseFilters(): void;
    createPictures(): void;
    pictureContainerRect(): Rectangle;
    createTimer(): void;
    createOverallFilters(): void;
    updateBaseFilters(): void;
    updateOverallFilters(): void;
    updatePosition(): void;
    findTargetSprite(target: any): Sprite | null;
    updateAnimations(): void;
    processAnimationRequests(): void;
    createAnimation(request: any): void;
    createAnimationSprite(
        targets: any[],
        animation: rm.types.Animation,
        mirror: boolean,
        delay: number
    ): void;
    isMVAnimation(animation: any): boolean;
    makeTargetSprites(targets: any[]): Sprite[];
    lastAnimationSprite(): Sprite_Animation | Sprite_AnimationMV;
    isAnimationForEach(animation: any): boolean;
    animationBaseDelay(): number;
    animationNextDelay(): number;
    animationShouldMirror(target: any): boolean;
    removeAnimation(sprite: Sprite_Animation | Sprite_AnimationMV): void;
    removeAllAnimations(): void;
    isAnimationPlaying(): boolean;
}

// ---------------------------------------------------------------------------
// Spriteset_Map
// ---------------------------------------------------------------------------

declare class Spriteset_Map extends Spriteset_Base {
    constructor();
    initialize(): void;

    _balloonSprites: Sprite_Balloon[];
    _characterSprites: Sprite_Character[];
    _parallax: TilingSprite;
    _tilemap: Tilemap;
    _tileset: rm.types.Tileset;
    _shadowSprite: Sprite;
    _destinationSprite: Sprite_Destination;
    _weather: Weather;
    _parallaxName: string;

    destroy(options?: any): void;
    loadSystemImages(): void;
    createLowerLayer(): void;
    update(): void;
    hideCharacters(): void;
    createParallax(): void;
    createTilemap(): void;
    loadTileset(): void;
    createCharacters(): void;
    createShadow(): void;
    createDestination(): void;
    createWeather(): void;
    updateTileset(): void;
    updateParallax(): void;
    updateTilemap(): void;
    updateShadow(): void;
    updateWeather(): void;
    updateBalloons(): void;
    processBalloonRequests(): void;
    createBalloon(request: any): void;
    removeBalloon(sprite: Sprite_Balloon): void;
    removeAllBalloons(): void;
    findTargetSprite(target: Game_Character): Sprite_Character | undefined;
    animationBaseDelay(): number;
}

// ---------------------------------------------------------------------------
// Spriteset_Battle
// ---------------------------------------------------------------------------

declare class Spriteset_Battle extends Spriteset_Base {
    constructor();
    initialize(): void;

    _battlebackLocated: boolean;
    _backgroundFilter: PIXI.filters.BlurFilter;
    _backgroundSprite: Sprite;
    _back1Sprite: Sprite_Battleback;
    _back2Sprite: Sprite_Battleback;
    _battleField: Sprite;
    _enemySprites: Sprite_Enemy[];
    _actorSprites: Sprite_Actor[];

    loadSystemImages(): void;
    createLowerLayer(): void;
    createBackground(): void;
    createBattleback(): void;
    createBattleField(): void;
    battleFieldOffsetY(): number;
    update(): void;
    updateBattleback(): void;
    createEnemies(): void;
    compareEnemySprite(a: Sprite_Enemy, b: Sprite_Enemy): number;
    createActors(): void;
    updateActors(): void;
    findTargetSprite(target: Game_Actor | Game_Enemy): Sprite_Battler | undefined;
    battlerSprites(): Sprite_Battler[];
    isEffecting(): boolean;
    isAnyoneMoving(): boolean;
    isBusy(): boolean;
}
