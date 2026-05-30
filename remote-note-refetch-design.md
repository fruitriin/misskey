# リモートノート TTL 再フェッチ 設計書

リモートの絵文字（およびノート差分）が「一度取り込まれると二度と更新されない」問題を、
**ノートを主キーとした TTL 付き遅延再フェッチ**で解消する。

- 対象: `packages/backend`（ActivityPub 取り込み + DB 保存）
- ステータス: 設計（未実装）
- ブランチ: `claude/remote-emoji-refetch-2nbU9`

---

## 1. 大局判断

### 何が問題か

リモート絵文字の情報（画像 URL / ライセンス等）は、**そのリモート絵文字を含むノート・プロフィール・リアクションが新規に届いたときにしか更新されない**。
既存ノートを表示しても再取得は走らないため、リモート側で絵文字が差し替えられてもローカルには古い情報が残り続ける。能動的な再取得手段は存在しない。

### どう解くか

絵文字単体を AP で取りに行くことは**原理的にできない**（後述 2-3）。
絵文字情報は常にノート/プロフィールの `tag` に埋め込まれて配信されるため、

> **「古くなったリモートノートを、参照を契機に再フェッチし、`tag` から絵文字を upsert する」**

という**ノート粒度の再検証**で解く。これは Misskey が既にリモート**ユーザー**に対して実装済みの
「`lastFetchedAt` による 24h TTL 遅延再フェッチ」（後述 2-4）とまったく同じパターンであり、
アーキテクチャ上の前例がある。

### スコープと判断

- **主キー = ノート**（`uri != null` のリモートノート）。
- コアは「**TTL ガード付き再フェッチメソッド 1 本**」。**いつ呼ぶか（実行タイミング）は規定しない** =
  トリガー非依存。自動表示フックは本設計では配線しない。
- 絵文字は**無条件 upsert**（リモート絵文字はめったに変わらず、量はノート単位 TTL で律速されるため、
  条件判定を省いて常に上書きしてよい）。
- 将来 UI に「更新ボタン」を置く場合も、同じコアを `force:false` で呼ぶだけ
  （TTL 内なら無視 / TTL 外なら再フェッチ、が自然に満たされる）。

---

## 2. 調査内容

### 2-1. 絵文字の取り込み・保存の入口

すべて `ApNoteService.extractEmojis()` に集約。呼び出し元は「何かが届いたとき」の 3 経路のみ。

| 経路 | ファイル:行 |
| --- | --- |
| リモートノート受信時 (`note.tag`) | `src/core/activitypub/models/ApNoteService.ts:307` |
| リモートユーザー作成時 (`person.tag`) | `src/core/activitypub/models/ApPersonService.ts:359` |
| リモートユーザー更新時 (`person.tag`) | `src/core/activitypub/models/ApPersonService.ts:512` |
| リアクション(Like)受信時 (`activity.tag`) | `src/core/activitypub/ApInboxService.ts:203` |

### 2-2. DB エンティティ

`src/models/Emoji.ts`
- `@Index(['name', 'host'], { unique: true })` … `name`+`host` で一意（`Emoji.ts:10`）
- `host: string | null` … **null=ローカル / 非null=リモート**（`Emoji.ts:31`）
- 主なカラム: `originalUrl` / `publicUrl` / `uri`(= AP `tag.id`) / `updatedAt` / `license`

`src/models/Note.ts`
- リモートノートは `uri`（`Note.ts:143`, unique index）を持つ。
- **`updatedAt` / `fetchedAt` / `lastFetchedAt` カラムは存在しない**（再フェッチ判定の足場が無い）。

### 2-3. 既存の更新判定ロジック（絵文字）

`src/core/activitypub/models/ApNoteService.ts:383-441` `extractEmojis()`。
既存絵文字は以下 4 条件のいずれかが真のときのみ update（`ApNoteService.ts:400-405`）:

```ts
if ((exists.updatedAt == null)                 // ① updatedAt 未設定
  || (tag.id != null && exists.uri == null)    // ② 初めて uri 取得
  || (new Date(tag.updated) > exists.updatedAt)// ③ リモートの updated が新しい
  || (tag.icon.url !== exists.originalUrl)) {  // ④ 画像 URL が変わった
```

無ければ `insertOne`（`ApNoteService.ts:428`）。
→ いずれにせよ**新規ノート等が届かない限りこの関数自体が呼ばれない**のが問題の本質。

### 2-4. 前例: リモートユーザーの TTL 再フェッチ

`src/core/RemoteUserResolveService.ts:98`（および `ApInboxService.ts:132`）:

```ts
// ユーザー情報が古い場合は、WebFingerからやりなおして返す
if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
  // 繋がらないインスタンスに何回も試行するのを防ぐ ため 試行前にも更新する
  await this.usersRepository.update(user.id, { lastFetchedAt: new Date() });
  // → resolveSelf / updatePerson → extractEmojis(person.tag) 再実行
}
```

- `MiUser.lastFetchedAt`（`src/models/User.ts:26`）に最終取得時刻、**24h** 超過で再フェッチ。
- 試行**前**に `lastFetchedAt` を先行更新 → 死活不明な鯖への連打・同時多発を抑止。
- 本設計はこれをノートへ写像する。

### 2-5. 既存の再フェッチ手段は無いことの確認

- `ApNoteService.resolveNote()`（`ApNoteService.ts:352`）は `if (exist) return exist;`（`ApNoteService.ts:366`）で即返し、**既存ノートを再取得しない**。
- `ApInboxService.update()`（`ApInboxService.ts:780-804`）は `Update` activity を **Person / Question のみ**処理。**`Update(Note)` ハンドラは無い**（ノート本体の更新ロジックが存在しない）。
- 表示経路 `notes/show`（`src/server/api/endpoints/notes/show.ts:64`）は `getterService.getNoteWithRelations`（DB 読み）→ `pack` で返すだけ。**表示時に AP を叩かない**。
- 絵文字単体の AP オブジェクト URL は dereference 不可: `ApRendererService.renderEmoji()`（`ApRendererService.ts:180`）は `id: ${config.url}/emojis/${name}` を付与するが、`/emojis/:name` を AP オブジェクトとして配信するルートは**存在しない**（確認済み）。→ 絵文字は必ず親（ノート/プロフィール）の `tag` 経由でしか取得できない。

---

## 3. 方針

### 3-1. 設計原則

1. **ノート粒度**の TTL 再検証（主キー = ノート）。
2. コア = **TTL ガード付き再フェッチメソッド 1 本**。トリガー非依存（呼ぶ場所を規定しない）。
3. TTL ガードの意味:
   - `lastFetchedAt` が **TTL 内 → 何もしない（無視）**
   - `lastFetchedAt` が **null / TTL 超過 → 再フェッチ＆更新**
4. 絵文字は **`force` で無条件 upsert**（4 条件をスキップ）。既存呼び出しは挙動不変。
5. 試行前に `lastFetchedAt` 先行更新 + `acquireApObjectLock` で連打・重複を抑止（ユーザー版と同作法）。
6. 再フェッチ・更新は副作用が大きいので**バックグラウンド前提**（同期フェッチ禁止）。
7. 差分反映スコープは**初版は絵文字のみ**。本文/CW/添付は拡張余地として口だけ用意。

### 3-2. 要件との対応

| 要件 | 実現箇所 |
| --- | --- |
| TTL 付き | `NOTE_REFETCH_TTL` 定数 + コアのガード |
| 実行タイミング指定なし | コア `updateNoteIfStale` は呼び出し元を規定しない。自動フックは未配線 |
| 将来ボタン: TTL 外なら再フェッチ / TTL 内なら無視 | ボタンは `updateNoteIfStale(force:false)` を呼ぶだけ。分岐はガードに内包 |

---

## 4. どのファイルのどこをどう直すか

> 凡例: 【新規】= 新規追加 / 【改修】= 既存改修 / 【任意】= 拡張余地（初版で必須ではない）

### 4-1. 【改修】`src/models/Note.ts` — 最終取得時刻カラム追加

`MiUser.lastFetchedAt`（`User.ts:26`）と対称に、`MiNote` へ追加する。

```ts
// 既存カラム群に追記（例: uri 付近）
@Column('timestamp with time zone', { nullable: true })
public lastFetchedAt: Date | null;
```

### 4-2. 【新規】migration — `lastFetchedAt` 追加

`packages/backend/migration/{unixMs}-AddNoteLastFetchedAt.js`

- `node -e "console.log(Date.now())"` で UNIX ms を採番、ファイル名に使用。
- クラス名は `AddNoteLastFetchedAt{13桁ms}`、SPDX ヘッダー付与。
- `up`: `ALTER TABLE "note" ADD "lastFetchedAt" TIMESTAMP WITH TIME ZONE`
- `down`: `ALTER TABLE "note" DROP COLUMN "lastFetchedAt"`
- 生成は `create-migration` skill 推奨。`pnpm --filter backend check-migrations` を通す。

### 4-3. 【改修】`src/core/activitypub/models/ApNoteService.ts` — `extractEmojis` に force

`extractEmojis(tags, host)`（`ApNoteService.ts:383`）のシグネチャに `opts?: { force?: boolean }` を追加し、
既存絵文字の更新判定（`ApNoteService.ts:400-405`）の先頭に `opts?.force ||` を足す。

```ts
public async extractEmojis(tags: IObject | IObject[], host: string, opts?: { force?: boolean }): Promise<MiEmoji[]> {
  ...
  if (exists) {
    if (opts?.force
      || (exists.updatedAt == null)
      || (tag.id != null && exists.uri == null)
      || (new Date(tag.updated) > exists.updatedAt)
      || (tag.icon.url !== exists.originalUrl)) {
      // 既存の update 処理そのまま
    }
    return exists;
  }
  // 既存の insertOne そのまま
}
```

- 既存呼び出し（`ApNoteService.ts:307` / `ApPersonService.ts:359,512` / `ApInboxService.ts:203`）は
  第 3 引数なし = **挙動不変**。再フェッチ経路だけ `{ force: true }`。

### 4-4. 【新規】`src/core/activitypub/models/ApNoteService.ts` — コア `updateNoteIfStale`

TTL ガード付き再フェッチ本体。**トリガー非依存**。

```ts
// 定数（ファイル先頭 or config）
const NOTE_REFETCH_TTL = 1000 * 60 * 60 * 24; // 24h（ユーザー版に合わせる）

@bindThis
public async updateNoteIfStale(
  note: MiNote,
  opts?: { force?: boolean; resolver?: Resolver },
): Promise<MiNote | null> {
  if (note.uri == null) return note;                          // ローカルは対象外
  if (!this.utilityService.isFederationAllowedUri(note.uri)) return note;

  // --- TTL ガード ---
  if (!opts?.force) {
    const fresh = note.lastFetchedAt != null
      && Date.now() - note.lastFetchedAt.getTime() < NOTE_REFETCH_TTL;
    if (fresh) return note;                                   // TTL 内 → 無視
  }

  const unlock = await acquireApObjectLock(this.redisClient, note.uri); // 重複防止
  try {
    // 連打防止: 試行前に先行更新（RemoteUserResolveService.ts:99-102 と同作法）
    await this.notesRepository.update(note.id, { lastFetchedAt: new Date() });

    const resolver = opts?.resolver ?? await this.apResolverService.createResolver();
    const object = await resolver.resolve(note.uri);
    return await this.updateNote(note, object);              // 4-5
  } catch (e) {
    // 取得失敗は握りつぶす（lastFetchedAt 先行更新済みなので連打しない）
    this.logger.debug(`updateNoteIfStale failed: ${e}`);
    return note;
  } finally {
    unlock();
  }
}
```

依存 import の確認（既存利用箇所あり）:
- `acquireApObjectLock` … `resolveNote`（`ApNoteService.ts:362`）で既に使用。
- `notesRepository` … DI 済みか確認、無ければ inject 追加。

### 4-5. 【新規】`src/core/activitypub/models/ApNoteService.ts` — `updateNote`（差分反映）

`Update(Note)` ハンドラが存在しないため新規。**初版は絵文字のみ無条件 upsert**。

```ts
@bindThis
private async updateNote(exist: MiNote, object: IObject): Promise<MiNote> {
  // host は exist 側から取る（actor.host 相当）
  const host = this.utilityService.extractDbHost(exist.uri!);
  // 絵文字を無条件 upsert
  await this.extractEmojis(object.tag ?? [], host, { force: true }).catch(e => {
    this.logger.debug(`updateNote extractEmojis failed: ${e}`);
    return [];
  });

  // 【任意】本文/CW/添付の差分反映はここに追加（初版では入れない）

  // lastFetchedAt は updateNoteIfStale 側で更新済み
  return await this.notesRepository.findOneByOrFail({ id: exist.id });
}
```

補足:
- 既存ノートの emoji 名リスト（`note.emojis`）に追従させたい場合は、ここで `note.emojis` 更新も検討（初版は任意）。
- host 取得は `UtilityService.extractDbHost` 等、リポジトリの既存ユーティリティに合わせる。

### 4-6. 【任意/将来】UI 更新ボタン用エンドポイント

本設計では**配線しない**が、将来像として:

- 新エンドポイント（例 `notes/refetch`、`add-api-endpoint` skill で追加）が
  対象ノートを取得 → `apNoteService.updateNoteIfStale(note, { force: false })` を呼ぶだけ。
- **TTL 内なら無視 / TTL 外なら再フェッチ**という要件はコアのガードでそのまま満たされる
  （ボタン側に分岐ロジック不要）。
- レスポンスで「再フェッチした / TTL 内でスキップした」を返すと UX 上わかりやすい。
- 権限・レート制限は他 `notes/*` に倣う。

### 4-7. エッジケース処理方針

| ケース | 初版の扱い |
| --- | --- |
| 410 Gone / Tombstone | 更新せず `lastFetchedAt` だけ進める（削除追従は将来検討） |
| フェデレーション禁止 / ブロック鯖 | `isFederationAllowedUri` で早期 return |
| ローカルノート (`uri == null`) | 対象外（早期 return） |
| 取得失敗（タイムアウト等） | catch して握りつぶし。先行更新済みで連打しない |

---

## 5. 影響範囲・検証

- **挙動不変**: `extractEmojis` の既存呼び出し（force 無し）はすべて従来通り。
- **新規挙動**: `updateNoteIfStale` を呼ぶ箇所を作らない限り何も起きない（トリガー非依存ゆえ安全に段階導入可能）。
- 検証:
  - `pnpm --filter backend check-migrations`（migration 整合）
  - `pnpm --filter backend typecheck` / `pnpm lint`
  - federation test（`packages/backend/test-federation/test/emoji.test.ts` 周辺）に
    「再フェッチで絵文字 URL が更新される」ケースを追加検討。
- API を追加する場合（4-6）は `pnpm build-misskey-js-with-types` で misskey-js 再生成 + CHANGELOG 追記。

---

## 6. 実装順序（推奨）

1. `Note.ts` に `lastFetchedAt` 追加 → migration 生成（`create-migration`）→ `check-migrations`。
2. `extractEmojis` に `force` 追加（既存挙動不変を確認）。
3. `updateNote` / `updateNoteIfStale` 実装（トリガー未配線）。
4. typecheck / lint / federation test。
5. （将来）UI 更新ボタン用エンドポイント + misskey-js 再生成 + CHANGELOG。
