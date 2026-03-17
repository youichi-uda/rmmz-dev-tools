// ============================================================================
// 手動テスト: スマートタグ補完 & @type 補完
// ============================================================================
//
// テスト方法:
// 1. RMMZ Dev Tools が有効な状態で VSCode でこのファイルを開く
// 2. 各テストポイントの手順に従う
// 3. 各テストに PASS / FAIL を記録する
//
// 前提条件: 拡張機能が有効であること（ワークスペースに js/plugins/ と data/ が存在する）
//
// ソース参照: src/annotation/completionProvider.ts
//              src/annotation/tags.ts（タグと型の定義）
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Manual Completion Test Plugin
 * @author Tester
 *
 * // ------------------------------------------------------------------
 * // テスト 1: トップレベルタグの補完
 * // 手順: 下の空行にカーソルを置き、「@」を入力する
 * // 期待結果: 補完リストにトップレベルタグが表示される:
 * //   @target, @plugindesc, @author, @help, @url, @base, @orderAfter,
 * //   @orderBefore, @requiredAssets, @param, @command, @noteParam,
 * //   @noteDir, @noteType, @noteData
 * //   各項目に説明が表示されること（例: @target -- "Target engine (MZ)"）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * @target MZ
 *
 * @param testParam
 * @text Test Parameter
 * @desc A test parameter
 * // ------------------------------------------------------------------
 * // テスト 2: @param スコープのタグ補完
 * // 手順: 下の空行にカーソルを置き、「@」を入力する
 * // 期待結果: 補完リストに PARAM サブタグが表示される:
 * //   @text, @desc, @type, @default, @parent, @min, @max, @decimals,
 * //   @dir, @require, @on, @off, @option, @value
 * //   先頭に @param, @command, @plugindesc が表示されないこと
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * 
 *
 * // ------------------------------------------------------------------
 * // テスト 3: @type 値の補完
 * // 手順: 下の空行にカーソルを置き、「@type 」（スペース付き）を入力する
 * // 期待結果: 補完リストにすべての型値が表示される:
 * //   基本型: string, multiline_string, number, boolean, note, file,
 * //           select, combo
 * //   データベース型: actor, class, skill, item, weapon, armor, enemy, troop,
 * //                    state, animation, tileset, common_event, switch, variable
 * //   その他: struct<> テンプレート
 * //   各項目に説明が表示されること（例: number -- "Numeric spinner input"）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * @type struct<TypeName>
 *
 * @command testCommand
 * @text Test Command
 * @desc A test command
 * // ------------------------------------------------------------------
 * // テスト 4: @command スコープのタグ補完
 * // 手順: 下の空行にカーソルを置き、「@」を入力する
 * // 期待結果: 補完リストに COMMAND サブタグと PARAM サブタグが表示される:
 * //   @text, @desc, @arg、および @type, @default, @min, @max 等
 * //   （completionProvider.ts の COMMAND_TAGS + PARAM_TAGS）
 * //   @plugindesc, @help, @base が表示されないこと
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * 
 *
 * @arg testArg
 * @text Test Arg
 * // ------------------------------------------------------------------
 * // テスト 5: @arg スコープのタグ補完
 * // 手順: 下の空行にカーソルを置き、「@」を入力する
 * // 期待結果: 補完リストに @param サブタグが表示される（ARG_TAGS = PARAM_TAGS）:
 * //   @text, @desc, @type, @default, @parent, @min, @max, @decimals,
 * //   @dir, @require, @on, @off, @option, @value
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * @dir 
 *
 * // ------------------------------------------------------------------
 * // テスト 6: @type 値の部分補完
 * // 手順: 下の空行にカーソルを置き、「@type nu」を入力する
 * // 期待結果: 補完リストが "number" のみにフィルタリングされる（"nu" で始まる唯一の候補）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 * @type number
 *
 * // ------------------------------------------------------------------
 * // テスト 7: アノテーションブロック外での補完
 * // 手順: 閉じ */ の後の空行（下のコードセクション）にカーソルを置き、「@」を入力する
 * // 期待結果: RMMZ アノテーション補完が表示されないこと
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @help
 * This is a test plugin for manual completion testing.
 */

// テスト 7 エリア: ここで「@」を入力する -- RMMZ 補完が出ないこと

// プラグインコードは不要
