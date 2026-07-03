---
title: 連合停止（閉鎖インスタンス化）の既存手段と抜け穴
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# 連合停止（閉鎖インスタンス化）の既存手段と抜け穴

## 発見した知見

### 既存設定で連合は完全停止できる

- **`Meta.federation: 'all' | 'specified' | 'none'`**（`Meta.ts:686-697`、**デフォルトが 'none'**）。セットアップウィザードにも「連合なし」選択肢が既にある（`MkServerSetupWizard.vue:61-77`）
- 判定の一次点は `UtilityService.isFederationAllowedHost/-Uri`（`UtilityService.ts:134-148`）
- `'none'` で 403 になるもの: AP エンドポイント全15箇所（inbox / outbox / users / notes の AP 表現等、`ActivityPubServerService.ts`）+ WellKnown 4箇所（webfinger / host-meta / .well-known/nodeinfo、`WellKnownServerService.ts`）
- inbox 処理・AP 解決・deliver 実行も `isFederationAllowedHost` 経由で全て遮断される
- **`.config/*.yml` に連合を封じる設定は存在しない**。真実の源は DB の Meta で、管理 UI から再有効化できてしまう
- フロントは `instance.federation === 'none'` を見てナビ・ウィジェット・統計等を自動非表示にする（対応済み）

### 抜け穴（閉鎖度を上げるなら塞ぐ箇所）

1. **`/nodeinfo/2.0` `/2.1` 直リンクにはガードが無い**（`NodeinfoServerService.ts` は federation を参照ゼロ。403 になるのは `.well-known/nodeinfo` だけ）
2. **deliver ジョブの enqueue は止まらない**（`ApDeliverManagerService.execute` / `QueueService.deliver` にガード無し。Processor 側で skip されるだけ。過去のリモートフォロワーが DB に残っていると空回りする）
3. **HTML の `/users/:user` `/notes/:note` は生きる**（Accept ヘッダの `apOrHtml` constraint で分岐）。連合停止 ≠ 対外公開停止。訪問者への公開制御は `Meta.ugcVisibilityForVisitor`（`Meta.ts:703`）という別の軸
4. 連合と無関係に残る外部通信: Web Push（VAPID）、URL プレビュー（`urlPreviewEnabled`）、メディアプロキシ、SMTP
5. 管理 UI / `admin/update-meta` から `federation` を戻せる——恒久閉鎖を保証するなら update-meta に `'none'` 強制ガード、または config 独自フラグで Meta ロード時にオーバーライドする小パッチが要る

### 物理削除の位置づけ（2026-07-03 更新）

- AP 関連コードは約6,400行 + `apRendererService` 呼び出し83箇所 + Note/User エンティティのカラム（uri / inbox / publicKey 等）に浸潤
- 当初は「upstream 追従を殺す」ため非推奨としたが、**追従放棄の決定（イヴの時間構想.md）によりこの制約は消えた**。物理削除は正当な選択肢であり、構想の「破壊して綺麗にする」方針とも合致する
- ただし工数は残る。現実的な段取りは**まず「設定 'none' + 再有効化防止パッチ + nodeinfo 直リンク/enqueue 抑止の小パッチ」で閉鎖を成立させ、動いてから AP コードを段階的に削っていく**（削除は独立した計画に切り出す）

## プロジェクトへの適用（イヴの時間）

- 「連合しない」方針はほぼ既存機能で達成できる。計画A（連合停止）は小パッチ2〜3個の軽い計画にできる
- 完全非公開ではなく「非ログインは制限付き閲覧」方針なので、HTML が生きるのはむしろ好都合。閲覧の制御は `ugcVisibilityForVisitor` 側の計画（非ログイン閲覧制限）で扱う

## 注意点・制約

- インバウンド 403 はスキャナから見える。より静かにするならリバースプロキシ側で塞ぐ選択肢もある（運用判断）
- 物理削除に進む場合、Note/User エンティティのカラム削除は migration を伴う。段階削除の各ステップで `check-migrations` を通すこと

## 参照

- `packages/backend/src/models/Meta.ts:686-697, 703`
- `packages/backend/src/core/UtilityService.ts:134-148`
- `packages/backend/src/server/ActivityPubServerService.ts` / `WellKnownServerService.ts` / `NodeinfoServerService.ts`
- `packages/backend/src/core/activitypub/ApDeliverManagerService.ts:107-148` / `QueueService.ts:146-223`
