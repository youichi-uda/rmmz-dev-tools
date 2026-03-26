// ============================================================================
// 手動テスト: 型定義修正の確認（Issue #12 対応）
// ============================================================================
//
// テスト方法:
//   1. test-fixture/ を VS Code のワークスペースとして開く
//   2. このファイルを開く
//   3. 各テスト項目のコードにエラー（赤い波線）がないことを確認する
//   4. 型チェック: ターミナルで npx tsc --noEmit を実行してエラー 0 を確認
//
// 前提条件:
//   - ts/typings/rmmz/ に最新の .d.ts ファイルがコピーされていること
//     (拡張の "RMMZ: Setup TypeScript" コマンドでも可)
//
// ソース参照:
//   - typings/rmmz/rmmz_objects.d.ts
//   - typings/rmmz/rmmz_managers.d.ts
//   - typings/rmmz/rmmz_windows.d.ts
//   - typings/rmmz/rmmz_sprites.d.ts
//
// ============================================================================

// === テスト 1: Game_Unit のメソッド戻り値の型 =============================
// 期待結果: aliveMembers() が (Game_Actor | Game_Enemy)[] を返す
//           → .isActor() で型ガードした後に .actorId() が使える
//           → エラーなし
// 結果: [ PASS / FAIL ]
// =========================================================================
function test1_gameUnitReturnTypes(): void {
  const party = new Game_Party();
  const members = party.aliveMembers(); // (Game_Actor | Game_Enemy)[]

  for (const member of members) {
    // name() が使えること（以前は Game_Battler に name() がなくエラーだった）
    const name: string = member.name();
    console.log(name);

    // 型ガードで Game_Actor に絞り込めること
    if (member.isActor()) {
      const actorId: number = (member as Game_Actor).actorId();
      console.log(actorId);
    }
  }

  // randomTarget() が Game_Actor | Game_Enemy | null を返すこと
  const target = party.randomTarget();
  if (target) {
    const targetName: string = target.name();
    console.log(targetName);
  }

  // smoothTarget() が Game_Actor | Game_Enemy を返すこと
  const smooth = party.smoothTarget(0);
  const smoothName: string = smooth.name();
  console.log(smoothName);

  // deadMembers(), movableMembers() も同様
  const dead = party.deadMembers();
  const movable = party.movableMembers();
  if (dead.length > 0) console.log(dead[0].name());
  if (movable.length > 0) console.log(movable[0].name());
}

// === テスト 2: Game_Action の subject/target 型 ===========================
// 期待結果: subject() が Game_Actor | Game_Enemy を返す
//           → .name() が直接呼べる（エラーなし）
// 結果: [ PASS / FAIL ]
// =========================================================================
function test2_gameActionTypes(): void {
  const actor = new Game_Actor(1);
  const action = new Game_Action(actor);

  // subject() の戻り値で .name() が使えること
  const subject = action.subject();
  const subjectName: string = subject.name();
  console.log(subjectName);

  // makeTargets() が (Game_Actor | Game_Enemy)[] を返すこと
  const targets = action.makeTargets();
  for (const t of targets) {
    const tName: string = t.name();
    console.log(tName);
  }
}

// === テスト 3: Game_Action のコンストラクタ引数 ===========================
// 期待結果: Game_Actor も Game_Enemy もコンストラクタに渡せること
// 結果: [ PASS / FAIL ]
// =========================================================================
function test3_gameActionConstructor(): void {
  const actor = new Game_Actor(1);
  const enemy = new Game_Enemy(1, 0, 0);

  // 両方渡せること
  const actionA = new Game_Action(actor);
  const actionE = new Game_Action(enemy);

  // setSubject も同様
  actionA.setSubject(enemy);
  actionE.setSubject(actor);

  console.log(actionA, actionE);
}

// === テスト 4: BattleManager メソッドの引数型 =============================
// 期待結果: BattleManager のメソッドに Game_Actor / Game_Enemy を渡せる
//           戻り値で .name() が使えること
// 結果: [ PASS / FAIL ]
// =========================================================================
function test4_battleManagerTypes(): void {
  const next = BattleManager.getNextSubject();
  if (next) {
    // Game_Actor | Game_Enemy | null → null チェック後に .name() が使える
    const name: string = next.name();
    console.log(name);
  }

  const allMembers = BattleManager.allBattleMembers();
  for (const m of allMembers) {
    // (Game_Actor | Game_Enemy)[] → .name() が使える
    console.log(m.name());
  }
}

// === テスト 5: Game_Battler.initialize が ...args を受け付ける ===========
// 期待結果: Game_Enemy(enemyId, x, y) や Game_Actor(actorId) の
//           initialize が親クラスのシグネチャと矛盾しないこと
// 結果: [ PASS / FAIL ]
// =========================================================================
function test5_initializeSignatures(): void {
  // Game_Actor.initialize(actorId) が呼べること
  const actor = new Game_Actor(1);
  console.log(actor);

  // Game_Enemy.initialize(enemyId, x, y) が呼べること
  const enemy = new Game_Enemy(1, 100, 200);
  console.log(enemy);

  // Game_Event.initialize(mapId, eventId) が呼べること
  const event = new Game_Event(1, 1);
  console.log(event);

  // Game_Follower.initialize(memberIndex) が呼べること
  const follower = new Game_Follower(0);
  console.log(follower);

  // Game_Vehicle.initialize(type) が呼べること
  const vehicle = new Game_Vehicle("boat");
  console.log(vehicle);
}

// === テスト 6: Window_Selectable.drawItem が ...args を受け付ける ========
// 期待結果: サブクラスで異なる引数でオーバーライドしてもエラーにならない
// 結果: [ PASS / FAIL ]
// =========================================================================
function test6_windowSelectableDrawItem(): void {
  // Window_Selectable.drawItem は ...args: any[] なので自由に呼べる
  class MyWindow extends Window_Selectable {
    // index のみ（通常パターン）
    drawItem(index: number): void {
      console.log(index);
    }
  }

  class MyEquipWindow extends Window_Selectable {
    // x, y, paramId パターン（Window_EquipStatus と同じ）
    drawItem(x: number, y: number, paramId: number): void {
      console.log(x, y, paramId);
    }
  }

  const w1 = new MyWindow(new Rectangle(0, 0, 100, 100));
  const w2 = new MyEquipWindow(new Rectangle(0, 0, 100, 100));
  console.log(w1, w2);
}

// === テスト 7: Game_Temp のバトラー型 ====================================
// 期待結果: touchTarget() が Game_Actor | Game_Enemy | null を返すこと
// 結果: [ PASS / FAIL ]
// =========================================================================
function test7_gameTempTypes(): void {
  const actor = new Game_Actor(1);
  $gameTemp.setTouchState(actor, "click");

  const target = $gameTemp.touchTarget();
  if (target) {
    const name: string = target.name();
    console.log(name);
  }
}

// === テスト 8: Sprite_Battler の型 =======================================
// 期待結果: Sprite_Battler._battler が Game_Actor | Game_Enemy | null であること
//           setBattler に Game_Actor / Game_Enemy を渡せること
// 結果: [ PASS / FAIL ]
// =========================================================================
function test8_spriteBattlerTypes(): void {
  const actor = new Game_Actor(1);
  const sprite = new Sprite_Battler(actor);

  if (sprite._battler) {
    const name: string = sprite._battler.name();
    console.log(name);
  }

  const enemy = new Game_Enemy(1, 0, 0);
  sprite.setBattler(enemy);

  if (sprite._battler) {
    console.log(sprite._battler.name());
  }
}

// === テスト 9: Game_Interpreter.iterateBattler コールバック型 =============
// 期待結果: コールバック引数が Game_Actor | Game_Enemy であること
//           → .name() が使えること
// 結果: [ PASS / FAIL ]
// =========================================================================
function test9_interpreterBattlerCallback(): void {
  const interpreter = new Game_Interpreter();
  interpreter.iterateBattler(0, 1, (battler) => {
    // battler は Game_Actor | Game_Enemy
    const name: string = battler.name();
    console.log(name);
  });
}

// === テスト 10: Game_Battler を基底型として使えること =====================
// 期待結果: Game_Actor | Game_Enemy は Game_Battler に代入可能であること
//           （後方互換性の確認）
// 結果: [ PASS / FAIL ]
// =========================================================================
function test10_backwardCompatibility(): void {
  const actor = new Game_Actor(1);
  const enemy = new Game_Enemy(1, 0, 0);

  // Game_Actor / Game_Enemy は Game_Battler のサブクラスなので代入可能
  const battler1: Game_Battler = actor;
  const battler2: Game_Battler = enemy;

  // Game_Battler 自体のメソッドは引き続き使える
  battler1.clearActions();
  battler2.requestMotion("walk");

  console.log(battler1, battler2);
}

// === テスト 11: StorageManager が DOM と衝突しないこと (Issue #13) ========
// 期待結果: RMMZ_StorageManager のメソッドが使えること
//           DOM の StorageManager インターフェースと混同されないこと
//           ※ DOM と名前衝突するため、TS コードでは RMMZ_StorageManager を使う
// 結果: [ PASS / FAIL ]
// =========================================================================
function test11_storageManagerNoDomConflict(): void {
  // RMMZ_StorageManager の直接利用（DOM 衝突を回避）
  const isLocal: boolean = RMMZ_StorageManager.isLocalMode();
  console.log(isLocal);

  // ファイル存在チェック
  const exists: boolean = RMMZ_StorageManager.exists("file1");
  console.log(exists);

  // 非同期メソッド
  const promise: Promise<void> = RMMZ_StorageManager.saveObject("save1", {});
  console.log(promise);

  // fs系メソッド
  const dir: string = RMMZ_StorageManager.fileDirectoryPath();
  console.log(dir);
}

// === テスト 12: Scene_Skill._itemWindow の型が矛盾しないこと (Issue #14) ==
// 期待結果: Scene_Skill が Scene_ItemBase を正しく拡張できること
//           _itemWindow が Window_SkillList として使えること
// 結果: [ PASS / FAIL ]
// =========================================================================
function test12_sceneSkillItemWindow(): void {
  const scene = new Scene_Skill();

  // Scene_Skill._itemWindow は Window_SkillList
  const skillWindow: Window_SkillList = scene._itemWindow;
  console.log(skillWindow);

  // Scene_Item._itemWindow は Window_ItemList
  const itemScene = new Scene_Item();
  const itemWindow: Window_ItemList = itemScene._itemWindow;
  console.log(itemWindow);

  // Scene_ItemBase として参照しても型エラーにならないこと
  const base: Scene_ItemBase = scene;
  const baseWindow: Window_Selectable = base._itemWindow;
  console.log(baseWindow);
}

// =========================================================================
// 全テスト終了
// npx tsc --noEmit でエラー 0 であれば全 PASS
// =========================================================================
