# リモートノート TTL 再フェッチ 設計書 — Phase 2（ユーザー向けエンドポイント + UI）

Phase 1（[remote-note-refetch-design.md](./remote-note-refetch-design.md)）で設計した
**トリガー非依存のコア `updateNoteIfStale`** を、ユーザーが能動的に叩けるようにする。

- 対象: `packages/backend`（API エンドポイント） + `packages/frontend`（ノート詳細 UI） + `locales/ja-JP.yml`
- 前提: Phase 1（`MiNote.lastFetchedAt` / `updateNoteIfStale` / `updateNote` / `extractEmojis` の force）が実装済み
- ステータス: 設計（未実装）
- ブランチ: `claude/remote-emoji-refetch-2nbU9`

---

## 1. 大局判断

### 何を作るか

- **エンドポイント** `notes/refetch`: ノート ID を受け取り、Phase 1 の `updateNoteIfStale(note, { force:false })` を呼ぶだけ。
  TTL ガードはコアに内包されているので、**エンドポイント側に分岐ロジックは持たせない**。
- **UI**: ノート詳細画面の「リモートで表示」(`showOnRemote`) リンクの**横**に、再取得の導線を出す。
  - TTL 切れ（再取得可能）→ リンク **「または再取得」**
  - TTL 中（クールダウン中）→ ただのテキスト **「再取得は N 時間後に利用できます」**

### 設計上の要のポイント

1. **UI が事前に状態を出し分けるには、フロントが「次に再取得できる時刻」を知っている必要がある**。
   → ノートに `lastFetchedAt` を pack で公開し、TTL と突き合わせて UI 側で判定する。
   ボタンを押してからエラーで気付く方式（事後）では、要件「N 時間後に利用できます」を**事前**表示できない。
2. UI は既存の `MkRemoteCaution.vue`（`showOnRemote` を描画している箇所）に相乗りする。ただし
   **`MkRemoteCaution` はリモートユーザー注意にも使われる汎用部品**なので、ノート固有ロジックを埋め込まず、
   「再取得導線は任意 props + emit」で外から注入し、API 呼び出し・ノート差し替えは `note.vue` 側に置く。
3. 取得後は `note.vue` の `note` ref を差し替えるだけで `MkNoteDetailed` に伝播する（既存の双方向バインド）。
4. **クールダウンはサーバで弾かず黙って現状ノートを返す**（決定）。FE 側で押下不可にするのが一次防御。
   他人が直前に再取得済みでも、`notes/refetch` は**常に最新 DB 状態を pack して返す**ので、
   **FE↔BE のリフレッシュ（=自分の画面の更新）はクールダウン中でも必ず行われる**。
   = 「自分が押した時、実フェッチは走らなくても最新状態には追いつく」。

### 決定事項（このフェーズで確定）

| 項目 | 決定 |
| --- | --- |
| TTL | **4 時間**（Phase 1 で確定）。`refetchedCount` を併せて表示 |
| クールダウン | サーバはエラーにせず黙って現状ノートを返す。FE で押下不可にする |
| エンドポイント kind | **`write:notes`**。他人（リモートユーザー）のリソース更新だが、リモート由来なので許容 |
| 「N 時間後」表記 | 時間で丸める。**MkTime 相当（非リアルタイム＝秒で再描画しない）** |

### スコープ

- 配置は**ノート詳細ページのみ**（`note.vue` の `MkRemoteCaution`）。タイムライン等には出さない。
- 権限・レート制限はサーバ側でも担保（TTL ガード + `limit`）。UI のクールダウン表示は UX 補助であって信頼境界ではない。

---

## 2. 調査内容（Phase 2 関連）

### 2-1. 「リモートで表示」リンクの実装

- ノート詳細ページ `packages/frontend/src/pages/note.vue:21`:
  ```vue
  <MkRemoteCaution v-if="note.user.host != null" :href="note.url ?? note.uri"/>
  ```
- 部品 `packages/frontend/src/components/MkRemoteCaution.vue:7`（テンプレート全体）:
  ```vue
  <div :class="$style.root"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ i18n.ts.remoteUserCaution }}<a v-if="href" :class="$style.link" :href="href" rel="nofollow noopener" target="_blank">{{ i18n.ts.showOnRemote }}</a></div>
  ```
  props は現状 `href?: string` のみ。
- i18n キー: `locales/ja-JP.yml:203` `showOnRemote: "リモートで表示"`、`:330` `remoteUserCaution`。
- リモート判定: `note.user.host != null`（`note.vue:21`）、リンク URL は `note.url ?? note.uri`。

### 2-2. ノート詳細ページの再取得・差し替え機構

`packages/frontend/src/pages/note.vue`:
- `const note = ref<null | Misskey.entities.Note>(CTX_NOTE);`（`:75`）
- `fetchNote()`（`:115-151`）で `misskeyApi('notes/show', { noteId })` → `note.value = res` で差し替え。
- `<MkNoteDetailed :key="note.id" v-model:note="note" .../>`（`:22`）で双方向バインド。
→ **再取得後は `note.value` に新ノートを代入すれば UI 全体（絵文字含む）が更新される**。

### 2-3. フロントの API 呼び出し・ダイアログ規約

- `misskeyApi(endpoint, data)` … `packages/frontend/src/utility/misskey-api.ts:13`。
- `os.apiWithDialog(endpoint, data)` … `packages/frontend/src/os.ts:42`（成功/失敗ダイアログ込み）。
- `os.toast(msg)` … `os.ts:255`。`os.confirm({...})` … `os.ts:278`。
- 操作系の実例: `get-note-menu.ts:235-240`（favorites を `apiWithDialog`）、`:656-662`（renote 後 `os.toast`）。

### 2-4. エンドポイントのテンプレート

- noteId を取り処理して結果を返す型: `src/server/api/endpoints/notes/translate.ts`
  （`meta`/`paramDef`/`getterService.getNote` の作法、`:17-58`）。
- レート制限の書式: `src/server/api/endpoints/notes/create.ts:23`
  ```ts
  limit: { duration: ms('1hour'), max: 300 },
  ```
- エンドポイント追加時は **`src/server/api/endpoint-list.ts` への手動登録**と
  **misskey-js 再生成**（`pnpm build-misskey-js-with-types`）が必要（`add-api-endpoint` skill 準拠）。

---

## 3. 方針

### 3-1. 状態の単一ソース

- バックエンドが TTL の真実を持つ。フロントは判定材料として **ノートの `lastFetchedAt`** と **TTL 値**を受け取り、
  `nextRefetchAt = lastFetchedAt + TTL` を計算して出し分ける。
- **TTL 値の配布方法（要決定 / 推奨案）**: サーバ側 `lastFetchedAt` をノートに pack し、
  TTL は Phase 1 の定数 `NOTE_REFETCH_TTL` をインスタンス meta で公開（例 `policies` か meta 新規フィールド）。
  - 簡易代替: フロント定数で同値（24h）をハードコード。単一ソース性は劣るが実装は最小。
  - 初版は「meta 公開」を推奨（将来 TTL 可変にしても UI が追従する）。

### 3-2. エンドポイント `notes/refetch`

- 入力 `{ noteId }`、`requireCredential: true`、`limit` でレート制限（TTL ガードと二重防御）。
- 中身は `getNote` → リモート判定 → `apNoteService.updateNoteIfStale(note, { force:false })` → 更新後ノートを pack して返す。
- TTL 中に叩かれた場合: コアが no-op で現状ノートを返す。エンドポイントは `COOLDOWN` エラーを投げる方針を推奨
  （UI は通常クールダウン中はリンクを出さないが、競合・直叩き対策としてサーバでも弾く）。

### 3-3. UI（`MkRemoteCaution` を汎用のまま拡張）

- `MkRemoteCaution` に**任意 props**を追加: `nextRefetchAt?: number | null`（ms, リモートノート時のみ親が渡す）、
  `refetchable?: boolean`。`refetch` を **emit**。ノート以外の用途（リモートユーザー注意）では props 未指定 = 従来表示のまま。
- 表示ロジック（`showOnRemote` の `<a>` の直後）:
  - `refetchable` 指定あり かつ `now >= nextRefetchAt`（または null）→ リンク「または再取得」→ クリックで `emit('refetch')`。
  - `refetchable` 指定あり かつ `now < nextRefetchAt` → テキスト「再取得は N 時間後に利用できます」
    （`N = ceil((nextRefetchAt - now) / 3600000)`）。
- `note.vue` 側で `@refetch` を受けて API 呼び出し → `note.value` 差し替え → トースト。

### 3-4. 要件との対応

| 要件 | 実現 |
| --- | --- |
| ユーザーが叩けるエンドポイント | `notes/refetch`（§4-1） |
| 「リモートで表示」の横に出す | `MkRemoteCaution.vue` の `<a>` 直後（§4-5） |
| TTL 切れ → 「または再取得」 | `now >= nextRefetchAt` 分岐のリンク |
| TTL 中 → 「再取得は N 時間後に利用できます」 | `now < nextRefetchAt` 分岐のテキスト |

---

## 4. どのファイルのどこをどう直すか

> 凡例: 【新規】=新規 / 【改修】=既存改修 / 【決定】=要意思決定

### 4-1. 【新規】`packages/backend/src/server/api/endpoints/notes/refetch.ts`

`translate.ts` を雛形に。SPDX ヘッダー必須。

```ts
export const meta = {
  tags: ['notes'],
  requireCredential: true,
  kind: 'write:notes', // 決定: DB を更新するため write 系。他人(リモート)のノート更新だがリモート由来なので許容
  limit: { duration: ms('1hour'), max: 30 }, // TTL と二重防御
  res: { type: 'object', optional: false, nullable: false, ref: 'Note' },
  errors: {
    noSuchNote:  { message: 'No such note.',  code: 'NO_SUCH_NOTE',  id: '<uuidgen>' },
    isLocalNote: { message: 'Cannot refetch a local note.', code: 'IS_LOCAL_NOTE', id: '<uuidgen>' },
    // 決定: クールダウンはエラーにしない（黙って現状ノートを返す）→ COOLDOWN エラーは設けない
  },
} as const;

export const paramDef = {
  type: 'object',
  properties: { noteId: { type: 'string', format: 'misskey:id' } },
  required: ['noteId'],
} as const;

// 実装本体
const note = await this.getterService.getNote(ps.noteId).catch(/* → noSuchNote */);
if (note.uri == null) throw new ApiError(meta.errors.isLocalNote);

// TTL 切れなら実フェッチ＆更新、TTL 中なら何もせず現状ノートを返す（どちらも下で pack）。
// → クールダウン中でも「最新 DB 状態を返す」= FE↔BE リフレッシュは常に成立。
const updated = await this.apNoteService.updateNoteIfStale(note, { force: false });
return await this.noteEntityService.pack(updated ?? note, me, { detail: true });
```

- `id`（UUID）は `node -e "console.log(crypto.randomUUID())"` 等で採番。
- DI: `GetterService` / `ApNoteService` / `NoteEntityService`。
- クールダウン判定をサーバに持たせないので `updateNoteIfStale` の戻り値拡張は**不要**（§4-2 は採用しない）。

### 4-2. （不採用）`updateNoteIfStale` の戻り値拡張

当初検討していた「TTL 中かどうかを呼び出し側へ伝える」拡張は、**クールダウンをサーバでエラーにしない**
決定により**不要**。`updateNoteIfStale` は Phase 1 のまま（現状ノート or 更新後ノートを返す）でよい。
クールダウン中の抑止は FE の押下不可表示に任せる。

### 4-3. 【改修】`packages/backend/src/server/api/endpoint-list.ts`

`notes/refetch` を手動登録（`add-api-endpoint` skill 準拠）。

### 4-4. 【改修】ノート pack に `lastFetchedAt` / `refetchedCount` を公開

- `packages/backend/src/models/json-schema/note.ts` … `lastFetchedAt`（string, nullable, optional）と
  `refetchedCount`（number, optional）を schema 追加。
- `packages/backend/src/core/entities/NoteEntityService.ts` … `pack` の戻りに
  `lastFetchedAt: note.lastFetchedAt?.toISOString() ?? null` と `refetchedCount: note.refetchedCount` を追加
  （`lastFetchedAt` はリモートノートのみ非 null）。
- これにより misskey-js の `Note` 型に両フィールドが乗る（再生成で反映）。
- UI は `lastFetchedAt`+TTL で出し分け、`refetchedCount` を「これまで N 回再取得」として表示する。

### 4-5. 【改修】`packages/frontend/src/components/MkRemoteCaution.vue`

props 追加と emit、テンプレートに再取得導線を追加。汎用性は維持（props 未指定なら従来表示）。

```vue
<template>
<div :class="$style.root">
  <i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ i18n.ts.remoteUserCaution }}
  <a v-if="href" :class="$style.link" :href="href" rel="nofollow noopener" target="_blank">{{ i18n.ts.showOnRemote }}</a>
  <template v-if="refetchable">
    <!-- TTL 切れ: リンク「または再取得」 -->
    <a v-if="canRefetchNow" :class="$style.link" href="#" @click.prevent="emit('refetch')">{{ i18n.ts.orRefetch }}</a>
    <!-- TTL 中: 静的テキスト「再取得は N 時間後に利用できます」（MkTime 相当・非リアルタイム） -->
    <span v-else :class="$style.cooldown">{{ i18n.tsx.refetchAvailableIn({ time: i18n.tsx._timeIn.hours({ n: remainingHours }) }) }}</span>
    <!-- これまでの再取得回数 -->
    <span v-if="refetchedCount" :class="$style.count">{{ i18n.tsx.refetchedNTimes({ n: refetchedCount }) }}</span>
  </template>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
  href?: string;
  refetchable?: boolean;
  nextRefetchAt?: number | null; // ms。null/過去なら即再取得可
  refetchedCount?: number;       // これまでの実フェッチ回数
}>();
const emit = defineEmits<{ (ev: 'refetch'): void }>();

const canRefetchNow = computed(() => props.nextRefetchAt == null || Date.now() >= props.nextRefetchAt);
// MkTime と同じく時間で丸める（Math.round）。computed だが ticking now を参照しないので非リアルタイム＝静的。
const remainingHours = computed(() => Math.max(1, Math.round(((props.nextRefetchAt ?? 0) - Date.now()) / 3600000)));
</script>
```

ポイント:
- 「N 時間後」は既存 `_timeIn.hours: "{n}時間後"`（`locales/ja-JP.yml:2442`）を再利用。**MkTime コンポーネント自体は未来時刻を「未来」としか出さない**ため使わず、時間丸め（`Math.round`）の静的表示で代替（= ユーザー要望「MkTime のリアルタイムなし」）。
- SPDX は HTML コメント形式の既存ヘッダーを踏襲。`$style.cooldown` / `$style.count` は `$style.link` に倣って追加。

### 4-6. 【改修】`packages/frontend/src/pages/note.vue`

`MkRemoteCaution` に props を渡し、`@refetch` を実装。

```vue
<MkRemoteCaution
  v-if="note.user.host != null"
  :href="note.url ?? note.uri"
  :refetchable="true"
  :nextRefetchAt="nextRefetchAt"
  :refetchedCount="note.refetchedCount"
  @refetch="refetchNote"
/>
```

```ts
// TTL = 4h（Phase 1 の NOTE_REFETCH_TTL と同値）。meta 公開値があればそれを使う（§3-1）。
const REFETCH_TTL = 1000 * 60 * 60 * 4;
const nextRefetchAt = computed(() => {
  const t = note.value?.lastFetchedAt; // pack で追加（§4-4）
  return t ? new Date(t).getTime() + REFETCH_TTL : null; // null=即可
});

async function refetchNote() {
  if (note.value == null) return;
  const res = await os.apiWithDialog('notes/refetch', { noteId: note.value.id });
  note.value = res;            // 差し替え → MkNoteDetailed に伝播（絵文字も更新）
  os.toast(i18n.ts.refetched);
}
```

### 4-7. 【改修】`locales/ja-JP.yml`（ja-JP のみ編集可）

```yaml
orRefetch: "または再取得"
refetchAvailableIn: "再取得は{time}に利用できます"   # {time} には _timeIn.hours の結果（例「4時間後」）が入る
refetchedNTimes: "これまで{n}回再取得"
refetched: "再取得しました"
```

- `refetchAvailableIn` は `i18n.tsx.refetchAvailableIn({ time: i18n.tsx._timeIn.hours({ n }) })` で参照
  （「N 時間後」部分は既存 `_timeIn.hours`（`ja-JP.yml:2442`）を再利用）。
- `refetchedNTimes` は `i18n.tsx.refetchedNTimes({ n })` で参照。
- 他言語 yml は触らない（Crowdin 管轄）。`packages/i18n` の型は自動再生成。
- 追加は `add-i18n-key` skill 準拠。

### 4-8. 【改修】misskey-js 再生成 & CHANGELOG

- `pnpm build-misskey-js-with-types`（`notes/refetch` と `Note.lastFetchedAt` を型に反映）。
- `CHANGELOG.md` の `## Unreleased`:
  - `### Client` … `- Feat: リモートノートの詳細画面から最新情報を再取得できるように`
  - `### Server` … `- Feat: notes/refetch エンドポイントを追加`

---

## 5. 影響範囲・検証

- `MkRemoteCaution` は props 未指定で従来挙動 → リモートユーザー注意などの既存利用は不変。
- `notes/refetch` 未配線でも他に影響なし。UI は `lastFetchedAt` が無い古いレスポンスでも `nextRefetchAt=null`（即可）にフォールバック。
- 検証:
  - backend: `pnpm --filter backend typecheck` / e2e（`notes/refetch` の noSuchNote / isLocalNote / 正常系）。
  - frontend: `pnpm --filter frontend test`、`MkRemoteCaution` の Storybook（`*.stories.impl.ts`）に
    「再取得可能」「クールダウン中」2 状態を追加。
  - `pnpm lint`。

---

## 6. 決定事項（Phase 2・確定）

1. **TTL**: 4 時間（Phase 1 確定）。`refetchedCount` を併記。
2. **クールダウン**: サーバはエラーにせず黙って現状ノートを返す。FE で押下不可にする。`COOLDOWN` エラーは設けない。
3. **エンドポイント kind**: `write:notes`（DB 更新あり。他人=リモートユーザーのリソースだが許容）。
4. **「N 時間後」表記**: 時間で丸める（`Math.round`）。MkTime 相当の非リアルタイム静的表示。`_timeIn.hours` 再利用。

残る軽微な選択:
- **TTL 値の配布**: フロント定数（4h ハードコード, 最小）/ instance meta 公開（将来 TTL 可変対応）。初版は定数でよい。

---

## 7. 実装順序（推奨）

1. backend: `lastFetchedAt` を pack（§4-4）→ `notes/refetch`（§4-1, §4-3）→ 必要なら `updateNoteIfStale` 戻り値拡張（§4-2）。
2. misskey-js 再生成。
3. i18n キー追加（§4-7）。
4. frontend: `MkRemoteCaution` 拡張（§4-5）→ `note.vue` 配線（§4-6）→ Storybook。
5. typecheck / lint / test → CHANGELOG。
