# Feedback — 問題・改善アクションの記録

## 未対応

### addf-lint テンプレート同期チェックのダウンストリーム誤検知（2026-07-03、計画01）

- **問題**: `/addf-lint` のペア1（Progress.md ⇔ テンプレート）とペア3（AGENTS.md ブートシーケンス）が本リポジトリで ERROR を出すが、いずれも誤検知。原因は lint スクリプトが `ProgressTemplate.addf.md` の存在有無で upstream/downstream を判定しており、ダウンストリームに .addf.md 版が配布されていると upstream と誤判定するため。また Misskey 由来の `AGENTS.md` が ADDF 本体の同名ファイルと衝突して検査対象になる
- **改善アクション**: ADDF 本体へのコントリビューション候補3件を addf-contribution-agent が確定（いずれも再現確認済み・PR 化可能）:
  1. `lint-template-sync.py` + `addf-init.md`: upstream/downstream 判定を「ファイル存在」から `addf-lock.json` の存在に改める。addf-init が `.addf.md` をコピーするのに使わない矛盾も併せて解消
  2. `addf-knowhow-index.md`: 「INDEX.addf.md があれば優先」ヒューリスティックは ADDF/ 配布を受けた全ダウンストリームで恒常的に誤判定する設計欠陥。CLAUDE.repo.md のプロジェクト種別宣言を一次根拠に変更
  3. `docs/knowhow/ADDF/sync-lint-design.md`: 「欠如=SKIP」原則の逆ケース（存在するはずのないファイルが存在する／名前衝突）の明文化を追記
  - 3件とも共通解（addf-lock.json ベース判定）で統一的に解消可能。upstream PR 時は `.claude/tests/tools/test-template-sync.sh` への回帰テスト追加を推奨。当面、本リポジトリではペア1・3 の ERROR は既知の誤検知として扱う

### ADDF ファイル群が使い捨てブランチ mistems-main 上にある（2026-07-03、計画01）

- **問題**: `main-統合.sh` は mistems-main を `origin/develop` への reset --hard で毎回作り直す。`.claude/` / `docs/plans/` / `docs/knowhow/` / `CLAUDE.md` / 構想文書はこのブランチに直接コミットされるため、**次回統合で消失するリスクがある**（前回は「ADDF 導入」コミットとして統合されたと推測されるが、運用ルールとして明文化されていない）
- **改善アクション**: オーナーに運用方針を確認する（①ADDF 関連を機能ブランチ化して統合スクリプトに登録する ②統合スクリプトに「ADDF ファイル群の引き継ぎステップ」を追加する 等）。確認まで、コミットは通常どおり行うが消失リスクを認識しておく
