---
title: リポジトリ構造の土地勘（monorepo・backend・frontend）
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# リポジトリ構造の土地勘（monorepo・backend・frontend）

## 発見した知見

### パッケージ構成（pnpm monorepo）

| パッケージ | 役割 |
|---|---|
| `packages/backend/` | NestJS + TypeORM + Fastify のサーバー本体 |
| `packages/frontend/` | Vue 3 SFC の Web クライアント（`Mk*.vue` コンポーネント251個） |
| `packages/frontend-shared/` | frontend / frontend-embed 間の共有コード |
| `packages/frontend-embed/` | 埋め込みノートビューア |
| `packages/frontend-builder/` | フロントエンドのビルドチェーン共有 |
| `packages/misskey-js/` | 公式 TypeScript SDK。**MIT サブパッケージ（AGPL SPDX ヘッダー禁止）** |
| `packages/sw/` | Service Worker |
| `packages/i18n/` | 言語ファイルローダ |
| `packages/misskey-reversi/` `misskey-bubble-game/` | ミニゲームロジック |
| `packages/shared/` | ESLint 共有設定等（pnpm-workspace.yaml の pattern 対象外だが物理存在） |

### backend/src の責務地図

- `boot/` — 起動シーケンス（`entry.ts` → `master.ts` / `worker.ts`）
- `core/` — ドメインサービス層（約81ファイル、`*Service.ts`）。`NoteCreateService` / `RoleService` / `FanoutTimelineService` 等
  - `core/activitypub/` — 連合（`ApInboxService` / `ApDeliverManagerService` / `ApRendererService`）
  - `core/entities/` — API レスポンス整形（Packer）
- `models/` — TypeORM Entity（`_.ts` に集約 export）
- `server/api/` — REST API。`endpoints/` に全実装、`endpoints.ts` / `endpoint-list.ts` に登録。`RateLimiterService` / `AuthenticateService` もここ。`stream/` に WebSocket
- `server/` 直下 — `ActivityPubServerService.ts` / `WellKnownServerService.ts` / `NodeinfoServerService.ts`（連合系 HTTP）
- `queue/processors/` — Bull ジョブ（`InboxProcessorService` / `DeliverProcessorService` 等）
- `migration/` — TypeORM マイグレーション（マージ済みは編集禁止）

### frontend/src の責務地図

- `components/` — `Mk*.vue` コンポーネント（251個）+ `.stories.impl.ts` ペア。`components/global/` に汎用
- `pages/` — ルーティング先。`router.definition.ts` が定義本体
- `ui/` — アプリシェル（`universal.vue` / `deck.vue` / `visitor.vue` / `zen.vue` 等）
- `os.ts` / `stream.ts` / `i18n.ts` — ランタイムハブ（ダイアログ等は `os.*` 経由が規約）
- `composables/` / `utility/` / `preferences/` / `store.ts` / `accounts.ts` / `instance.ts`

## プロジェクトへの適用

- backend の改造は `core/` のサービスと `server/api/endpoints/` の2層を見る。横断的な API 制御（認証・レートリミット）は `server/api/ApiCallService.ts` 周辺が共通経路
- API 変更後は `pnpm build-misskey-js-with-types` で `misskey-js` 再生成が必須（CI が差分検査する）

## 注意点・制約

- CI（lint / test）の trigger は `master` / `develop` への push と PR のみ。**`mistems-main` への push では発火しない**（推測: upstream 設定のまま）。ローカルでの `pnpm lint` / テスト実行が実質の品質ゲート
- `pnpm-workspace.yaml` と `package.json` の workspaces に微妙な差異あり（`shared` の扱い）。upstream 由来で MISTEMS 固有ではない可能性が高い

## 参照

- `packages/backend/src/` / `packages/frontend/src/`
- `.github/workflows/`（32ファイル。MISTEMS 追加分は `claude.yml` / `claude-code-review.yml`）
- ビルド・テストコマンド一覧は `CLAUDE.repo.md` 参照
