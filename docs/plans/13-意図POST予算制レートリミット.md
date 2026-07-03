---
trust: normal
responsiveness: relaxed
image_clarity: balanced
depends_on: 02-イヴの時間構想の実装計画策定.md
---

# 計画13: 意図POST予算制レートリミット

## 実装状況: 未着手

## 目的

イヴの時間構想・技術1「レートリミット = 人間速度」を実装する。

- **意図を伴う POST 系操作全般**——投稿・リプライ・リノート・リアクション付与・フォロー等——を**1つの共有予算**（例: 毎時5回）に含める
- 人間もエージェントも同一の制約を受ける。速度による区別を構造的に不可能にする
- ノートだけを制限するとリアクション等に表現が逃げるため、「意図の表明」単位で1予算にまとめる（構想の決定事項）
- 既読処理・ドライブ整理のような**機械的操作は対象外**

**この計画は基盤である。** 以下の後続計画がこの予算機構の上に乗る:

| 後続計画 | この計画への依存内容 |
|---|---|
| 計画14: Deliberation Gate（二相コミット + 残弾表示UI） | 残量照会（peek）API と予算消費の実行点 |
| 計画15: アカウント成熟モデル（Memory Gate） | ユーザーごとに予算値を変える解決フック |
| 計画16: 人口適応レートリミット | インスタンス全体の予算値を実行時に上下させる経路 |

したがって本計画では「毎時5回を強制する」ことよりも、**予算という概念（消費・照会・値の解決）を正しい場所に据えること**を優先する。

設計態度（構想「技術は舞台装置である」）: 完璧な強制力は求めない。固定ウィンドウの境界バースト等の理論的な穴は許容し、**破られても空間の性格（発言の希少性）が保たれること**を目標とする。

## 現状の挙動

### レートリミット実装本体

- `packages/backend/src/server/api/RateLimiterService.ts`（全94行）: npm `ratelimiter`（Redis INCR + EXPIRE の**固定ウィンドウ**）の薄いラッパ
- **`NODE_ENV !== 'production'` で常時無効**（`RateLimiterService.ts:36-38`）——開発環境で検証できない
- 2段構え: `minInterval`（キー `${actor}:${key}:min`、`RateLimiterService.ts:60-73`）と `duration`+`max`（キー `${actor}:${key}`、`RateLimiterService.ts:76-89`）
- `ratelimiter` は **peek 不可**: `.get()` を呼ぶと1消費される。「残り n 回」を消費なしで返す手段がない（残量照会 API はコードベース全体に不在）

### API 実行フローとフック点

- `ApiCallService.call()`（`packages/backend/src/server/api/ApiCallService.ts:297-453`）が**全 API の唯一の共通実行点**。ストリーミング API 経由の書き込みは存在しないため、ここにフックすれば漏れない（knowhow `rate-limit-mechanics.md` で確認済み）
- 既存 limit チェックは `ApiCallService.ts:315-348`。`ep.meta.limit` があるときのみ、actor（user.id または IP ハッシュ、`ApiCallService.ts:316-325`）に対して課す
- **rateLimitFactor**（`ApiCallService.ts:334`）: `getUserPolicies` から取得し、`duration: minInterval * factor` / `max: max / factor`（`RateLimiterService.ts:63,80`）——**factor が大きいほど厳しい**（名前の直感と逆）。**`factor = 0` は完全免除**（`ApiCallService.ts:336` の `factor > 0` 判定）
- 429 エラー: `RATE_LIMIT_EXCEEDED`（id `d5826d14-3982-4d2e-8011-b9e9f02499ef`、`ApiCallService.ts:340-345`）。`info` に `LimiterInfo`（total / remaining / reset / resetMs）が載る
- `Retry-After` ヘッダ: `#sendApiError`（`ApiCallService.ts:70-97`、resetMs 参照は L77-80）が `info.resetMs` の**存在を duck-typing で判定**して付与する。新エラーの `info` にも `resetMs` を含めれば追加実装なしで機能する

### エンドポイント定義

- `IEndpointMeta['limit']`（`packages/backend/src/server/api/endpoints.ts:54-77`）: `key?` / `duration` / `max` / `minInterval`。**単一枠**しか持てない（個別 limit と共有予算の両立には別パスが必要）
- `notes/create` は `duration: 1hour, max: 300`（`endpoints/notes/create.ts:23-26`）
- **`notes/reactions/create` には limit 定義が無い**（`kind: 'write:reactions'` のみ、`endpoints/notes/reactions/create.ts:19`）——現在**実質無制限**。本予算制で最も影響が大きいエンドポイント
- `meta.limit.key` の共有前例はゼロ（機構的には動くが誰も使っていない）

### サービス登録

- `RateLimiterService` は `ServerModule` の providers に登録され（`packages/backend/src/server/ServerModule.ts:78`）、`ApiCallService` にコンストラクタ注入されている（`ApiCallService.ts:52`）。新 Service も同じ経路で登録する

## 変更内容

### 1. IntentBudgetService の新設（自前カウンタ。既存 ratelimiter ラッパは使わない）

**新規ファイル**: `packages/backend/src/server/api/IntentBudgetService.ts`（SPDX ヘッダ必須）

既存 `RateLimiterService` / npm `ratelimiter` を使わない理由:

1. **peek（消費なし残量照会）が必須要件**——計画14 の残弾表示・本計画の照会 endpoint の両方で使う。`ratelimiter` は消費時にしか状態を返さない。knowhow の比較（Redis キー直読み / ライブラリ乗せ替え / 自前カウンタ）では**自前カウンタ Service 新設が中長期的に安全**と結論済み
2. `NODE_ENV !== 'production'` 無効化に巻き込まれない（後述の検証可能性）
3. 予算値の動的解決（計画15/16 の接続点）を自然に組み込める

実装方針:

- **固定ウィンドウ**を踏襲する（Redis `INCR` + 初回 `PEXPIRE`、Lua または MULTI でアトミックに）。境界バーストは理論上可能だが、舞台装置としては許容する（厳密化したくなったらウィンドウ方式ごと見直す。本計画ではやらない）
- Redis キー: `intentBudget:${userId}`（TTL = ウィンドウ長）。キー名を変えるとカウンタはリセット扱いになる点に注意
- 公開インターフェース（案）:

```ts
type IntentBudgetInfo = {
  limit: number;      // 現在の予算上限
  remaining: number;  // 残回数
  resetMs: number;    // ウィンドウリセット時刻（epoch ms）— #sendApiError の Retry-After が拾う名前に合わせる
};

class IntentBudgetService {
  consume(userId: string): Promise<{ ok: boolean; info: IntentBudgetInfo }>;
  peek(userId: string): Promise<IntentBudgetInfo>;
  resolveLimit(userId: string): Promise<{ max: number; durationMs: number; enabled: boolean }>;
}
```

- `resolveLimit()` が**計画15/16 の接続点**。予算値そのものを変える正規経路をここに一本化する。本計画の実装はインスタンス設定（後述の MiMeta カラム）を返すだけだが、後続計画との結合は以下のとおり確定させる（2026-07-03 相互整合レビューで調停済み）:
  - **内部実装者は `IntentBudgetService` 自身**。計画15 導入時は `RoleService`、計画16 導入時は `IntentPopulationService` への依存を `resolveLimit()` の内部に持つ。**`ApiCallService` 側は `resolveLimit()` の結果を使うだけで合成には関与しない**（計画15/16 が ApiCallService を触ることはない）
  - **合成規則**: `最終予算 max = min( ロール由来値（計画15 の policies.intentfulPostBudget。未導入時は ∞）, 人口ベースライン（計画16 の getCurrentBudgetMax()。未導入・無効時は Meta.intentBudgetMax にフォールバック） )`。人口値は全参加者共通の天井、ロール値は成熟度による個人上限。min 合成は順序非依存で説明可能
  - この規則により `Meta.intentBudgetMax` は計画16 導入後も「人口適応 OFF 時のベースライン」として意味を持ち続ける

### 2. フック点: ApiCallService.call() 一択

`ApiCallService.ts:315-348` の既存 limit チェックの**直後**に、別パスとして意図予算チェックを追加する:

```
if (ep.meta.intentful && user != null) {
  const result = await this.intentBudgetService.consume(user.id);
  if (!result.ok) throw new ApiError(INTENT_BUDGET_EXCEEDED, result.info);
}
```

- **既存の個別 limit（meta.limit）は残す**。minInterval 等は連打対策として引き続き有効。`meta.limit` が単一枠しか持てない問題は、別パスにすることで回避する（meta.limit.key 共有ハックは採らない）
- **actor は user.id のみ**。intentful 対象エンドポイントはすべて `requireCredential: true` であり、IP actor は考慮不要
- **factor（rateLimitFactor）はこの予算には通さない**。`ApiCallService.ts:334` の factor 取得を意図予算パスでは参照しない。理由: `factor = 0` 免除（`ApiCallService.ts:336`）や管理者・VIP ロールの緩和が「人間もエージェントも同一制約」の抜け穴になるため。予算値を変えたい場合は `resolveLimit()` 経由（計画15/16 の正規経路）のみとする。root ユーザーも例外にしない（構想ルール2: モデレーターすら例外ではない）
- **消費タイミングは exec 前・失敗時返金なし**を推奨する。exec 後に消費すると成功判定と加算の間にレースが生じ、返金機構は複雑さに見合わない。バリデーションエラーで1回失うのは UX 上の痛みだが、計画14 の二相コミット（確認段階でパラメータ検証できる）が実質的な緩和策になる。→ 異論があれば要オーナー確認へ

### 3. 対象エンドポイントの決め方: `intentful` フラグ vs kind ベース判定

| 方式 | 内容 | 評価 |
|---|---|---|
| **A. `intentful?: boolean` を IEndpointMeta に追加**（推奨） | `endpoints.ts:11-108` の `IEndpointMetaBase` にフィールドを足し、対象エンドポイントの meta に明示的に書く | 対象が grep 可能・レビュー可能。1エンドポイントずつ意図的に選定でき、構想の「意図の表明かどうか」という**意味的な基準**をコードに写せる |
| B. `kind: 'write:*'` ベースで判定 | `ApiCallService` で `ep.meta.kind?.startsWith('write:')` を見る | `write:*` は182件あり、既読処理・ドライブ整理等の機械的操作を大量に含む。kind は OAuth 権限の粒度であって意図の粒度ではない（例: `write:notes` は投稿と下書き操作を区別しない）。除外リストの管理が地獄になる |

**A を推奨**。デフォルト挙動が「対象外」なので、新エンドポイント追加時に意図せず予算対象になる事故もない（逆の漏れ——対象にすべきものへの付け忘れ——はレビューで拾う。`intentful: true` の全量は grep 一発で監査できる）。

#### 対象候補（`intentful: true` を付ける）

「意図の表明 = 他者に向けた能動的な表現・関係構築」を基準とする:

| エンドポイント | 備考 |
|---|---|
| `notes/create` | 投稿・リプライ・リノート・引用のすべてがここを通る（renote は renoteId パラメータ）。既存の 300/h 個別 limit は残置でよい（予算の方が圧倒的に厳しい） |
| `notes/reactions/create` | **現在 limit 無し（実質無制限）**。表現の逃げ先として最重要 |
| `following/create` | 関係構築の意図表明 |
| `following/requests/accept` / `reject` | フォロリク応答も関係の意思決定（境界寄り。迷えば要確認へ） |
| `chat/messages/create-to-user` / `create-to-room` | チャット発言。ただし予算設計に大きく影響（境界例参照） |
| `chat/messages/react` | チャット版リアクション |
| `pages/like` / `gallery 系 like` | 公開の評価表明 |
| `renote 相当の操作全般` | notes/create に集約済みのため個別対応不要 |

#### 対象外（機械的操作・自己管理操作）

- `write:admin:*` 全件（管理操作。ここを縛るとモデレーション自体が予算に食われる）
- 既読処理: `i/read-announcement`、`notifications` 系 mark-read、`chat/read-all` 等
- ドライブ整理: `drive/files/*`、`drive/folders/*`（アップロード自体は表現でなく、表現は添付先の notes/create で消費される）
- ミュート・ブロック等の自衛操作: `mute/*`、`blocking/*`、`notes/thread-muting/*`（自衛に予算を要求すると弱い立場ほど不利になる）
- **取り消し系**: `notes/delete`、`notes/unrenote`、`notes/reactions/delete`、`following/delete`、`chat/messages/delete`（撤回は新たな意図の表明ではなく責任の引き取り。撤回に課金すると「消せないから放置」を誘発する）
- 下書き: `notes/drafts/*`（公開されない）
- 認証・アカウント管理: `i/2fa/*`、`i/regenerate-token` 等

#### 境界例（→ 要オーナー確認へ送る。下記「要オーナー確認」参照）

- `clips/add-note`（キュレーションは意図か整理か）
- `notes/polls/vote`（投票は意図の表明だが、参加行為を渋らせたくない面もある）
- チャット全体の扱い（毎時5回予算にチャットを含めると会話が成立しない）
- `i/update`（プロフィール変更）・`notes/favorites/create`（お気に入りは非公開）

### 4. 予算値: 固定値ではなく設定可能パラメータ

「毎時5回」は構想でも**例**の扱い。値の決定は運用に委ねる（計画02「迷ったときの補足」）。

**MiMeta（`packages/backend/src/models/Meta.ts`）に新カラムを追加**する:

| カラム | 型 | デフォルト | 意味 |
|---|---|---|---|
| `intentBudgetEnabled` | boolean | `false` | 予算制の有効/無効 |
| `intentBudgetMax` | integer | `5` | ウィンドウあたりの予算 |
| `intentBudgetDurationMs` | bigint | `3600000`（1時間） | ウィンドウ長 |

- config ファイルでなく **Meta（DB）にする理由**: 計画16（人口適応）が**実行時に自動で値を書き換える**必要があるため。config は再起動が要る
- 変更は既存 `admin/update-meta` / `admin/meta` を拡張（paramDef / res に3項目追加）。コントロールパネル UI への項目追加は任意（オーナーは API 直叩きでも設定できる。UI は計画14 とまとめてもよい）
- **migration 新規作成が必要**（新タイムスタンプ、`up()` / `down()` 両方実装、`pnpm --filter backend check-migrations` 通過）

### 5. 専用エラーコード

既存 `RATE_LIMIT_EXCEEDED` とは**別のコード**を切る:

- code: `INTENT_BUDGET_EXCEEDED`、HTTP 429、id は新規 UUID
- `info` に `{ limit, remaining: 0, resetMs }` を載せる → `#sendApiError`（`ApiCallService.ts:77-80`）の duck-typing により `Retry-After` ヘッダが自動で付く
- 区別する理由: 既定 300/h から毎時数回への激減は既存クライアントに 429 を踏ませる。UI（計画14 の残弾表示・専用ダイアログ）が「連打しすぎ」と「今日の言葉を使い切った」を判別できる必要がある（knowhow の推奨どおり）

### 6. 残量照会エンドポイント

**新規ファイル**: `packages/backend/src/server/api/endpoints/i/intent-budget.ts`（SPDX ヘッダ必須）

- `requireCredential: true` / `kind: 'read:account'` / `allowGet: true`
- **read-only**: `IntentBudgetService.peek()` を呼ぶだけで予算を消費しない
- res（案）: `{ enabled: boolean, limit: number, remaining: number, resetMs: number }`
- `endpoint-list.ts` への登録（`export * as 'i/intent-budget' from ...`）を忘れない
- 計画14（残弾表示 UI・「残り n 回。実行しますか？」）がこの endpoint を叩く

### 7. dev 環境での検証可能性

- 既存 `RateLimiterService` は `NODE_ENV !== 'production'` で無効（`RateLimiterService.ts:36-38`）だが、**IntentBudgetService には NODE_ENV による無効化を入れない**
- 有効/無効は `intentBudgetEnabled`（Meta、デフォルト false）**のみ**で制御する。これにより:
  - dev / test 環境でも Meta フラグを立てれば実挙動を検証できる（検証用フラグの追加という要件を、環境変数でなく設定フラグで満たす）
  - デフォルト false なので、マージ直後に既存の開発フロー・e2e テストを壊さない（段階導入）
  - 本番での ON/OFF も再起動なしで切り替えられる（ロールバック容易）

## 影響範囲

| 項目 | 要否 | 内容 |
|---|---|---|
| **misskey-js 再生成** | **必須** | 新 endpoint `i/intent-budget`、`admin/update-meta` / `admin/meta` の項目追加。`pnpm build-misskey-js-with-types` を実行し `packages/misskey-js/src/autogen/` の差分をコミットに含める |
| **migration** | **必須** | MiMeta へのカラム3本追加。新タイムスタンプで新規ファイル、`up()`/`down()` 実装、`pnpm --filter backend check-migrations` 通過 |
| **フロントエンド** | 本計画では**ほぼ無し** | 残弾表示・専用エラーダイアログは計画14 の管轄。本計画では `INTENT_BUDGET_EXCEEDED` は汎用エラーダイアログで表示される（暫定として許容）。コントロールパネルへの設定 UI 追加は任意 |
| backend 型・共通コード | 中 | `IEndpointMetaBase` への `intentful` 追加、`ApiCallService.call()` 改造、`ServerModule` への Service 登録、対象エンドポイント十数件の meta へ `intentful: true` 追加 |
| CHANGELOG | 必須 | `## Unreleased` の `### Server` に追記 |
| locale | 不要（本計画では） | UI 文言は計画14 で `ja-JP.yml` に追加 |

実装時は `working-on-backend` スキルを参照すること（AGENTS.md 絶対禁止事項13）。

## テスト方針

backend e2e（`pnpm --filter backend test:e2e`。事前に `cp .github/misskey/test.yml .config/test.yml`）を主軸にする。IntentBudgetService は NODE_ENV に依存しないため、**test 環境でそのまま実挙動を検証できる**（既存 RateLimiterService では不可能だった検証）。

1. **消費と枯渇**: `admin/update-meta` で `enabled: true, max: 2, duration: 短時間` に設定 → `notes/create` 2回成功 → 3回目が `INTENT_BUDGET_EXCEEDED`（429、Retry-After ヘッダあり）
2. **予算の共有**: `notes/create` 1回 + `notes/reactions/create` 1回で max 2 を使い切る（別カウンタになっていないこと）
3. **対象外の非消費**: 既読処理・`notes/delete` 等が予算を消費しないこと
4. **peek の非消費**: `i/intent-budget` を何度呼んでも remaining が減らないこと。消費後に remaining が正しく減ること
5. **factor 非適用**: `rateLimitFactor: 0`（既存 limit 完全免除）のロールを付与したユーザーでも予算が課されること（**抜け穴防止の要のテスト**）。root ユーザーでも同様
6. **無効時の素通り**: `intentBudgetEnabled: false` で一切課されないこと（デフォルト挙動の確認）
7. **ウィンドウリセット**: 短い duration でリセット後に remaining が回復すること
8. **unit test**: IntentBudgetService 単体（consume/peek のアトミック性、TTL 設定）
9. **check-migrations**: pending DDL 0 件
10. 仕上げに `pnpm lint` / `pnpm build`

既存 e2e への回帰: デフォルト false のため原則影響なし。万一 429 を踏むテストが出たら該当テストの setup を確認する。

## 破壊的変更の許容範囲

upstream 追従は放棄済み（2026-07-03 決定）。以下を躊躇なく行う:

- `IEndpointMetaBase` / `ApiCallService.call()` という全 API 共通基盤の改造
- 既存クライアント（サードパーティ含む）が新 429 を踏むこと。この空間は閉鎖・招待制のワンオフ品であり、汎用クライアント互換は目標でない
- `notes/create` の既存 300/h という前提の実質的な無効化（個別 limit 自体は残すが、予算の方が支配的になる）
- ただし**デフォルト無効（`intentBudgetEnabled: false`）でマージする**ため、マージ即時の挙動変化はゼロ。有効化はオーナーの操作で行う——舞台の幕はオーナーが上げる

## 要オーナー確認

実装着手前に確定が必要なもの（回答は `.claude/Questions.md` 経由でも可）:

1. **チャットの扱い**: `chat/messages/create-to-*` を毎時5回予算に含めると会話が成立しない。選択肢: (a) チャットも同一予算（チャットは実質使わない空間になる） (b) チャット機能自体を無効化する（構想は公開タイムラインの空間） (c) チャットは対象外（表現の逃げ先になるリスクを受容） (d) 別予算枠。**推奨: (b) または (a)**——「1つの予算」の原則を守りつつ、逃げ先を作らない
2. **境界エンドポイントの裁定**: `clips/add-note` / `notes/polls/vote` / `i/update`（プロフィール変更）/ `notes/favorites/create`（非公開お気に入り）をそれぞれ対象に含めるか。**推奨: vote は対象、clips/favorites/i-update は対象外**（公開の場への表明かどうかで線を引く）
3. **取り消し系の扱い**: delete / unreact / unfollow を対象外とする方針でよいか（上記「対象外」の理由参照）
4. **失敗時の返金なし**でよいか（バリデーションエラーでも1消費。計画14 の二相コミットで実質緩和される見込み）
5. **デフォルト値**: `max: 5` / `duration: 1h` / `enabled: false` で起票してよいか（すべて後から変更可能）
6. **フォロー関連の粒度**: `following/create` は対象とするが、`requests/accept・reject` まで含めるか

## AI実装の見積もり

- **AI セッション数: 1〜2 セッション**
  - セッション1: IntentBudgetService + ApiCallService フック + Meta migration + エラーコード + `i/intent-budget` + 対象エンドポイントへの `intentful` 付与 + misskey-js 再生成
  - セッション2（必要なら）: e2e テスト群の整備と品質ゲート（lint / build / check-migrations / レビュー対応）
- **難度: 中**。変更点は多岐（Service 新設・共通実行点改造・migration・endpoint 新設・meta 型拡張）だが、各要素は既存パターンの踏襲であり、フック点が `ApiCallService.call()` 一点に集約されているため設計リスクは低い。最大の落とし穴は (a) factor を誤って予算に通す、(b) `endpoint-list.ts` 登録漏れ、(c) misskey-js 再生成漏れ、(d) Retry-After 用の `resetMs` フィールド名ミス——いずれもテスト方針 5 と品質ゲートで検出できる

## 参照

- 構想: `イヴの時間構想.md` 技術1（レートリミット = 人間速度）・設計態度（舞台装置）
- 親計画: `docs/plans/02-イヴの時間構想の実装計画策定.md`（分解表 C）
- knowhow: `docs/knowhow/rate-limit-mechanics.md`（一次資料）/ `docs/knowhow/role-policy-mechanics.md`（rateLimitFactor の罠）
- 後続: 計画14（Deliberation Gate）/ 計画15（成熟モデル）/ 計画16（人口適応）
