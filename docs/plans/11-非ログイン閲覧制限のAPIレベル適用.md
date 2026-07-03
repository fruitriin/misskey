---
trust: normal
responsiveness: relaxed
image_clarity: balanced
depends_on: 02-イヴの時間構想の実装計画策定.md
related: 10-連合停止と閉鎖インスタンス化.md
---

# 計画11: 非ログイン閲覧制限のAPIレベル適用

## 実装状況: 未着手

## 目的

イヴの時間構想（空間のルール3・技術4）を API レイヤーで実装する:

> 声を聞くことは誰にでも開かれている——ただし、全量ではない。
> アカウントを持たない存在に開かれるのは、制限された閲覧まで（Misskey の UI が非ログインユーザーに見せる範囲と同等）。
> タイムラインを全量浴びること——文脈情報の大量摂取——は、この空間の参加者の特権である。
> UI は薄いスキンなのだから、UI だけの制限は制限ではない。

実装方式は knowhow（[visitor-visibility-mechanics.md](../knowhow/visitor-visibility-mechanics.md)）が推奨する **allowVisitor 中央ゲート方式（デフォルト拒否 + 許可リストだけ注釈）** を採用する。あわせて REST API 以外の抜け道（embed / feed / キャッシュ / fetch-rss）を塞ぐ。

また本計画は「追放者は非ログイン相当の制限閲覧へ降格する」（構想・技術6、将来の追放刑計画）の**土台**である。ゲートの判定を「user が null か」ではなく「このアクターは制限閲覧者か」という述語に寄せて設計し、将来 exile フラグを同じ述語に合流できるようにする。

## 現状の挙動

### 認証判定は「明示的に requireCredential: true と書いた所だけ」防がれる

- `packages/backend/src/server/api/endpoints.ts:26-30` — `requireCredential?: boolean`（省略時 **false** = 誰でも叩ける）。'optional' は存在しない
- `packages/backend/src/server/api/ApiCallService.ts:350-357` — `requireCredential || requireModerator || requireAdmin` のときだけ非ログインに 401（`CREDENTIAL_REQUIRED`, id `1384574d-a912-4b81-8601-c7b1c4085df1`）
- 非ログインで叩けるエンドポイントは2クラスある:
  - **明示 `requireCredential: false`**: 81ファイル（`notes/show`、`users/show`、`notes/search`、`users/search`、`channels/*` read系、`hashtags/*`、`federation/*`、`fetch-rss` 等）
  - **`requireCredential` 省略（デフォルト false）**: `notes/local-timeline`、`notes/global-timeline`、`notes/search-by-tag`、`users/notes`、`notes.ts`、`gallery/posts.ts`、`charts/*` 13ファイル、`users/clips`、`users/pages`、`users/flashs` 等。**LTL/GTL 全量閲覧がこの「書き忘れと区別のつかない省略」クラスにいる**——追加型（deny-list）のパッチでは必ず漏れが再発する構造的理由がここにある
- LTL/GTL はロールポリシー `ltlAvailable`/`gtlAvailable` のみで守られており、非ログインには `getUserPolicies(null)` = base policies（デフォルト true）が適用されるため素通しになる

### 既存の訪問者制限は穴だらけ

- `Meta.ugcVisibilityForVisitor: 'all' | 'local' | 'none'`（`packages/backend/src/models/Meta.ts:703`、デフォルト 'local'）を参照するのは5経路のみ:
  `notes/show`（`endpoints/notes/show.ts:73-78`）/ `users/show`（`endpoints/users/show.ts:157,177`。**'none' チェックは `users/show.ts:119-122` でコメントアウトされ無効**）/ SSR `/@:user`（`ClientServerService.ts:523-524`）/ SSR `/notes/:note`（`ClientServerService.ts:592-593`）/ robots.txt（`ClientServerService.ts:404`）
- LTL/GTL・一覧系・検索系・`users/notes` は一切参照していない。'none' に設定しても非ログインで叩き放題
- ユーザー単位の `requireSigninToViewContents`（`packages/backend/src/models/User.ts:206`）は `NoteEntityService.ts:136` で text/files を null 化するだけ（ノートの存在はリークする）

### ストリーミングも同型の穴

- `packages/backend/src/server/api/stream/Connection.ts:280-282` — `channelConstructor.requireCredential && this.user == null` のときだけ拒否
- `static requireCredential = false` のチャンネル: `local-timeline` / `global-timeline` / `hashtag` / `channel` / `role-timeline` / `user-list` / `queue-stats` / `server-stats` / `reversi-game`（`stream/channels/*.ts`）。**非ログインで LTL/GTL をリアルタイム購読できる**

### REST 以外の抜け道

1. **embed**: `/embed/user-timeline/:user`（`ClientServerService.ts:795`）/ `/embed/notes/:note`（同 :817）/ `/embed/clips/:clip`（同 :847）/ `/embed/*`（同 :868）——訪問者設定を一切見ない
2. **フィード**: `/@:user.atom`（同 :465）/ `.rss`（同 :480）/ `.json`（同 :495）——RSS リーダーで全ノート丸見え
3. **キャッシュ**: `cacheSec` 付きエンドポイントは非ログイン GET に `Cache-Control: public, max-age=...` を吐く（`ApiCallService.ts:178-180`）。対象25ファイル（`charts/*`、`emojis`、`notes/featured`、`server-info`、`fetch-rss` 等）。後から閉じても CDN・中間キャッシュに残る
4. **fetch-rss**: `endpoints/fetch-rss.ts:16-18` — `requireCredential: false` + `allowGet` + `cacheSec` で任意 URL fetch（SSRF 面でも危険）
5. **AP エンドポイント**（outbox / followers 等の未認証 GET）: **計画10（連合停止）の `federation: 'none'` で 403 になる前提**。[federation-shutdown.md](../knowhow/federation-shutdown.md) が確認済み——AP 全15箇所 + WellKnown 4箇所は `isFederationAllowedHost` 経由で遮断される。本計画では扱わない（nodeinfo 直リンク等の残穴も計画10の管轄）
6. **HTML SSR**（`/@:user`、`/notes/:note`）: OGP 用のメタ情報を返す。`ugcVisibilityForVisitor` を参照済みで、「Misskey UI の非ログイン相当」の範囲内なので**塞がない**（構想はゼロ公開ではない）

## 変更内容

### 1. endpoints.ts のメタ拡張

`packages/backend/src/server/api/endpoints.ts` の `IEndpointMetaBase` に追加:

```ts
/**
 * 非ログイン（訪問者）からの呼び出しを許可するか。
 * 省略した場合は false（デフォルト拒否）として解釈されます。
 * requireCredential: true との併用は無意味（requireCredential が優先）。
 */
readonly allowVisitor?: boolean;
```

型レベルで `requireCredential: true` と `allowVisitor: true` の併用を排除できるなら union（`endpoints.ts:110-125`）に組み込む（無理に複雑化しない。実行時は無害）。

### 2. ApiCallService.call() の中央ゲート

`packages/backend/src/server/api/ApiCallService.ts` の `call()`（L297-）に、`secure` チェック（L311-313）の直後・レートリミット（L315-348）の**前**に挿入:

```ts
if (this.isRestrictedViewer(user) && !ep.meta.allowVisitor) {
    throw new ApiError(/* 401 CREDENTIAL_REQUIRED — 既存 id 1384574d-… を再利用 */);
}
```

- **述語 `isRestrictedViewer(user)`**: 現時点の実装は `user == null` のみ。ただし判定をこの述語に集約しておくことで、追放刑計画で `|| user.isExiled` を1箇所足すだけで「追放者 = 非ログイン相当」が REST 全域に効く。置き場所は ApiCallService のプライベートメソッドで開始し、追放刑計画で必要になったら共有サービスへ昇格する
- **レートリミットより前に置く理由**: 拒否される匿名スキャンで Redis を往復させない
- **エラーは既存の `CREDENTIAL_REQUIRED`（401）を再利用**: フロントエンドが既にこのエラーをサインイン誘導として扱うため、新コード不要で UI が自然に振る舞う（404 秘匿方針にするかは要オーナー確認）
- 既存の `requireCredential` 分岐（L350-366）はそのまま残す（挙動の重複は無害。isSuspended チェック等を壊さない最小差分）

### 3. ストリーミング Connection の同型ゲート

- `packages/backend/src/server/api/stream/channel.ts`（Channel 基底クラス）に `public static allowVisitor = false as const;` 相当を追加し、各チャンネルでオーバーライド可能にする
- `packages/backend/src/server/api/stream/Connection.ts:280-282` を書き換え:

```ts
if ((this.user == null && !channelConstructor.allowVisitor) /* 将来: isRestrictedViewer */) {
    return;
}
```

- **初期の許可リストは空**（訪問者にストリーミング購読を許すチャンネルなし）。既存の `requireCredential` は WS 側でも残置
- 接続確立自体（`/streaming` ハンドシェイク）は許容してよい（チャンネル購読が全滅なら実害なし）。ハンドシェイク段階で切る強化は任意

### 4. 非ログイン許可リスト（allowVisitor: true を付けるエンドポイント案）

方針: **「Misskey の非ログイン UI が壊れない最小集合」を許可し、全量取得・検索・横断列挙は participant 特権とする**。根拠列は実際のフロント参照箇所。

#### 4a. 許可提案（コア: これが無いと非ログイン UI が起動すらしない）

| エンドポイント | 根拠 |
|---|---|
| `meta` | フロント起動時に必須（`packages/frontend/src/instance.ts:46`） |
| `ping` | ヘルスチェック。無害 |
| `stats` | 訪問者ダッシュボード（`MkVisitorDashboard.vue:76`） |
| `announcements` / `announcements/show` | 非ログインでもお知らせページは見える（招待制の案内掲示にも使う） |
| `emojis` / `emoji` | ノート・プロフィール表示のカスタム絵文字解決に必須 |
| `get-avatar-decorations` | アバター表示の付帯。無害 |
| `notes/show` | 「制限された閲覧」の核。単一ノート直リンク閲覧。既存の `ugcVisibilityForVisitor` チェック（notes/show.ts:73-78）はそのまま併存 |
| `users/show` | プロフィール直リンク閲覧の核 |
| `username/available` / `email-address/available` | サインアップフォームが叩く |
| `request-reset-password` / `reset-password` / `verify-email` | アカウント回復経路。ログイン前に必要 |

※ `signup` / `signin-flow` / `signin-with-passkey` / `signup-pending` / `miauth/:session/check` は endpoint-list 外の専用ルート（`ApiServerService.ts:108-160`）であり、本ゲートの影響を受けない（変更不要）。

#### 4b. 許可提案（準コア: 非ログイン UI の閲覧体験。オーナー判断で削ってよい）

| エンドポイント | 根拠 / 論点 |
|---|---|
| `notes/conversation` / `notes/children` / `notes/replies` | ノート詳細ページがスレッドを組むのに使う。単発ノートだけ見せて文脈は見せない、という絞り方も可能 |
| `notes/reactions` / `notes/renotes` | ノート詳細のリアクション・リノート一覧。存在リークの範囲が広がるので削る選択肢あり |
| `users/notes` | プロフィールページのノート一覧。**「1ユーザーの発言を遡る」は許すが「タイムライン全量」は許さない**という線引きの境界線上。Misskey 非ログイン UI 同等性の観点では許可が自然 |
| `notes/featured` | welcome ページのタイムライン風表示（`welcome.timeline.vue` が `misskeyApiGet('notes/featured')`）。キュレーション済み部分集合であり「全量」ではない |
| `charts/active-users` | welcome ページの活動グラフ。統計のみで UGC を含まない |
| `pages/show` / `clips/show` / `clips/notes` / `gallery/posts/show` / `flash/show` / `channels/show` | 直リンク共有物の閲覧面。閉鎖空間として全部サインイン壁にする選択肢もある |

#### 4c. 拒否（デフォルトのまま。特筆すべきもの）

- **`notes/local-timeline` / `notes/global-timeline` / `notes/search-by-tag` / ストリーミング全チャンネル** — 本計画の主目的。「タイムライン全量はアカウント保持者の特権」
- **`notes/search` / `users/search` / `users` / `notes` / `hashtags/*` / `users/search-by-username-and-host`** — 横断検索・全列挙 = 文脈情報の大量摂取に等しい
- **`federation/*`** — 連合なし（計画10）で不要
- **`fetch-rss`** — SSRF 面。§5 で requireCredential: true 化まで行う
- **`server-info` / `charts/*`（active-users 以外）/ `retention` / `bubble-game/ranking` / `reversi/*` / `pinned-users` / `users/followers` / `users/following` / `endpoint` / `endpoints`** — 訪問者に見せる理由がない
- **`admin/roles/users`** — upstream で `requireCredential: false` + `requireModerator: true`（`endpoints/admin/roles/users.ts:19-20`）という紛らわしい書き方。requireModerator 側で守られてはいるが、デフォルト拒否の下では見た目にも安全になる（現状の「明示 false でも実は守られている」例として棚卸し時に注意）

許可リストは実装時に定数化せず**各エンドポイントの meta に `allowVisitor: true` を書く**（1エンドポイント1ファイルの Misskey 規約に従い、grep 可能性を保つ）。e2e テストで許可リストのスナップショットを取り、無断追加を検出する（§テスト方針）。

### 5. 抜け道の穴埋め

| # | 対象 | 変更 |
|---|---|---|
| 1 | `/embed/notes/:note` / `/embed/user-timeline/:user` / `/embed/clips/:clip` / `/embed/*`（`ClientServerService.ts:795-876`） | ルートごと 404 化（ハンドラ削除または即 404 返却）。閉鎖インスタンスに外部サイト埋め込み需要はない。`embed.js`（同 :383）と `frontend-embed` パッケージのビルドは当面残置でよい（配信面だけ閉じる） |
| 2 | `/@:user.atom` / `.rss` / `.json`（`ClientServerService.ts:465-509`） | ルート削除（404）。フィードは認証を運べないため「参加者のみ」と両立しない |
| 3 | `cacheSec` の `Cache-Control: public`（`ApiCallService.ts:178-180`） | 条件を `endpoint.meta.cacheSec && endpoint.meta.allowVisitor && !token && !user` に変更。**訪問者拒否エンドポイントの応答が中間キャッシュに残る事故を構造的に排除**する。さらに安全側に倒すなら public を全廃し `private` にする（要オーナー確認） |
| 4 | `fetch-rss`（`endpoints/fetch-rss.ts:16`） | `requireCredential: true` + `kind` 付与に変更（SSRF 面はログイン済みにも開けたくないが、RSS ウィジェット機能を残すなら credential 必須が下限）。`cacheSec` は削除 |
| 5 | `users/show` の 'none' チェック（`endpoints/users/show.ts:119-122`） | コメントアウトを復活させる。コメントの懸念（「ログイン時に users/show できなくなってしまう」）は `me == null` 条件があるため当たらない——復活時に条件が `me == null` を含むことを確認して直す。本インスタンスは 'none' 運用をしない想定だが、設定と実装の乖離を残さない |

### 6. 既存機構との関係整理（置き換えか併存か）

| 機構 | 扱い | 理由 |
|---|---|---|
| `ugcVisibilityForVisitor`（インスタンス設定） | **併存**（廃止しない） | 軸が違う。allowVisitor は「どの API を叩けるか」（エンドポイント軸）、ugcVisibilityForVisitor は「訪問者にどのコンテンツを見せるか」（コンテンツ軸）で、SSR/OGP・robots.txt にも効いている。本インスタンスはデフォルト 'local' のままでよい（連合停止後はリモート UGC 自体が増えない）。将来 AP 物理削除計画で 'local'/'all' の区別が無意味になったら簡素化を検討 |
| `requireSigninToViewContents`（ユーザー単位フラグ） | **併存**（触らない） | ユーザーの自衛オプションであり、API ゲートとは独立に SSR/OGP の本文隠蔽（`ClientServerService.ts:591`、`NoteEntityService.ts:136`）で意味を持ち続ける |
| `requireCredential` | **併存**（触らない） | allowVisitor はその補集合を守る別レイヤー。80+ ファイルの requireCredential を書き換える工数と regression リスクに見合わない |
| `ltlAvailable` / `gtlAvailable`（ロールポリシー） | **併存**（触らない） | ログインユーザー間の出し分けとして引き続き有効。非ログインは手前の中央ゲートで落ちるため、`getUserPolicies(null)` の base policy をいじる必要がなくなる（knowhow の案Cは不要になる） |
| 追放刑（構想・技術6、将来計画） | **本計画が土台** | ゲート判定を `isRestrictedViewer(user)` 述語に集約（§2, §3）。追放 = 述語が true になる、で REST・ストリーミング両方に一貫適用できる。追放刑計画側は述語に `isExiled` を足し、allowVisitor 許可リストがそのまま「追放者に残される閲覧範囲」になる |

## 影響範囲

- **misskey-js 再生成: 必要**。`IEndpointMeta` の型変更 + 各エンドポイント meta 変更のため、規約通り `pnpm build-misskey-js-with-types` を実行し `packages/misskey-js/src/autogen/` の差分をコミットに含める（res/params スキーマは変えないため autogen 差分は小さい見込み）
- **migration: 不要**。エンティティ・スキーマ変更なし（新設定は Meta に足さず、コード内デフォルト拒否で表現する）
- **フロントエンド影響: あり（限定的）**
  - 非ログインで拒否されるようになる呼び出し（`federation/instances` を使う about ページ等）は、計画10で連合 'none' なら大半が既に非表示。非ログイン状態で全訪問者ページ（welcome / ノート直リンク / プロフィール / お知らせ / サインアップ）を実際に踏んで 401 起因の白画面がないか検証する（Playwright）
  - 401 は既存のサインイン誘導フローに乗るため、原則フロント改修なしで劣化が gracefully になる想定。壊れたら該当ページだけ `$i` ガードを足す
- **既存 backend e2e テストへの影響: 大きい**。匿名で API を叩くテストが多数あるため、許可リスト外の匿名呼び出しは 401 期待に書き換える必要がある（upstream 追従放棄済みなので躊躇しない）
- **エージェント（API 利用者）への影響: なし**。トークンがあれば従来通り

## テスト方針

1. **中央ゲートの単体/E2E**（`packages/backend/test/e2e/` に新規 `visitor-gate.ts`）:
   - 全エンドポイントを列挙し、`allowVisitor: true` の**許可リストをスナップショットとして固定**（リストに無いものが匿名 200 を返したら fail、リスト変更は意図的な diff としてレビューに現れる）
   - 代表エンドポイントで: 匿名 → 401 / トークン有り → 従来通り / allowVisitor 付き匿名 → 200
   - `notes/local-timeline` / `global-timeline` / `users/notes`（省略クラス代表）が匿名 401 になることの明示テスト
2. **ストリーミング**: 匿名 WS 接続で `local-timeline` / `global-timeline` / `hashtag` / `channel` チャンネル購読が確立しないこと（既存 `streaming.ts` e2e に追加）
3. **抜け道**: `/embed/notes/:id`・`/@user.atom`・`.rss`・`.json` が 404 を返すこと。allowVisitor でないエンドポイントの匿名 GET 応答に `Cache-Control: public` が付かないこと
4. **回帰**: `cp .github/misskey/test.yml .config/test.yml` の上で `pnpm --filter backend test` / `test:e2e`、`pnpm lint`、`pnpm build`
5. **手動（Playwright）**: 非ログインで welcome → ノート直リンク → プロフィール → サインアップ導線を踏破し、UI 劣化を確認

## 破壊的変更の許容範囲

- upstream 追従は放棄済み（構想・実装の基盤）。以下を**許容する**:
  - 匿名アクセスを前提とした外部ツール（RSS リーダー・embed 利用・サードパーティクライアントの未認証モード）の全滅
  - upstream e2e テストの大量書き換え
  - `IEndpointMeta` 型のフォーク独自拡張（以後 upstream の endpoint 追加を取り込む際は allowVisitor 判断が必須になる——これは意図した「デフォルト安全」）
- **許容しない**: ログイン済みユーザー・トークン付きエージェントの既存動作変更。サインアップ/サインイン/パスワード回復の導線切断

## 要オーナー確認

1. **許可リストの最終確定**: §4a（コア）は許可でよいか。§4b（準コア）のうち削るものはどれか——特に `users/notes`（プロフィールの発言一覧）と `notes/conversation` 系（スレッド文脈）をどこまで訪問者に開くか
2. **直リンク閲覧面**（`pages/show` / `clips/show` / `gallery/posts/show` / `flash/show` / `channels/show`）は Misskey 非ログイン UI 同等として許可か、閉鎖空間としてサインイン壁か
3. **エラー方針**: 拒否時は 401（サインイン誘導、実装最小）か、404（存在秘匿、スキャナに静か）か。提案は 401
4. **Cache-Control**: allowVisitor 限定で `public` を残すか、全廃して `private` に倒すか。提案は allowVisitor 限定で残す
5. **`/url`（URL プレビュー、`ClientServerService.ts:450`）**: API endpoint-list 外の web ルートで匿名から叩ける。本計画の範囲外としてよいか（外部 fetch 面は fetch-rss と同種。閉じるなら小差分で足せる）
6. **auth/session/*・app/create（サードパーティアプリのトークン発行フロー）**: 匿名から始まるフローのため、デフォルト拒否だと MiAuth/レガシー認可が死ぬ。エージェントのトークン発行を管理者発行（settings/API コンソール）に一本化するなら拒否のまま、セルフサービス発行を残すなら allowVisitor 付与。**提案: 拒否のまま**（招待制・閉鎖空間ではトークンは招待とセットで配る想定）

## AI実装の見積もり

- **セッション数: 2〜3**
  - S1: メタ拡張 + REST/WS 中央ゲート + 許可リスト注釈（15〜25ファイル、機械的）+ 抜け道穴埋め（§5）+ misskey-js 再生成
  - S2: e2e スナップショットテスト新設 + 既存 e2e の 401 期待書き換え（ここが最大の物量。匿名呼び出しテストの洗い出しに時間を食う）+ Playwright 手動検証
  - S3（バッファ）: レビュー指摘対応・フロント劣化の個別修正
- **難度: 中**。設計は knowhow で確定済みで一本道。リスクは (a) 既存 e2e の書き換え物量、(b) 非ログイン UI の想定外の API 依存の発見——いずれも機械的に潰せる類
- **依存**: 計画10（連合停止）が先行していること（AP 経由の匿名閲覧穴は本計画では塞がないため）。ただしコード上の衝突はなく、並行実装も可能（マージ順のみ 10 → 11 を推奨）
