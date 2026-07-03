---
title: ロール／ポリシー機構と成熟モデル実装経路
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# ロール／ポリシー機構と成熟モデル実装経路

## 発見した知見

### ロールの2形態と条件式

- `MiRole`（`packages/backend/src/models/Role.ts:179`）は `target: 'manual' | 'conditional'`。conditional は `condFormula`（jsonb）で判定
- **`createdLessThan` / `createdMoreThan`（秒指定）が既存**（`Role.ts:157-177`）——「アカウント作成から N 日」条件は追加実装不要。他に `notesMoreThanOrEq` / `followersMoreThanOrEq` / `isBot` / `roleAssignedTo` / and・or・not 等
- 条件評価は `RoleService.evalCond`（`RoleService.ts:246-333`）。作成日時は **user.id（AID）埋め込みタイムスタンプ**から取る（`user.createdAt` ではない）
- **conditional ロールはリクエスト毎に JIT 評価**され `role_assignment` テーブルに入らない。再評価ジョブは存在しない。時間経過で自動昇格する一方、「いつロールに入ったか」のログは残らず、`/admin/roles/users` は conditional では常に空

### ポリシー解決（getUserPolicies, RoleService.ts:383-402）

- `basePolicies = { ...DEFAULT_POLICIES, ...meta.policies }`（管理画面の「デフォルトポリシー」= `meta.policies`）
- priority 2 のポリシーだけがあればそれのみ → なければ priority 1 → なければ全ロール、の段階集約
- **集約は boolean = OR（some true）、数値上限系 = Math.max**（集約ロジックの実例は `RoleService.ts:412-459` の `calc(...)` 群）。つまり「制限を厳しくするロール」は priority を上げないと緩いロールに負ける。**直感に反するので実装時テスト必須**
- `getUserPolicies` は5分キャッシュ + 条件式都度評価（昇格遅延は最大5分程度と推測）

### 重要な不在

- **`canCreateNote` ポリシーは存在しない**。投稿封殺は `canPublicNote: false` による public→home 降格（silence、`NoteCreateService.ts:476`）のみ
- **承認制サインアップは存在しない**（grep で approval 系ゼロヒット。`MiUserPending` はメール確認待ち専用）
- 新ポリシー追加は: `RolePolicies` 型 + `DEFAULT_POLICIES` + `calc(...)` 集約 + enforcement 呼出点 + **misskey-js 再生成** のフルセットが必要

### サインアップ制御

- `meta.disableRegistration`（default true）で招待コード必須。`MiRegistrationTicket`（code / expiresAt / createdBy / usedBy）
- 招待発行: `invite/create`（`requiredRolePolicy: 'canInvite'`、`inviteLimit` / `inviteLimitCycle` / `inviteExpirationTime` ポリシー）
- モデレーター不在が続くと `CheckModeratorsActivityProcessorService` が自動で `disableRegistration: true` に切り替える副作用あり
- `NODE_ENV=test` では captcha と disableRegistration チェックが**完全スキップ**（e2e で招待制を検証できない）
- root ユーザー（`meta.rootUserId`）は `requiredRolePolicy` / `requireModerator` をバイパスする

## プロジェクトへの適用（イヴの時間・成熟モデル）

推奨経路:
1. デフォルトポリシー（`admin/roles/update-default-policies`）で新規標準を絞る
2. conditional ロール「成熟」（例: `createdMoreThan(7d) AND notesMoreThanOrEq(3)`）を priority 1 で緩め、必要なら「新規」ロールを priority 2 で絞る
3. 投稿回数そのものの段階制御は既存ポリシーでは表現できない → `RolePolicies` に専用ポリシー新設（`rateLimitFactor` の項は rate-limit-mechanics.md 参照）
4. 条件式ビルダー UI（`pages/admin/RolesEditorFormula.vue`）は createdMoreThan 等に対応済みでそのまま使える

## 注意点・制約

- `rateLimitFactor` は **大きいほど厳しい**（名前と逆方向）。集約が Math.max なので複数ロール兼務時は最も厳しい値が勝つ——「成熟で factor を下げる」設計は兼務で相殺されうる。要検証
- conditional ロール取得時の通知は飛ばない（assign 経由のみ）。昇格をユーザーに見せたいなら別途 fanout が必要
- バッジ（`getUserBadgeRoles`）は conditional でも自動反映される

## 参照

- `packages/backend/src/core/RoleService.ts`（DEFAULT_POLICIES: L36-130 / evalCond: L246-333 / getUserPolicies: L383-465（集約実例は L412-459）/ assign: L568-620）
- `packages/backend/src/models/Role.ts` / `Meta.ts`
- `packages/backend/src/server/api/SignupApiService.ts`
- 関連: [rate-limit-mechanics.md](rate-limit-mechanics.md)
