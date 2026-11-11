---
name: showcase-pr
description: MISTEMS に統合した機能ブランチを、mistems/mistems の develop 向けショーケース PR として出す。タイトルと短い一言だけの簡素な PR にし、画面が変わる機能ならスクリーンショットか GIF を添える。squash-prep で統合に入れたあと、または "/showcase-pr"、"ショーケース PR を出して"、"mistems に PR を出して"、"systems に PR" 等の発話で起動する。
---

# showcase-pr

統合に入れた機能を見せるための PR を、mistems/mistems に作る。レビューや経緯は riin の PR に残し、ショーケース PR には書かない (CLAUDE.md の「PR の使い分け」)。

## 書式

初期のショーケース PR (mistems/mistems #36、#44、#45) にならう。

- **タイトル**: 機能を言い表す日本語の短い文。`feat:` などの接頭辞や `[Merged]` は付けない
  - 例: 「リアクションビューアに読み仮名などを表示」「チャンネル一覧」
- **本文**: 次のどちらか、または両方だけを書く。見出し、確かめ方、検証の結果、既知の制限、設計書のパスは書かない
  - 画面が変わるなら、スクリーンショットか GIF を 1〜3 枚
  - 画面で伝わらないことだけを 1〜3 行 (何ができるようになるか、なぜ欲しいか)
- 本文の最後の行は `🤖 Generated with [Claude Code](https://claude.com/claude-code)` とする
- misskey-dev の PR / Issue 番号は書かない。riin のレビュー用 PR へのリンクも書かない
- draft にしない。マージもしない

## 手順

### 1. 前提を確かめる

- `git log origin/develop..riin/<branch> --oneline` に、他の MISTEMS 機能のコミットや `Version updated to:` が混ざっていないこと。混ざっていれば mistems-main から派生しているので、PR を作らず、先に `rebase-to-develop` か `develop-review-pr` で載せ直すよう報告する
- `riin/release/*` には作らない。元の機能ブランチごとに作る
- `gh pr list -R mistems/mistems --head <branch> --state open` で、同じ head の PR が無いこと。あれば作らず、番号を報告する

### 2. systems の develop をそろえる

差分に上流のコミットが混ざらないよう、PR を作る前にそろえる。

```bash
git fetch origin develop && git fetch systems develop
git rev-list --count origin/develop..systems/develop   # 0 であること。0 でなければ上書きせずに尋ねる
git push systems origin/develop:refs/heads/develop
```

### 3. 画面を撮る (画面が変わる機能のとき)

- riin のレビュー用 PR にスクリーンショットがあれば、その URL を流用する
- 無ければ、`orb-dev-server` スキルでブランチの環境を起動し、Playwright で撮る。動きのある変更 (アニメーション、ドラッグ、画面遷移) は GIF にする
- 画像は systems の `showcase-assets` ブランチ (孤立ブランチ) の `<branch の / を - にした名前>/` に置いて push し、次の URL で本文に貼る
  ```
  https://raw.githubusercontent.com/mistems/mistems/showcase-assets/<ディレクトリ>/<ファイル名>
  ```
  `showcase-assets` は main-統合.sh の対象外で、画像だけを置く。まだ無ければ `git worktree add --orphan -b showcase-assets <misskey-worktrees>/showcase-assets` で作る

### 4. PR を作る

head は riin のブランチを指す。mistems/mistems と fruitriin/misskey は同じフォークネットワークに入っているので、ブランチを systems へ push し直さなくてよい。

```bash
gh pr create -R mistems/mistems --base develop --head fruitriin:<branch> --title "<タイトル>" --body-file <本文>
```

### 5. 報告

PR の URL を報告する。画面を撮らなかったときは、その理由 (画面が変わらない、など) を書く。

## 統合から外したとき

コメントアウトや「栄誉の殿堂」への移動で統合から外したブランチのショーケース PR は、閉じるかどうかをユーザーに尋ねる。指示なしに閉じない。

## スキル修正時の反映

このスキルの本籍は claudeImplement worktree (`misskey-worktrees/claudeImplement`、ブランチ `add-claude-github-actions-1762310148415`) である。修正したらそこでコミットし、riin へ push する。

## 経験の記録

(実行時に任意で追記する)
