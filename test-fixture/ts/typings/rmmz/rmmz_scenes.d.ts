// Type definitions for RMMZ Scene classes (rmmz_scenes.js v1.10.0)
// All Scene_* classes used by RPG Maker MZ.

// ---------------------------------------------------------------------------
// Scene_Base
// The superclass of all scenes within the game.
// ---------------------------------------------------------------------------

declare class Scene_Base extends Stage {
  constructor();
  initialize(): void;

  // Lifecycle
  create(): void;
  isActive(): boolean;
  isReady(): boolean;
  start(): void;
  update(): void;
  stop(): void;
  isStarted(): boolean;
  isBusy(): boolean;
  isFading(): boolean;
  terminate(): void;

  // Window layer
  createWindowLayer(): void;
  addWindow(window: Window_Base): void;

  // Fade
  startFadeIn(duration?: number, white?: boolean): void;
  startFadeOut(duration?: number, white?: boolean): void;
  createColorFilter(): void;
  updateColorFilter(): void;
  updateFade(): void;
  updateChildren(): void;

  // Navigation
  popScene(): void;
  checkGameover(): void;
  fadeOutAll(): void;
  fadeSpeed(): number;
  slowFadeSpeed(): number;

  // Sprite helpers
  scaleSprite(sprite: Sprite): void;
  centerSprite(sprite: Sprite): void;

  // Layout
  isBottomHelpMode(): boolean;
  isBottomButtonMode(): boolean;
  isRightInputMode(): boolean;
  mainCommandWidth(): number;
  buttonAreaTop(): number;
  buttonAreaBottom(): number;
  buttonAreaHeight(): number;
  buttonY(): number;
  calcWindowHeight(numLines: number, selectable: boolean): number;

  // Autosave
  requestAutosave(): void;
  isAutosaveEnabled(): boolean;
  executeAutosave(): void;
  onAutosaveSuccess(): void;
  onAutosaveFailure(): void;

  // Private fields
  _started: boolean;
  _active: boolean;
  _fadeSign: number;
  _fadeDuration: number;
  _fadeWhite: number;
  _fadeOpacity: number;
  _colorFilter: ColorFilter;
  _windowLayer: WindowLayer;
}

// ---------------------------------------------------------------------------
// Scene_Boot
// The scene class for initializing the entire game.
// ---------------------------------------------------------------------------

declare class Scene_Boot extends Scene_Base {
  constructor();
  initialize(): void;
  create(): void;
  isReady(): boolean;
  start(): void;

  onDatabaseLoaded(): void;
  setEncryptionInfo(): void;
  loadSystemImages(): void;
  loadPlayerData(): void;
  loadGameFonts(): void;
  isPlayerDataLoaded(): boolean;

  startNormalGame(): void;
  resizeScreen(): void;
  adjustBoxSize(): void;
  adjustWindow(): void;
  screenScale(): number;
  updateDocumentTitle(): void;
  checkPlayerLocation(): void;

  // Private fields
  _databaseLoaded: boolean;
}

// ---------------------------------------------------------------------------
// Scene_Splash
// The scene class of the splash screen.
// ---------------------------------------------------------------------------

declare class Scene_Splash extends Scene_Base {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;
  update(): void;
  stop(): void;

  createBackground(): void;
  adjustBackground(): void;
  isEnabled(): boolean;
  initWaitCount(): void;
  updateWaitCount(): boolean;
  checkSkip(): void;
  gotoTitle(): void;

  // Private fields
  _backSprite: Sprite;
  _waitCount: number;
}

// ---------------------------------------------------------------------------
// Scene_Title
// The scene class of the title screen.
// ---------------------------------------------------------------------------

declare class Scene_Title extends Scene_Base {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;
  update(): void;
  isBusy(): boolean;
  terminate(): void;

  createBackground(): void;
  createForeground(): void;
  drawGameTitle(): void;
  adjustBackground(): void;
  createCommandWindow(): void;
  commandWindowRect(): Rectangle;
  commandNewGame(): void;
  commandContinue(): void;
  commandOptions(): void;
  playTitleMusic(): void;

  // Private fields
  _commandWindow: Window_TitleCommand;
  _backSprite1: Sprite;
  _backSprite2: Sprite;
  _gameTitleSprite: Sprite;
}

// ---------------------------------------------------------------------------
// Scene_Message
// The superclass of Scene_Map and Scene_Battle.
// ---------------------------------------------------------------------------

declare class Scene_Message extends Scene_Base {
  constructor();
  initialize(): void;

  isMessageWindowClosing(): boolean;
  createAllWindows(): void;
  createMessageWindow(): void;
  messageWindowRect(): Rectangle;
  createScrollTextWindow(): void;
  scrollTextWindowRect(): Rectangle;
  createGoldWindow(): void;
  goldWindowRect(): Rectangle;
  createNameBoxWindow(): void;
  createChoiceListWindow(): void;
  createNumberInputWindow(): void;
  createEventItemWindow(): void;
  eventItemWindowRect(): Rectangle;
  associateWindows(): void;
  cancelMessageWait(): void;

  // Private fields
  _messageWindow: Window_Message;
  _scrollTextWindow: Window_ScrollText;
  _goldWindow: Window_Gold;
  _nameBoxWindow: Window_NameBox;
  _choiceListWindow: Window_ChoiceList;
  _numberInputWindow: Window_NumberInput;
  _eventItemWindow: Window_EventItem;
}

// ---------------------------------------------------------------------------
// Scene_Map
// The scene class of the map screen.
// ---------------------------------------------------------------------------

declare class Scene_Map extends Scene_Message {
  constructor();
  initialize(): void;
  create(): void;
  isReady(): boolean;
  start(): void;
  update(): void;
  stop(): void;
  isBusy(): boolean;
  terminate(): void;

  onMapLoaded(): void;
  onTransfer(): void;
  onTransferEnd(): void;
  shouldAutosave(): boolean;
  updateMainMultiply(): void;
  updateMain(): void;
  isPlayerActive(): boolean;
  isFastForward(): boolean;
  needsFadeIn(): boolean;
  needsSlowFadeOut(): boolean;
  updateWaitCount(): boolean;
  updateDestination(): void;
  updateMenuButton(): void;
  hideMenuButton(): void;
  updateMapNameWindow(): void;
  isMenuEnabled(): boolean;
  isMapTouchOk(): boolean;
  processMapTouch(): void;
  isAnyButtonPressed(): boolean;
  onMapTouch(): void;
  isSceneChangeOk(): boolean;
  updateScene(): void;
  createDisplayObjects(): void;
  createSpriteset(): void;
  createAllWindows(): void;
  createMapNameWindow(): void;
  mapNameWindowRect(): Rectangle;
  createButtons(): void;
  createMenuButton(): void;
  updateTransferPlayer(): void;
  updateEncounter(): void;
  updateCallMenu(): void;
  isMenuCalled(): boolean;
  callMenu(): void;
  updateCallDebug(): void;
  isDebugCalled(): boolean;
  fadeInForTransfer(): void;
  fadeOutForTransfer(): void;
  launchBattle(): void;
  stopAudioOnBattleStart(): void;
  startEncounterEffect(): void;
  updateEncounterEffect(): void;
  snapForBattleBackground(): void;
  startFlashForEncounter(duration: number): void;
  encounterEffectSpeed(): number;

  // Public fields
  menuCalling: boolean;

  // Private fields
  _waitCount: number;
  _encounterEffectDuration: number;
  _mapLoaded: boolean;
  _touchCount: number;
  _menuEnabled: boolean;
  _transfer: boolean;
  _lastMapWasNull: boolean;
  _spriteset: Spriteset_Map;
  _mapNameWindow: Window_MapName;
  _menuButton: Sprite_Button;
}

// ---------------------------------------------------------------------------
// Scene_MenuBase
// The superclass of all the menu-type scenes.
// ---------------------------------------------------------------------------

declare class Scene_MenuBase extends Scene_Base {
  constructor();
  initialize(): void;
  create(): void;
  update(): void;

  helpAreaTop(): number;
  helpAreaBottom(): number;
  helpAreaHeight(): number;
  mainAreaTop(): number;
  mainAreaBottom(): number;
  mainAreaHeight(): number;
  actor(): Game_Actor;
  updateActor(): void;
  createBackground(): void;
  setBackgroundOpacity(opacity: number): void;
  createHelpWindow(): void;
  helpWindowRect(): Rectangle;
  createButtons(): void;
  needsCancelButton(): boolean;
  createCancelButton(): void;
  needsPageButtons(): boolean;
  createPageButtons(): void;
  updatePageButtons(): void;
  arePageButtonsEnabled(): boolean;
  nextActor(): void;
  previousActor(): void;
  onActorChange(): void;

  // Private fields
  _actor: Game_Actor;
  _backgroundFilter: PIXI.filters.BlurFilter;
  _backgroundSprite: Sprite;
  _helpWindow: Window_Help;
  _cancelButton: Sprite_Button;
  _pageupButton: Sprite_Button;
  _pagedownButton: Sprite_Button;
}

// ---------------------------------------------------------------------------
// Scene_Menu
// The scene class of the menu screen.
// ---------------------------------------------------------------------------

declare class Scene_Menu extends Scene_MenuBase {
  constructor();
  initialize(): void;
  helpAreaHeight(): number;
  create(): void;
  start(): void;

  createCommandWindow(): void;
  commandWindowRect(): Rectangle;
  createGoldWindow(): void;
  goldWindowRect(): Rectangle;
  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  commandItem(): void;
  commandPersonal(): void;
  commandFormation(): void;
  commandOptions(): void;
  commandSave(): void;
  commandGameEnd(): void;
  onPersonalOk(): void;
  onPersonalCancel(): void;
  onFormationOk(): void;
  onFormationCancel(): void;

  // Private fields
  _commandWindow: Window_MenuCommand;
  _goldWindow: Window_Gold;
  _statusWindow: Window_MenuStatus;
}

// ---------------------------------------------------------------------------
// Scene_ItemBase
// The superclass of Scene_Item and Scene_Skill.
// ---------------------------------------------------------------------------

declare class Scene_ItemBase extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;

  createActorWindow(): void;
  actorWindowRect(): Rectangle;
  item(): object;
  user(): Game_Actor | null;
  isCursorLeft(): boolean;
  showActorWindow(): void;
  hideActorWindow(): void;
  isActorWindowActive(): boolean;
  onActorOk(): void;
  onActorCancel(): void;
  determineItem(): void;
  useItem(): void;
  activateItemWindow(): void;
  itemTargetActors(): Game_Actor[];
  canUse(): boolean;
  isItemEffectsValid(): boolean;
  applyItem(): void;
  checkCommonEvent(): void;
  playSeForItem(): void;

  // Private fields
  _actorWindow: Window_MenuActor;
  _itemWindow: Window_Selectable;
}

// ---------------------------------------------------------------------------
// Scene_Item
// The scene class of the item screen.
// ---------------------------------------------------------------------------

declare class Scene_Item extends Scene_ItemBase {
  constructor();
  initialize(): void;
  create(): void;

  createCategoryWindow(): void;
  categoryWindowRect(): Rectangle;
  createItemWindow(): void;
  itemWindowRect(): Rectangle;
  user(): Game_Actor;
  onCategoryOk(): void;
  onItemOk(): void;
  onItemCancel(): void;
  playSeForItem(): void;
  useItem(): void;

  // Private fields
  _categoryWindow: Window_ItemCategory;
  _itemWindow: Window_ItemList;
}

// ---------------------------------------------------------------------------
// Scene_Skill
// The scene class of the skill screen.
// ---------------------------------------------------------------------------

declare class Scene_Skill extends Scene_ItemBase {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;

  createSkillTypeWindow(): void;
  skillTypeWindowRect(): Rectangle;
  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  createItemWindow(): void;
  itemWindowRect(): Rectangle;
  needsPageButtons(): boolean;
  arePageButtonsEnabled(): boolean;
  refreshActor(): void;
  user(): Game_Actor;
  commandSkill(): void;
  onItemOk(): void;
  onItemCancel(): void;
  playSeForItem(): void;
  useItem(): void;
  onActorChange(): void;

  // Private fields
  _skillTypeWindow: Window_SkillType;
  _statusWindow: Window_SkillStatus;
  _itemWindow: Window_SkillList;
}

// ---------------------------------------------------------------------------
// Scene_Equip
// The scene class of the equipment screen.
// ---------------------------------------------------------------------------

declare class Scene_Equip extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;

  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  createCommandWindow(): void;
  commandWindowRect(): Rectangle;
  createSlotWindow(): void;
  slotWindowRect(): Rectangle;
  createItemWindow(): void;
  itemWindowRect(): Rectangle;
  statusWidth(): number;
  needsPageButtons(): boolean;
  arePageButtonsEnabled(): boolean;
  refreshActor(): void;
  commandEquip(): void;
  commandOptimize(): void;
  commandClear(): void;
  onSlotOk(): void;
  onSlotCancel(): void;
  onItemOk(): void;
  executeEquipChange(): void;
  onItemCancel(): void;
  onActorChange(): void;
  hideItemWindow(): void;

  // Private fields
  _statusWindow: Window_EquipStatus;
  _commandWindow: Window_EquipCommand;
  _slotWindow: Window_EquipSlot;
  _itemWindow: Window_EquipItem;
}

// ---------------------------------------------------------------------------
// Scene_Status
// The scene class of the status screen.
// ---------------------------------------------------------------------------

declare class Scene_Status extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;
  helpAreaHeight(): number;
  start(): void;

  createProfileWindow(): void;
  profileWindowRect(): Rectangle;
  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  createStatusParamsWindow(): void;
  statusParamsWindowRect(): Rectangle;
  createStatusEquipWindow(): void;
  statusEquipWindowRect(): Rectangle;
  statusParamsWidth(): number;
  statusParamsHeight(): number;
  profileHeight(): number;
  needsPageButtons(): boolean;
  refreshActor(): void;
  onActorChange(): void;

  // Private fields
  _profileWindow: Window_Help;
  _statusWindow: Window_Status;
  _statusParamsWindow: Window_StatusParams;
  _statusEquipWindow: Window_StatusEquip;
}

// ---------------------------------------------------------------------------
// Scene_Options
// The scene class of the options screen.
// ---------------------------------------------------------------------------

declare class Scene_Options extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;
  terminate(): void;

  createOptionsWindow(): void;
  optionsWindowRect(): Rectangle;
  maxCommands(): number;
  maxVisibleCommands(): number;

  // Private fields
  _optionsWindow: Window_Options;
}

// ---------------------------------------------------------------------------
// Scene_File
// The superclass of Scene_Save and Scene_Load.
// ---------------------------------------------------------------------------

declare class Scene_File extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;
  helpAreaHeight(): number;
  start(): void;

  savefileId(): number;
  isSavefileEnabled(savefileId: number): boolean;
  createHelpWindow(): void;
  helpWindowRect(): Rectangle;
  createListWindow(): void;
  listWindowRect(): Rectangle;
  mode(): string | null;
  needsAutosave(): boolean;
  activateListWindow(): void;
  helpWindowText(): string;
  firstSavefileId(): number;
  onSavefileOk(): void;

  // Private fields
  _helpWindow: Window_Help;
  _listWindow: Window_SavefileList;
}

// ---------------------------------------------------------------------------
// Scene_Save
// The scene class of the save screen.
// ---------------------------------------------------------------------------

declare class Scene_Save extends Scene_File {
  constructor();
  initialize(): void;

  mode(): string;
  helpWindowText(): string;
  firstSavefileId(): number;
  onSavefileOk(): void;
  executeSave(savefileId: number): void;
  onSaveSuccess(): void;
  onSaveFailure(): void;
}

// ---------------------------------------------------------------------------
// Scene_Load
// The scene class of the load screen.
// ---------------------------------------------------------------------------

declare class Scene_Load extends Scene_File {
  constructor();
  initialize(): void;
  terminate(): void;

  mode(): string;
  helpWindowText(): string;
  firstSavefileId(): number;
  onSavefileOk(): void;
  executeLoad(savefileId: number): void;
  onLoadSuccess(): void;
  onLoadFailure(): void;
  reloadMapIfUpdated(): void;

  // Private fields
  _loadSuccess: boolean;
}

// ---------------------------------------------------------------------------
// Scene_GameEnd
// The scene class of the game end screen.
// ---------------------------------------------------------------------------

declare class Scene_GameEnd extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;
  stop(): void;

  createBackground(): void;
  createCommandWindow(): void;
  commandWindowRect(): Rectangle;
  commandToTitle(): void;

  // Private fields
  _commandWindow: Window_GameEnd;
}

// ---------------------------------------------------------------------------
// Scene_Shop
// The scene class of the shop screen.
// ---------------------------------------------------------------------------

declare class Scene_Shop extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;

  prepare(goods: number[][], purchaseOnly: boolean): void;
  createGoldWindow(): void;
  goldWindowRect(): Rectangle;
  createCommandWindow(): void;
  commandWindowRect(): Rectangle;
  createDummyWindow(): void;
  dummyWindowRect(): Rectangle;
  createNumberWindow(): void;
  numberWindowRect(): Rectangle;
  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  createBuyWindow(): void;
  buyWindowRect(): Rectangle;
  createCategoryWindow(): void;
  categoryWindowRect(): Rectangle;
  createSellWindow(): void;
  sellWindowRect(): Rectangle;
  statusWidth(): number;
  activateBuyWindow(): void;
  activateSellWindow(): void;
  commandBuy(): void;
  commandSell(): void;
  onBuyOk(): void;
  onBuyCancel(): void;
  onCategoryOk(): void;
  onCategoryCancel(): void;
  onSellOk(): void;
  onSellCancel(): void;
  onNumberOk(): void;
  onNumberCancel(): void;
  doBuy(number: number): void;
  doSell(number: number): void;
  endNumberInput(): void;
  maxBuy(): number;
  maxSell(): number;
  money(): number;
  currencyUnit(): string;
  buyingPrice(): number;
  sellingPrice(): number;

  // Private fields
  _goods: number[][];
  _purchaseOnly: boolean;
  _item: object | null;
  _goldWindow: Window_Gold;
  _commandWindow: Window_ShopCommand;
  _dummyWindow: Window_Base;
  _numberWindow: Window_ShopNumber;
  _statusWindow: Window_ShopStatus;
  _buyWindow: Window_ShopBuy;
  _categoryWindow: Window_ItemCategory;
  _sellWindow: Window_ShopSell;
}

// ---------------------------------------------------------------------------
// Scene_Name
// The scene class of the name input screen.
// ---------------------------------------------------------------------------

declare class Scene_Name extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;

  prepare(actorId: number, maxLength: number): void;
  createEditWindow(): void;
  editWindowRect(): Rectangle;
  createInputWindow(): void;
  inputWindowRect(): Rectangle;
  onInputOk(): void;

  // Private fields
  _actorId: number;
  _maxLength: number;
  _actor: Game_Actor;
  _editWindow: Window_NameEdit;
  _inputWindow: Window_NameInput;
}

// ---------------------------------------------------------------------------
// Scene_Debug
// The scene class of the debug screen.
// ---------------------------------------------------------------------------

declare class Scene_Debug extends Scene_MenuBase {
  constructor();
  initialize(): void;
  create(): void;

  needsCancelButton(): boolean;
  createRangeWindow(): void;
  rangeWindowRect(): Rectangle;
  createEditWindow(): void;
  editWindowRect(): Rectangle;
  createDebugHelpWindow(): void;
  debugHelpWindowRect(): Rectangle;
  onRangeOk(): void;
  onEditCancel(): void;
  refreshHelpWindow(): void;
  helpText(): string;

  // Private fields
  _rangeWindow: Window_DebugRange;
  _editWindow: Window_DebugEdit;
  _debugHelpWindow: Window_Base;
}

// ---------------------------------------------------------------------------
// Scene_Battle
// The scene class of the battle screen.
// ---------------------------------------------------------------------------

declare class Scene_Battle extends Scene_Message {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;
  update(): void;
  stop(): void;
  terminate(): void;

  updateVisibility(): void;
  updateBattleProcess(): void;
  isTimeActive(): boolean;
  isAnyInputWindowActive(): boolean;
  changeInputWindow(): void;
  shouldAutosave(): boolean;
  needsSlowFadeOut(): boolean;

  // Window visibility
  updateLogWindowVisibility(): void;
  updateStatusWindowVisibility(): void;
  shouldOpenStatusWindow(): boolean;
  updateStatusWindowPosition(): void;
  statusWindowX(): number;
  updateInputWindowVisibility(): void;
  needsInputWindowChange(): boolean;
  updateCancelButton(): void;

  // Display object creation
  createDisplayObjects(): void;
  createSpriteset(): void;
  createAllWindows(): void;
  createLogWindow(): void;
  logWindowRect(): Rectangle;
  createStatusWindow(): void;
  statusWindowRect(): Rectangle;
  createPartyCommandWindow(): void;
  partyCommandWindowRect(): Rectangle;
  createActorCommandWindow(): void;
  actorCommandWindowRect(): Rectangle;
  createHelpWindow(): void;
  helpWindowRect(): Rectangle;
  createSkillWindow(): void;
  skillWindowRect(): Rectangle;
  createItemWindow(): void;
  itemWindowRect(): Rectangle;
  createActorWindow(): void;
  actorWindowRect(): Rectangle;
  createEnemyWindow(): void;
  enemyWindowRect(): Rectangle;
  createButtons(): void;
  createCancelButton(): void;

  // Layout
  helpAreaTop(): number;
  helpAreaBottom(): number;
  helpAreaHeight(): number;
  buttonAreaTop(): number;
  windowAreaHeight(): number;

  // Command handling
  closeCommandWindows(): void;
  hideSubInputWindows(): void;
  startPartyCommandSelection(): void;
  commandFight(): void;
  commandEscape(): void;
  startActorCommandSelection(): void;
  commandAttack(): void;
  commandSkill(): void;
  commandGuard(): void;
  commandItem(): void;
  commandCancel(): void;
  selectNextCommand(): void;
  selectPreviousCommand(): void;

  // Target selection
  startActorSelection(): void;
  onActorOk(): void;
  onActorCancel(): void;
  startEnemySelection(): void;
  onEnemyOk(): void;
  onEnemyCancel(): void;

  // Skill/Item selection
  onSkillOk(): void;
  onSkillCancel(): void;
  onItemOk(): void;
  onItemCancel(): void;
  onSelectAction(): void;
  endCommandSelection(): void;

  // Private fields
  _spriteset: Spriteset_Battle;
  _logWindow: Window_BattleLog;
  _statusWindow: Window_BattleStatus;
  _partyCommandWindow: Window_PartyCommand;
  _actorCommandWindow: Window_ActorCommand;
  _helpWindow: Window_Help;
  _skillWindow: Window_BattleSkill;
  _itemWindow: Window_BattleItem;
  _actorWindow: Window_BattleActor;
  _enemyWindow: Window_BattleEnemy;
  _cancelButton: Sprite_Button;
}

// ---------------------------------------------------------------------------
// Scene_Gameover
// The scene class of the game over screen.
// ---------------------------------------------------------------------------

declare class Scene_Gameover extends Scene_Base {
  constructor();
  initialize(): void;
  create(): void;
  start(): void;
  update(): void;
  stop(): void;
  terminate(): void;

  playGameoverMusic(): void;
  createBackground(): void;
  adjustBackground(): void;
  isTriggered(): boolean;
  gotoTitle(): void;

  // Private fields
  _backSprite: Sprite;
}
