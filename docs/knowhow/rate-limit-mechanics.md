---
title: レートリミット機構と意図POST予算制の実装ポイント
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# レートリミット機構と意図POST予算制の実装ポイント

## 発見した知見

### 実装本体

- `packages/backend/src/server/api/RateLimiterService.ts`（94行）。npm `ratelimiter`（Redis INCR+EXPIRE の**固定ウィンドウ**）の薄いラッパ。Sharkey の SkRateLimiterService（リーキーバケット）は不在
- 2段構え: `minInterval`（最小間隔、キー `${actor}:${key}:min`）と `duration`+`max`（長期、キー `${actor}:${key}`）を別 Redis キーでチェック
- **`NODE_ENV !== 'production'` では常時無効**（L36-38）——開発環境で動作検証できない。検証には別フラグの追加が要る

### エンドポイント定義と共有キー

- `IEndpointMeta['limit']`（`endpoints.ts:54-77`）: `key?`（省略時 endpoint 名）/ `duration` / `max` / `minInterval`
- `ApiCallService.call()`（`ApiCallService.ts:297-453`）が**全 API の唯一の共通実行点**。limit チェックは L315-348。ストリーミング API 経由の書き込みは存在しないため、ここにフックすれば漏れない
- endpoints 配下で `meta.limit.key` を共有する前例はゼロ（signin 系の直接呼び出しのみ）。機構的には動くが自分で始めるパターン
- **`notes/reactions/create` には limit 定義が無い**（実質無制限）。意図POST予算制で最も影響が大きいエンドポイント
- 個別 limit と共有バケットを両立するには、meta.limit が単一枠しか持てないため ApiCallService で2回チェックする改造が必要

### rateLimitFactor の向き（要注意）

- `duration: minInterval * factor`、`max: max / factor` —— **factor が大きいほど厳しい**（名前の直感と逆）
- `factor = 0 は完全免除`（`ApiCallService.ts:336` の `factor > 0` 判定）
- 「人間もエージェントも同一制約」を守るなら、**共有バケットには factor を通さない**（管理者・VIP ロールが自動緩和を受ける抜け穴になるため）

### 429 レスポンスの現状

- `RATE_LIMIT_EXCEEDED`（id: `d5826d14-...`、HTTP 429）。`info: { total, remaining, reset, resetMs }` がボディに載る
- **Retry-After ヘッダは機能する**: `#sendApiError` が `info.resetMs` を参照して秒換算で付与する。`ratelimiter@3.4.1` の LimiterInfo は `resetMs` を含む（node_modules ソースおよび @types/ratelimiter で確認済み。※初回調査で「resetMs が存在せず壊れている」と誤認した経緯があるため、この項目は訂正済み）
- `X-RateLimit-*` 系ヘッダは一切なし

### 残量照会 API は存在しない

- `ratelimiter` は消費時にしか状態を返さず、peek 不可（`.get()` を呼ぶと1消費される）
- 「残り n 回」を返すには: ①Redis キー直読み（内部キー名依存で upgrade に弱い）②ライブラリ乗せ替え ③自前カウンタ Service 新設、のいずれか。**自前カウンタが中長期的に安全**

## プロジェクトへの適用（イヴの時間・意図POST予算制）

- 実装位置は `ApiCallService.call()` 一択。meta 型に `intentful?: boolean` 等を追加し、既存個別 limit チェックとは別パスで共有バケットを課す
- 意図POST候補: `notes/create` / `delete` / `unrenote`、`notes/reactions/create` / `delete`、`notes/favorites/*`、`following/*`、`notes/polls/vote`、`channels/follow` 等（`kind: 'write:*'` は182件あり全部ではない。`write:admin:*` は除外）
- Deliberation Gate（残弾表示）には残量照会が必須 → 自前カウンタ Service + `i/rate-limit-status` 的な read-only endpoint 新設が定石
- 既定の `notes/create` は 300/h。毎時数回への削減は既存クライアントに 429 を踏ませる——専用エラーコードを切って UI が判別できるようにするのが望ましい

## 注意点・制約

- 固定ウィンドウなので境界バースト（窓末尾 max 回+直後 max 回）が理論上可能。厳密さが要るならウィンドウ方式ごと見直す
- キー名を変えるとカウンタはリセット扱い（旧キーは TTL で自然消滅）

## 参照

- `packages/backend/src/server/api/RateLimiterService.ts`
- `packages/backend/src/server/api/ApiCallService.ts:297-453`（factor: L334-338 / 429: L339-346 / ヘッダ: L70-97）
- `packages/backend/src/server/api/endpoints.ts:54-77`
- 関連: [role-policy-mechanics.md](role-policy-mechanics.md)（rateLimitFactor の集約仕様）
