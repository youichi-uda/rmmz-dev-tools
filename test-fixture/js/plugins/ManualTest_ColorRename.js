// ============================================================================
// 手動テスト: カラーピッカー & パラメータリネーム
// ============================================================================
//
// テスト方法: 各セクションのテスト手順に従う
//
// ソース参照:
//   - カラー:   src/annotation/colorProvider.ts
//   - リネーム: src/annotation/renameProvider.ts
//
// カラープロバイダーのトリガー条件（colorProvider.ts より）:
//   - 行に「@default」と「#」の両方が含まれていること
//   - 行がアノテーションブロック内（/*: または /*~struct~）にあること
//   - 16進カラーのマッチ: #rgb または #rrggbb（HEX_COLOR_RE）
//
// リネームプロバイダーの動作（renameProvider.ts より）:
//   - カーソルが @param または @arg の名前トークン上にあること
//   - リネーム対象: @param/@arg の値、同ブロック内の @parent 参照、
//     およびアノテーションブロック以降のコード内の
//     parameters["name"] / parameters['name'] / parameters.name
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Color & Rename Test Plugin
 * @author Tester
 *
 * @param textColor
 * @text Text Color
 * @desc The color for display text.
 * @type string
 * @default #ff4488
 *
 * // ------------------------------------------------------------------
 * // テスト 1: @default #ff4488 のカラーピッカー装飾
 * // 手順: 上の「@default #ff4488」行を確認する
 * // 期待結果: 16進値の近くにカラースウォッチ（装飾）が表示される。
 * //           クリックすると VSCode のカラーピッカーが開く。
 * //           色を変更すると16進値がその場で更新される。
 * // 備考: 同じ行に「@default」と「#」の両方が必要（colorProvider.ts）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param bgColor
 * @text Background Color
 * @type string
 * @default #1a2b3c
 *
 * // ------------------------------------------------------------------
 * // テスト 2: 別のカラー値
 * // 期待結果: 上の @default 行に #1a2b3c のカラー装飾が表示される
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param shortColor
 * @text Short Color
 * @type string
 * @default #f0f
 *
 * // ------------------------------------------------------------------
 * // テスト 3: 短縮形の16進カラー（#rgb 形式）
 * // 期待結果: 上の @default 行に #f0f（マゼンタ）のカラー装飾が表示される
 * //           colorProvider.ts は #rgb（3桁）パターンをサポートしている
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param nonColorParam
 * @text Non-Color
 * @type number
 * @default 42
 *
 * // ------------------------------------------------------------------
 * // テスト 4: 非16進数の @default にカラー装飾が出ないこと
 * // 期待結果: 上の「@default 42」にカラースウォッチが表示されないこと（「#」がないため）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param myParameter
 * @text My Parameter
 * @desc A parameter to test renaming.
 * @type string
 * @default hello
 *
 * @param childParam
 * @text Child Param
 * @parent myParameter
 * @type string
 * @default world
 *
 * // ------------------------------------------------------------------
 * // テスト 5: パラメータリネーム（@parent 参照あり）
 * // 手順:
 * //   1. @param の後の「myParameter」にカーソルを置く（右クリックまたは F2）
 * //   2.「名前の変更」を選択する（または F2 を押す）
 * //   3.「renamedParameter」と入力する
 * //   4. Enter を押す
 * // 期待結果:
 * //   - @param myParameter  →  @param renamedParameter
 * //   - @parent myParameter  →  @parent renamedParameter（childParam ブロック内）
 * //   - parameters["myParameter"]  →  parameters["renamedParameter"]（下のコード内）
 * // ソース参照: renameProvider.ts がリネームする対象: タグ値、@parent 参照、parameters["..."]
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * // ------------------------------------------------------------------
 * // テスト 6: @param/@arg 名以外ではリネームが利用不可
 * // 手順: 下のコード内の parameters["textColor"] の「textColor」で F2 を押す
 * // 期待結果: リネームが有効にならないこと（@param/@arg 行からのみ動作する）
 * //   エラー: "Cannot rename here -- cursor must be on a @param or @arg name."
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @help
 * Test plugin for color picker and rename features.
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "ManualTest_ColorRename";
  const parameters = PluginManager.parameters(PLUGIN_NAME);

  // @param myParameter をリネームすると以下の参照も更新されること:
  const myParam = parameters["myParameter"] || "default";
  const textColor = parameters["textColor"] || "#ffffff";
  const bgColor = parameters["bgColor"] || "#000000";

  console.log(myParam, textColor, bgColor);
})();
