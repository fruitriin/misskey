---
name: squash-prep
description: ブランチ名から squash merge 書式を生成し main-統合.sh に追記し、mistems/mistems にショーケース PR を作る。ブランチ名がプロンプト引数またはファイルで与えられたとき、ブランチの存在確認・コミット分析・コミットメッセージ生成・ランダムシード名ブランチのリネーム提案を行い、`squash_merge` + `git commit` の書式を `main-統合.sh` に挿入する。"/squash-prep"、"スカッシュマージ書式"、"統合スクリプトに追加"、"ブランチを統合スクリプトに入れたい" 等の発話で起動する。
---

# squash-prep

ブランチ名を受け取り、`main-統合.sh` に追記できる squash merge 書式を生成・挿入するスキル。

## 入力

引数でブランチ名を受け取る。複数指定可。ファイルパスが渡された場合は 1 行 1 ブランチとして読み取る。

```
/squash-prep riin/branch1 riin/branch2
/squash-prep --file branches.txt
```

## 処理フロー

### 1. ブランチ存在チェック

以下の順でブランチを探す。見つかった時点で次のステップへ進む。

1. `git rev-parse --verify <branch>` でローカル/リモート参照を確認
2. 見つからなければ `git fetch riin <branch名からriin/を除いた部分>` で取得を試みる
3. それでもなければ `fruitriin/misskey` の PR を `gh pr list --head <branch名>` で逆引きし、PR の `headRefName` からブランチを特定して fetch する
4. すべて失敗した場合はそのブランチについてエラーを報告し、残りのブランチの処理を続行する

### 2. ブランチ分析

```bash
git log origin/develop..<branch> --oneline
```

で origin/develop からの固有コミットを取得する。コミットメッセージと変更ファイルの概要から、squash merge 用のコミットメッセージを決定する。

コミットメッセージの決め方:
- 固有コミットが 1 つだけ → そのコミットメッセージをそのまま使う
- 固有コミットが複数 → 変更の本質を要約した 1 行メッセージを作る
- 既存の PR タイトルがあればそれを優先的に参考にする
- Conventional Commits 形式 (`fix(frontend):`, `feat(backend):` など) が適切な場合はそれに従う。既存エントリのスタイル（日本語の概要文）も許容する

### 3. ランダムシード名ブランチの検出

`claude/` プレフィックス + ランダム文字列パターンを検出する:

```
claude/<adjective>-<noun>-<random>  (例: awesome-volta-vljoz9, gallant-hamilton-1jmatx)
```

検出したらユーザーに以下を提案する:
- 内容に基づいた新しいブランチ名 (例: `riin/fix/connection-tip-modal-click`)
- 承認を得たら:
  1. 新ブランチ名で push (`git push riin <new-branch>`)
  2. `gh pr create` で新 PR を作成 (旧 PR の title/body を引き継ぐ)
  3. 旧 PR を close (`gh pr close`)
  4. 旧リモートブランチを削除 (`git push riin --delete <old-branch>`)

リネームはあくまで提案。ユーザーが断った場合は元の名前のまま書式を生成する。

### 4. 書式生成・挿入

生成する書式:

```fish
# https://github.com/fruitriin/misskey/pull/<N>  (PR がある場合)
squash_merge riin/<branch>
git commit -a -m "<commit message>"
```

挿入位置は `main-統合.sh` の `set MISVER` 行の直前 (バージョン番号セクションの手前)。既に同じブランチのエントリが存在する場合は重複追加しない。

### 5. ショーケース PR を作る

統合に入れたブランチは、mistems/mistems に develop 向けのショーケース PR を作る (CLAUDE.md の「PR の使い分け」)。riin のレビュー用 PR とは別に、完成した機能を見せるための PR である。

1. ブランチが最新の develop から派生していることを確かめる。`git log origin/develop..riin/<branch> --oneline` に他の MISTEMS 機能のコミットや `Version updated to:` が混ざっていれば、mistems-main から派生している。ショーケース PR は作らず、先に `rebase-to-develop` か `develop-review-pr` で載せ直すよう報告する
2. systems の develop を origin/develop にそろえる。fast-forward だけで済むことを確かめる
   ```bash
   git fetch origin develop && git fetch systems develop
   git rev-list --count origin/develop..systems/develop   # 0 であること
   git push systems origin/develop:refs/heads/develop
   ```
3. 同じ head の PR がすでにあるか確かめる。あれば作らず、番号を報告する
   ```bash
   gh pr list -R mistems/mistems --head <branch> --state open
   ```
4. PR を作る。head は riin のブランチ (`fruitriin:<branch>`) を指す。mistems/mistems と fruitriin/misskey は同じフォークネットワークに入っているので、ブランチを systems へ push し直す必要はない。マージしない PR なので draft にする
   ```bash
   gh pr create -R mistems/mistems --base develop --head fruitriin:<branch> --draft --title "<日本語のタイトル>" --body-file <本文>
   ```
   本文には、機能の説明、スクリーンショット (riin のレビュー用 PR にあれば流用する)、riin のレビュー用 PR へのリンクを書く。最後の行は `🤖 Generated with [Claude Code](https://claude.com/claude-code)` とする。misskey-dev の PR / Issue 番号は書かない
5. `riin/release/*` は複数の機能をまとめた統合用のブランチなので、ショーケース PR を作らない。元の機能ブランチごとに作る

統合から外したブランチ (コメントアウトや「栄誉の殿堂」への移動) のショーケース PR は、閉じるかどうかをユーザーに尋ねる。指示なしに閉じない。

## 出力

- `main-統合.sh` に書式を挿入したら、挿入した内容をユーザーに報告する
- 作ったショーケース PR の URL と、作らなかったブランチとその理由を報告する
- 複数ブランチを処理した場合はまとめて報告する

## 注意

- このスキルは `main-統合.sh` の編集とショーケース PR の作成だけを行う。実際の squash merge やビルドは実行しない
- ブランチのリネーム操作は破壊的なので、必ずユーザーの承認を得てから実行する
- `main-統合.sh` が存在しない場合はエラーを報告して終了する

## スキル修正時の反映

このスキルを修正したら、**claudeImplement worktree** (`misskey-worktrees/claudeImplement`、ブランチ `add-claude-github-actions-1762310148415`) の同ファイルにも反映してコミットし、riin へ push する。mistems-main は統合のたびに origin/develop へ reset されるため、統合ブランチ側の `.claude/` 変更はコミットしても次回統合で消える（スキルの本籍はこのブランチで、main-統合.sh 経由で mistems-main に取り込まれる）。

# 経験の記録
（実施したときの注意点などを自由に記載）
