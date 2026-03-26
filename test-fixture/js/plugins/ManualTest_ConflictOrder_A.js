// ============================================================================
// 手動テスト: 競合レポートのプラグイン順番（A）
// ============================================================================
//
// テスト方法:
// 1. このファイルと ManualTest_ConflictOrder_B.js を同時に確認する
// 2. 両方が Game_Map.prototype.setup をオーバーライドしている
// 3. plugins.js では B → A の順番で登録されている（アルファベット逆順）
//
// ソース参照:
//   - 競合検出器:     src/conflict/detector.ts
//   - プラグイン順読み取り: readPluginOrder() 関数
//
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Conflict Order Test A
 * @author Tester
 * @help
 * This plugin overrides Game_Map.prototype.setup with alias.
 * Used to test that conflict report respects plugin manager order.
 */

(() => {
  "use strict";

  // ------------------------------------------------------------------
  // テスト 5: 競合レポートのプラグイン順番
  // 手順:
  //   1. plugins.js の並び順を確認する:
  //      ManualTest_ConflictOrder_B → ManualTest_ConflictOrder_A の順
  //   2. コマンドパレット →「RMMZ: Show Plugin Conflicts」を実行する
  //   3.「RMMZ Conflicts」出力チャンネルを確認する
  // 期待結果:
  //   Game_Map.prototype.setup のチェーン表示が plugins.js 順になる:
  //     - ManualTest_ConflictOrder_B (先)
  //     - ManualTest_ConflictOrder_A (後)
  //   ※ アルファベット順なら A → B だが、plugins.js 順では B → A
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  const _Game_Map_setup = Game_Map.prototype.setup;
  Game_Map.prototype.setup = function(mapId) {
    _Game_Map_setup.call(this, mapId);
    console.log("ConflictOrder_A: setup called");
  };

  // ------------------------------------------------------------------
  // テスト 6: 複数メソッドの競合順番
  // 手順:
  //   1. 競合レポートで Scene_Map.prototype.onMapLoaded も確認する
  //   2. B と A が同じメソッドをオーバーライドしている
  // 期待結果:
  //   こちらも plugins.js の B → A 順で表示される
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
  Scene_Map.prototype.onMapLoaded = function() {
    _Scene_Map_onMapLoaded.call(this);
    console.log("ConflictOrder_A: onMapLoaded");
  };

})();
