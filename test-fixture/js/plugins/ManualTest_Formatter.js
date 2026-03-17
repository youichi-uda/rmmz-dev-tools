// ============================================================================
// 手動テスト: アノテーションフォーマッター
// ============================================================================
//
// テスト方法:
// 1. VSCode でこのファイルを開く
// 2. 下のアノテーションブロック内にカーソルを置く
// 3. コマンドパレット（Ctrl+Shift+P）→「RMMZ: Format Annotation Block」を実行する
//    （コマンドID: rmmz.formatAnnotation）
// 4. ブロックが一貫してフォーマットされることを確認する
//
// ソース参照: src/annotation/formatter.ts
//
// フォーマッターの動作（ソースより）:
//   - 行をタググループ（タグ + 継続行）に解析する
//   - メタデータタグを正規の順序にソートする:
//     @target, @plugindesc, @author, @url, @base, @orderAfter, @orderBefore
//   - ブロックタグ（@param, @command, @arg）と不明なタグは中間に配置し、
//     元の順序を維持する
//   - @help は最後に配置される
//   - 各タグ行のフォーマット: " * @tag value"
//   - 継続行のフォーマット: " * text" または空行は " *"
//   - 末尾の空白を除去する
// ============================================================================

/*:
 * @target MZ
 * @plugindesc Badly Formatted Plugin
 * @author Sloppy Developer
 * @url https://example.com/sloppy
 *
 * @param speed
 * @text Speed Setting
 * @desc How fast things go.
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @command doStuff
 * @text Do Stuff
 * @desc Does things.
 *
 * @arg target
 * @text Target
 * @type actor
 *
 * @help
 * This plugin is intentionally badly formatted
 * to test the formatter.
 */

// ------------------------------------------------------------------
// テスト 1: アノテーションブロックのフォーマット
// 手順: 上の /*: ブロック内にカーソルを置き、
//        「RMMZ: Format Annotation Block」（rmmz.formatAnnotation）を実行する
// 期待結果:
//   - すべての行が " * @tag value" パターンで統一的にフォーマットされる
//   - " *" の後にスペース1つ、「@tag」の後にスペース1つ、その後に値
//   - 末尾の空白が除去される
//   - メタデータタグの順序が維持される（target, plugindesc, author, url は
//     正規の順序: target → plugindesc → author → url で表示される）
//   - ブロックタグ（@param, @command）は元の相対順序を維持する
//   - @help は最後に表示される
// 結果: [ PASS / FAIL ]
// ------------------------------------------------------------------
//
// テスト 2: フォーマットで内容の値が変更されないこと
// 期待結果: タグの値がそのまま維持される:
//   "MZ", "Badly Formatted Plugin", "Sloppy Developer", "https://example.com/sloppy"
//   空白・フォーマットの変更のみ
// 結果: [ PASS / FAIL ]
// ------------------------------------------------------------------
//
// テスト 3: アノテーションブロック外でのカーソル
// 手順: ここ（コードセクション）にカーソルを置き、「RMMZ: Format Annotation Block」を実行する
// 期待結果: メッセージ: "Cursor is not inside an RMMZ annotation block."
// 結果: [ PASS / FAIL ]
// ------------------------------------------------------------------

(() => {
  "use strict";
})();
