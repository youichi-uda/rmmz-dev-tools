// Type definitions for rmmz_windows.js v1.10.0
// RPG Maker MZ window classes
// Definitions generated from the RMMZ source code.

// ---------------------------------------------------------------------------
// TextState - used by text rendering methods in Window_Base and descendants
// ---------------------------------------------------------------------------

interface TextState {
    text: string;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
    rtl: boolean;
    buffer: string;
    drawing: boolean;
    outputWidth: number;
    outputHeight: number;
}

// ---------------------------------------------------------------------------
// CommandItem - used internally by Window_Command._list
// ---------------------------------------------------------------------------

interface CommandItem {
    name: string;
    symbol: string;
    enabled: boolean;
    ext: any;
}

// ---------------------------------------------------------------------------
// Window_Base
// The superclass of all windows within the game.
// ---------------------------------------------------------------------------

declare class Window_Base extends Window {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    destroy(options?: any): void;
    checkRectObject(rect: Rectangle): void;

    // Metrics
    lineHeight(): number;
    itemWidth(): number;
    itemHeight(): number;
    itemPadding(): number;
    baseTextRect(): Rectangle;

    // Setup
    loadWindowskin(): void;
    updatePadding(): void;
    updateBackOpacity(): void;
    fittingHeight(numLines: number): number;
    updateTone(): void;

    // Contents
    createContents(): void;
    destroyContents(): void;
    contentsWidth(): number;
    contentsHeight(): number;
    resetFontSettings(): void;
    resetTextColor(): void;

    // Update
    update(): void;
    updateOpen(): void;
    updateClose(): void;

    // Open/Close
    open(): void;
    close(): void;
    isOpening(): boolean;
    isClosing(): boolean;

    // Visibility
    show(): void;
    hide(): void;
    activate(): void;
    deactivate(): void;

    // Colors
    systemColor(): string;
    translucentOpacity(): number;
    changeTextColor(color: string): void;
    changeOutlineColor(color: string): void;
    changePaintOpacity(enabled: boolean | number): void;

    // Drawing
    drawRect(x: number, y: number, width: number, height: number): void;
    drawText(text: string | number, x: number, y: number, maxWidth?: number, align?: string): void;
    textWidth(text: string): number;
    drawTextEx(text: string, x: number, y: number, width: number): number;
    textSizeEx(text: string): { width: number; height: number };
    createTextState(text: string, x: number, y: number, width: number): TextState;
    processAllText(textState: TextState): void;
    flushTextState(textState: TextState): void;
    createTextBuffer(rtl: boolean): string;
    convertEscapeCharacters(text: string): string;
    actorName(n: number): string;
    partyMemberName(n: number): string;
    processCharacter(textState: TextState): void;
    processControlCharacter(textState: TextState, c: string): void;
    processNewLine(textState: TextState): void;
    obtainEscapeCode(textState: TextState): string;
    obtainEscapeParam(textState: TextState): number | string;
    processEscapeCharacter(code: string, textState: TextState): void;
    processColorChange(colorIndex: number): void;
    processDrawIcon(iconIndex: number, textState: TextState): void;
    makeFontBigger(): void;
    makeFontSmaller(): void;
    calcTextHeight(textState: TextState): number;
    maxFontSizeInLine(line: string): number;
    drawIcon(iconIndex: number, x: number, y: number): void;
    drawFace(faceName: string, faceIndex: number, x: number, y: number, width?: number, height?: number): void;
    drawCharacter(characterName: string, characterIndex: number, x: number, y: number): void;
    drawItemName(item: RPG_Item | RPG_Weapon | RPG_Armor | RPG_Skill | null, x: number, y: number, width: number): void;
    drawCurrencyValue(value: number, unit: string, x: number, y: number, width: number): void;

    // Background
    setBackgroundType(type: number): void;
    showBackgroundDimmer(): void;
    createDimmerSprite(): void;
    hideBackgroundDimmer(): void;
    updateBackgroundDimmer(): void;
    refreshDimmerBitmap(): void;

    // Sound
    playCursorSound(): void;
    playOkSound(): void;
    playBuzzerSound(): void;

    // Private fields
    _opening: boolean;
    _closing: boolean;
    _dimmerSprite: Sprite | null;
}

// ---------------------------------------------------------------------------
// Window_Scrollable
// The window class with scroll functions.
// ---------------------------------------------------------------------------

declare class Window_Scrollable extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    clearScrollStatus(): void;
    scrollX(): number;
    scrollY(): number;
    scrollBaseX(): number;
    scrollBaseY(): number;
    scrollTo(x: number, y: number): void;
    scrollBy(x: number, y: number): void;
    smoothScrollTo(x: number, y: number): void;
    smoothScrollBy(x: number, y: number): void;
    setScrollAccel(x: number, y: number): void;
    overallWidth(): number;
    overallHeight(): number;
    maxScrollX(): number;
    maxScrollY(): number;
    scrollBlockWidth(): number;
    scrollBlockHeight(): number;
    smoothScrollDown(n: number): void;
    smoothScrollUp(n: number): void;
    update(): void;
    processWheelScroll(): void;
    processTouchScroll(): void;
    isWheelScrollEnabled(): boolean;
    isTouchScrollEnabled(): boolean;
    isScrollEnabled(): boolean;
    isTouchedInsideFrame(): boolean;
    onTouchScrollStart(): void;
    onTouchScroll(): void;
    onTouchScrollEnd(): void;
    updateSmoothScroll(): void;
    updateScrollAccel(): void;
    updateArrows(): void;
    updateOrigin(): void;
    updateScrollBase(baseX: number, baseY: number): void;
    paint(): void;

    // Private fields
    _scrollX: number;
    _scrollY: number;
    _scrollBaseX: number;
    _scrollBaseY: number;
    _scrollTargetX: number;
    _scrollTargetY: number;
    _scrollDuration: number;
    _scrollAccelX: number;
    _scrollAccelY: number;
    _scrollTouching: boolean;
    _scrollLastTouchX: number;
    _scrollLastTouchY: number;
    _scrollLastCursorVisible: boolean;
}

// ---------------------------------------------------------------------------
// Window_Selectable
// The window class with cursor movement functions.
// ---------------------------------------------------------------------------

declare class Window_Selectable extends Window_Scrollable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    // Index & selection
    index(): number;
    cursorFixed(): boolean;
    setCursorFixed(cursorFixed: boolean): void;
    cursorAll(): boolean;
    setCursorAll(cursorAll: boolean): void;
    select(index: number): void;
    forceSelect(index: number): void;
    smoothSelect(index: number): void;
    deselect(): void;
    reselect(): void;

    // Layout
    maxCols(): number;
    maxItems(): number;
    colSpacing(): number;
    rowSpacing(): number;
    itemWidth(): number;
    itemHeight(): number;
    contentsHeight(): number;
    maxRows(): number;
    overallHeight(): number;
    maxPageRows(): number;
    maxPageItems(): number;
    maxVisibleItems(): number;
    isHorizontal(): boolean;
    topIndex(): number;
    topRow(): number;
    maxTopRow(): number;
    setTopRow(row: number): void;
    row(): number;

    // Rectangles
    itemRect(index: number): Rectangle;
    itemRectWithPadding(index: number): Rectangle;
    itemLineRect(index: number): Rectangle;

    // Help window
    setHelpWindow(helpWindow: Window_Help): void;
    showHelpWindow(): void;
    hideHelpWindow(): void;
    callUpdateHelp(): void;
    updateHelp(): void;
    setHelpWindowItem(item: RPG_Item | RPG_Weapon | RPG_Armor | RPG_Skill | null): void;

    // Handlers
    setHandler(symbol: string, method: () => void): void;
    isHandled(symbol: string): boolean;
    callHandler(symbol: string): void;

    // State
    isOpenAndActive(): boolean;
    isCursorMovable(): boolean;
    isCurrentItemEnabled(): boolean;
    isScrollEnabled(): boolean;

    // Cursor movement
    cursorDown(wrap: boolean): void;
    cursorUp(wrap: boolean): void;
    cursorRight(wrap: boolean): void;
    cursorLeft(wrap: boolean): void;
    cursorPagedown(): void;
    cursorPageup(): void;

    // Input processing
    update(): void;
    processCursorMove(): void;
    processHandling(): void;
    processTouch(): void;
    isHoverEnabled(): boolean;
    onTouchSelect(trigger: boolean): void;
    onTouchOk(): void;
    onTouchCancel(): void;
    hitIndex(): number;
    hitTest(x: number, y: number): number;
    isTouchOkEnabled(): boolean;
    isOkEnabled(): boolean;
    isCancelEnabled(): boolean;
    isOkTriggered(): boolean;
    isCancelTriggered(): boolean;
    processOk(): void;
    callOkHandler(): void;
    processCancel(): void;
    callCancelHandler(): void;
    processPageup(): void;
    processPagedown(): void;
    updateInputData(): void;

    // Scroll
    ensureCursorVisible(smooth: boolean): void;

    // Drawing
    drawAllItems(): void;
    drawItem(...args: any[]): void;
    clearItem(index: number): void;
    drawItemBackground(index: number): void;
    drawBackgroundRect(rect: Rectangle): void;
    redrawItem(index: number): void;
    redrawCurrentItem(): void;
    refresh(): void;
    paint(): void;
    refreshCursor(): void;
    refreshCursorForAll(): void;

    activate(): void;
    deactivate(): void;

    // Private fields
    _index: number;
    _cursorFixed: boolean;
    _cursorAll: boolean;
    _helpWindow: Window_Help | null;
    _handlers: { [symbol: string]: () => void };
    _doubleTouch: boolean;
    _canRepeat: boolean;
}

// ---------------------------------------------------------------------------
// Window_Command
// The superclass of windows for selecting a command.
// ---------------------------------------------------------------------------

declare class Window_Command extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxItems(): number;
    clearCommandList(): void;
    makeCommandList(): void;
    addCommand(name: string, symbol: string, enabled?: boolean, ext?: any): void;
    commandName(index: number): string;
    commandSymbol(index: number): string;
    isCommandEnabled(index: number): boolean;
    currentData(): CommandItem | null;
    isCurrentItemEnabled(): boolean;
    currentSymbol(): string | null;
    currentExt(): any;
    findSymbol(symbol: string): number;
    selectSymbol(symbol: string): void;
    findExt(ext: any): number;
    selectExt(ext: any): void;
    drawItem(index: number): void;
    itemTextAlign(): string;
    isOkEnabled(): boolean;
    callOkHandler(): void;
    refresh(): void;

    // Private fields
    _list: CommandItem[];
}

// ---------------------------------------------------------------------------
// Window_HorzCommand
// The command window for the horizontal selection format.
// ---------------------------------------------------------------------------

declare class Window_HorzCommand extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxCols(): number;
    itemTextAlign(): string;
}

// ---------------------------------------------------------------------------
// Window_Help
// The window for displaying the description of the selected item.
// ---------------------------------------------------------------------------

declare class Window_Help extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setText(text: string): void;
    clear(): void;
    setItem(item: RPG_Item | RPG_Weapon | RPG_Armor | RPG_Skill | null): void;
    refresh(): void;

    // Private fields
    _text: string;
}

// ---------------------------------------------------------------------------
// Window_Gold
// The window for displaying the party's gold.
// ---------------------------------------------------------------------------

declare class Window_Gold extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    colSpacing(): number;
    refresh(): void;
    value(): number;
    currencyUnit(): string;
    open(): void;
}

// ---------------------------------------------------------------------------
// Window_StatusBase
// The superclass of windows for displaying actor status.
// ---------------------------------------------------------------------------

declare class Window_StatusBase extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    loadFaceImages(): void;
    refresh(): void;
    hideAdditionalSprites(): void;
    placeActorName(actor: Game_Actor, x: number, y: number): void;
    placeStateIcon(actor: Game_Actor, x: number, y: number): void;
    placeGauge(actor: Game_Actor, type: string, x: number, y: number): void;
    createInnerSprite(key: string, spriteClass: new () => Sprite): Sprite;
    placeTimeGauge(actor: Game_Actor, x: number, y: number): void;
    placeBasicGauges(actor: Game_Actor, x: number, y: number): void;
    gaugeLineHeight(): number;
    drawActorCharacter(actor: Game_Actor, x: number, y: number): void;
    drawActorFace(actor: Game_Actor, x: number, y: number, width?: number, height?: number): void;
    drawActorName(actor: Game_Actor, x: number, y: number, width?: number): void;
    drawActorClass(actor: Game_Actor, x: number, y: number, width?: number): void;
    drawActorNickname(actor: Game_Actor, x: number, y: number, width?: number): void;
    drawActorLevel(actor: Game_Actor, x: number, y: number): void;
    drawActorIcons(actor: Game_Actor, x: number, y: number, width?: number): void;
    drawActorSimpleStatus(actor: Game_Actor, x: number, y: number): void;
    actorSlotName(actor: Game_Actor, index: number): string;

    // Private fields
    _additionalSprites: { [key: string]: Sprite };
}

// ---------------------------------------------------------------------------
// Window_MenuCommand
// The window for selecting a command on the menu screen.
// ---------------------------------------------------------------------------

declare class Window_MenuCommand extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    static _lastCommandSymbol: string | null;
    static initCommandPosition(): void;

    makeCommandList(): void;
    addMainCommands(): void;
    addFormationCommand(): void;
    addOriginalCommands(): void;
    addOptionsCommand(): void;
    addSaveCommand(): void;
    addGameEndCommand(): void;
    needsCommand(name: string): boolean;
    areMainCommandsEnabled(): boolean;
    isFormationEnabled(): boolean;
    isOptionsEnabled(): boolean;
    isSaveEnabled(): boolean;
    isGameEndEnabled(): boolean;
    processOk(): void;
    selectLast(): void;
}

// ---------------------------------------------------------------------------
// Window_MenuStatus
// The window for displaying party member status on the menu screen.
// ---------------------------------------------------------------------------

declare class Window_MenuStatus extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxItems(): number;
    numVisibleRows(): number;
    itemHeight(): number;
    actor(index: number): Game_Actor;
    drawItem(index: number): void;
    drawPendingItemBackground(index: number): void;
    drawItemImage(index: number): void;
    drawItemStatus(index: number): void;
    processOk(): void;
    isCurrentItemEnabled(): boolean;
    selectLast(): void;
    formationMode(): boolean;
    setFormationMode(formationMode: boolean): void;
    pendingIndex(): number;
    setPendingIndex(index: number): void;

    // Private fields
    _formationMode: boolean;
    _pendingIndex: number;
}

// ---------------------------------------------------------------------------
// Window_MenuActor
// The window for selecting a target actor on the item and skill screens.
// ---------------------------------------------------------------------------

declare class Window_MenuActor extends Window_MenuStatus {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    processOk(): void;
    selectLast(): void;
    selectForItem(item: RPG_Skill | RPG_Item): void;
}

// ---------------------------------------------------------------------------
// Window_ItemCategory
// The window for selecting a category of items on the item and shop screens.
// ---------------------------------------------------------------------------

declare class Window_ItemCategory extends Window_HorzCommand {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxCols(): number;
    update(): void;
    makeCommandList(): void;
    needsCommand(name: string): boolean;
    setItemWindow(itemWindow: Window_ItemList): void;
    needsSelection(): boolean;

    // Private fields
    _itemWindow: Window_ItemList | null;
}

// ---------------------------------------------------------------------------
// Window_ItemList
// The window for selecting an item on the item screen.
// ---------------------------------------------------------------------------

declare class Window_ItemList extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setCategory(category: string): void;
    maxCols(): number;
    colSpacing(): number;
    maxItems(): number;
    item(): RPG_Item | RPG_Weapon | RPG_Armor | null;
    itemAt(index: number): RPG_Item | RPG_Weapon | RPG_Armor | null;
    isCurrentItemEnabled(): boolean;
    includes(item: RPG_Item | RPG_Weapon | RPG_Armor | null): boolean;
    needsNumber(): boolean;
    isEnabled(item: RPG_Item | RPG_Weapon | RPG_Armor | null): boolean;
    makeItemList(): void;
    selectLast(): void;
    drawItem(index: number): void;
    numberWidth(): number;
    drawItemNumber(item: RPG_Item | RPG_Weapon | RPG_Armor, x: number, y: number, width: number): void;
    updateHelp(): void;
    refresh(): void;

    // Private fields
    _category: string;
    _data: (RPG_Item | RPG_Weapon | RPG_Armor | null)[];
}

// ---------------------------------------------------------------------------
// Window_SkillType
// The window for selecting a skill type on the skill screen.
// ---------------------------------------------------------------------------

declare class Window_SkillType extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    makeCommandList(): void;
    update(): void;
    setSkillWindow(skillWindow: Window_SkillList): void;
    selectLast(): void;

    // Private fields
    _actor: Game_Actor | null;
    _skillWindow: Window_SkillList | null;
}

// ---------------------------------------------------------------------------
// Window_SkillStatus
// The window for displaying the skill user's status on the skill screen.
// ---------------------------------------------------------------------------

declare class Window_SkillStatus extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    refresh(): void;

    // Private fields
    _actor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_SkillList
// The window for selecting a skill on the skill screen.
// ---------------------------------------------------------------------------

declare class Window_SkillList extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    setStypeId(stypeId: number): void;
    maxCols(): number;
    colSpacing(): number;
    maxItems(): number;
    item(): RPG_Skill | null;
    itemAt(index: number): RPG_Skill | null;
    isCurrentItemEnabled(): boolean;
    includes(item: RPG_Skill): boolean;
    isEnabled(item: RPG_Skill | null): boolean;
    makeItemList(): void;
    selectLast(): void;
    drawItem(index: number): void;
    costWidth(): number;
    drawSkillCost(skill: RPG_Skill, x: number, y: number, width: number): void;
    updateHelp(): void;
    refresh(): void;

    // Private fields
    _actor: Game_Actor | null;
    _stypeId: number;
    _data: RPG_Skill[];
}

// ---------------------------------------------------------------------------
// Window_EquipStatus
// The window for displaying parameter changes on the equipment screen.
// ---------------------------------------------------------------------------

declare class Window_EquipStatus extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    colSpacing(): number;
    refresh(): void;
    setTempActor(tempActor: Game_Actor | null): void;
    drawAllParams(): void;
    drawItem(x: number, y: number, paramId: number): void;
    drawParamName(x: number, y: number, paramId: number): void;
    drawCurrentParam(x: number, y: number, paramId: number): void;
    drawRightArrow(x: number, y: number): void;
    drawNewParam(x: number, y: number, paramId: number): void;
    rightArrowWidth(): number;
    paramWidth(): number;
    paramX(): number;
    paramY(index: number): number;

    // Private fields
    _actor: Game_Actor | null;
    _tempActor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_EquipCommand
// The window for selecting a command on the equipment screen.
// ---------------------------------------------------------------------------

declare class Window_EquipCommand extends Window_HorzCommand {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxCols(): number;
    makeCommandList(): void;
}

// ---------------------------------------------------------------------------
// Window_EquipSlot
// The window for selecting an equipment slot on the equipment screen.
// ---------------------------------------------------------------------------

declare class Window_EquipSlot extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    update(): void;
    maxItems(): number;
    item(): RPG_Weapon | RPG_Armor | null;
    itemAt(index: number): RPG_Weapon | RPG_Armor | null;
    drawItem(index: number): void;
    slotNameWidth(): number;
    isEnabled(index: number): boolean;
    isCurrentItemEnabled(): boolean;
    setStatusWindow(statusWindow: Window_EquipStatus): void;
    setItemWindow(itemWindow: Window_EquipItem): void;
    updateHelp(): void;

    // Private fields
    _actor: Game_Actor | null;
    _statusWindow: Window_EquipStatus | null;
    _itemWindow: Window_EquipItem | null;
}

// ---------------------------------------------------------------------------
// Window_EquipItem
// The window for selecting an equipment item on the equipment screen.
// ---------------------------------------------------------------------------

declare class Window_EquipItem extends Window_ItemList {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxCols(): number;
    colSpacing(): number;
    setActor(actor: Game_Actor): void;
    setSlotId(slotId: number): void;
    includes(item: RPG_Weapon | RPG_Armor | null): boolean;
    etypeId(): number;
    isEnabled(item?: RPG_Weapon | RPG_Armor | null): boolean;
    selectLast(): void;
    setStatusWindow(statusWindow: Window_EquipStatus): void;
    updateHelp(): void;
    playOkSound(): void;

    // Private fields
    _actor: Game_Actor | null;
    _slotId: number;
    _statusWindow: Window_EquipStatus | null;
}

// ---------------------------------------------------------------------------
// Window_Status
// The window for displaying full status on the status screen.
// ---------------------------------------------------------------------------

declare class Window_Status extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    refresh(): void;
    drawBlock1(): void;
    block1Y(): number;
    drawBlock2(): void;
    block2Y(): number;
    drawBasicInfo(x: number, y: number): void;
    drawExpInfo(x: number, y: number): void;
    expTotalValue(): number | string;
    expNextValue(): number | string;

    // Private fields
    _actor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_StatusParams
// The window for displaying parameters on the status screen.
// ---------------------------------------------------------------------------

declare class Window_StatusParams extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    maxItems(): number;
    itemHeight(): number;
    drawItem(index: number): void;
    drawItemBackground(index: number): void;

    // Private fields
    _actor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_StatusEquip
// The window for displaying equipment items on the status screen.
// ---------------------------------------------------------------------------

declare class Window_StatusEquip extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setActor(actor: Game_Actor): void;
    maxItems(): number;
    itemHeight(): number;
    drawItem(index: number): void;
    drawItemBackground(index: number): void;

    // Private fields
    _actor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_Options
// The window for changing various settings on the options screen.
// ---------------------------------------------------------------------------

declare class Window_Options extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    makeCommandList(): void;
    addGeneralOptions(): void;
    addVolumeOptions(): void;
    drawItem(index: number): void;
    statusWidth(): number;
    statusText(index: number): string;
    isVolumeSymbol(symbol: string): boolean;
    booleanStatusText(value: boolean): string;
    volumeStatusText(value: number): string;
    processOk(): void;
    cursorRight(): void;
    cursorLeft(): void;
    changeVolume(symbol: string, forward: boolean, wrap: boolean): void;
    volumeOffset(): number;
    changeValue(symbol: string, value: boolean | number): void;
    getConfigValue(symbol: string): any;
    setConfigValue(symbol: string, volume: any): void;
}

// ---------------------------------------------------------------------------
// Window_SavefileList
// The window for selecting a save file on the save and load screens.
// ---------------------------------------------------------------------------

declare class Window_SavefileList extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setMode(mode: string, autosave: boolean): void;
    maxItems(): number;
    numVisibleRows(): number;
    itemHeight(): number;
    drawItem(index: number): void;
    indexToSavefileId(index: number): number;
    savefileIdToIndex(savefileId: number): number;
    isEnabled(savefileId: number): boolean;
    savefileId(): number;
    selectSavefile(savefileId: number): void;
    drawTitle(savefileId: number, x: number, y: number): void;
    drawContents(info: any, rect: Rectangle): void;
    drawPartyCharacters(info: any, x: number, y: number): void;
    drawPlaytime(info: any, x: number, y: number, width: number): void;
    playOkSound(): void;

    // Private fields
    _mode: string | null;
    _autosave: boolean;
}

// ---------------------------------------------------------------------------
// Window_ShopCommand
// The window for selecting buy/sell on the shop screen.
// ---------------------------------------------------------------------------

declare class Window_ShopCommand extends Window_HorzCommand {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setPurchaseOnly(purchaseOnly: boolean): void;
    maxCols(): number;
    makeCommandList(): void;

    // Private fields
    _purchaseOnly: boolean;
}

// ---------------------------------------------------------------------------
// Window_ShopBuy
// The window for selecting an item to buy on the shop screen.
// ---------------------------------------------------------------------------

declare class Window_ShopBuy extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setupGoods(shopGoods: number[][]): void;
    maxItems(): number;
    item(): RPG_Item | RPG_Weapon | RPG_Armor | null;
    itemAt(index: number): RPG_Item | RPG_Weapon | RPG_Armor | null;
    setMoney(money: number): void;
    isCurrentItemEnabled(): boolean;
    price(item: RPG_Item | RPG_Weapon | RPG_Armor): number;
    isEnabled(item: RPG_Item | RPG_Weapon | RPG_Armor | null): boolean;
    refresh(): void;
    makeItemList(): void;
    goodsToItem(goods: number[]): RPG_Item | RPG_Weapon | RPG_Armor | null;
    drawItem(index: number): void;
    priceWidth(): number;
    setStatusWindow(statusWindow: Window_ShopStatus): void;
    updateHelp(): void;

    // Private fields
    _money: number;
    _shopGoods: number[][];
    _data: (RPG_Item | RPG_Weapon | RPG_Armor | null)[];
    _price: number[];
    _statusWindow: Window_ShopStatus | null;
}

// ---------------------------------------------------------------------------
// Window_ShopSell
// The window for selecting an item to sell on the shop screen.
// ---------------------------------------------------------------------------

declare class Window_ShopSell extends Window_ItemList {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    isEnabled(item: RPG_Item | RPG_Weapon | RPG_Armor | null): boolean;
}

// ---------------------------------------------------------------------------
// Window_ShopNumber
// The window for inputting quantity of items to buy or sell on the shop screen.
// ---------------------------------------------------------------------------

declare class Window_ShopNumber extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    isScrollEnabled(): boolean;
    number(): number;
    setup(item: RPG_Item | RPG_Weapon | RPG_Armor, max: number, price: number): void;
    setCurrencyUnit(currencyUnit: string): void;
    createButtons(): void;
    placeButtons(): void;
    totalButtonWidth(): number;
    buttonSpacing(): number;
    refresh(): void;
    drawCurrentItemName(): void;
    drawMultiplicationSign(): void;
    multiplicationSign(): string;
    multiplicationSignX(): number;
    drawNumber(): void;
    drawHorzLine(): void;
    drawTotalPrice(): void;
    itemNameY(): number;
    totalPriceY(): number;
    buttonY(): number;
    cursorWidth(): number;
    cursorX(): number;
    maxDigits(): number;
    update(): void;
    playOkSound(): void;
    processNumberChange(): void;
    changeNumber(amount: number): void;
    itemRect(): Rectangle;
    isTouchOkEnabled(): boolean;
    onButtonUp(): void;
    onButtonUp2(): void;
    onButtonDown(): void;
    onButtonDown2(): void;
    onButtonOk(): void;

    // Private fields
    _item: RPG_Item | RPG_Weapon | RPG_Armor | null;
    _max: number;
    _price: number;
    _number: number;
    _currencyUnit: string;
    _buttons: Sprite_Button[];
}

// ---------------------------------------------------------------------------
// Window_ShopStatus
// The window for displaying number of items in possession and the actor's
// equipment on the shop screen.
// ---------------------------------------------------------------------------

declare class Window_ShopStatus extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    refresh(): void;
    setItem(item: RPG_Item | RPG_Weapon | RPG_Armor | null): void;
    isEquipItem(): boolean;
    drawPossession(x: number, y: number): void;
    drawEquipInfo(x: number, y: number): void;
    statusMembers(): Game_Actor[];
    pageSize(): number;
    maxPages(): number;
    drawActorEquipInfo(x: number, y: number, actor: Game_Actor): void;
    drawActorParamChange(x: number, y: number, actor: Game_Actor, item1: RPG_Weapon | RPG_Armor | null): void;
    paramId(): number;
    currentEquippedItem(actor: Game_Actor, etypeId: number): RPG_Weapon | RPG_Armor | null;
    update(): void;
    updatePage(): void;
    isPageChangeEnabled(): boolean;
    isPageChangeRequested(): boolean;
    changePage(): void;

    // Private fields
    _item: RPG_Item | RPG_Weapon | RPG_Armor | null;
    _pageIndex: number;
}

// ---------------------------------------------------------------------------
// Window_NameEdit
// The window for editing an actor's name on the name input screen.
// ---------------------------------------------------------------------------

declare class Window_NameEdit extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setup(actor: Game_Actor, maxLength: number): void;
    name(): string;
    restoreDefault(): boolean;
    add(ch: string): boolean;
    back(): boolean;
    faceWidth(): number;
    charWidth(): number;
    left(): number;
    itemRect(index: number): Rectangle;
    underlineRect(index: number): Rectangle;
    underlineColor(): string;
    drawUnderline(index: number): void;
    drawChar(index: number): void;
    refresh(): void;

    // Private fields
    _actor: Game_Actor | null;
    _maxLength: number;
    _name: string;
    _index: number;
    _defaultName: string | number;
}

// ---------------------------------------------------------------------------
// Window_NameInput
// The window for selecting text characters on the name input screen.
// ---------------------------------------------------------------------------

declare class Window_NameInput extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    static LATIN1: string[];
    static LATIN2: string[];
    static RUSSIA: string[];
    static JAPAN1: string[];
    static JAPAN2: string[];
    static JAPAN3: string[];

    setEditWindow(editWindow: Window_NameEdit): void;
    table(): string[][];
    maxCols(): number;
    maxItems(): number;
    itemWidth(): number;
    groupSpacing(): number;
    character(): string;
    isPageChange(): boolean;
    isOk(): boolean;
    itemRect(index: number): Rectangle;
    drawItem(index: number): void;
    updateCursor(): void;
    isCursorMovable(): boolean;
    cursorDown(wrap: boolean): void;
    cursorUp(wrap: boolean): void;
    cursorRight(wrap: boolean): void;
    cursorLeft(wrap: boolean): void;
    cursorPagedown(): void;
    cursorPageup(): void;
    processCursorMove(): void;
    processHandling(): void;
    isCancelEnabled(): boolean;
    processCancel(): void;
    processJump(): void;
    processBack(): void;
    processOk(): void;
    onNameAdd(): void;
    onNameOk(): void;

    // Private fields
    _editWindow: Window_NameEdit | null;
    _page: number;
}

// ---------------------------------------------------------------------------
// Window_NameBox
// The window for displaying a speaker name above the message window.
// ---------------------------------------------------------------------------

declare class Window_NameBox extends Window_Base {
    constructor();
    initialize(): void;

    setMessageWindow(messageWindow: Window_Message): void;
    setName(name: string): void;
    clear(): void;
    start(): void;
    updatePlacement(): void;
    updateBackground(): void;
    windowWidth(): number;
    windowHeight(): number;
    refresh(): void;

    // Private fields
    _name: string;
    _messageWindow: Window_Message;
}

// ---------------------------------------------------------------------------
// Window_ChoiceList
// The window used for the event command [Show Choices].
// ---------------------------------------------------------------------------

declare class Window_ChoiceList extends Window_Command {
    constructor();
    initialize(): void;

    setMessageWindow(messageWindow: Window_Message): void;
    createCancelButton(): void;
    start(): void;
    update(): void;
    updateCancelButton(): void;
    selectDefault(): void;
    updatePlacement(): void;
    updateBackground(): void;
    placeCancelButton(): void;
    windowX(): number;
    windowY(): number;
    windowWidth(): number;
    windowHeight(): number;
    numVisibleRows(): number;
    maxLines(): number;
    maxChoiceWidth(): number;
    makeCommandList(): void;
    drawItem(index: number): void;
    isCancelEnabled(): boolean;
    needsCancelButton(): boolean;
    callOkHandler(): void;
    callCancelHandler(): void;

    // Private fields
    _messageWindow: Window_Message;
    _background: number;
    _cancelButton: Sprite_Button | null;
}

// ---------------------------------------------------------------------------
// Window_NumberInput
// The window used for the event command [Input Number].
// ---------------------------------------------------------------------------

declare class Window_NumberInput extends Window_Selectable {
    constructor();
    initialize(): void;

    setMessageWindow(messageWindow: Window_Message): void;
    start(): void;
    updatePlacement(): void;
    windowWidth(): number;
    windowHeight(): number;
    maxCols(): number;
    maxItems(): number;
    itemWidth(): number;
    itemRect(index: number): Rectangle;
    isScrollEnabled(): boolean;
    isHoverEnabled(): boolean;
    createButtons(): void;
    placeButtons(): void;
    totalButtonWidth(): number;
    buttonSpacing(): number;
    buttonY(): number;
    update(): void;
    processDigitChange(): void;
    changeDigit(up: boolean): void;
    isTouchOkEnabled(): boolean;
    isOkEnabled(): boolean;
    isCancelEnabled(): boolean;
    processOk(): void;
    drawItem(index: number): void;
    onButtonUp(): void;
    onButtonDown(): void;
    onButtonOk(): void;

    // Private fields
    _number: number;
    _maxDigits: number;
    _messageWindow: Window_Message;
    _buttons: Sprite_Button[];
}

// ---------------------------------------------------------------------------
// Window_EventItem
// The window used for the event command [Select Item].
// ---------------------------------------------------------------------------

declare class Window_EventItem extends Window_ItemList {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setMessageWindow(messageWindow: Window_Message): void;
    createCancelButton(): void;
    start(): void;
    update(): void;
    updateCancelButton(): void;
    updatePlacement(): void;
    placeCancelButton(): void;
    includes(item: RPG_Item | null): boolean;
    needsNumber(): boolean;
    isEnabled(item?: RPG_Item | null): boolean;
    onOk(): void;
    onCancel(): void;

    // Private fields
    _messageWindow: Window_Message;
    _cancelButton: Sprite_Button | null;
}

// ---------------------------------------------------------------------------
// Window_Message
// The window for displaying text messages.
// ---------------------------------------------------------------------------

declare class Window_Message extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    initMembers(): void;
    setGoldWindow(goldWindow: Window_Gold): void;
    setNameBoxWindow(nameBoxWindow: Window_NameBox): void;
    setChoiceListWindow(choiceListWindow: Window_ChoiceList): void;
    setNumberInputWindow(numberInputWindow: Window_NumberInput): void;
    setEventItemWindow(eventItemWindow: Window_EventItem): void;
    clearFlags(): void;
    update(): void;
    checkToNotClose(): void;
    synchronizeNameBox(): void;
    canStart(): boolean;
    startMessage(): void;
    newLineX(textState: TextState): number;
    updatePlacement(): void;
    updateBackground(): void;
    terminateMessage(): void;
    updateWait(): boolean;
    cancelWait(): void;
    updateLoading(): boolean;
    updateInput(): boolean;
    isAnySubWindowActive(): boolean;
    updateMessage(): boolean;
    shouldBreakHere(textState: TextState): boolean;
    canBreakHere(textState: TextState): boolean;
    onEndOfText(): void;
    startInput(): boolean;
    isTriggered(): boolean;
    doesContinue(): boolean;
    areSettingsChanged(): boolean;
    updateShowFast(): void;
    newPage(textState: TextState): void;
    updateSpeakerName(): void;
    loadMessageFace(): void;
    drawMessageFace(): void;
    processControlCharacter(textState: TextState, c: string): void;
    processNewLine(textState: TextState): void;
    processNewPage(textState: TextState): void;
    isEndOfText(textState: TextState): boolean;
    needsNewPage(textState: TextState): boolean;
    processEscapeCharacter(code: string, textState: TextState): void;
    startWait(count: number): void;
    startPause(): void;
    isWaiting(): boolean;

    // Private fields
    _background: number;
    _positionType: number;
    _waitCount: number;
    _faceBitmap: Bitmap | null;
    _textState: TextState | null;
    _goldWindow: Window_Gold | null;
    _nameBoxWindow: Window_NameBox | null;
    _choiceListWindow: Window_ChoiceList | null;
    _numberInputWindow: Window_NumberInput | null;
    _eventItemWindow: Window_EventItem | null;
    _showFast: boolean;
    _lineShowFast: boolean;
    _pauseSkip: boolean;
}

// ---------------------------------------------------------------------------
// Window_ScrollText
// The window for displaying scrolling text. No frame is displayed, but it
// is handled as a window for convenience.
// ---------------------------------------------------------------------------

declare class Window_ScrollText extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    update(): void;
    startMessage(): void;
    refresh(): void;
    updatePlacement(): void;
    contentsHeight(): number;
    updateMessage(): void;
    scrollSpeed(): number;
    isFastForward(): boolean;
    fastForwardRate(): number;
    terminateMessage(): void;

    // Private fields
    _reservedRect: Rectangle;
    _text: string | null;
    _maxBitmapHeight: number;
    _allTextHeight: number;
    _blockHeight: number;
    _blockIndex: number;
    _scrollY: number;
}

// ---------------------------------------------------------------------------
// Window_MapName
// The window for displaying the map name on the map screen.
// ---------------------------------------------------------------------------

declare class Window_MapName extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    update(): void;
    updateFadeIn(): void;
    updateFadeOut(): void;
    open(): void;
    close(): void;
    refresh(): void;
    drawBackground(x: number, y: number, width: number, height: number): void;

    // Private fields
    _showCount: number;
}

// ---------------------------------------------------------------------------
// Window_BattleLog
// The window for displaying battle progress. No frame is displayed, but it
// is handled as a window for convenience.
// ---------------------------------------------------------------------------

declare class Window_BattleLog extends Window_Base {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    setSpriteset(spriteset: Spriteset_Battle): void;
    maxLines(): number;
    numLines(): number;
    messageSpeed(): number;
    isBusy(): boolean;
    update(): void;
    updateWait(): boolean;
    updateWaitCount(): boolean;
    updateWaitMode(): boolean;
    setWaitMode(waitMode: string): void;
    callNextMethod(): void;
    isFastForward(): boolean;
    push(methodName: string, ...args: any[]): void;
    clear(): void;
    wait(): void;
    waitForEffect(): void;
    waitForMovement(): void;
    addText(text: string): void;
    pushBaseLine(): void;
    popBaseLine(): void;
    waitForNewLine(): void;
    popupDamage(target: Game_Actor | Game_Enemy): void;
    performActionStart(subject: Game_Actor | Game_Enemy, action: Game_Action): void;
    performAction(subject: Game_Actor | Game_Enemy, action: Game_Action): void;
    performActionEnd(subject: Game_Actor | Game_Enemy): void;
    performDamage(target: Game_Actor | Game_Enemy): void;
    performMiss(target: Game_Actor | Game_Enemy): void;
    performRecovery(target: Game_Actor | Game_Enemy): void;
    performEvasion(target: Game_Actor | Game_Enemy): void;
    performMagicEvasion(target: Game_Actor | Game_Enemy): void;
    performCounter(target: Game_Actor | Game_Enemy): void;
    performReflection(target: Game_Actor | Game_Enemy): void;
    performSubstitute(substitute: Game_Actor | Game_Enemy, target: Game_Actor | Game_Enemy): void;
    performCollapse(target: Game_Actor | Game_Enemy): void;
    showAnimation(subject: Game_Actor | Game_Enemy, targets: (Game_Actor | Game_Enemy)[], animationId: number): void;
    showAttackAnimation(subject: Game_Actor | Game_Enemy, targets: (Game_Actor | Game_Enemy)[]): void;
    showActorAttackAnimation(subject: Game_Actor, targets: (Game_Actor | Game_Enemy)[]): void;
    showEnemyAttackAnimation(subject: Game_Enemy, targets: (Game_Actor | Game_Enemy)[]): void;
    showNormalAnimation(targets: (Game_Actor | Game_Enemy)[], animationId: number, mirror?: boolean): void;
    refresh(): void;
    drawBackground(): void;
    backRect(): Rectangle;
    lineRect(index: number): Rectangle;
    backColor(): string;
    backPaintOpacity(): number;
    drawLineText(index: number): void;
    startTurn(): void;
    startAction(subject: Game_Actor | Game_Enemy, action: Game_Action, targets: (Game_Actor | Game_Enemy)[]): void;
    endAction(subject: Game_Actor | Game_Enemy): void;
    displayCurrentState(subject: Game_Actor | Game_Enemy): void;
    displayRegeneration(subject: Game_Actor | Game_Enemy): void;
    displayAction(subject: Game_Actor | Game_Enemy, item: RPG_Skill | RPG_Item): void;
    displayItemMessage(fmt: string, subject: Game_Actor | Game_Enemy, item: RPG_Skill | RPG_Item): void;
    displayCounter(target: Game_Actor | Game_Enemy): void;
    displayReflection(target: Game_Actor | Game_Enemy): void;
    displaySubstitute(substitute: Game_Actor | Game_Enemy, target: Game_Actor | Game_Enemy): void;
    displayActionResults(subject: Game_Actor | Game_Enemy, target: Game_Actor | Game_Enemy): void;
    displayFailure(target: Game_Actor | Game_Enemy): void;
    displayCritical(target: Game_Actor | Game_Enemy): void;
    displayDamage(target: Game_Actor | Game_Enemy): void;
    displayMiss(target: Game_Actor | Game_Enemy): void;
    displayEvasion(target: Game_Actor | Game_Enemy): void;
    displayHpDamage(target: Game_Actor | Game_Enemy): void;
    displayMpDamage(target: Game_Actor | Game_Enemy): void;
    displayTpDamage(target: Game_Actor | Game_Enemy): void;
    displayAffectedStatus(target: Game_Actor | Game_Enemy): void;
    displayAutoAffectedStatus(target: Game_Actor | Game_Enemy): void;
    displayChangedStates(target: Game_Actor | Game_Enemy): void;
    displayAddedStates(target: Game_Actor | Game_Enemy): void;
    displayRemovedStates(target: Game_Actor | Game_Enemy): void;
    displayChangedBuffs(target: Game_Actor | Game_Enemy): void;
    displayBuffs(target: Game_Actor | Game_Enemy, buffs: number[], fmt: string): void;
    makeHpDamageText(target: Game_Actor | Game_Enemy): string;
    makeMpDamageText(target: Game_Actor | Game_Enemy): string;
    makeTpDamageText(target: Game_Actor | Game_Enemy): string;

    // Private fields
    _lines: string[];
    _methods: { name: string; params: any[] }[];
    _waitCount: number;
    _waitMode: string;
    _baseLineStack: number[];
    _spriteset: Spriteset_Battle | null;
}

// ---------------------------------------------------------------------------
// Window_PartyCommand
// The window for selecting whether to fight or escape on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_PartyCommand extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    makeCommandList(): void;
    setup(): void;
}

// ---------------------------------------------------------------------------
// Window_ActorCommand
// The window for selecting an actor's action on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_ActorCommand extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    makeCommandList(): void;
    addAttackCommand(): void;
    addSkillCommands(): void;
    addGuardCommand(): void;
    addItemCommand(): void;
    setup(actor: Game_Actor): void;
    actor(): Game_Actor;
    processOk(): void;
    selectLast(): void;

    // Private fields
    _actor: Game_Actor | null;
}

// ---------------------------------------------------------------------------
// Window_BattleStatus
// The window for displaying the status of party members on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_BattleStatus extends Window_StatusBase {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    extraHeight(): number;
    maxCols(): number;
    itemHeight(): number;
    maxItems(): number;
    rowSpacing(): number;
    updatePadding(): void;
    actor(index: number): Game_Actor;
    selectActor(actor: Game_Actor): void;
    update(): void;
    preparePartyRefresh(): void;
    performPartyRefresh(): void;
    drawItem(index: number): void;
    drawItemImage(index: number): void;
    drawItemStatus(index: number): void;
    faceRect(index: number): Rectangle;
    nameX(rect: Rectangle): number;
    nameY(rect: Rectangle): number;
    stateIconX(rect: Rectangle): number;
    stateIconY(rect: Rectangle): number;
    basicGaugesX(rect: Rectangle): number;
    basicGaugesY(rect: Rectangle): number;

    // Private fields
    _bitmapsReady: number;
}

// ---------------------------------------------------------------------------
// Window_BattleActor
// The window for selecting a target actor on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_BattleActor extends Window_BattleStatus {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    show(): void;
    hide(): void;
    select(index: number): void;
    processTouch(): void;
}

// ---------------------------------------------------------------------------
// Window_BattleEnemy
// The window for selecting a target enemy on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_BattleEnemy extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxCols(): number;
    maxItems(): number;
    enemy(): Game_Enemy;
    enemyIndex(): number;
    drawItem(index: number): void;
    show(): void;
    hide(): void;
    refresh(): void;
    select(index: number): void;
    processTouch(): void;

    // Private fields
    _enemies: Game_Enemy[];
}

// ---------------------------------------------------------------------------
// Window_BattleSkill
// The window for selecting a skill to use on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_BattleSkill extends Window_SkillList {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    show(): void;
    hide(): void;
}

// ---------------------------------------------------------------------------
// Window_BattleItem
// The window for selecting an item to use on the battle screen.
// ---------------------------------------------------------------------------

declare class Window_BattleItem extends Window_ItemList {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    includes(item: RPG_Item | RPG_Weapon | RPG_Armor | null): boolean;
    show(): void;
    hide(): void;
}

// ---------------------------------------------------------------------------
// Window_TitleCommand
// The window for selecting New Game/Continue on the title screen.
// ---------------------------------------------------------------------------

declare class Window_TitleCommand extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    static _lastCommandSymbol: string | null;
    static initCommandPosition(): void;

    makeCommandList(): void;
    isContinueEnabled(): boolean;
    processOk(): void;
    selectLast(): void;
}

// ---------------------------------------------------------------------------
// Window_GameEnd
// The window for selecting "Go to Title" on the game end screen.
// ---------------------------------------------------------------------------

declare class Window_GameEnd extends Window_Command {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    makeCommandList(): void;
}

// ---------------------------------------------------------------------------
// Window_DebugRange
// The window for selecting a block of switches/variables on the debug screen.
// ---------------------------------------------------------------------------

declare class Window_DebugRange extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    static lastTopRow: number;
    static lastIndex: number;

    maxItems(): number;
    update(): void;
    mode(index: number): string;
    topId(index: number): number;
    isSwitchMode(index: number): boolean;
    drawItem(index: number): void;
    isCancelTriggered(): boolean;
    processCancel(): void;
    setEditWindow(editWindow: Window_DebugEdit): void;

    // Private fields
    _maxSwitches: number;
    _maxVariables: number;
    _editWindow: Window_DebugEdit | null;
}

// ---------------------------------------------------------------------------
// Window_DebugEdit
// The window for displaying switches and variables on the debug screen.
// ---------------------------------------------------------------------------

declare class Window_DebugEdit extends Window_Selectable {
    constructor(rect: Rectangle);
    initialize(rect: Rectangle): void;

    maxItems(): number;
    drawItem(index: number): void;
    itemName(dataId: number): string;
    itemStatus(dataId: number): string;
    setMode(mode: string): void;
    setTopId(id: number): void;
    currentId(): number;
    update(): void;
    updateSwitch(): void;
    updateVariable(): void;
    deltaForVariable(): number;

    // Private fields
    _mode: string;
    _topId: number;
}
