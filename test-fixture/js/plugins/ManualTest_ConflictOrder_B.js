// ============================================================================
// 手動テスト: 競合レポートのプラグイン順番（B）
// ============================================================================
//
// テスト方法:
// 1. このファイルと ManualTest_ConflictOrder_A.js を同時に確認する
// 2. plugins.js では B が A より前に登録されている（アルファベット逆順）
// 3. 競合レポートが plugins.js の順番を反映することを確認する
//
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Conflict Order Test B
 * @author Tester
 * @help
 * This plugin overrides Game_Map.prototype.setup WITHOUT alias.
 * Used to test that conflict report respects plugin manager order.
 */

(() => {
  "use strict";

  // ------------------------------------------------------------------
  // テスト 7: エイリアスなし競合 + 順番
  // 手順:
  //   1. 競合レポートの出力を確認する
  // 期待結果:
  //   Game_Map.prototype.setup:
  //     - ManualTest_ConflictOrder_B (NO ALIAS) ← 先（plugins.js 順）
  //     - ManualTest_ConflictOrder_A (alias)    ← 後
  //   hasConflict = true（B がエイリアスなしのため）
  //   B のエイリアスなしオーバーライドが A のエイリアスチェーンを壊す
  //   ことが順番から読み取れる
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  // 意図的にエイリアスなし -- A との競合を発生させる
  Game_Map.prototype.setup = function(mapId) {
    console.log("ConflictOrder_B: overriding setup without alias!");
  };

  // ------------------------------------------------------------------
  // テスト 8: plugins.js に未登録のプラグインの順番
  // 手順:
  //   1. ManualTest_ConflictCodeLens.js は plugins.js に登録されていない
  //   2. Scene_Battle.prototype.start の競合レポートを確認する
  //      （SamplePlugin と ManualTest_ConflictCodeLens の競合）
  // 期待結果:
  //   - SamplePlugin が先に表示される（plugins.js に登録済み）
  //   - ManualTest_ConflictCodeLens が後に表示される（未登録 → 末尾）
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  // Scene_Map.onMapLoaded もエイリアスなしで上書き
  Scene_Map.prototype.onMapLoaded = function() {
    console.log("ConflictOrder_B: onMapLoaded without alias!");
  };

})();
