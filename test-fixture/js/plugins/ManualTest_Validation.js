// ============================================================================
// 手動テスト: アノテーションバリデーション & 多言語同期
// ============================================================================
//
// テスト方法:
// 1. RMMZ Dev Tools が有効な状態で VSCode でこのファイルを開く
// 2. 問題パネル（Ctrl+Shift+M）で診断を確認する
// 3. 各期待される診断が正しい位置に表示されることを確認する
//
// ソース参照:
//   - バリデーション: src/annotation/validator.ts
//   - 多言語同期:     src/annotation/langSync.ts
//   - タグ定義:       src/annotation/tags.ts
// ============================================================================

/*:
 * @plugindesc Validation Test Plugin
 * @author Tester
 *
 * // ------------------------------------------------------------------
 * // テスト 1: @target の欠落
 * // 期待結果: /*: の開始行に情報診断が表示される:
 * //   "@target MZ is recommended"
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param goodParam
 * @text Good Parameter
 * @type number
 * @min 0
 * @max 100
 * @default 50
 *
 * // ------------------------------------------------------------------
 * // テスト 2: 正しいサブタグを持つ有効な @param に警告が出ないこと
 * // 期待結果: 上記 @param goodParam ブロックに診断が出ないこと
 * //           （@min, @max は "number" 型固有のタグで、ここでは妥当）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param badTypeParam
 * @text Bad Type
 * @type nubmer
 * // ------------------------------------------------------------------
 * // テスト 3: @type 値のタイプミス
 * // 期待結果: "nubmer" に警告診断が表示される:
 * //   'Unknown @type: "nubmer"'
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param wrongScopeDemo
 * @text Wrong Scope
 * @type string
 * @min 0
 * // ------------------------------------------------------------------
 * // テスト 4: @type string に @min を使用（型固有の不一致）
 * // 期待結果: @min に Hint 診断が表示される:
 * //   '@min is typically used with @type number, not "string"'
 * //   ※ Hint は Warning の波線ではなく「...」3点ドットで表示される
 * //   ※ 短いタグ名では3点ドットが1つしか見えないため注意
 * //   確認方法: 問題パネル（Ctrl+Shift+M）で severity=Hint を確認
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @command testCmd
 * @text Test Command
 * @desc Does something
 * @default 5
 * // ------------------------------------------------------------------
 * // テスト 5: @command スコープ内（@arg の前）の @default
 * // 期待結果: @default に警告診断が表示される:
 * //   '@default is not valid inside @command (before @arg)'
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @arg cmdArg1
 * @text Argument 1
 * @type number
 * @default 1
 *
 * @unknownTagHere
 * // ------------------------------------------------------------------
 * // テスト 6: 不明なアノテーションタグ
 * // 期待結果: @unknownTagHere に警告診断が表示される:
 * //   'Unknown annotation tag: @unknownTagHere'
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @help
 * // ------------------------------------------------------------------
 * // テスト 7: @help によるスコープのリセット
 * // 期待結果: @help 自体に警告が出ないこと。
 * //   @help は TOP_LEVEL_TAG であるため、検出時にスコープが
 * //   validator.ts（103-106行）で 'top' にリセットされる。
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * This is help text.
 */

/*:ja
 * @plugindesc バリデーションテスト
 * @author テスター
 *
 * // ------------------------------------------------------------------
 * // テスト 8: 多言語同期 -- :ja ブロックに不足している params/commands
 * // 期待結果: この /*:ja の開始行に警告が表示される:
 * //   "Locale /*:ja is missing @param goodParam (present in primary block)"
 * //   "Locale /*:ja is missing @param badTypeParam (present in primary block)"
 * //   "Locale /*:ja is missing @param wrongScopeDemo (present in primary block)"
 * //   "Locale /*:ja is missing @command testCmd (present in primary block)"
 * // ソース参照: src/annotation/langSync.ts compareStructures()
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @help
 * テスト用プラグインです。
 */

(() => {
  "use strict";
  // 実装は不要
})();
