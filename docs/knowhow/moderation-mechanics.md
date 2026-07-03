---
title: モデレーション機構と AI モデレーター／追放刑の実装ポイント
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# モデレーション機構と AI モデレーター／追放刑の実装ポイント

## 発見した知見

### 権限とボット運用

- モデレーター権限はロールの `isModerator` フラグ + `role_assignment`。**bot アカウントに moderator ロールを assign すれば API 権限は付く**
- `admin/*` エンドポイントは細粒度スコープ（`read:admin:*` / `write:admin:*` 計42種、`misskey-js/src/consts.ts:50-137` に他の一般権限と混在して列挙）を持ち、アクセストークン（`MiAccessToken.permission`）で最小権限化できる
- **通報のリアルタイム受信が可能**: `wss://host/streaming?i=<token>` で `admin` channel（kind: `read:admin:stream`）を購読すると `newAbuseUserReport` が飛ぶ。AI モデレーターのプッシュ型パイプラインが既存機構で組める
- ネイティブトークン（user.token）はスコープ制約が効かない。bot は必ず MiAccessToken 経由にする

### 通報（abuse report）

- `MiAbuseUserReport`: reporter / targetUser / comment(2048) / resolved / resolvedAs。**ノートIDフィールドは無い**（comment テキストのみ）——AI が判定材料を得るには運用かフィールド追加が要る
- 解決は `admin/resolve-abuse-user-report`。**自動処理フックは存在しない**（手動前提）
- resolve は adminStream に流れない（SystemWebhook のみ）。AI が先取り解決すると人間モデレーターの UI に既読が伝わらない——AI 併用時は解決通知の追加が要る

### 処罰プリミティブと凍結の実効

- suspend（`requireModerator`）/ silence（実体は `canPublicNote: false` の public→home 降格のみ）/ ノート削除 / ドライブ全削除 / delete-account（**requireAdmin**、物理削除で不可逆）
- **凍結（isSuspended）で止まるもの**: サインイン、requireCredential 系 API 全部（403）、WebSocket、TL 露出（SQL/FTTL 両方でフィルタ）、検索、SSR/フィード/AP 表現（404 化）
- **凍結でも残るもの**: DB 上のノート・プロフィール。非ログイン閲覧は可能（＝「非ログイン相当への降格」に近い挙動が既にある）
- **suspend はフォロー関係を破壊し unsuspend で復元されない**——誤検知からの復帰が不可逆損失を生む。AI モデレーターの誤判定リスクと相性が悪い

### 追放刑の設計材料

- 「発言権喪失 + 非ログイン相当の閲覧 + プロフィール・過去ログは残る」は **suspend が最も近い**。delete-account は 404 化するので「声だけ奪う」要件には過剰
- 蓄積実績（ロール・バッジ）の剥奪は UserSuspendService がロールを触らないため別途 `role_assignment` 全削除が要る
- 専用プリミティブ「exile」を作るなら: `MiUser.isExiled` フラグ + ApiCallService での拒否 + moderationLog type 追加（`types.ts:82-138` + misskey-js 同期）
- **ガード**: `suspend-user.ts:45-47` で「モデレーターは凍結できない」。root は原理的に追放不可能。AI 同士・AI→人間モデレーターの処罰経路は設計時に要検討
- 管理者への通報は禁止（`users/report-abuse.ts:65-71`）——AI モデレーターを `isAdministrator` にすると通報できなくなる。**isModerator に留めるのが正解**

### モデレーションログ

- `moderation_log`（type: varchar(128) + info: jsonb、追記のみ・訂正 API なし）。AI の判断根拠・確信度は info jsonb に自由に詰められる
- createdAt カラムは無く id（AID）から日付を得る

## プロジェクトへの適用（イヴの時間・技術6）

- MVP 経路: bot アカウント + moderator ロール + スコープ絞りトークン + admin stream 購読 → 通報を受けて判定 → suspend/resolve を REST で実行。**コア機構はすべて既存**
- 「記憶を持つモデレーター」の記憶部分（過去パターン参照）は Misskey 外（エージェントハーネス側）の責務。Misskey 側は moderationLog の info jsonb に判断根拠を残すことで監査可能性を担保
- 追放刑は suspend ベースで開始し、実績剥奪（ロール削除）を足した合成オペレーションとして実装するのが最小。専用 exile プリミティブは運用で不足を感じてから

## 注意点・制約

- モデレーション機構に MISTEMS 固有パッチは無い（upstream 素のまま。grep 確認済み）
- `read:admin:stream` は misskey-js の permissions 定数に未収載——公式 UI の同意画面に出ない。consts.ts への追記が必要
- suspend のフォロー関係破壊は「異議申立てが通ったら完全復元」を不可能にする。イヴの時間の異議申立てプロトコルを作るなら、suspend の代わりに可逆な拒否（exile フラグ等）を最初から検討する価値がある

## 参照

- `packages/backend/src/core/UserSuspendService.ts` / `AbuseReportService.ts` / `ModerationLogService.ts`
- `packages/backend/src/server/api/ApiCallService.ts:350-425`
- `packages/backend/src/server/api/stream/channels/admin.ts` / `StreamingApiServerService.ts:36-100`
- `packages/backend/src/server/api/endpoints/admin/suspend-user.ts:45-47`
- `packages/backend/src/types.ts:82-380`
- 関連: [role-policy-mechanics.md](role-policy-mechanics.md) / [visitor-visibility-mechanics.md](visitor-visibility-mechanics.md)
