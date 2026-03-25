// Type definitions for rmmz_managers.js v1.10.0
// All RMMZ manager classes — static-only, declared as namespaces.

// ---------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.
// ---------------------------------------------------------------------------

interface DataManagerDatabaseFile {
  name: string;
  src: string;
}

interface DataManagerSavefileInfo {
  title: string;
  characters: [string, number][];
  faces: [string, number][];
  playtime: string;
  timestamp: number;
}

interface DataManagerSaveContents {
  system: Game_System;
  screen: Game_Screen;
  timer: Game_Timer;
  switches: Game_Switches;
  variables: Game_Variables;
  selfSwitches: Game_SelfSwitches;
  actors: Game_Actors;
  party: Game_Party;
  map: Game_Map;
  player: Game_Player;
}

interface DataManagerError {
  name: string;
  src: string;
  url: string;
}

declare namespace DataManager {
  let _globalInfo: (DataManagerSavefileInfo | null)[] | null;
  let _errors: DataManagerError[];
  const _databaseFiles: DataManagerDatabaseFile[];

  function loadGlobalInfo(): void;
  function removeInvalidGlobalInfo(): void;
  function saveGlobalInfo(): void;
  function isGlobalInfoLoaded(): boolean;
  function loadDatabase(): void;
  function loadDataFile(name: string, src: string): void;
  function onXhrLoad(xhr: XMLHttpRequest, name: string, src: string, url: string): void;
  function onXhrError(name: string, src: string, url: string): void;
  function isDatabaseLoaded(): boolean;
  function loadMapData(mapId: number): void;
  function makeEmptyMap(): void;
  function isMapLoaded(): boolean;
  function onLoad(object: Record<string, unknown>): void;
  function isMapObject(object: Record<string, unknown>): boolean;
  function extractArrayMetadata(array: unknown[]): void;
  function extractMetadata(data: { note: string; meta: Record<string, unknown> }): void;
  function checkError(): void;
  function isBattleTest(): boolean;
  function isEventTest(): boolean;
  function isTitleSkip(): boolean;
  function isSkill(item: unknown): item is RPG_Skill;
  function isItem(item: unknown): item is RPG_Item;
  function isWeapon(item: unknown): item is RPG_Weapon;
  function isArmor(item: unknown): item is RPG_Armor;
  function createGameObjects(): void;
  function setupNewGame(): void;
  function setupBattleTest(): void;
  function setupEventTest(): void;
  function isAnySavefileExists(): boolean;
  function latestSavefileId(): number;
  function earliestSavefileId(): number;
  function emptySavefileId(): number;
  function loadAllSavefileImages(): void;
  function loadSavefileImages(info: DataManagerSavefileInfo): void;
  function maxSavefiles(): number;
  function savefileInfo(savefileId: number): DataManagerSavefileInfo | null;
  function savefileExists(savefileId: number): boolean;
  function saveGame(savefileId: number): Promise<number>;
  function loadGame(savefileId: number): Promise<number>;
  function makeSavename(savefileId: number): string;
  function selectSavefileForNewGame(): void;
  function makeSavefileInfo(): DataManagerSavefileInfo;
  function makeSaveContents(): DataManagerSaveContents;
  function extractSaveContents(contents: DataManagerSaveContents): void;
  function correctDataErrors(): void;
}

// ---------------------------------------------------------------------------
// ConfigManager
//
// The static class that manages the configuration data.
// ---------------------------------------------------------------------------

interface ConfigData {
  alwaysDash: boolean;
  commandRemember: boolean;
  touchUI: boolean;
  bgmVolume: number;
  bgsVolume: number;
  meVolume: number;
  seVolume: number;
}

declare namespace ConfigManager {
  let alwaysDash: boolean;
  let commandRemember: boolean;
  let touchUI: boolean;
  let _isLoaded: boolean;
  let bgmVolume: number;
  let bgsVolume: number;
  let meVolume: number;
  let seVolume: number;

  function load(): void;
  function save(): void;
  function isLoaded(): boolean;
  function makeData(): ConfigData;
  function applyData(config: Partial<ConfigData>): void;
  function readFlag(config: Record<string, unknown>, name: string, defaultValue: boolean): boolean;
  function readVolume(config: Record<string, unknown>, name: string): number;
}

// ---------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.
// ---------------------------------------------------------------------------

declare namespace StorageManager {
  let _forageKeys: string[];
  let _forageKeysUpdated: boolean;

  function isLocalMode(): boolean;
  function saveObject(saveName: string, object: unknown): Promise<void>;
  function loadObject(saveName: string): Promise<unknown>;
  function objectToJson(object: unknown): Promise<string>;
  function jsonToObject(json: string): Promise<unknown>;
  function jsonToZip(json: string): Promise<string>;
  function zipToJson(zip: string): Promise<string>;
  function saveZip(saveName: string, zip: string): Promise<void>;
  function loadZip(saveName: string): Promise<string>;
  function exists(saveName: string): boolean;
  function remove(saveName: string): void;
  function saveToLocalFile(saveName: string, zip: string): Promise<void>;
  function loadFromLocalFile(saveName: string): Promise<string>;
  function localFileExists(saveName: string): boolean;
  function removeLocalFile(saveName: string): void;
  function saveToForage(saveName: string, zip: string): Promise<void>;
  function loadFromForage(saveName: string): Promise<string>;
  function forageExists(saveName: string): boolean;
  function removeForage(saveName: string): Promise<void>;
  function updateForageKeys(): Promise<number>;
  function forageKeysUpdated(): boolean;
  function fsMkdir(path: string): void;
  function fsRename(oldPath: string, newPath: string): void;
  function fsUnlink(path: string): void;
  function fsReadFile(path: string): string | null;
  function fsWriteFile(path: string, data: string): void;
  function fileDirectoryPath(): string;
  function filePath(saveName: string): string;
  function forageKey(saveName: string): string;
  function forageTestKey(): string;
}

// ---------------------------------------------------------------------------
// FontManager
//
// The static class that loads font files.
// ---------------------------------------------------------------------------

declare namespace FontManager {
  let _urls: Record<string, string>;
  let _states: Record<string, string>;

  function load(family: string, filename: string): void;
  function isReady(): boolean;
  function startLoading(family: string, url: string): void;
  function throwLoadError(family: string): never;
  function makeUrl(filename: string): string;
}

// ---------------------------------------------------------------------------
// ImageManager
//
// The static class that loads images, creates bitmap objects and retains them.
// ---------------------------------------------------------------------------

declare namespace ImageManager {
  let standardIconWidth: number;
  let standardIconHeight: number;
  let standardFaceWidth: number;
  let standardFaceHeight: number;
  let _cache: Record<string, Bitmap>;
  let _system: Record<string, Bitmap>;
  let _emptyBitmap: Bitmap;
  const iconWidth: number;
  const iconHeight: number;
  const faceWidth: number;
  const faceHeight: number;

  function getIconSize(): number;
  function getFaceSize(): number;
  function loadAnimation(filename: string): Bitmap;
  function loadBattleback1(filename: string): Bitmap;
  function loadBattleback2(filename: string): Bitmap;
  function loadEnemy(filename: string): Bitmap;
  function loadCharacter(filename: string): Bitmap;
  function loadFace(filename: string): Bitmap;
  function loadParallax(filename: string): Bitmap;
  function loadPicture(filename: string): Bitmap;
  function loadSvActor(filename: string): Bitmap;
  function loadSvEnemy(filename: string): Bitmap;
  function loadSystem(filename: string): Bitmap;
  function loadTileset(filename: string): Bitmap;
  function loadTitle1(filename: string): Bitmap;
  function loadTitle2(filename: string): Bitmap;
  function loadBitmap(folder: string, filename: string): Bitmap;
  function loadBitmapFromUrl(url: string): Bitmap;
  function clear(): void;
  function isReady(): boolean;
  function throwLoadError(bitmap: Bitmap): never;
  function isObjectCharacter(filename: string): boolean;
  function isBigCharacter(filename: string): boolean;
  function isZeroParallax(filename: string): boolean;
}

// ---------------------------------------------------------------------------
// EffectManager
//
// The static class that loads Effekseer effects.
// ---------------------------------------------------------------------------

declare namespace EffectManager {
  let _cache: Record<string, EffekseerEffect>;
  let _errorUrls: string[];

  function load(filename: string): EffekseerEffect | null;
  function startLoading(url: string): EffekseerEffect;
  function clear(): void;
  function onLoad(url: string): void;
  function onError(url: string): void;
  function makeUrl(filename: string): string;
  function checkErrors(): void;
  function throwLoadError(url: string): never;
  function isReady(): boolean;
}

// ---------------------------------------------------------------------------
// AudioManager
//
// The static class that handles BGM, BGS, ME and SE.
// ---------------------------------------------------------------------------

declare namespace AudioManager {
  let _bgmVolume: number;
  let _bgsVolume: number;
  let _meVolume: number;
  let _seVolume: number;
  let _currentBgm: RPG_AudioFile | null;
  let _currentBgs: RPG_AudioFile | null;
  let _bgmBuffer: WebAudio | null;
  let _bgsBuffer: WebAudio | null;
  let _meBuffer: WebAudio | null;
  let _seBuffers: WebAudio[];
  let _staticBuffers: WebAudio[];
  let _replayFadeTime: number;
  let _path: string;
  let bgmVolume: number;
  let bgsVolume: number;
  let meVolume: number;
  let seVolume: number;

  function playBgm(bgm: RPG_AudioFile, pos?: number): void;
  function replayBgm(bgm: RPG_AudioFile): void;
  function isCurrentBgm(bgm: RPG_AudioFile): boolean;
  function updateBgmParameters(bgm: RPG_AudioFile): void;
  function updateCurrentBgm(bgm: RPG_AudioFile, pos?: number): void;
  function stopBgm(): void;
  function fadeOutBgm(duration: number): void;
  function fadeInBgm(duration: number): void;
  function playBgs(bgs: RPG_AudioFile, pos?: number): void;
  function replayBgs(bgs: RPG_AudioFile): void;
  function isCurrentBgs(bgs: RPG_AudioFile): boolean;
  function updateBgsParameters(bgs: RPG_AudioFile): void;
  function updateCurrentBgs(bgs: RPG_AudioFile, pos?: number): void;
  function stopBgs(): void;
  function fadeOutBgs(duration: number): void;
  function fadeInBgs(duration: number): void;
  function playMe(me: RPG_AudioFile): void;
  function updateMeParameters(me: RPG_AudioFile): void;
  function fadeOutMe(duration: number): void;
  function stopMe(): void;
  function playSe(se: RPG_AudioFile): void;
  function updateSeParameters(buffer: WebAudio, se: RPG_AudioFile): void;
  function cleanupSe(): void;
  function stopSe(): void;
  function playStaticSe(se: RPG_AudioFile): void;
  function loadStaticSe(se: RPG_AudioFile): void;
  function isStaticSe(se: RPG_AudioFile): boolean;
  function stopAll(): void;
  function saveBgm(): RPG_AudioFile;
  function saveBgs(): RPG_AudioFile;
  function makeEmptyAudioObject(): RPG_AudioFile;
  function createBuffer(folder: string, name: string): WebAudio;
  function updateBufferParameters(buffer: WebAudio, configVolume: number, audio: RPG_AudioFile): void;
  function audioFileExt(): string;
  function checkErrors(): void;
  function throwLoadError(webAudio: WebAudio): never;
}

// ---------------------------------------------------------------------------
// SoundManager
//
// The static class that plays sound effects defined in the database.
// ---------------------------------------------------------------------------

declare namespace SoundManager {
  function preloadImportantSounds(): void;
  function loadSystemSound(n: number): void;
  function playSystemSound(n: number): void;
  function playCursor(): void;
  function playOk(): void;
  function playCancel(): void;
  function playBuzzer(): void;
  function playEquip(): void;
  function playSave(): void;
  function playLoad(): void;
  function playBattleStart(): void;
  function playEscape(): void;
  function playEnemyAttack(): void;
  function playEnemyDamage(): void;
  function playEnemyCollapse(): void;
  function playBossCollapse1(): void;
  function playBossCollapse2(): void;
  function playActorDamage(): void;
  function playActorCollapse(): void;
  function playRecovery(): void;
  function playMiss(): void;
  function playEvasion(): void;
  function playMagicEvasion(): void;
  function playReflection(): void;
  function playShop(): void;
  function playUseItem(): void;
  function playUseSkill(): void;
}

// ---------------------------------------------------------------------------
// TextManager
//
// The static class that handles terms and messages.
// ---------------------------------------------------------------------------

interface TextManager {
  basic(basicId: number): string;
  param(paramId: number): string;
  command(commandId: number): string;
  message(messageId: string): string;
  getter(method: string, param: number | string): PropertyDescriptor;

  // Currency
  readonly currencyUnit: string;

  // Basic terms (from $dataSystem.terms.basic)
  readonly level: string;
  readonly levelA: string;
  readonly hp: string;
  readonly hpA: string;
  readonly mp: string;
  readonly mpA: string;
  readonly tp: string;
  readonly tpA: string;
  readonly exp: string;
  readonly expA: string;

  // Command terms (from $dataSystem.terms.commands)
  readonly fight: string;
  readonly escape: string;
  readonly attack: string;
  readonly guard: string;
  readonly item: string;
  readonly skill: string;
  readonly equip: string;
  readonly status: string;
  readonly formation: string;
  readonly save: string;
  readonly gameEnd: string;
  readonly options: string;
  readonly weapon: string;
  readonly armor: string;
  readonly keyItem: string;
  readonly equip2: string;
  readonly optimize: string;
  readonly clear: string;
  readonly newGame: string;
  readonly continue_: string;
  readonly toTitle: string;
  readonly cancel: string;
  readonly buy: string;
  readonly sell: string;

  // Message terms (from $dataSystem.terms.messages)
  readonly alwaysDash: string;
  readonly commandRemember: string;
  readonly touchUI: string;
  readonly bgmVolume: string;
  readonly bgsVolume: string;
  readonly meVolume: string;
  readonly seVolume: string;
  readonly possession: string;
  readonly expTotal: string;
  readonly expNext: string;
  readonly saveMessage: string;
  readonly loadMessage: string;
  readonly file: string;
  readonly autosave: string;
  readonly partyName: string;
  readonly emerge: string;
  readonly preemptive: string;
  readonly surprise: string;
  readonly escapeStart: string;
  readonly escapeFailure: string;
  readonly victory: string;
  readonly defeat: string;
  readonly obtainExp: string;
  readonly obtainGold: string;
  readonly obtainItem: string;
  readonly levelUp: string;
  readonly obtainSkill: string;
  readonly useItem: string;
  readonly criticalToEnemy: string;
  readonly criticalToActor: string;
  readonly actorDamage: string;
  readonly actorRecovery: string;
  readonly actorGain: string;
  readonly actorLoss: string;
  readonly actorDrain: string;
  readonly actorNoDamage: string;
  readonly actorNoHit: string;
  readonly enemyDamage: string;
  readonly enemyRecovery: string;
  readonly enemyGain: string;
  readonly enemyLoss: string;
  readonly enemyDrain: string;
  readonly enemyNoDamage: string;
  readonly enemyNoHit: string;
  readonly evasion: string;
  readonly magicEvasion: string;
  readonly magicReflection: string;
  readonly counterAttack: string;
  readonly substitute: string;
  readonly buffAdd: string;
  readonly debuffAdd: string;
  readonly buffRemove: string;
  readonly actionFailure: string;

  [key: string]: any;
}

declare const TextManager: TextManager;

// ---------------------------------------------------------------------------
// ColorManager
//
// The static class that handles the window colors.
// ---------------------------------------------------------------------------

declare namespace ColorManager {
  let _windowskin: Bitmap;

  function loadWindowskin(): void;
  function textColor(n: number): string;
  function normalColor(): string;
  function systemColor(): string;
  function crisisColor(): string;
  function deathColor(): string;
  function gaugeBackColor(): string;
  function hpGaugeColor1(): string;
  function hpGaugeColor2(): string;
  function mpGaugeColor1(): string;
  function mpGaugeColor2(): string;
  function mpCostColor(): string;
  function powerUpColor(): string;
  function powerDownColor(): string;
  function ctGaugeColor1(): string;
  function ctGaugeColor2(): string;
  function tpGaugeColor1(): string;
  function tpGaugeColor2(): string;
  function tpCostColor(): string;
  function pendingColor(): string;
  function hpColor(actor: Game_Actor): string;
  function mpColor(actor: Game_Actor): string;
  function tpColor(actor: Game_Actor): string;
  function paramchangeTextColor(change: number): string;
  function damageColor(colorType: number): string;
  function outlineColor(): string;
  function dimColor1(): string;
  function dimColor2(): string;
  function itemBackColor1(): string;
  function itemBackColor2(): string;
}

// ---------------------------------------------------------------------------
// SceneManager
//
// The static class that manages scene transitions.
// ---------------------------------------------------------------------------

interface SceneConstructor {
  new (): Scene_Base;
}

declare namespace SceneManager {
  let _scene: Scene_Base | null;
  let _nextScene: Scene_Base | null;
  let _stack: SceneConstructor[];
  let _exiting: boolean;
  let _previousScene: Scene_Base | null;
  let _previousClass: SceneConstructor | null;
  let _backgroundBitmap: Bitmap | null;
  let _smoothDeltaTime: number;
  let _elapsedTime: number;

  function run(sceneClass: SceneConstructor): void;
  function initialize(): void;
  function checkBrowser(): void;
  function checkPluginErrors(): void;
  function initGraphics(): void;
  function initAudio(): void;
  function initVideo(): void;
  function initInput(): void;
  function setupEventHandlers(): void;
  function update(deltaTime: number): void;
  function determineRepeatNumber(deltaTime: number): number;
  function terminate(): void;
  function onError(event: ErrorEvent): void;
  function onReject(event: PromiseRejectionEvent): void;
  function onUnload(): void;
  function onKeyDown(event: KeyboardEvent): void;
  function reloadGame(): void;
  function showDevTools(): void;
  function catchException(e: unknown): void;
  function catchNormalError(e: Error): void;
  function catchLoadError(e: [string, string, (() => void)?]): void;
  function catchUnknownError(e: unknown): void;
  function updateMain(): void;
  function updateFrameCount(): void;
  function updateInputData(): void;
  function updateEffekseer(): void;
  function changeScene(): void;
  function updateScene(): void;
  function isGameActive(): boolean;
  function onSceneTerminate(): void;
  function onSceneCreate(): void;
  function onBeforeSceneStart(): void;
  function onSceneStart(): void;
  function isSceneChanging(): boolean;
  function isCurrentSceneBusy(): boolean;
  function isNextScene(sceneClass: SceneConstructor): boolean;
  function isPreviousScene(sceneClass: SceneConstructor): boolean;
  function goto(sceneClass: SceneConstructor | null): void;
  function push(sceneClass: SceneConstructor): void;
  function pop(): void;
  function exit(): void;
  function clearStack(): void;
  function stop(): void;
  function prepareNextScene(...args: unknown[]): void;
  function snap(): Bitmap;
  function snapForBackground(): void;
  function backgroundBitmap(): Bitmap | null;
  function resume(): void;
}

// ---------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.
// ---------------------------------------------------------------------------

interface BattleRewards {
  gold: number;
  exp: number;
  items: (RPG_Item | RPG_Weapon | RPG_Armor)[];
}

declare namespace BattleManager {
  let _phase: string;
  let _inputting: boolean;
  let _canEscape: boolean;
  let _canLose: boolean;
  let _battleTest: boolean;
  let _eventCallback: ((result: number) => void) | null;
  let _preemptive: boolean;
  let _surprise: boolean;
  let _currentActor: Game_Actor | null;
  let _actionForcedBattler: Game_Battler | null;
  let _mapBgm: RPG_AudioFile | null;
  let _mapBgs: RPG_AudioFile | null;
  let _actionBattlers: Game_Battler[];
  let _subject: Game_Battler | null;
  let _action: Game_Action | null;
  let _targets: Game_Battler[];
  let _logWindow: Window_BattleLog | null;
  let _spriteset: Spriteset_Battle | null;
  let _escapeRatio: number;
  let _escaped: boolean;
  let _rewards: BattleRewards;
  let _tpbNeedsPartyCommand: boolean;

  function setup(troopId: number, canEscape: boolean, canLose: boolean): void;
  function initMembers(): void;
  function isTpb(): boolean;
  function isActiveTpb(): boolean;
  function isBattleTest(): boolean;
  function setBattleTest(battleTest: boolean): void;
  function setEventCallback(callback: (result: number) => void): void;
  function setLogWindow(logWindow: Window_BattleLog): void;
  function setSpriteset(spriteset: Spriteset_Battle): void;
  function onEncounter(): void;
  function ratePreemptive(): number;
  function rateSurprise(): number;
  function saveBgmAndBgs(): void;
  function playBattleBgm(): void;
  function playVictoryMe(): void;
  function playDefeatMe(): void;
  function replayBgmAndBgs(): void;
  function makeEscapeRatio(): void;
  function update(timeActive: boolean): void;
  function updatePhase(timeActive: boolean): void;
  function updateEvent(): boolean;
  function updateEventMain(): boolean;
  function isBusy(): boolean;
  function updateTpbInput(): void;
  function checkTpbInputClose(): void;
  function checkTpbInputOpen(): void;
  function isPartyTpbInputtable(): boolean;
  function needsActorInputCancel(): boolean;
  function isTpbMainPhase(): boolean;
  function isInputting(): boolean;
  function isInTurn(): boolean;
  function isTurnEnd(): boolean;
  function isAborting(): boolean;
  function isBattleEnd(): boolean;
  function canEscape(): boolean;
  function canLose(): boolean;
  function isEscaped(): boolean;
  function actor(): Game_Actor | null;
  function startBattle(): void;
  function displayStartMessages(): void;
  function startInput(): void;
  function inputtingAction(): Game_Action | null;
  function selectNextCommand(): void;
  function selectNextActor(): void;
  function selectPreviousCommand(): void;
  function selectPreviousActor(): void;
  function changeCurrentActor(forward: boolean): void;
  function startActorInput(): void;
  function finishActorInput(): void;
  function cancelActorInput(): void;
  function updateStart(): void;
  function startTurn(): void;
  function updateTurn(timeActive: boolean): void;
  function updateTpb(): void;
  function updateAllTpbBattlers(): void;
  function updateTpbBattler(battler: Game_Battler): void;
  function checkTpbTurnEnd(): void;
  function processTurn(): void;
  function endBattlerActions(battler: Game_Battler): void;
  function endTurn(): void;
  function updateTurnEnd(): void;
  function endAllBattlersTurn(): void;
  function displayBattlerStatus(battler: Game_Battler, current: boolean): void;
  function getNextSubject(): Game_Battler | null;
  function allBattleMembers(): Game_Battler[];
  function makeActionOrders(): void;
  function startAction(): void;
  function updateAction(): void;
  function endAction(): void;
  function invokeAction(subject: Game_Battler, target: Game_Battler): void;
  function invokeNormalAction(subject: Game_Battler, target: Game_Battler): void;
  function invokeCounterAttack(subject: Game_Battler, target: Game_Battler): void;
  function invokeMagicReflection(subject: Game_Battler, target: Game_Battler): void;
  function applySubstitute(target: Game_Battler): Game_Battler;
  function checkSubstitute(target: Game_Battler): boolean;
  function isActionForced(): boolean;
  function forceAction(battler: Game_Battler): void;
  function processForcedAction(): void;
  function abort(): void;
  function checkBattleEnd(): boolean;
  function checkAbort(): boolean;
  function processVictory(): void;
  function processEscape(): boolean;
  function onEscapeSuccess(): void;
  function onEscapeFailure(): void;
  function processPartyEscape(): void;
  function processAbort(): void;
  function processDefeat(): void;
  function endBattle(result: number): void;
  function updateBattleEnd(): void;
  function makeRewards(): void;
  function displayVictoryMessage(): void;
  function displayDefeatMessage(): void;
  function displayEscapeSuccessMessage(): void;
  function displayEscapeFailureMessage(): void;
  function displayRewards(): void;
  function displayExp(): void;
  function displayGold(): void;
  function displayDropItems(): void;
  function gainRewards(): void;
  function gainExp(): void;
  function gainGold(): void;
  function gainDropItems(): void;
}

// ---------------------------------------------------------------------------
// PluginManager
//
// The static class that manages the plugins.
// ---------------------------------------------------------------------------

interface PluginInfo {
  name: string;
  status: boolean;
  description: string;
  parameters: Record<string, string>;
}

declare namespace PluginManager {
  let _scripts: string[];
  let _errorUrls: string[];
  let _parameters: Record<string, Record<string, string>>;
  let _commands: Record<string, (args: Record<string, string>) => void>;

  function setup(plugins: PluginInfo[]): void;
  function parameters(name: string): Record<string, string>;
  function setParameters(name: string, parameters: Record<string, string>): void;
  function loadScript(filename: string): void;
  function onError(e: Event): void;
  function makeUrl(filename: string): string;
  function checkErrors(): void;
  function throwLoadError(url: string): never;
  function registerCommand(pluginName: string, commandName: string, func: (args: Record<string, string>) => void): void;
  function callCommand(self: Game_Interpreter, pluginName: string, commandName: string, args: Record<string, string>): void;
}
