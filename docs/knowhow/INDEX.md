# Knowhow Index — MISTEMS

> 自動生成。`/addf-knowhow-index reindex` で再生成できる。
> ADDF フレームワーク由来のノウハウは [`ADDF/`](ADDF/) 配下にあり、[INDEX.addf.md](INDEX.addf.md) が索引を担当する。

## リポジトリ・統合運用

| 鮮度 | ファイル | 要約 | キーワード |
|---|---|---|---|
| 🟢 2026-07-03 | [repo-structure.md](repo-structure.md) | pnpm monorepo のパッケージ構成と backend/frontend の責務地図。CI は mistems-main push では発火しない | packages/backend, packages/frontend, misskey-js, NoteCreateService, RoleService, FanoutTimelineService, ApiCallService, endpoints, core/activitypub, router.definition.ts, os.ts, build-misskey-js-with-types |
| 🟢 2026-07-03 | [mistems-integration-flow.md](mistems-integration-flow.md) | mistems-main は develop から毎回作り直す使い捨てブランチ。main-統合.sh の squash merge 積み上げ・rerere・MISVER 採番の統合フロー | mistems-main, main-統合.sh, mistems-readme, git merge --squash, git rerere, reset --hard, MISVER, squash-prep, CHANGELOG破棄, 機能ブランチ |
| 🟢 2026-07-03 | [mistems-feature-inventory.md](mistems-feature-inventory.md) | MISTEMS.96 時点の upstream に無い独自機能・修正の棚卸し。改造が厚い領域（チャンネルUI・投稿フォーム・絵文字ピッカー・検索）の衝突注意 | MkChannelIndex.vue, channelIndex, FavstarAndTimemachine, mkPostFormExtend, search-enhance, hashtag-mutable, mkNoteExtend, use-timemachine, block-mentions-from-unfamiliar, 独自改造一覧 |

## Misskey 機構調査（イヴの時間）

| 鮮度 | ファイル | 要約 | キーワード |
|---|---|---|---|
| 🟢 2026-07-03 | [channel-mechanics.md](channel-mechanics.md) | チャンネルは強制 public + localOnly で LTL/GTL 非混入・連合非搭乗。空間分割への適性は高い。削除はノート CASCADE 物理削除 | MiChannel, channelId, localOnly強制, channelTimeline, canCreateChannel, isArchived, ChannelFollowing, requireCredential: false, channel-column.vue, CASCADE削除 |
| 🟢 2026-07-03 | [federation-shutdown.md](federation-shutdown.md) | Meta.federation: 'none' で連合は既存設定でほぼ完全停止できる。nodeinfo 直リンク・deliver enqueue・管理UIからの再有効化が残る抜け穴。物理削除は非推奨 | Meta.federation, isFederationAllowedHost, ActivityPubServerService, WellKnownServerService, NodeinfoServerService, ApDeliverManagerService, ugcVisibilityForVisitor, update-meta, 閉鎖インスタンス |
| 🟢 2026-07-03 | [visitor-visibility-mechanics.md](visitor-visibility-mechanics.md) | 非ログイン閲覧の現状は穴だらけ（ugcVisibilityForVisitor 参照は5経路のみ）。API レベル制限は allowVisitor 中央ゲート方式が本命。embed/feed/キャッシュの抜け道一覧 | requireCredential, ugcVisibilityForVisitor, allowVisitor, ApiCallService.call, getUserPolicies(null), ltlAvailable, embed, atom/rss, Cache-Control: public, requireSigninToViewContents, 中央ゲート |
| 🟢 2026-07-03 | [rate-limit-mechanics.md](rate-limit-mechanics.md) | RateLimiterService は固定ウィンドウの薄いラッパで dev 環境無効。意図POST予算制は ApiCallService.call に共有バケットを足す。残量照会 API は不在 | RateLimiterService, ratelimiter, minInterval, IEndpointMeta.limit, rateLimitFactor（大きいほど厳しい）, factor=0免除, RATE_LIMIT_EXCEEDED, 429, 残量照会, notes/reactions/create無制限, 固定ウィンドウ, Retry-After |
| 🟢 2026-07-03 | [role-policy-mechanics.md](role-policy-mechanics.md) | conditional ロール（createdMoreThan 等）は JIT 評価で成熟モデルに使える。ポリシー集約は OR / Math.max で「厳しくする」には priority 必須。canCreateNote 不在・承認制サインアップ不在 | MiRole, condFormula, createdMoreThan, evalCond, getUserPolicies, DEFAULT_POLICIES, priority集約, canPublicNote, disableRegistration, MiRegistrationTicket, canInvite, rootバイパス |
| 🟢 2026-07-03 | [moderation-mechanics.md](moderation-mechanics.md) | AI モデレーターは bot + moderator ロール + admin stream 購読で既存機構のみで組める。suspend はフォロー関係を不可逆破壊——追放刑は可逆な exile フラグも検討 | isModerator, MiAccessToken, admin stream, newAbuseUserReport, read:admin:stream, MiAbuseUserReport, suspend, isSuspended, UserSuspendService, moderation_log, exile, 追放刑, resolve-abuse-user-report |

## 開発プロセス

| 鮮度 | ファイル | 要約 | キーワード |
|---|---|---|---|
| 🟢 2026-07-03 | [investigation-plan-pattern.md](investigation-plan-pattern.md) | 調査計画の実行パターン。機構単位分割×改造意図の注入×事実/推測区別。正確性の信頼境界（リポ内=信頼可、外部パッケージ・集計値=要自前検証） | 調査計画, 並列探索, Explore, 機構単位, 事実と推測, 信頼境界, knowhow化, squash merge棚卸し, 計画01 |

## 鮮度レポート

🔴 stale / needs-review のファイルはなし（直下10ファイルすべて 🟢 fresh）。
