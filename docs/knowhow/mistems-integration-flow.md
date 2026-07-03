---
title: MISTEMS 統合フロー（旧運用・歴史的記録）
created: 2026-07-03
last_verified: 2026-07-03
depends_on: []
status: retired
---

# MISTEMS 統合フロー（旧運用・歴史的記録）

## ⚠️ 運用停止（2026-07-03 オーナー決定）

**upstream Misskey への追従は放棄された**（イヴの時間構想.md「実装の基盤」参照）。以下の統合フローは今後実行されない歴史的記録である。

- `mistems-main` は**長寿命ブランチ**になった。直接コミットしてよく、次回統合で消える心配はない
- `main-統合.sh` / `/squash-prep` / `/mistems-readme` / `/rebase-to-develop` はレガシー
- この記録の価値: リポジトリの歴史（なぜ 27 個の squash コミットで構成されているか）と、mistems-feature-inventory.md の棚卸しの根拠を説明するため

## 発見した知見（旧運用の記録）

- **mistems-main は毎回作り直される使い捨てブランチ**。`main-統合.sh` が `git reset origin/develop --hard` から始まり、機能ブランチを順次 `git merge --squash` → `git commit` で積み上げる。1機能 = 1コミット
- **統合スクリプトの正史は `mistems-readme` ブランチ**（`origin/mistems-readme:main-統合.sh`、約193行）。ルート `README.md` にも変更点リストとスクリプトの完全コピーが埋め込まれている（更新用スキル `/mistems-readme` あり）
- **CHANGELOG.md は squash 中に毎回 `git checkout HEAD -- CHANGELOG.md` で破棄**（コンフリクト回避のための仕様）
- コンフリクトは **git rerere** に学習させて再統合を自動化する運用
- 機能ブランチは個別に rebase して追従し、複数コミットは squash して1コミット化してから統合する
- **バージョン採番**: スクリプト末尾で `MISVER` を設定し、jq で `package.json` の version を `<upstreamバージョン>-MISTEMS.<N>` に書き換え、prettier 整形、コミット + annotated tag（例: `2026.6.1-alpha.1-MISTEMS.96`）
- 機能ブランチ名は `riin/xxx` 形式で README に記載されるが、リポジトリ上では `origin/xxx` にミラーされている。`riin` remote は `fruitriin/misskey` を指す可能性（推測）

## プロジェクトへの適用

- （旧運用時代の指針は失効。現在は mistems-main に直接コミットしてよい。CLAUDE.repo.md「ブランチ運用」参照）
- 過去のコミット履歴を読むときの解釈: `origin/develop..HEAD` の各コミットは機能ブランチの squash 結果であり、1コミット = 1機能

## 注意点・制約

- CHANGELOG.md は旧運用で統合のたびに破棄されていたため、MISTEMS 独自変更の記録は含まれていない（履歴を追うときは README.md の変更点リストが正）

## 参照

- `README.md`（ルート。変更点リスト + スクリプト埋め込み）
- `origin/mistems-readme:main-統合.sh`
- `.claude/skills/`: `squash-prep` / `mistems-readme` / `rebase-to-develop`
