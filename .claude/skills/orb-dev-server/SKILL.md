---
name: orb-dev-server
description: Use whenever starting, stopping, or checking a Misskey dev server (`pnpm dev`) for a worktree on this machine — runs pnpm dev, PostgreSQL and Redis inside OrbStack containers per worktree so ports 3000 / 5173 / 5432 / 6379 never collide with other worktrees or projects. Prefer this over running `pnpm dev` on the host. "開発サーバー起動して"、"dev サーバー"、"動作確認したい"、"pnpm dev"、"検証環境を止めて" 等の発話で起動する。
---

# orb-dev-server

worktree ごとに独立した Misskey 開発サーバーを OrbStack 上で立てる。
ホストにポートを公開せず、`http://web.<project>.orb.local:3000/` でアクセスする。

## コマンド

```bash
.claude/skills/orb-dev-server/scripts/orb-dev.sh up     [worktree] [--prod] [--seed]  # 起動して URL を表示 (初回は管理者も作成)
.claude/skills/orb-dev-server/scripts/orb-dev.sh status [worktree]
.claude/skills/orb-dev-server/scripts/orb-dev.sh logs   [worktree]   # web のログを追う
.claude/skills/orb-dev-server/scripts/orb-dev.sh down   [worktree] [-v]  # -v で DB・node_modules の volume も消す
.claude/skills/orb-dev-server/scripts/orb-dev.sh seed     [worktree]          # 開発用データを入れてスナップショットを取る
.claude/skills/orb-dev-server/scripts/orb-dev.sh snapshot [worktree] [名前]   # 今の DB と files/ を保存する (名前の既定は seed)
.claude/skills/orb-dev-server/scripts/orb-dev.sh restore  [worktree] [名前]   # 保存した状態に戻す (名前の既定は seed)
```

- `up --prod` は `pnpm dev` の代わりに本番ビルド (`pnpm build` → `pnpm migrate` → `pnpm start`) で起動する。初回はビルドがあるので待ち時間の上限を 30 分にしている (開発モードは 15 分)
- `up --seed` は起動と管理者作成のあとに、キーの合う `seed` のスナップショットがあれば確認なしで `restore` する。現在のデータは上書きされる。無ければ `seed` を実行する
- `seed` は管理者以外のユーザーがいない環境にだけ入れる。データが既にあるときは何も変えずに止まるので、`down -v` してから入れ直すか、`restore` で戻す
- `worktree` を省略するとカレントディレクトリの worktree を対象にする
- スクリプトはこのブランチ (skill の本籍) にしか無いことがある。対象 worktree に無ければ、mistems-main か claudeImplement worktree のものをフルパスで呼ぶ
- 初回の `up` は依存のインストールで数分かかる。`run_in_background` で実行して完了通知を待つとよい
- 管理者アカウントは `admin` / `admin1234`。ユーザーが 1 人もいないときだけ作る
- 動作確認は Playwright MCP で上記 URL を開く

## 仕組み

- compose プロジェクト名は worktree のディレクトリ名を小文字化したもの。生成物は `~/.cache/misskey-orb-dev/<project>/` に置き、worktree には何も書かない
- `web` は `.node-version` の Node 公式イメージで動かす。開発モードでは `pnpm install` → `pnpm build-pre` → (バックエンドのビルドが無いときだけ) `pnpm --filter backend... build` → `pnpm migrate` → `pnpm dev` を実行する。`--prod` では `pnpm install` → `pnpm build` → `pnpm migrate` → `pnpm start` を実行する。worktree はマウントするので、開発モードではファイル保存がそのまま HMR で反映される
- `.config/default.yml` は `.config/example.yml` から生成し (URL・DB / Redis の接続先・setupPassword・allowedPrivateNetworks を差し替え)、コンテナ内の同じパスに重ねてマウントする。ホストの `.config/default.yml` は変更しない
- `allowedPrivateNetworks` には OrbStack のコンテナが使う private IP の範囲 (`192.168.0.0/16` など) を入れる。本番モードの Misskey は private IP への取得を遮断するので、これが無いと seed のリモートのアバター・絵文字・添付・インスタンスのアイコン (この環境自身の orb.local の URL を proxy 経由で取る) が表示されない

## ハマりどころ

- **ホストで `pnpm dev` を動かさない理由**: vite のポート (5173 / 5174) は環境変数で変えられない。backend は `VITE_PORT` を読んでプロキシするが vite 側は読まないので、他の vite が 5173 にいると別プロジェクトへプロキシしてしまう
- **node_modules はホストと分ける**: ホストの node_modules は macOS 向けのネイティブモジュール (sharp, re2 など) を含み、Linux コンテナでは動かない。ルートと `packages/*/node_modules` を名前付き volume にしている
- **Node 25 以降は corepack が無い**: 公式イメージに同梱されなくなったので、`package.json` の `packageManager` のバージョンを `npm i -g` で入れている
- **vite は `.config/default.yml` を固定パスで読む**: `allowedHosts` を URL のホスト名から作るので、URL を orb.local のものにしないと vite が接続を拒否する
- **seed は web コンテナの中で実行する**: ホストの Node.js は `*.orb.local` を引けないことがある。そのため seed の API の段は web コンテナ内から `http://localhost:3000` に対して実行する
- **`files/` もスナップショットに含める**: 添付画像・アバターなどの実体は worktree の `files/` にあり、DB だけ戻すと参照先が無くなる。`files/` の tar はホスト側で作り、戻す
- **新しい worktree でも migrate が動くように、開発モードでは起動のたびに `pnpm build-pre` を実行する**: `pnpm migrate` は `built/meta.json` を読む。バックエンドのビルドは `packages/backend/built/config.js` が無いときだけ行う。`--prod` では `pnpm build` がこれらを作るので実行しない

## 開発用データ (seed / snapshot / restore)

タイムラインや検索、プロフィールなどの画面を実データに近い量で確認するために、開発用のデータを入れられる。

### データの中身

- ユーザーは約 50 人である。パスワードはローカルのユーザー全員 `admin1234` である
  - ローカルは 40 人である。`admin` (管理者) と `user01`〜`user39` で、`user38` と `user39` はボットである
  - リモートは 10 人である。`remote-a.example` (Misskey) に `akari`・`bunta`・`chihiro`・`daisuke`・`emi`、`remote-b.example` (Mastodon) に `fumi`・`gen`・`hana`・`iori`・`jun` がいる (例: `@akari@remote-a.example`)。リモートのユーザーではログインできない
- ノートは約 3.5 万件で、過去 180 日に散らしている。1 人あたり 600〜800 件で、リモートのノートは約 7 千件である。リプライ・リノート・添付・リアクション・アンケート・CW・MFM・ハッシュタグを含む
- カスタム絵文字はローカルが約 100 個、リモートが 8 個である
- フォロー関係は相互・片思い・被フォロー・孤立の 4 種類を用意している
- クリップ、お気に入り、リスト、アンテナ、チャンネル 3 つ、リモートのインスタンス情報 (名前・テーマカラー・アイコン) も入る
- シード用のロールを付けている。レート制限を外し、ノート検索 (`canSearchNotes`) とクリップ上限を広げるためである
- FTT (fanout timeline) は seed が無効にする。SQL で入れたリモートのノートをタイムラインに出すためである

### 仕組みと保存先

- seed は 2 段で入れる。API の段 (`seed/seed.mjs`) で本物のコードを通して約 430 件を作り、SQL の段 (`seed/bulk.mjs`) で大量のノートとリモートのデータを 1 つのトランザクションで流し込む。どちらかが失敗したらスナップショットは取らない
- seed のスクリプトは `orb-dev.sh` 自身の場所にある `seed/` を web コンテナの `/orb-seed` に読み取り専用でマウントして使う。対象の worktree に seed のスクリプトが無くても動く
- スナップショットは `~/.cache/misskey-orb-dev/<project>/snapshots/<最新の migration 名>/<名前>.dump` (`pg_dump -Fc`) と `<名前>.files.tar` (worktree の `files/`) の 2 つである。取るときは一時ファイルに書いてから置き換えるので、途中で失敗しても前のものは壊れない
- キーは最新の migration 名である。migration が変わると古いスナップショットは使えなくなるので、`restore` は戻さずに止まり、手元の一覧を表示する。その場合は `down -v` してから `up --seed` で入れ直す
- 同じシード値なら、いつ実行しても内容 (ユーザー名・本文・CW・公開範囲・リプライやリノートの相手・リアクション・フォロー関係) は同じになる。ID と時刻は実行ごとに変わる。SQL の段のノートは、実行した日の JST の 0 時を基準に、その前日までの 179 日に置く
- seed の設定は環境変数で変えられる。`SEED` はシード値 (既定 `20261023`)、`SEED_LOCAL_NOTES` と `SEED_REMOTE_NOTES` は SQL の段で作る 1 人あたりのノート数の平均 (既定 700) である。`orb-dev.sh` は設定された変数だけを web コンテナに渡す (例: `SEED=1 orb-dev.sh seed`)
- 値を変えて `seed` しても、スナップショットは同じ名前 `seed` で上書きされる。既定の内容を残したいときは、名前を付けて取る (例: `SEED_LOCAL_NOTES=50 orb-dev.sh seed . small`)

### 対象外と注意

- 実際の連合はしない。リモートのユーザーとノートは DB に直接入れた表示用のデータである。ログインしていないと `users/show` はリモートユーザーを返さない (Misskey の仕様)
- API で作るノート (約 430 件) の時刻は実行時刻になる。過去 180 日に散らしているのは SQL の段のノートである
- `down -v` は worktree の `files/` (ローカルドライブの保存先) を消さない。残ったファイルはどこからも参照されないので害はないが、次のスナップショットには入る
- `restore` は web を止め、DB を消してから戻し、worktree の `files/` を丸ごと消してスナップショットの中身に置き換え、Redis を `FLUSHALL` で空にしてから web を起動し直す。`files/` に手で置いたファイルも消える
- `restore` が途中で失敗すると、DB が空のまま残ることがある。復旧は `up` → `restore`、または `up --seed` である。それでも失敗するなら `down -v` → `up --seed` で作り直す
- スナップショットの名前を指定するときは worktree も書く (例: `restore . before-x`)。1 つ目の位置引数は常に worktree として扱う

## variant (統合待ちのブランチの確認)

統合待ちのブランチを、ベース環境 (既定は mistems-main の worktree) の DB・Redis を使う別のコンテナで動かす。呼び出しの順序と報告の形は `variant-prep` スキルに書いてある。ここではコマンドと注意点だけを書く。

```bash
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant classify <branch>        # frontend / backend / migration / other を表示する
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant prepare  <branch> [base] # worktree を作り、ブランチ固有の差分を当てる (コンフリクトは終了コード 2)
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant up       <branch> [base] # 本番ビルドで起動し、応答するまで待つ
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant down     <branch> [-v]   # 止める。-v で vdb・node_modules の volume も消す
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant status                    # ブランチ・種類・URL・DB・状態・応答を一覧する
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant up-all   <branch>...      # prepare と up を 1 本ずつ順に行う (ベースは既定のものだけ)
.claude/skills/orb-dev-server/scripts/orb-dev.sh variant down-all [-v]
```

`<branch>` は riin のブランチ名 (例: `claude/renote-lock-feature-7J0NA`) である。

- 種類は origin/develop との差分で決める。migration を追加するものは `vdb` (自分専用の DB)、backend を変えるものはベース環境の DB を使う。frontend だけのものは `prepare` / `up` を断る (frontend-variants.yml で確認する)
- variant の worktree は `<ベースの親>/variant-<slug>`、ブランチは `variant/<slug>` (ローカルのみ)、compose のプロジェクトは `variant-<slug>`、URL は `http://web.variant-<slug>.orb.local:3000/` である。slug はブランチ名の最後の `/` 以降を小文字にし、`[a-z0-9-]` 以外を `-` にしたものである
- `prepare` は、起点 (件名が `Version updated to:` の最新のコミット、無ければ merge-base) からブランチ先端までの差分を、ベースの HEAD に 3-way で当ててコミットする。コンフリクトの解消のコミットは、rerere の記録が `main-統合.sh` に影響しないよう `git -c rerere.enabled=false commit` で行う
- variant のコンテナは `MK_ONLY_SERVER=1` と `MK_NO_DAEMONS=1` で起動する。キューのワーカーとデーモンが動かないので、積まれたジョブ (配送・通知の後処理など) は処理されず、定期ジョブも動かない。配送や通知の後処理を伴う動作は確認できない
- Redis はベース環境のものを共有するが、キーの接頭辞は URL のホスト名から決まるので variant ごとに分かれる。接頭辞を揃えると、variant のコードがベース環境の定期ジョブを書き換えたり消したりするため、揃えてはならない
- `files/` と pnpm のストア (`<base>_pnpm-store`) はベース環境のものを共有する
- seed のスナップショットにはベース環境の URL (`http://web.<ベース>.orb.local:3000/`) が入っている。**ベース環境を止めると、variant の画像 (アバター・絵文字・添付・インスタンスのアイコン) も表示されなくなり、variant の起動もできない**。確認が終わるまでベース環境を止めない
- `vdb` の初回は、ベースの seed のスナップショットを restore してから migrate を当てる。seed が無いときは web を起動せずに止まる。やり直すときは `variant down <branch> -v` → `variant up <branch>` である
- `up` の前に空きメモリ (VM 全体からコンテナの使用量の合計を引いた値) を確かめ、4GB 未満なら起動せずに内訳を表示して止まる。他のコンテナを止めて空けることはしない
- pnpm install / build が重なるので、`up` は 1 本ずつ実行し、前の web が応答してから次へ進む

# 経験の記録
（実施したときの注意点などを自由に記載）

- 2026-10-10: emojiDropUpload worktree で作成・動作確認。依存インストール込みで初回の起動は 1〜2 分だった
