---
title: 非ログイン閲覧の現状と API レベル制限の実装ポイント
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# 非ログイン閲覧の現状と API レベル制限の実装ポイント

## 発見した知見

### 認証判定の仕組み

- `requireCredential` は **boolean の2値のみ**（'optional' は存在しない）。false のエンドポイントは `me: MiLocalUser | null` を受けて自前分岐
- 判定は `ApiCallService.call()`（L350-357 で 401）。WebSocket は `stream/Connection.ts:280` + 各 channel の `static requireCredential`
- **非ログインでも叩ける**: `notes/local-timeline` / `global-timeline`（ロールポリシー `ltlAvailable`/`gtlAvailable` のみ、base policy が true）、`notes/show` / `children` / `replies` / `renotes` / `search-by-tag`、`users/show` / `notes` / `followers`、`channels/*` read系、`hashtags/*`、`pages/*`、`gallery/*` 等、明示 false だけで80ファイル
- 非ログインには `getUserPolicies(null)` = base policies がそのまま適用される。base を絞るとログインユーザーにも効いてしまう点に注意

### 既存の訪問者制限設定は「穴だらけ」

- `Meta.ugcVisibilityForVisitor: 'all' | 'local' | 'none'`（デフォルト 'local'、管理UI: admin/moderation.vue）
- しかし参照しているのは **5経路のみ**: `notes/show`、`users/show`（'local' のみ。**'none' チェックはコメントアウトされ無効**）、SSR `/notes/:note`、SSR `/@:user`、robots.txt
- **LTL/GTL・一覧系・users/notes 等はまったく参照していない**。'none' に設定しても非ログインで叩き放題
- ユーザー単位の `requireSigninToViewContents` は `shouldHideNote` で text/files を null にするだけ（ノートの存在はリークする）

### 抜け道の一覧（API レベル制限の実装時に全部塞ぐ）

1. `/embed/notes/:note` / `/embed/user-timeline/:user` / `/embed/clips/:clip`（`ClientServerService.ts:795-867`。訪問者設定を一切見ない）
2. `/@:user.atom` / `.rss` / `.json` フィード（`ugcVisibilityForVisitor` 非参照。RSS リーダーで丸見え）
3. AP エンドポイント（outbox / followers 等）は未認証 GET を受け付ける——`federation: 'none'` なら 403 になるので**閉鎖インスタンス方針が先に立っていれば自動的に塞がる**
4. `cacheSec` 付きエンドポイントは非ログイン時 `Cache-Control: public` を吐く（`ApiCallService.ts:178`）。後から閉じても CDN/中間キャッシュに残る
5. ストリーミング: `local-timeline` / `global-timeline` / `hashtag` / `channel` channel は非ログイン購読可
6. `fetch-rss` は requireCredential: false で任意 URL fetch（SSRF 面でも注意）

### 実装アプローチの評価

- **A. 中央ゲート方式（推奨）**: `endpoints.ts` に `allowVisitor?: boolean` 的な新メタを追加し、`ApiCallService.call()` で「非ログイン && allowVisitor でない → 401」。許可リスト（meta / stats / announcements / notes/show 等の最小集合）だけ true にする。忘れによる漏れがゼロになる。Stream 側 `Connection.connectChannel` にも同型を適用。misskey-js 再生成が必要
- B. `ugcVisibilityForVisitor === 'none'` を各エンドポイントに横串で足す方式は対象が多く漏れやすい（20ファイル以上 + embed + feed）
- C. base policies の非ログイン分岐（`getUserPolicies(null)` を専用化）は LTL/GTL 系を1箇所で閉じられるが、ポリシー非参照エンドポイントには効かない——A の補助として有効

## プロジェクトへの適用（イヴの時間・ルール3）

- 「非ログインは Misskey UI の非ログイン相当の制限閲覧まで、それを API でも課す」は **A の中央ゲート + embed/feed/キャッシュの穴埋め**が本命
- 「追放者は非ログイン相当に降格」の実装は、この allowVisitor ゲートが完成していることが前提になる（追放 = 認証を失う = 訪問者扱い、で一貫する）

## 注意点・制約

- `users/notes` には `signinRequired` エラーが定義されているのに投げられていない（未完成の upstream コードの痕跡）
- 中央ゲート導入は 80+ エンドポイントの棚卸しを伴う。「訪問者に許すもの」のリストを計画段階で確定させること

## 参照

- `packages/backend/src/server/api/ApiCallService.ts:158-192, 297-453`
- `packages/backend/src/server/api/endpoints.ts:11-125`
- `packages/backend/src/models/Meta.ts:699-763` / `User.ts:206`
- `packages/backend/src/server/web/ClientServerService.ts:380-870`（SSR / embed / feed）
- `packages/backend/src/core/QueryService.ts:261-303`（generateVisibilityQuery: 非ログインは public+home のみ）
- 関連: [federation-shutdown.md](federation-shutdown.md)（AP 経由の閲覧穴は連合停止で塞がる）
