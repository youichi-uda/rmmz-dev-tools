# Demo: Debugger setVariable

## Concept

DebugDemo.js プラグインを使い、ブレークポイントで停止中に
Variables パネルから値を直接書き換え、ゲームに即反映されることを見せる。

## Test Project

`rpgmaker-mcp-private/test-projects/test-mz`

- DebugDemo.js が有効であること（プラグインマネージャで ON）
- BonusGold パラメータはデフォルト 100 のまま

## Scene 1: Menu Gold — 所持金をリアルタイム書き換え

### 1-1. ブレークポイント設置

- VS Code で `js/plugins/DebugDemo.js` を開く
- **102行目** `const before = $gameParty.gold();` にブレークポイント設置
- 赤い丸が付くのを映す

### 1-2. デバッガー起動

- コマンドパレット → `RMMZ: Setup Debugger`
- F5 でテストプレイ起動
- タイトル画面 → ニューゲーム → マップ表示まで待つ

### 1-3. ブレークポイントで停止

- ゲーム画面で **Esc キー**（メニューを開く）
- → `onMenuOpen()` のブレークポイントで VS Code に制御が戻る
- 黄色いハイライト行を映す

### 1-4. ステップ実行で gainGold を通過

- Variables パネルを開く
- F10（Step Over）で 1行ずつ進める
  - 102行目 → `before = 0` がローカル変数に出る
  - 103行目 `$gameParty.gainGold(bonusGold)` を **通過させる**（F10）
- ここで `$gameParty._gold` が `100` になっている

### 1-5. $gameParty._gold を書き換え（見せ場）

- Variables パネルの Scope 内で `$gameParty` → `_gold` を探す
- **`_gold` をダブルクリック**
- `100` → **`99999`** に書き換えて Enter
- → 値が即座に 99999 に変わるのを映す

### 1-6. 結果確認

- F5（Continue）で実行再開
- ゲームのメニュー画面に切り替わる
- **所持金が 99999 G** と表示されている


## Filming Tips

- Variables パネルのダブルクリック → 入力 → Enter の操作はズームで撮る
- 尺: 45-60秒
- Before/After を入れるなら冒頭に旧バージョンの `Unrecognized request: setVariable` エラーを 3秒映す

## テロップ案

```
① DebugDemo.js にブレークポイント設置
② Esc でメニューを開く → ブレークポイントで停止
③ ステップ実行で gainGold を通過
④ $gameParty._gold を 100 → 99999 に書き換え
⑤ 再開 → メニュー画面に 99999 G！再起動不要！
```
