// Type definitions for RMMZ global variables
// These are the global data and game objects available at runtime.

// ── Data objects (loaded from JSON files) ──

interface RPG_MetaData {
  id: number;
  name: string;
  note: string;
  meta: Record<string, unknown>;
}

interface RPG_Actor extends RPG_MetaData {
  battlerName: string;
  characterIndex: number;
  characterName: string;
  classId: number;
  equips: number[];
  faceIndex: number;
  faceName: string;
  initialLevel: number;
  maxLevel: number;
  nickname: string;
  profile: string;
  traits: RPG_Trait[];
}

interface RPG_Class extends RPG_MetaData {
  expParams: number[];
  learnings: RPG_Learning[];
  params: number[][];
  traits: RPG_Trait[];
}

interface RPG_Learning {
  level: number;
  note: string;
  skillId: number;
}

interface RPG_Skill extends RPG_MetaData {
  animationId: number;
  damage: RPG_Damage;
  description: string;
  effects: RPG_Effect[];
  hitType: number;
  iconIndex: number;
  message1: string;
  message2: string;
  mpCost: number;
  occasion: number;
  repeats: number;
  requiredWtypeId1: number;
  requiredWtypeId2: number;
  scope: number;
  speed: number;
  stypeId: number;
  successRate: number;
  tpCost: number;
  tpGain: number;
}

interface RPG_Item extends RPG_MetaData {
  animationId: number;
  consumable: boolean;
  damage: RPG_Damage;
  description: string;
  effects: RPG_Effect[];
  hitType: number;
  iconIndex: number;
  itypeId: number;
  occasion: number;
  price: number;
  repeats: number;
  scope: number;
  speed: number;
  successRate: number;
  tpGain: number;
}

interface RPG_Weapon extends RPG_MetaData {
  animationId: number;
  description: string;
  etypeId: number;
  traits: RPG_Trait[];
  iconIndex: number;
  params: number[];
  price: number;
  wtypeId: number;
}

interface RPG_Armor extends RPG_MetaData {
  atypeId: number;
  description: string;
  etypeId: number;
  traits: RPG_Trait[];
  iconIndex: number;
  params: number[];
  price: number;
}

interface RPG_Enemy extends RPG_MetaData {
  actions: RPG_EnemyAction[];
  battlerHue: number;
  battlerName: string;
  dropItems: RPG_DropItem[];
  exp: number;
  gold: number;
  params: number[];
  traits: RPG_Trait[];
}

interface RPG_EnemyAction {
  conditionParam1: number;
  conditionParam2: number;
  conditionType: number;
  rating: number;
  skillId: number;
}

interface RPG_DropItem {
  dataId: number;
  denominator: number;
  kind: number;
}

interface RPG_Troop {
  id: number;
  members: RPG_TroopMember[];
  name: string;
  pages: RPG_TroopPage[];
}

interface RPG_TroopMember {
  enemyId: number;
  x: number;
  y: number;
  hidden: boolean;
}

interface RPG_TroopPage {
  conditions: RPG_TroopPageConditions;
  list: RPG_EventCommand[];
  span: number;
}

interface RPG_TroopPageConditions {
  actorHp: number;
  actorId: number;
  actorValid: boolean;
  enemyHp: number;
  enemyIndex: number;
  enemyValid: boolean;
  switchId: number;
  switchValid: boolean;
  turnA: number;
  turnB: number;
  turnEnding: boolean;
  turnValid: boolean;
}

interface RPG_State extends RPG_MetaData {
  autoRemovalTiming: number;
  chanceByDamage: number;
  iconIndex: number;
  maxTurns: number;
  message1: string;
  message2: string;
  message3: string;
  message4: string;
  minTurns: number;
  motion: number;
  overlay: number;
  priority: number;
  releaseByDamage: boolean;
  removeAtBattleEnd: boolean;
  removeByDamage: boolean;
  removeByRestriction: boolean;
  removeByWalking: boolean;
  restriction: number;
  stepsToRemove: number;
  traits: RPG_Trait[];
}

interface RPG_Animation {
  id: number;
  displayType: number;
  effectName: string;
  flashTimings: RPG_FlashTiming[];
  name: string;
  offsetX: number;
  offsetY: number;
  rotation: RPG_AnimationRotation;
  scale: number;
  soundTimings: RPG_SoundTiming[];
  speed: number;
}

interface RPG_AnimationRotation {
  x: number;
  y: number;
  z: number;
}

interface RPG_FlashTiming {
  color: number[];
  duration: number;
  frame: number;
}

interface RPG_SoundTiming {
  frame: number;
  se: RPG_AudioFile;
}

interface RPG_Tileset extends RPG_MetaData {
  flags: number[];
  mode: number;
  tilesetNames: string[];
}

interface RPG_CommonEvent {
  id: number;
  list: RPG_EventCommand[];
  name: string;
  switchId: number;
  trigger: number;
}

interface RPG_System {
  airship: RPG_SystemVehicle;
  armorTypes: string[];
  attackMotions: RPG_AttackMotion[];
  battleBgm: RPG_AudioFile;
  battleback1Name: string;
  battleback2Name: string;
  battlerHue: number;
  battlerName: string;
  boat: RPG_SystemVehicle;
  currencyUnit: string;
  defeatMe: RPG_AudioFile;
  editMapId: number;
  elements: string[];
  equipTypes: string[];
  gameTitle: string;
  gameoverMe: RPG_AudioFile;
  locale: string;
  magicSkills: number[];
  menuCommands: boolean[];
  optAutosave: boolean;
  optDisplayTp: boolean;
  optDrawTitle: boolean;
  optExtraExp: boolean;
  optFloorDeath: boolean;
  optFollowers: boolean;
  optKeyItemsNumber: boolean;
  optSideView: boolean;
  optSlipDeath: boolean;
  optTransparent: boolean;
  partyMembers: number[];
  ship: RPG_SystemVehicle;
  skillTypes: string[];
  sounds: RPG_AudioFile[];
  startMapId: number;
  startX: number;
  startY: number;
  switches: string[];
  terms: RPG_SystemTerms;
  testBattlers: RPG_TestBattler[];
  testTroopId: number;
  title1Name: string;
  title2Name: string;
  titleBgm: RPG_AudioFile;
  variables: string[];
  versionId: number;
  victoryMe: RPG_AudioFile;
  weaponTypes: string[];
  windowTone: number[];
  advanced: RPG_SystemAdvanced;
}

interface RPG_SystemAdvanced {
  gameId: number;
  screenWidth: number;
  screenHeight: number;
  uiAreaWidth: number;
  uiAreaHeight: number;
  numberFontFilename: string;
  fallbackFonts: string;
  fontSize: number;
  mainFontFilename: string;
}

interface RPG_SystemVehicle {
  bgm: RPG_AudioFile;
  characterIndex: number;
  characterName: string;
  startMapId: number;
  startX: number;
  startY: number;
}

interface RPG_SystemTerms {
  basic: string[];
  commands: string[];
  params: string[];
  messages: Record<string, string>;
}

interface RPG_AttackMotion {
  type: number;
  weaponImageId: number;
}

interface RPG_TestBattler {
  actorId: number;
  equips: number[];
  level: number;
}

interface RPG_MapInfo {
  id: number;
  expanded: boolean;
  name: string;
  order: number;
  parentId: number;
  scrollX: number;
  scrollY: number;
}

interface RPG_Map {
  autoplayBgm: boolean;
  autoplayBgs: boolean;
  battleback1Name: string;
  battleback2Name: string;
  bgm: RPG_AudioFile;
  bgs: RPG_AudioFile;
  data: number[];
  disableDashing: boolean;
  displayName: string;
  encounterList: RPG_MapEncounter[];
  encounterStep: number;
  events: (RPG_Event | null)[];
  height: number;
  note: string;
  parallaxLoopX: boolean;
  parallaxLoopY: boolean;
  parallaxName: string;
  parallaxShow: boolean;
  parallaxSx: number;
  parallaxSy: number;
  scrollType: number;
  specifyBattleback: boolean;
  tilesetId: number;
  width: number;
  meta: Record<string, unknown>;
}

interface RPG_Event {
  id: number;
  name: string;
  note: string;
  pages: RPG_EventPage[];
  x: number;
  y: number;
  meta: Record<string, unknown>;
}

interface RPG_EventPage {
  conditions: RPG_EventPageConditions;
  directionFix: boolean;
  image: RPG_EventPageImage;
  list: RPG_EventCommand[];
  moveFrequency: number;
  moveRoute: RPG_MoveRoute;
  moveSpeed: number;
  moveType: number;
  priorityType: number;
  stepAnime: boolean;
  through: boolean;
  trigger: number;
  walkAnime: boolean;
}

interface RPG_EventPageConditions {
  actorId: number;
  actorValid: boolean;
  itemId: number;
  itemValid: boolean;
  selfSwitchCh: string;
  selfSwitchValid: boolean;
  switch1Id: number;
  switch1Valid: boolean;
  switch2Id: number;
  switch2Valid: boolean;
  variableId: number;
  variableValid: boolean;
  variableValue: number;
}

interface RPG_EventPageImage {
  characterIndex: number;
  characterName: string;
  direction: number;
  pattern: number;
  tileId: number;
}

interface RPG_EventCommand {
  code: number;
  indent: number;
  parameters: unknown[];
}

interface RPG_MoveRoute {
  list: RPG_MoveCommand[];
  repeat: boolean;
  skippable: boolean;
  wait: boolean;
}

interface RPG_MoveCommand {
  code: number;
  parameters?: unknown[];
}

interface RPG_MapEncounter {
  regionSet: number[];
  troopId: number;
  weight: number;
}

interface RPG_Trait {
  code: number;
  dataId: number;
  value: number;
}

interface RPG_Damage {
  critical: boolean;
  elementId: number;
  formula: string;
  type: number;
  variance: number;
}

interface RPG_Effect {
  code: number;
  dataId: number;
  value1: number;
  value2: number;
}

interface RPG_AudioFile {
  name: string;
  pan: number;
  pitch: number;
  volume: number;
}

// ── Global data variables ──

declare var $dataActors: (RPG_Actor | null)[];
declare var $dataClasses: (RPG_Class | null)[];
declare var $dataSkills: (RPG_Skill | null)[];
declare var $dataItems: (RPG_Item | null)[];
declare var $dataWeapons: (RPG_Weapon | null)[];
declare var $dataArmors: (RPG_Armor | null)[];
declare var $dataEnemies: (RPG_Enemy | null)[];
declare var $dataTroops: (RPG_Troop | null)[];
declare var $dataStates: (RPG_State | null)[];
declare var $dataAnimations: (RPG_Animation | null)[];
declare var $dataTilesets: (RPG_Tileset | null)[];
declare var $dataCommonEvents: (RPG_CommonEvent | null)[];
declare var $dataSystem: RPG_System;
declare var $dataMapInfos: (RPG_MapInfo | null)[];
declare var $dataMap: RPG_Map;

// ── Global game objects ──

declare var $gameTemp: Game_Temp;
declare var $gameSystem: Game_System;
declare var $gameScreen: Game_Screen;
declare var $gameTimer: Game_Timer;
declare var $gameMessage: Game_Message;
declare var $gameSwitches: Game_Switches;
declare var $gameVariables: Game_Variables;
declare var $gameSelfSwitches: Game_SelfSwitches;
declare var $gameActors: Game_Actors;
declare var $gameParty: Game_Party;
declare var $gameTroop: Game_Troop;
declare var $gameMap: Game_Map;
declare var $gamePlayer: Game_Player;

// ── Array/Math/String/Number extensions ──

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
