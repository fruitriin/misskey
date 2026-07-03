---
title: チャンネル機構の仕組みと空間分割への適性
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# チャンネル機構の仕組みと空間分割への適性

## 発見した知見

### データモデル

- `MiChannel`（`packages/backend/src/models/Channel.ts:11-101`）: `userId`（オーナー）、`name` / `description` / `bannerId` / `pinnedNoteIds` / `color` / `isArchived` / `isSensitive` / `allowRenoteToExternal`
- ノートは **0 または 1 個のチャンネルに属する**（`Note.ts:203-215` の `channelId`、マルチチャンネル不可）。`renoteChannelId` / `replyChannelId` の denormalize カラムもある
- 付帯: `ChannelFollowing` / `ChannelFavorite` / `ChannelMuting`
- **チャンネル削除はノートを CASCADE 物理削除する**。「空間を閉じたいがログは残したい」は削除ではなく `isArchived` で運用する

### タイムラインへの流れ方（重要）

チャンネル投稿は `NoteCreateService.ts:468-470` で**強制的に `visibility: 'public'` / `localOnly: true`** になる。fanout（`NoteCreateService.ts:1064-1081`）は:

- `channelTimeline:{channelId}` と、チャンネルフォロワーの `homeTimeline` にのみ push
- **LTL / GTL には出ない**（`channelId IS NULL` で除外）。HTL には自分がフォローしたチャンネル分だけ混ざる（オプトイン合流）
- **`localOnly: true` 強制のため ActivityPub 連合に絶対に乗らない**（`core/activitypub/` に channel 参照ゼロ）

### エンドポイントと権限

- read 系（`channels/search` / `show` / `featured` / `timeline`）は `requireCredential: false`——**非ログインで閲覧可能**
- write 系（`create` / `update` / `follow` 等）は認証必須
- チャンネル作成はロールポリシー `canCreateChannel` で制御（`RoleService.ts:54`）。**デフォルト `true`（誰でも作成可）**、集計は OR。作成レートリミットは 1h/10
- 非公開・招待制チャンネルは未実装（publicity フラグなし、強制 public）

### フロントエンド

- `/channels` 配下のページ群 + デッキの `channel-column.vue`（チャンネルを独立列にできる）
- MISTEMS 独自の `MkChannelIndex.vue`（viewMode 3種の全チャンネル一覧）が既にある。ただし `hashTags` が declare されたまま未使用（実装途中の可能性）

## プロジェクトへの適用（イヴの時間の空間分割）

- **適性は高い**: Redis TL キーが物理分離、LTL/GTL 非混入、フォローによるオプトイン合流——「認知上限を超えたら場を分ける」設計に合致。閉鎖インスタンス（連合なし）方針なら localOnly 強制も無害
- 最初の一手は **base role の `canCreateChannel` を false 化**して空間の乱立を防ぐこと（デフォルト true のまま運用開始するとチャンネル濫立で逆効果）
- 「全チャンネル横断タイムライン」は現状エンドポイントが無い。必要なら `channels/timeline` の複数 channelId 対応 or 新設

## 注意点・制約

- チャンネル間の返信は親ノートのチャンネルに自動吸着（`NoteCreateService.ts:451-463`）
- read 系が非ログイン公開なので、「非ログイン閲覧制限」の実装時は channels 系エンドポイントも忘れず対象に含めること（抜け道になる）
- `requireCredential` は endpoint 定数直書きで、meta 設定での切替は用意されていない

## 参照

- `packages/backend/src/models/Channel.ts` / `Note.ts`
- `packages/backend/src/core/NoteCreateService.ts:451-463, 468-470, 1064-1081`
- `packages/backend/src/server/api/endpoints/channels/`
- `packages/frontend/src/components/MkChannelIndex.vue` / `pages/channel.vue` / `ui/deck/channel-column.vue`
