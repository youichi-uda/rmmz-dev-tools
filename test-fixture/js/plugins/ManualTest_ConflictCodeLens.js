// ============================================================================
// 手動テスト: プラグイン競合検出 & CodeLens
// ============================================================================
//
// テスト方法:
// 1. このファイルと SamplePlugin.js を同時に開く
// 2. 両方のファイルが Scene_Battle.prototype.start をオーバーライドしている
// 3. 競合検出と CodeLens アノテーションを確認する
//
// ソース参照:
//   - 競合検出器:     src/conflict/detector.ts
//   - CodeLens プロバイダー: src/conflict/codeLens.ts
//
// コンテキスト: SamplePlugin.js には以下が含まれる:
//   const _Scene_Battle_start = Scene_Battle.prototype.start;  // エイリアスキャプチャ
//   Scene_Battle.prototype.start = function() {                // 直接代入
//     _Scene_Battle_start.call(this);
//     ...
//   };
//   これはエイリアスオーバーライド（isAlias=true）として検出される。
//
// このファイルはエイリアスなしでオーバーライドし、競合を発生させる:
//   Scene_Battle.prototype.start のエイリアスキャプチャがない
//   元の関数を呼び出さない直接代入
//
// 検出ロジック (detector.ts):
//   - ALIAS_CAPTURE_RE がマッチ: const/let/var _x = X.prototype.method;
//   - DIRECT_ASSIGN_RE がマッチ: X.prototype.method = function
//   - hasConflict = !allAliased（エイリアスなしのオーバーライドがあれば true）
//
// CodeLens ロジック (codeLens.ts):
//   - すべてのプラグインファイルのオーバーライドをスキャンする
//   - 各直接代入行の上に CodeLens を表示する
//   - タイトル: "Override: also modified by [plugin1, plugin2]"（競合がある場合）
//              "Alias chain: plugin1 -> plugin2"（すべてエイリアスの場合）
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Conflict Test Plugin -- intentionally conflicts with SamplePlugin
 * @author Tester
 * @help
 * This plugin overrides Scene_Battle.prototype.start WITHOUT an alias,
 * creating a conflict with SamplePlugin which also overrides it (with alias).
 */

(() => {
  "use strict";

  // ------------------------------------------------------------------
  // テスト 1: 競合検出の出力
  // 手順:
  //   1. コマンドパレット →「RMMZ: Show Plugin Conflicts」を実行する
  //      （コマンドID: rmmz.showConflicts）
  //   2.「RMMZ Conflicts」出力チャンネルを確認する
  // 期待結果: "=== Conflicts (1) ===" セクションに以下が表示される:
  //   Scene_Battle.prototype.start
  //     - SamplePlugin line NN (alias)
  //     - ManualTest_ConflictCodeLens line NN (NO ALIAS)
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // テスト 2: オーバーライドの CodeLens アノテーション
  // 手順: 下の「Scene_Battle.prototype.start = function」行を確認する
  // 期待結果: 行の上に CodeLens が表示される:
  //   "Override: also modified by [SamplePlugin]"
  //   クリックすると rmmz.showConflicts が実行される
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // テスト 3: 競合の診断
  // 手順: このファイルの問題パネル（Ctrl+Shift+M）を確認する
  // 期待結果: オーバーライド行に警告診断が表示される:
  //   "Scene_Battle.prototype.start overridden without alias -- also modified by [SamplePlugin]"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------

  // 意図的にエイリアスなし -- これは競合となる
  Scene_Battle.prototype.start = function() {
    console.log("ConflictTest: overriding without alias!");
  };

  // ------------------------------------------------------------------
  // テスト 4: 安全なエイリアスチェーン（危険な競合としてフラグされないこと）
  // 手順: 下の Game_Party.prototype.gold に以下があることを確認する:
  //   - エイリアスキャプチャ行（const _Game_Party_gold = ...）
  //   - 直接代入行
  // 期待結果:
  //   - 他のプラグインが Game_Party.prototype.gold をオーバーライドしていない場合:
  //     CodeLens も診断も表示されない（オーバーライドが1つだけで競合ではない）
  //   - 他のプラグインも（両方エイリアスで）オーバーライドしている場合:
  //     CodeLens に "Alias chain: PluginA -> PluginB" が表示される
  //     診断の重大度: Information（Warning ではない）
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const _Game_Party_gold = Game_Party.prototype.gold;
  Game_Party.prototype.gold = function() {
    return _Game_Party_gold.call(this) * 2;
  };

})();
