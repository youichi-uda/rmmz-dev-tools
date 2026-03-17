// ============================================================================
// 手動テスト: ホバードキュメント & データホバープレビュー
// ============================================================================
//
// テスト方法:
// 1. VSCode でこのファイルを開く
// 2. 指定された要素にマウスをホバーする
// 3. ホバーツールチップに期待される内容が表示されることを確認する
//
// ソース参照:
//   - タグホバー:     src/annotation/hoverProvider.ts (TAG_DESCRIPTIONS)
//   - 型ホバー:       src/annotation/hoverProvider.ts (TYPE_DESCRIPTIONS)
//   - データホバー:   src/datalink/hover.ts (DATA_GLOBALS, SWITCH_PATTERN, VARIABLE_PATTERN)
//   - 数式ホバー:     src/datalink/formulaEvaluator.ts (STRING_LITERAL_PATTERN)
//
// データ依存関係 (test-fixture/data/):
//   System.json:
//     switches = ["", "Main Switch", "Debug Mode", "Boss Defeated"]
//     variables = ["", "Player Score", "Enemy Count", "Current Chapter"]
//   Actors.json:
//     [null, {id:1, name:"Harold", classId:1, initialLevel:1, maxLevel:99, ...}]
//   Items.json:
//     [null, {id:1, name:"Potion", description:"Restores 500 HP...", price:50, consumable:true, ...}]
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Hover Test Plugin
 * @author Tester
 *
 * // ------------------------------------------------------------------
 * // テスト 1: @target タグのホバー
 * // 手順: 上の @target 行の「@target」にマウスをホバーする
 * // 期待結果: ツールチップ: "**@target** -- Target engine (MZ)"
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * // ------------------------------------------------------------------
 * // テスト 2: @plugindesc タグのホバー
 * // 手順: 上の「@plugindesc」にマウスをホバーする
 * // 期待結果: ツールチップ: "**@plugindesc** -- Plugin title shown in Plugin Manager"
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param speed
 * @text Speed
 * @type number
 * // ------------------------------------------------------------------
 * // テスト 3: @type 値 "number" のホバー
 * // 手順: 上の @type 行の「number」にマウスをホバーする
 * // 期待結果: ツールチップ: "**number** -- Numeric spinner input"
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @param items
 * @text Items
 * @type item[]
 * // ------------------------------------------------------------------
 * // テスト 4: 配列型 "item[]" のホバー
 * // 手順: 上の「item[]」にマウスをホバーする
 * // 期待結果: ツールチップ: "**item[]** -- Item selector (from database)"
 * //           さらに: "*Array type: stored as JSON array string*"
 * //   （hoverProvider.ts が [] を除去してベース型を取得し、配列の注記を追加する）
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * // ------------------------------------------------------------------
 * // テスト 5: @param タグ自体のホバー
 * // 手順: 上の「@param speed」行の「@param」にマウスをホバーする
 * // 期待結果: ツールチップ: "**@param** -- Plugin parameter definition"
 * // 結果: [ PASS / FAIL ]
 * // ------------------------------------------------------------------
 *
 * @help
 * Hover test plugin.
 */

(() => {
  "use strict";

  // ------------------------------------------------------------------
  // テスト 6: データホバー -- $dataActors[1]
  // 手順: 下の「$dataActors[1]」にマウスをホバーする
  // 期待結果: ツールチップに以下が表示される:
  //   **$dataActors[1]**
  //   - **name:** `"Harold"`
  //   - **nickname:** `""`
  //   - **classId:** `1`
  //   - **initialLevel:** `1`
  //   - **maxLevel:** `99`
  //   （datalink/hover.ts の DATA_GLOBALS からのステータスリスト）
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const hero = $dataActors[1];

  // ------------------------------------------------------------------
  // テスト 7: データホバー -- $dataItems[1]
  // 手順: 下の「$dataItems[1]」にマウスをホバーする
  // 期待結果: ツールチップに以下が表示される:
  //   **$dataItems[1]**
  //   - **name:** `"Potion"`
  //   - **description:** `"Restores 500 HP to one ally."`
  //   - **price:** `50`
  //   - **consumable:** `true`
  //   （ステータス: name, description, price, consumable）
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const potion = $dataItems[1];

  // ------------------------------------------------------------------
  // テスト 8: スイッチ名の解決
  // 手順: 下の「$gameSwitches.value(1)」にマウスをホバーする
  // 期待結果: ツールチップ: **Switch #1** -- "Main Switch"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  if ($gameSwitches.value(1)) {
    console.log("Main switch is ON");
  }

  // ------------------------------------------------------------------
  // テスト 9: スイッチ名の解決 -- ID 2
  // 手順: 下の「$gameSwitches.value(2)」にマウスをホバーする
  // 期待結果: ツールチップ: **Switch #2** -- "Debug Mode"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const debugMode = $gameSwitches.value(2);

  // ------------------------------------------------------------------
  // テスト 10: 変数名の解決
  // 手順: 下の「$gameVariables.value(1)」にマウスをホバーする
  // 期待結果: ツールチップ: **Variable #1** -- "Player Score"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const score = $gameVariables.value(1);

  // ------------------------------------------------------------------
  // テスト 11: 変数の setValue
  // 手順: 下の「$gameVariables.setValue(2」にマウスをホバーする
  // 期待結果: ツールチップ: **Variable #2** -- "Enemy Count"
  //   （VARIABLE_PATTERN は .value() と .setValue() の両方にマッチする）
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  $gameVariables.setValue(2, 10);

  // ------------------------------------------------------------------
  // テスト 12: データホバー -- 存在しないインデックス
  // 手順: 下の「$dataActors[999]」にマウスをホバーする
  // 期待結果: ツールチップ: **$dataActors[999]** -- not found in `Actors.json`
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const nobody = $dataActors[999];

  // ------------------------------------------------------------------
  // テスト 13: 戦闘ダメージ計算式の評価
  // 手順: 下の文字列 "a.atk * 4 - b.def * 2" にマウスをホバーする
  // 期待結果: ツールチップに「MZ Damage Formula Preview」が表示される
  //   データファイルからのアクターパラメータ (a) とエネミーパラメータ (b)、
  //   および計算結果が表示される。
  //   Actor#1 のパラメータを使用: atk=33, def=22（Actors.json より）
  //   エネミーパラメータは Enemies.json から（存在しない場合はデフォルト値）
  //   トリガーには文字列リテラル内に数式がある必要がある。
  // 備考: formulaEvaluator.ts の STRING_LITERAL_PATTERN は
  //        クォートされた文字列内の a.xxx または b.xxx を必要とする。
  // 結果: [ PASS / FAIL / N/A（Enemies.json がない場合）]
  // ------------------------------------------------------------------
  const formula = "a.atk * 4 - b.def * 2";

  // ------------------------------------------------------------------
  // テスト 14: スイッチ ID 3（Boss Defeated）
  // 手順: 下の「$gameSwitches.setValue(3」にマウスをホバーする
  // 期待結果: ツールチップ: **Switch #3** -- "Boss Defeated"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  $gameSwitches.setValue(3, true);

  // ------------------------------------------------------------------
  // テスト 15: 変数 ID 3（Current Chapter）
  // 手順: 下の「$gameVariables.value(3)」にマウスをホバーする
  // 期待結果: ツールチップ: **Variable #3** -- "Current Chapter"
  // 結果: [ PASS / FAIL ]
  // ------------------------------------------------------------------
  const chapter = $gameVariables.value(3);

  console.log(hero, potion, debugMode, score, nobody, formula, chapter);
})();
