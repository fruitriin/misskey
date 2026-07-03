---
title: MISTEMS 統合フロー（mistems-main は使い捨てブランチ）
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: active
---

# MISTEMS 統合フロー（mistems-main は使い捨てブランチ）

## 発見した知見

- **mistems-main は毎回作り直される使い捨てブランチ**。`main-統合.sh` が `git reset origin/develop --hard` から始まり、機能ブランチを順次 `git merge --squash` → `git commit` で積み上げる。1機能 = 1コミット
- **統合スクリプトの正史は `mistems-readme` ブランチ**（`origin/mistems-readme:main-統合.sh`、約193行）。ルート `README.md` にも変更点リストとスクリプトの完全コピーが埋め込まれている（更新用スキル `/mistems-readme` あり）
- **CHANGELOG.md は squash 中に毎回 `git checkout HEAD -- CHANGELOG.md` で破棄**（コンフリクト回避のための仕様）
- コンフリクトは **git rerere** に学習させて再統合を自動化する運用
- 機能ブランチは個別に rebase して追従し、複数コミットは squash して1コミット化してから統合する
- **バージョン採番**: スクリプト末尾で `MISVER` を設定し、jq で `package.json` の version を `<upstreamバージョン>-MISTEMS.<N>` に書き換え、prettier 整形、コミット + annotated tag（例: `2026.6.1-alpha.1-MISTEMS.96`）
- 機能ブランチ名は `riin/xxx` 形式で README に記載されるが、リポジトリ上では `origin/xxx` にミラーされている。`riin` remote は `fruitriin/misskey` を指す可能性（推測）

## プロジェクトへの適用

- **mistems-main 上のコミットは統合のたびに書き換わる**。恒久的な変更は機能ブランチとして切り出し、`main-統合.sh` に squash merge 行を追加する（`/squash-prep` スキルが書式生成を担当）
- イヴの時間の実装も同様: 機能単位のブランチ + 統合スクリプトへの登録、が正規の入れ方
- mistems-main への force push は運用上の前提（upstream AGENTS.md の force push 禁止は `main`/`develop`/`master` の話で、mistems-main には適用されない）

## 注意点・制約

- `main-統合.sh` はローカル手動実行。CI では走らない
- mistems-main 上に直接コミットした変更は、次回の統合（reset --hard）で**消える**。ブランチ化を忘れないこと
- CHANGELOG.md への追記は統合時に破棄されるため、MISTEMS 運用では実質意味を持たない（upstream への PR を出す場合のみ有効）

## 参照

- `README.md`（ルート。変更点リスト + スクリプト埋め込み）
- `origin/mistems-readme:main-統合.sh`
- `.claude/skills/`: `squash-prep` / `mistems-readme` / `rebase-to-develop`
