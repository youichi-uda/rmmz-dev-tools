/**
 * Complete definition of RPG Maker MZ plugin annotation tags.
 */

/** Top-level tags that appear directly in the plugin comment block */
export const TOP_LEVEL_TAGS = [
  'target',
  'plugindesc',
  'author',
  'help',
  'url',
  'base',
  'orderAfter',
  'orderBefore',
  'requiredAssets',
  'param',
  'command',
  'noteParam',
  'noteDir',
  'noteType',
  'noteData',
] as const;

/** Tags valid inside a @param scope */
export const PARAM_TAGS = [
  'text',
  'desc',
  'type',
  'default',
  'parent',
  'min',
  'max',
  'decimals',
  'dir',
  'require',
  'on',
  'off',
  'option',
  'value',
] as const;

/** Tags valid inside a @command scope */
export const COMMAND_TAGS = [
  'text',
  'desc',
  'arg',
] as const;

/** Tags valid inside an @arg scope (same as @param) */
export const ARG_TAGS = PARAM_TAGS;

/** Basic @type values */
export const TYPE_VALUES_BASIC = [
  'string',
  'multiline_string',
  'number',
  'boolean',
  'note',
  'file',
  'select',
  'combo',
] as const;

/** Database reference @type values */
export const TYPE_VALUES_DATABASE = [
  'actor',
  'class',
  'skill',
  'item',
  'weapon',
  'armor',
  'enemy',
  'troop',
  'state',
  'animation',
  'tileset',
  'common_event',
  'switch',
  'variable',
] as const;

/** All simple @type values (without struct<> or [] modifiers) */
export const TYPE_VALUES = [
  ...TYPE_VALUES_BASIC,
  ...TYPE_VALUES_DATABASE,
] as const;

/** Description for each @type value, shown in completion details */
export const TYPE_DESCRIPTIONS: Record<string, string> = {
  string: 'Single-line text input',
  multiline_string: 'Multi-line text area',
  number: 'Numeric spinner input',
  boolean: 'ON/OFF toggle',
  note: 'Multi-line text (JSON-escaped)',
  file: 'File picker with preview',
  select: 'Dropdown list (fixed choices)',
  combo: 'Dropdown with free-text entry',
  actor: 'Actor selector (from database)',
  class: 'Class selector (from database)',
  skill: 'Skill selector (from database)',
  item: 'Item selector (from database)',
  weapon: 'Weapon selector (from database)',
  armor: 'Armor selector (from database)',
  enemy: 'Enemy selector (from database)',
  troop: 'Troop selector (from database)',
  state: 'State selector (from database)',
  animation: 'Animation selector (from database)',
  tileset: 'Tileset selector (from database)',
  common_event: 'Common Event selector (from database)',
  switch: 'Switch selector (from database)',
  variable: 'Variable selector (from database)',
};

/** Tags that have special type-specific applicability */
export const TYPE_SPECIFIC_TAGS: Record<string, string[]> = {
  number: ['min', 'max', 'decimals'],
  file: ['dir', 'require'],
  animation: ['require'],
  boolean: ['on', 'off'],
  select: ['option', 'value'],
  combo: ['option'],
};

/** Description for each annotation tag */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  target: 'Target engine (MZ)',
  plugindesc: 'Plugin title shown in Plugin Manager',
  author: 'Plugin author name',
  help: 'Multi-line help text for Plugin Manager',
  url: 'Plugin URL (clickable in Plugin Manager)',
  base: 'Required dependency plugin name',
  orderAfter: 'Plugin that must load before this one',
  orderBefore: 'Plugin that must load after this one',
  requiredAssets: 'Asset file path required for deployment',
  param: 'Plugin parameter definition',
  command: 'Plugin command definition',
  noteParam: 'Note tag field name for database editor',
  noteDir: 'Image folder path for note file picker',
  noteType: 'Note field type (file)',
  noteData: 'Target database (actors, items, etc.)',
  text: 'Display label in Plugin Manager UI',
  desc: 'Description / tooltip text',
  type: 'Data type for parameter or argument',
  default: 'Default value',
  parent: 'Parent parameter for tree hierarchy',
  min: 'Minimum numeric value',
  max: 'Maximum numeric value',
  decimals: 'Decimal places allowed',
  dir: 'Directory path for file browser',
  require: 'Mark file as required for deployment (1)',
  on: 'Custom label for ON state',
  off: 'Custom label for OFF state',
  option: 'Dropdown option text',
  value: 'Stored value for preceding @option',
  arg: 'Command argument definition',
};
