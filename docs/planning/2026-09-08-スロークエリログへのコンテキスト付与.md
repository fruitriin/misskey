# スロークエリログにコンテキストを付与する計画（AsyncLocalStorage + 決め打ちパース）

## 背景・課題

- 本番の `packages/backend/src/postgres.ts` は `maxQueryExecutionTime: 300` により
  スロークエリ検知自体は生きているが、`const log = process.env.NODE_ENV !== 'production'`
  （260行目）により `logger` が本番では `undefined` になり、`MyCustomLogger.logQuerySlow`
  自体が呼ばれず、スロークエリが**アプリ側ログに一切残らない**
- 有効化しても現状の `MyCustomLogger`（`truncateSql`、100文字切り詰め）では
  `SELECT` 句しか残らず、`FROM`/`WHERE` が失われて「何のクエリか」が分からない。
  単純な文字数切り詰めの有効化は無意味と判断（切り詰めるくらいならログを出さない方がマシ）
- `disableQueryTruncation` / `enableQueryParamLogging` はいずれも upstream 本体の実装
  （切り詰め機能: 2019年 PR#4572 の本体実装、2025年 PR#15268 で truncation 制御を追加）
  であり、MISTEMS 固有の改造ではない
- 欲しい情報は「エンドポイント名・メソッド名・FROM・WHERE」。これが揃えば、
  短い1行でも「どの機能の・どんな条件のクエリが重かったか」の当たりがつく

## 設計方針

### 1. コンテキストの伝搬（AsyncLocalStorage）

`logQuerySlow(time, query, parameters, queryRunner)` の引数を遡っても、呼び出し元
（TypeORM 内部の `QueryRunner.query()`）は SQL 文字列・パラメータ・実行時間・
QueryRunner 自身しか持っておらず、HTTP リクエストやキュージョブのコンテキストへ
辿る経路は存在しない（`QueryRunner.data` という汎用フィールドはあるが、
`Repository`/`QueryBuilder` 経由の通常呼び出しでは TypeORM が QueryRunner を
暗黙に取得・解放するため、アプリケーションコードがそこに触れる機会がない）。

このため、Node.js 標準の `AsyncLocalStorage` で「外側が先にセットしたコンテキスト
文字列を、内側の非同期チェーンのどこからでも後乗りで読む」経路を新設する。

```ts
// packages/backend/src/misc/query-log-context.ts (新規)
import { AsyncLocalStorage } from 'node:async_hooks';

export const queryLogContext = new AsyncLocalStorage<string>();

export function runWithQueryLogContext<T>(context: string, fn: () => T): T {
	return queryLogContext.run(context, fn);
}
```

**中間表現は文字列1本。** HTTP・キューの由来を問わず同じ型で扱う。都合の良いことに、
両方の入口は既に OpenTelemetry の span 名として同形式の文字列を組み立て済み：

- HTTP: `ApiCallService.ts` の `handleRequest`（168行目）/ `handleMultipartRequest`
  （229行目）— `this.telemetryService.startSpan('API: ' + endpoint.name, cb)` の
  `cb` を `() => runWithQueryLogContext('API: ' + endpoint.name, cb)` で包むだけ
- キュー: `queue-job-runner.ts` の `runQueueJob`（17行目）— 各 Processor 側で
  組み立て済みの `spanName`（例: `'Queue: System: ' + job.name`）をそのまま
  `runWithQueryLogContext(spanName, () => processJob())` に渡すだけ。
  全キュー入口がこの1関数に集約されているため、`QueueProcessorService.ts` 側や
  個別 Processor の変更は不要

`MyCustomLogger.logQuerySlow` 側は由来を一切気にせず
`queryLogContext.getStore() ?? 'unknown'` を先頭に付けるだけでよい
（`'API: '`/`'Queue: '` の prefix は文字列に元から含まれているので、由来の区別は
その文字列を見れば分かる。ログ出力側に分岐は不要）。

### 2. クエリ本体の整形（決め打ちパース + フォールバック）

対象クエリの構造を事前調査した結果、TypeORM が生成する重いクエリは
「主 `FROM` 1回 + `WHERE` 句内に `(SELECT ... FROM ...)` 形のネストしたサブクエリが
多数」という形が支配的で、汎用的な正規表現1発では内側のネストに引っかかって
誤爆する。一方で、実際にスロークエリになりやすく・発生頻度も高いクエリは
以下の2系統にほぼ集約できる（詳細は「事前調査サマリ」参照）。

- **(1) タイムライン系**: `notes/timeline.ts` / `hybrid-timeline.ts` /
  `local-timeline.ts` / `global-timeline.ts` / `user-list-timeline.ts` /
  `channels/timeline.ts` / `antennas/notes.ts`。ベーステーブルは全て `note` 1つ、
  JOIN 差分（user/reply/renote、`user_list_membership`、`channel`）はあるが
  実用上は1パターンとして扱ってよい
- **(2) `notes/search` の DB 直投げパス**: `fulltextSearch.provider` が
  `sqlLike`/`sqlPgroonga` のときのみ Postgres に LIKE/pgroonga 演算子を直投げし、
  これがスロークエリログに乗る（`meilisearch` 経由は既に ID 絞り込み済みで
  対象外）

この2系統について、**パラメータ展開前（プレースホルダ `$1` のまま）の query
文字列に対して、括弧の対応を数えながら最上位レベルの `FROM`/`WHERE` だけを抜き出し、
ネストしたサブクエリは `(nested)` のように畳んで省略表示する**軽量ロジックを書く。
外部 SQL パーサーライブラリ（`node-sql-parser`/`pgsql-parser`等）は導入しない
（新規依存追加のメンテコスト・TypeORM生成SQLとの方言相性リスクを避け、目的が
「デバッグ用の短い要約」である以上オーバースペックと判断）。パースに失敗した場合や
想定外の構造だった場合は、素直に既存どおり生のクエリ文字列を出す。

上記2系統に該当しない**一般エンドポイント・キュー処理由来のクエリ**は、精密な
FROM/WHERE 抽出をせず、`SELECT` 句を圧縮する程度の雑な処理で十分とする。
根拠は次の2条件が揃うため：

1. AsyncLocalStorage 経由でエンドポイント名（またはキュー名）は既にログに残る
2. DB 側（`auto_explain` 等）でスロークエリの詳細ログが別途取得・EXPLAIN 可能な
   状態になっている（3台とも設定済み・運用実績あり）

つまり「どの機能で・重かったことは分かるが、クエリの詳細は必要なら DB 側ログを
見ればよい」という役割分担にする。

### 3. 本番での有効化

`postgres.ts` 260行目 `const log = process.env.NODE_ENV !== 'production'` により
`logger: undefined` となる現状の分岐を見直し、本番でも `logQuerySlow` が実行される
状態にする。通常の `logQuery`（全クエリログ）・`logQueryError` を本番で有効化する
必要はない（ノイズになるだけ）ため、`logger` 自体は常に登録しつつ、
`logQuery`/`logQueryError` は `logging: log` の設定値を見て no-op にする、といった
形を想定。TypeORM の `logging` オプションと `logger` インスタンスの組み合わせの
実際の挙動（`logging: false` でも `logger.logQuerySlow` が呼ばれるか）は
実装フェーズで検証する。

## スコープ

- MISTEMS 限定の運用改善（upstream への PR 化はしない）
- 対象: `packages/backend/src/postgres.ts`、新規
  `packages/backend/src/misc/query-log-context.ts`、
  `packages/backend/src/server/api/ApiCallService.ts`、
  `packages/backend/src/queue/queue-job-runner.ts`
- 対象外: 決め打ちパース対象を2系統以上に広げること（将来、実測で他のクエリが
  スロークエリの主要因になった場合に追加検討）

## 事前調査サマリ（実施済み・実装時の参照用）

- タイムライン系のクエリ構造調査（`QueryService.ts` の共通フィルタ関数群、
  `generateVisibilityQuery`/`generateBaseNoteFilteringQuery`等）で、ホームTL
  相当のクエリは WHERE 句中に `(SELECT ... FROM ...)` 形のネストが
  約20個並ぶことを確認済み
- `CleanRemoteNotesProcessorService.ts` に `WITH RECURSIVE` + `FROM (subquery)`、
  `CustomEmojiService.ts` に FROM 句自体のネストが存在することも確認済み
  （いずれも決め打ちパース対象外、フォールバックでカバー）
- `logQuerySlow` の呼び出し元（TypeORM 1.1.0, 各ドライバの `QueryRunner.query()`
  末尾）、`QueryRunner.data` の存在と実用不可な理由、`ApiCallService.ts`/
  `queue-job-runner.ts` の具体的な行番号は本文中に記載済み

## 懸念・リスク

- 括弧バランスのパースが崩れるケース（コメント内の括弧、文字列リテラル内の
  括弧等）→ パース失敗時は生クエリ出力にフォールバックするため実害は限定的
- `AsyncLocalStorage.run()` を全 HTTP リクエスト・全キュージョブに追加で1枚
  被せることによるオーバーヘッド → Node.js 標準機能で軽量、他プロジェクトでも
  リクエストスコープの定番手段のため許容範囲と判断
- 本番 `logger` 常時有効化に伴う既存動作への影響（`logging: log` の分岐と
  `logger` インスタンスの組み合わせ）→ 実装フェーズで要検証
