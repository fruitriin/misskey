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
- `web` は `.node-version` の Node 公式イメージで `pnpm install → pnpm migrate → pnpm dev` を実行する。worktree はマウントするので、ファイル保存はそのまま HMR で反映される
- `.config/default.yml` は `.config/example.yml` から生成し (URL・DB / Redis の接続先・setupPassword・allowedPrivateNetworks を差し替え)、コンテナ内の同じパスに重ねてマウントする。ホストの `.config/default.yml` は変更しない
- `allowedPrivateNetworks` には OrbStack のコンテナが使う private IP の範囲 (`192.168.0.0/16` など) を入れる。本番モードの Misskey は private IP への取得を遮断するので、これが無いと seed のリモートのアバター・絵文字・添付・インスタンスのアイコン (この環境自身の orb.local の URL を proxy 経由で取る) が表示されない

## ハマりどころ

- **ホストで `pnpm dev` を動かさない理由**: vite のポート (5173 / 5174) は環境変数で変えられない。backend は `VITE_PORT` を読んでプロキシするが vite 側は読まないので、他の vite が 5173 にいると別プロジェクトへプロキシしてしまう
- **node_modules はホストと分ける**: ホストの node_modules は macOS 向けのネイティブモジュール (sharp, re2 など) を含み、Linux コンテナでは動かない。ルートと `packages/*/node_modules` を名前付き volume にしている
- **Node 25 以降は corepack が無い**: 公式イメージに同梱されなくなったので、`package.json` の `packageManager` のバージョンを `npm i -g` で入れている
- **vite は `.config/default.yml` を固定パスで読む**: `allowedHosts` を URL のホスト名から作るので、URL を orb.local のものにしないと vite が接続を拒否する
- **seed は web コンテナの中で実行する**: ホストの Node.js は `*.orb.local` を引けないことがある。そのため seed の API の段は web コンテナ内から `http://localhost:3000` に対して実行する
- **`files/` もスナップショットに含める**: 添付画像・アバターなどの実体は worktree の `files/` にあり、DB だけ戻すと参照先が無くなる。`files/` の tar はホスト側で作り、戻す
- **新しい worktree でも migrate が動くように `pnpm build-pre` を毎回実行する**: `pnpm migrate` は `built/meta.json` を読む。バックエンドのビルドは `packages/backend/built/config.js` が無いときだけ行う

## 開発用データ (seed / snapshot / restore)

タイムラインや検索、プロフィールなどの画面を実データに近い量で確認するために、開発用のデータを入れられる。

### データの中身

- ユーザーは約 50 人である。ローカルが 40 人 (admin を含む) で、リモートが 10 人 (`remote-a.example` と `remote-b.example` に 5 人ずつ) である。パスワードはすべて `admin1234` である
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
- 同じシード値なら内容 (ユーザー名・本文・関係) は同じになる。ただし seed の結果と実行時刻が同じ場合に限る。ID (aidx のノード部分) と正確な時刻は実行ごとに変わる
- seed の設定は環境変数で変えられる。`SEED` はシード値 (既定 `20261023`)、`SEED_LOCAL_NOTES` と `SEED_REMOTE_NOTES` は SQL の段で作る 1 人あたりのノート数の平均 (既定 700) である。`orb-dev.sh` は設定された変数だけを web コンテナに渡す (例: `SEED=1 orb-dev.sh seed`)
- 値を変えて `seed` しても、スナップショットは同じ名前 `seed` で上書きされる。既定の内容を残したいときは、名前を付けて取る (例: `SEED_LOCAL_NOTES=50 orb-dev.sh seed . small`)

### 対象外と注意

- 実際の連合はしない。リモートのユーザーとノートは DB に直接入れた表示用のデータである。ログインしていないと `users/show` はリモートユーザーを返さない (Misskey の仕様)
- API で作るノート (約 430 件) の時刻は実行時刻になる。過去 180 日に散らしているのは SQL の段のノートである
- `down -v` は worktree の `files/` (ローカルドライブの保存先) を消さない。残ったファイルはどこからも参照されないので害はないが、次のスナップショットには入る
- `restore` が途中で失敗すると、DB が空のまま残ることがある。復旧は `up` → `restore`、または `up --seed` である。それでも失敗するなら `down -v` → `up --seed` で作り直す

# 経験の記録
（実施したときの注意点などを自由に記載）

- 2026-10-10: emojiDropUpload worktree で作成・動作確認。依存インストール込みで初回の起動は 1〜2 分だった
