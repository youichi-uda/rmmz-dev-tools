/*:
 * @target MZ
 * @plugindesc Enhanced Battle System
 * @author DemoAuthor
 * @url https://example.com/enhanced-battle
 *
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 *
 * @param battleSpeed
 * @text Battle Speed
 * @desc Adjusts the overall battle animation speed.
 * @type number
 * @min 1
 * @max 10
 * @decimals 1
 * @default 5
 *
 * @param showDamage
 * @text Show Damage Numbers
 * @desc Whether to display damage numbers in battle.
 * @type boolean
 * @on Show
 * @off Hide
 * @default true
 *
 * @param battleBgm
 * @text Battle BGM
 * @desc Background music file for battles.
 * @type file
 * @dir audio/bgm/
 *
 * @param difficulty
 * @text Difficulty Level
 * @desc Select the default difficulty.
 * @type select
 * @option Easy
 * @value easy
 * @option Normal
 * @value normal
 * @option Hard
 * @value hard
 * @default normal
 *
 * @param victoryActor
 * @text Victory Pose Actor
 * @desc Actor who performs the victory pose.
 * @type actor
 * @default 1
 *
 * @command startBossBattle
 * @text Start Boss Battle
 * @desc Initiates a boss battle with custom settings.
 *
 * @arg bossId
 * @text Boss Enemy
 * @desc Select the boss enemy.
 * @type enemy
 * @default 1
 *
 * @arg bgm
 * @text Boss BGM
 * @desc Override BGM for this boss fight.
 * @type file
 * @dir audio/bgm/
 *
 * @help
 * Enhanced Battle System
 *
 * This plugin provides an enhanced battle system with
 * configurable speed, damage display, and boss battles.
 *
 * Plugin Commands:
 *   Start Boss Battle - Begin a boss encounter
 */

/*:ja
 * @target MZ
 * @plugindesc 強化バトルシステム
 * @author DemoAuthor
 *
 * @param battleSpeed
 * @text バトル速度
 * @desc バトルアニメーションの速度を調整します。
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @help
 * 強化バトルシステム
 *
 * バトル速度やダメージ表示をカスタマイズできます。
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "SamplePlugin";
  const parameters = PluginManager.parameters(PLUGIN_NAME);

  const param = {
    battleSpeed: Number(parameters["battleSpeed"]) || 5,
    showDamage: parameters["showDamage"] === "true",
    difficulty: parameters["difficulty"] || "normal",
    victoryActor: Number(parameters["victoryActor"]) || 1,
  };

  PluginManager.registerCommand(PLUGIN_NAME, "startBossBattle", (args) => {
    const bossId = Number(args.bossId) || 1;
    // Data Hover test: hover over these to see resolved names
    const actor = $dataActors[param.victoryActor];
    if ($gameSwitches.value(1)) {
      $gameVariables.setValue(1, $gameVariables.value(1) + 1);
    }
    console.log(`Starting boss battle: Enemy ${bossId}, actor: ${actor?.name}`);
  });

  const _Scene_Battle_start = Scene_Battle.prototype.start;
  Scene_Battle.prototype.start = function() {
    _Scene_Battle_start.call(this);
    console.log(`Battle speed: ${param.battleSpeed}`);
  };

})();
