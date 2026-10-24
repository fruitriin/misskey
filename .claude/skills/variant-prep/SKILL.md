---
name: variant-prep
description: main-統合.sh の台帳で「統合待ち（要チェック）」になっているブランチを、種類 (frontend / backend / migration) ごとに分けて確認できる状態にする。frontend のブランチは frontend-variants.yml に追記し、backend・migration のブランチは mistems-main に差分を当てた別の worktree と OrbStack のコンテナで起動して、URL の一覧を報告する。"/variant-prep"、"variant-prep"、"統合待ちをまとめて確認"、"統合待ちを動かして"、"バリアントを全部起動"、"variant を立ち上げて" 等の発話で起動する。
---

# variant-prep

統合待ちのブランチをまとめて動かして確認できるようにする、薄いスキルである。
実際の処理は `orb-dev-server` スキルの `orb-dev.sh variant ...` が行う。このスキルは、その呼び出し順と、人の判断が要る箇所 (コンフリクトの解消、frontend-variants.yml への追記) を定める。

`orb-dev.sh` のパスは `.claude/skills/orb-dev-server/scripts/orb-dev.sh` である。対象 worktree に無ければ、claudeImplement worktree のものをフルパスで呼ぶ。以下では `orb-dev.sh` と略す。

## 守ること

- mistems-main のブランチにはコミットしない。`main-統合.sh` を実行しない。変えてよいのは、frontend-variants.yml を作る echo の中身だけである
- variant のブランチ (`variant/<slug>`) はローカルだけに置き、push しない
- ベース環境と variant 以外の開発環境は、止めたり変えたりしない
- 空きメモリが足りず `variant up` が止まったら、他のコンテナを止めて空けずに、使用量の内訳をそのまま報告する

## 手順

### 1. 統合待ちのブランチを集める

mistems-main の worktree (`/Users/riin/workspace/misskey-worktrees/mistems-main`) の `main-統合.sh` を読む。台帳は `exit` の行より後ろにあり、`[統合待ち（要チェック）]` で始まる行が対象である。

```bash
grep '^\[統合待ち（要チェック）\]' /Users/riin/workspace/misskey-worktrees/mistems-main/main-統合.sh
```

行は `[統合待ち（要チェック）] <riin のブランチ名> — <説明>` の形である。ブランチ名は ` — ` の前までを取る。ユーザーがブランチを指定したときは、台帳ではなくその指定を使う。

### 2. 種類を判定する

```bash
orb-dev.sh variant classify <branch>
```

標準出力に種類が出る。起点や slug、追加される migration は標準エラー出力に出る。

| 種類 | 意味 | 扱い |
| --- | --- | --- |
| frontend | frontend だけを変える | 手順 3 で frontend-variants.yml に追記する。コンテナは立てない |
| backend | backend を変える (migration は無い) | ベース環境の DB を使うコンテナで動かす |
| migration | migration を追加する | 自分専用の DB (`vdb`) を持つコンテナで動かす |
| other | 上のどれでもない | 動かさず、報告に理由を書く |

判定は origin/develop との差分で行う。`classify` は `origin/develop` を使うので、古いときは先に `git fetch origin` を実行する。

### 3. frontend のブランチを frontend-variants.yml に追記する

`/Users/riin/workspace/misskey-worktrees/mistems-main/main-統合.sh` にある `frontend-variants.yml` を作る echo のブロックに、次の 2 行を足す。

```
- name: <slug>
  branch: <riin のブランチ名>
```

- `<slug>` は `node .claude/skills/orb-dev-server/scripts/variant/classify.mjs --slug <branch>` の出力を使う。既存の項目 (例: `name: clips-pagination`) に合わせて短くしてよい
- `branch:` が既にあるブランチは追記しない
- 追記する位置は、最後の `- name:` / `branch:` の組の直後 (`#` で始まる除外のコメント行より前) である。echo の引用符は変えない
- 追記したら `fish -n /Users/riin/workspace/misskey-worktrees/mistems-main/main-統合.sh` で構文を確かめる。失敗したら元に戻す

### 4. ベース環境を起動する

```bash
orb-dev.sh status /Users/riin/workspace/misskey-worktrees/mistems-main
```

ベース環境 (db / redis / web) が動いていなければ、次を実行する。初回は本番ビルドがあるので時間がかかる。`run_in_background` で実行して完了を待つ。

```bash
orb-dev.sh up /Users/riin/workspace/misskey-worktrees/mistems-main --prod --seed
```

variant はベース環境の Redis とネットワークを使うので、ベース環境が動いていなければ `variant up` は断る。

### 5. backend・migration のブランチを 1 本ずつ起動する

ブランチごとに順に実行する。pnpm install と build が同時に走らないよう、並列にはしない。

```bash
orb-dev.sh variant prepare <branch>
orb-dev.sh variant up <branch>
```

`prepare` の終了コードで分岐する。

| 終了コード | 意味 | 次の動き |
| --- | --- | --- |
| 0 | 差分を当ててコミットした、または当て済み | `variant up` へ進む |
| 1 | frontend / other で断った、slug が衝突した、など | メッセージを読み、報告に書いて次のブランチへ進む |
| 2 | コンフリクト、または未コミットの変更が残っている | 下の「コンフリクトの解消」を行う |

`up-all <branch>...` で 1 本ずつ順に `prepare` → `up` を行うこともできる。ただし `prepare` が終了コード 2 で止まるので、コンフリクトがありそうなときは 1 本ずつ実行するほうがよい。

#### コンフリクトの解消

`prepare` は、コンフリクトしたファイルの一覧と手順を表示して止まる。変更は `<mistems-main の親>/variant-<slug>` の worktree で行う。

1. その worktree で、コンフリクトしたファイルを解消する。自動生成のファイルは、手でマージせず生成し直す
   - misskey-js の `src/autogen/` (`types.ts` / `entities.ts` など): `pnpm build-misskey-js-with-types` を実行する
   - `locale.ts` などの i18n の自動生成物: 該当ブランチの `locales/ja-JP.yml` を解消したうえで、i18n のビルド (`pnpm build-pre` など、リポジトリの手順に従う) で生成し直す
   - `CHANGELOG.md`: どちらを取ってもよい。variant の確認には影響しない
   - それ以外は、ブランチの変更とベースの変更の両方が残るよう、内容を読んで解消する
2. 解消したファイルを `git add` し、**`rerere` を無効にして**コミットする

   ```bash
   git -C <variant の worktree> add -A
   git -C <variant の worktree> -c rerere.enabled=false commit -m "variant: <branch>"
   ```

   - rerere の記録は、すべての worktree で共有される。variant での解消が記録されると、`main-統合.sh` が同じコンフリクトに当たったときに自動で適用されてしまう。そのため、解消のコミットでは必ず `-c rerere.enabled=false` を付ける
   - コミットの件名は `variant: <branch>` にする。`prepare` はこの件名で「当て済み」を判断する
3. もう一度 `orb-dev.sh variant prepare <branch>` を実行する。「当て済み」と判断して終了コード 0 で終わる
4. `orb-dev.sh variant up <branch>` へ進む

解消できない、またはブランチの意図が分からないときは、そのブランチを飛ばして報告する。

### 6. URL の一覧を報告する

```bash
orb-dev.sh variant status
```

ブランチ・種類・URL・DB・状態・応答が一覧で出る。次の列の表にまとめて報告する。

| 列 | 内容 |
| --- | --- |
| ブランチ | riin のブランチ名 |
| 種類 | frontend / backend / migration / other |
| URL | backend・migration は `http://web.variant-<slug>.orb.local:3000/`。frontend は「frontend-variants.yml に追記」と書く |
| DB | `base` (ベース環境の DB を共有) / `vdb` (自分専用の DB) / `-` (frontend) |

起動できなかったブランチは、表の下に理由 (コンフリクトの未解消、メモリ不足など) を書く。
管理者アカウントは `admin` / `admin1234` である。

## 後片付け

```bash
orb-dev.sh variant down <branch> [-v]
orb-dev.sh variant down-all [-v]
```

`-v` を付けると、`vdb` と node_modules の volume も消える。worktree (`variant-<slug>`) とブランチ (`variant/<slug>`) は自動では消えない。不要になったら `git worktree remove` で消す。

## スキル修正時の反映

このスキルを修正したら、**claudeImplement worktree** (`misskey-worktrees/claudeImplement`、ブランチ `add-claude-github-actions-1762310148415`) の同ファイルにも反映してコミットし、riin へ push する。mistems-main は統合のたびに origin/develop へ reset されるため、統合ブランチ側の `.claude/` 変更はコミットしても次回統合で消える（スキルの本籍はこのブランチで、main-統合.sh 経由で mistems-main に取り込まれる）。

# 経験の記録
（実施したときの注意点などを自由に記載）
