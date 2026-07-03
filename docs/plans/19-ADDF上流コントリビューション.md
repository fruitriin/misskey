---
trust: normal
responsiveness: relaxed
image_clarity: balanced
depends_on: []
---

# 計画19: ADDF 上流コントリビューション

## 実装状況: 未着手

## 目的

計画01・02 の実施中に発見した ADDF フレームワーク（AutomatonDevDrive）本体の問題・改善候補を、上流リポジトリへコントリビューションする。イヴの時間シリーズ（計画10〜18）とは独立したフレームワーク保守計画。

## 背景

本プロジェクト（ダウンストリーム）での ADDF 運用初日に、`/addf-lint` の誤検知2件と、テンプレート欠落1件が実測で確認された。いずれも再現手順つきで検証済み（addf-contribution-agent が2回の検出パスで確定）。

## コントリビューション項目

### 項目1: upstream/downstream 判定を addf-lock.json ベースに統一（バグ修正・最優先）

- **対象**: `.claude/addfTools/lint-template-sync.py`（ペア1: `check_pair1()` / ペア3: `check_boot_pair()`）、`.claude/commands/addf-init.md`
- **問題**: lint が `ProgressTemplate.addf.md` の**ファイル存在**で「ADDF 本体」と判定するが、`addf-init.md` は `.claude/templates/` を丸ごと（`.addf.md` 含む）ダウンストリームへコピーする。結果、**ADDF/ 配布を受けた全ダウンストリームで構造的に誤検知**する。ペア3も同様に、ダウンストリームが独自の `AGENTS.md`（本リポジトリでは Misskey 由来）を持つケースで「ブートシーケンス見出しなし」ERROR を誤報する
- **修正案**: `.claude/addf-lock.json` の存在を一次シグナルにする（addf-init / addf-migrate が既に採用している判定方法と統一）。lock あり → ダウンストリーム確定 → ペア1は `ProgressTemplate.md` を正とし、ペア3は SKIP
- **副次修正案**: `addf-init.md` のカテゴリ1コピーから `*.addf.md` を除外（分離規約に従い、ダウンストリームに `.addf.md` を物理的に置かない根治策）
- **回帰テスト**: `.claude/tests/tools/test-template-sync.sh` に「addf-lock.json ありダウンストリームで `.addf.md` / 独自 `AGENTS.md` が存在するケース」を追加（`docs/knowhow/ADDF/sync-lint-design.md` の mktemp サンドボックス+ドリフト注入パターンをそのまま使う）

### 項目2: addf-knowhow-index の INDEX 選択ヒューリスティック修正（バグ修正）

- **対象**: `.claude/commands/addf-knowhow-index.md`（「インデックスファイルの選択」節）
- **問題**: 「`INDEX.addf.md` が存在すればそちらを優先」というヒューリスティックは、ADDF/ 配布を受けた全ダウンストリームが両 INDEX を持つため**恒常的に誤誘導**する（エッジケースではなく設計欠陥）
- **修正案**: `CLAUDE.repo.md` のプロジェクト種別宣言（「ADD フレームワーク本体」/「ADDF 利用プロジェクト」）を一次根拠に、フォールバックとして addf-lock.json の存在を使う
- **根拠記録**: 本リポジトリの `.claude/commands/addf-knowhow-index.exp.md` に実際に踏んだ記録あり（そのまま一般化可能）

### 項目3: sync-lint-design.md（ADDF 本体 knowhow）への追記（知見）

- **対象**: `docs/knowhow/ADDF/sync-lint-design.md`
- **内容**: 現行の「欠如=SKIP」原則の**逆ケース**を明文化する——①`.addf.md` はダウンストリームに物理存在しうる（存在≠所有）②ADDF 配布ファイル名はダウンストリームの同名無関係ファイルと衝突しうる。所有判定は明示シグナル（addf-lock.json）で行うべき、という教訓

### 項目4: PlanTemplate.md の新規追加（機能提案）

- **対象**: `.claude/templates/PlanTemplate.md`（新規）、`CLAUDE.md` 骨格プランニング手順・`addf-init.md` からの参照
- **背景**: 計画10〜17 の8本が独立起草にもかかわらず同一構造に収束した（実装状況 / 目的 / 現状の挙動 / 変更内容 / 影響範囲 / テスト方針 / 破壊的変更の許容範囲 / 要オーナー確認 / 見積もり）。ProgressTemplate.md はあるのに Plan のテンプレートが無い
- **提案**: 上記構造を標準テンプレート化。検討スタブ用の簡略 variant（分かっていること / 未解決の問い / 着手のトリガー）を併記。「AI実装の見積もり」欄はオーナー個人設定由来のため任意セクション扱い
- **参考実装**: 本リポジトリの `docs/plans/10〜18`（構造の実例）と `docs/knowhow/parallel-plan-drafting.md`（共通構造固定の効果測定）

### 見送り（記録のみ）

- 「構想→計画書群への並列分解」ワークフロー自体の CLAUDE.md ブートシーケンスへの昇格: n=1 のため時期尚早。他プロジェクトでの再現例が出てから再検討

## 作業手順

1. ADDF 上流リポジトリを fork / clone する（場所は要オーナー確認）
2. 項目1+3 を1本の PR に（同根の修正と知見）、項目2・項目4 を各1本の PR に分ける（計3 PR 想定）
3. 各 PR に本リポジトリでの再現記録（lint 出力・exp.md）を添える
4. マージ後、本リポジトリ側は `/addf-migrate` で追従し、Feedback.md の該当項目を削除する

## 影響範囲

- 本リポジトリのコードには影響なし（ADDF 上流の変更）。マージ後の addf-migrate 適用時に `.claude/` 配下が更新される

## テスト方針

- 項目1: 上流の `.claude/tests/tools/test-template-sync.sh` に回帰ケースを追加して通す
- 項目2・4: ドキュメント/テンプレート変更のため上流の addf-lint を通す

## 要オーナー確認

1. **ADDF 上流リポジトリの場所と PR の出し方**（URL・ブランチ規約・PR 言語）。エージェントからは特定できていない
2. PR 分割の粒度（3本案でよいか、1本に束ねるか）
3. 項目4（PlanTemplate）は機能提案なので、上流の受け入れ方針次第では Issue で意見を聞いてから PR にする選択肢もある——どちらから入るか

## AI実装の見積もり

- 1〜2 セッション・難度低〜中（修正自体は小さい。上流リポジトリの規約把握と回帰テスト作成が本体）
