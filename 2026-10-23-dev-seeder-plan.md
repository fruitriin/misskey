# 開発用シードデータ（Seeder とスナップショット）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `orb-dev-server` で立てた Misskey に、動作確認用のデータ（ローカルユーザー・ノート数百〜1000 件・リモートユーザーとノート・カスタム絵文字・プロフィール画像など）を、いつでも同じ内容で入れられるようにする。2 回目以降はスナップショットから数十秒で戻せるようにする。

**Architecture:** Seeder が正本で、スナップショットはそのキャッシュである。Seeder は 2 段に分ける。ローカルのデータは Misskey の API で作り（カウンタや通知、Redis の整合を本体に任せる）、API では作れないリモート（連合）のデータは SQL を生成して DB に直接入れる。どちらも `orb-dev.sh` のサブコマンドから呼ぶ。API の段は web コンテナの中で `http://localhost:3000` に向けて実行する（ホストの Node.js から orb.local の名前を引けないことがあるため）。SQL の段は db コンテナの psql に流し込む。スナップショットは `pg_dump` と、アップロード済みファイルの `files/` の tar を組にして保存し、DB の最新 migration 名をキーにする。

**Tech Stack:** bash（`orb-dev.sh`）、Node.js 26（依存なしの ESM スクリプト。`fetch`、`zlib`、`crypto` だけを使う）、PostgreSQL 18（`pg_dump` / `pg_restore` / `psql`）、Redis 7、OrbStack（docker compose）

**Spec:** 独立した仕様書はない。下の「設計」節が仕様を兼ねる（2026-10-23 のセッションで合意した内容）。

## 設計

### 置き場所

すべて claudeImplement ブランチ（`add-claude-github-actions-1762310148415`）の `orb-dev-server` スキルの中に置く。claudeImplement は `main-統合.sh` で mistems-main に取り込まれるので、どのワークツリーからでも同じスクリプトを使える。

```
.claude/skills/orb-dev-server/
  SKILL.md                        ← seed / snapshot / restore / --prod の説明を追記
  scripts/
    orb-dev.sh                    ← サブコマンドを追加
    seed/
      seed.mjs                    ← 入口。API の段を実行し、リモート用の SQL を書き出す
      lib/png.mjs                 ← 依存なしの PNG 生成（アバター・バナー・絵文字・添付画像）
      lib/aidx.mjs                ← aidx 形式の ID を任意の時刻で生成する
      lib/api.mjs                 ← Misskey API の薄いクライアント（JSON と multipart）
      lib/random.mjs              ← シード値つきの乱数（毎回同じデータにする）
      data/texts.mjs              ← ノート本文の素材（日本語の短文、MFM、ハッシュタグ、CW の例）
      remote.mjs                  ← リモートユーザー・インスタンス・ノート・絵文字の SQL を生成する
      seed.test.mjs               ← png / aidx / random / remote の SQL 生成の単体テスト（node --test）
```

### サブコマンド

| コマンド | 動作 |
|---|---|
| `orb-dev.sh up [worktree] [--prod]` | 既存の起動。`--prod` を付けると `pnpm dev` の代わりに `pnpm build → pnpm migrate → pnpm start` で起動する |
| `orb-dev.sh seed [worktree]` | 起動中の環境に Seeder を流す。終わったら自動でスナップショットを取る |
| `orb-dev.sh snapshot [worktree] [名前]` | 今の DB と `files/` を保存する。名前の既定は `seed` |
| `orb-dev.sh restore [worktree] [名前]` | 保存したものに戻す。キー（最新 migration 名）が合わなければ失敗し、`seed` をやり直すよう案内する |
| `orb-dev.sh up [worktree] --seed` | 起動後、キーの合うスナップショットがあれば `restore`、なければ `seed` を実行する |

スナップショットは `~/.cache/misskey-orb-dev/<project>/snapshots/<最新 migration 名>/<名前>.dump` と `<名前>.files.tar` に保存する。最新 migration 名は `SELECT name FROM migrations ORDER BY id DESC LIMIT 1` で取る。

### データの中身

乱数はシード値（既定 `20261023`、環境変数 `SEED` で変更できる）で固定し、何度流しても同じ内容にする。

**ローカル（API で作る）**

| 種類 | 量・内容 |
|---|---|
| ユーザー | 管理者 `admin` に加えて 7 人（`alice`、`bob`、`carol`、`dave`、`erin`、`frank`、`bot`）。パスワードはすべて `admin1234`。`bot` は `isBot`。全員に生成したアバターとバナー、表示名、自己紹介、プロフィールの追加情報（fields）2 件を設定する |
| ロール | 「シード用」ロールを作り、全員に付ける。ポリシーは `rateLimitFactor: 0`（本番モードでもレート制限に当たらないようにする） |
| フォロー | 8 人の間で、ほぼ全員が互いにフォローする。`frank` は誰もフォローしない（ホームタイムラインが空のときの表示を確かめるため） |
| カスタム絵文字 | 生成した画像で 24 個。カテゴリ 3 つに分け、エイリアスを付ける。1 個はセンシティブ、1 個はローカルのみ |
| ノート | 約 700 件。内訳は、普通の文 50%、MFM 入り 10%、ハッシュタグ入り 10%、CW 5%、画像の添付 1〜4 枚が 10%、リプライ（スレッドを含む）10%、リノートと引用 5%。公開範囲は public が中心で、home、followers、specified も少し混ぜる |
| アンケート | 10 件。うち 1 件は締め切りが 2 分後、1 件は 1 日後、残りは締め切りなし |
| リアクション | ノートの 3 割に、Unicode とカスタム絵文字で 1〜6 個 |
| クリップ | `admin` に 15 件（11 件以上ないとページネーションの確認ができないため）。うち 3 件に 5〜10 ノートを入れる。`alice` のクリップ 2 件を `admin` がお気に入りにする |
| チャンネル | 3 つ。それぞれに 20〜40 件の投稿。`admin` が 2 つをフォローし、1 つをお気に入りにする |
| リスト・アンテナ | `admin` にリスト 2 つとアンテナ 1 つ |
| お気に入り | `admin` がノート 10 件をお気に入りにする |
| 通知 | 上のやりとりで自然に発生する（フォロー、リアクション、リプライ、メンション、リノート、アンケートの締め切り） |

API で作るノートの時刻は、すべて実行した時点になる（作成日時を指定する API はない）。過去の日付に散らばったデータが欲しい場合は、リモートのノートで確かめる。

**リモート（SQL で直接入れる）**

| 種類 | 量・内容 |
|---|---|
| インスタンス | 2 つ（`remote-a.example`（softwareName `misskey`）と `remote-b.example`（softwareName `mastodon`））。名前、themeColor、iconUrl を設定し、インスタンスティッカーが出るようにする |
| ユーザー | 各インスタンスに 3 人、計 6 人。`uri`、`inbox`、`sharedInbox`、`followersUri`、`lastFetchedAt` を入れる。アバターとバナーは、ローカルで生成した画像を `isLink` のリモート用 drive_file として登録し、その ID を指す |
| ノート | 約 250 件。時刻は過去 30 日に散らばらせる（ID を過去の時刻で生成する）。`uri` と `url` を入れる。リモートのカスタム絵文字を本文に含むものを混ぜる |
| リモートのカスタム絵文字 | 各インスタンスに 4 個（`host` を設定。画像はローカルで生成したものの URL を使う） |
| フォロー | ローカルの `admin`、`alice`、`bob` が、リモートのユーザー 4 人をフォローする（`following` テーブルに直接入れ、`user.followingCount` / `followersCount` も更新する） |
| リアクション | リモートのユーザーから、ローカルのノートに 30 件（`note_reaction` を入れ、`note.reactions` の jsonb も更新する） |

直接入れた行は、`user.notesCount`、`instance.notesCount`、`instance.usersCount` などのカウンタも SQL で合わせる。

### タイムラインの扱い

SQL で入れたリモートのノートは、Redis のタイムラインキャッシュ（FTT）には載らない。そこで Seeder は、最初に `admin/update-meta` で `enableFanoutTimeline: false` にする。こうするとタイムラインが DB から組み立てられるので、リモートのノートも出る。FTT の動作を確かめたいときは、seed の後に管理画面から戻す。`restore` の後は Redis を `FLUSHALL` する。

### 対象外

- 実際の連合（別のサーバーとの ActivityPub のやりとり）は扱わない。リモートのユーザーやノートは表示用のデータで、取得し直そうとすると失敗する
- 本番データの取り込みは扱わない（個人情報を含むため）
- ノート数千件以上の負荷試験用データは扱わない（量は `SEED_NOTES` で増やせるようにだけしておく）

## Global Constraints

- 作業ブランチは claudeImplement（`add-claude-github-actions-1762310148415`、ワークツリー `/Users/riin/workspace/misskey-worktrees/claudeImplement`）。`.node-version` の未コミットの変更はコミットに含めない
- Seeder のスクリプトは依存パッケージを使わない（Node.js 26 の標準機能だけで動かす）。web コンテナの中でも、ホストでも動くようにする
- 新規の `.mjs` には SPDX ヘッダーを付ける（`SPDX-FileCopyrightText: syuilo and misskey-project`、`SPDX-License-Identifier: AGPL-3.0-only`）。`node scripts/check-spdx.mjs` を通す
- パスワードは全員 `admin1234`、セットアップパスワードは `orb-dev.sh` と同じ `example_password_please_change_this_or_you_will_get_hacked` を使う
- 乱数の既定のシード値は `20261023`。同じシード値なら同じデータになること
- ID は aidx 形式（16 文字。先頭 8 文字が `(ミリ秒 - 946684800000)` の 36 進数）。`packages/backend/src/misc/id/aidx.ts` と同じ規則で作る
- 文言（ログ、SKILL.md）は日本語。段落はです・ます調、箇条書きはである調

## Review Focus

1. **同じ環境に 2 回 seed した** → 既にデータがあるときは止まり、`down -v` か `restore` を案内する（重複してもエラーで落ちず、中途半端な状態を作らないこと）
2. **seed の途中で API が失敗した** → どの段で失敗したかを表示して終了コード 1 で止まる。スナップショットは取らない
3. **migration が進んだブランチで `restore` した** → キーが合わないので戻さずに止まり、`seed` をやり直すよう案内する
4. **本番モード（`--prod`）で seed した** → レート制限に当たらずに最後まで流れる（シード用ロールの `rateLimitFactor: 0` が先に効いていること）
5. **`restore` の後のログインとタイムライン** → 戻した直後に `admin` / `admin1234` でログインでき、ホーム・ローカル・グローバルの各タイムラインにローカルとリモートのノートが出る（Redis の古いキャッシュが残らないこと）

---

### Task 1: 部品（PNG 生成、aidx、乱数）

**Files:**
- Create: `.claude/skills/orb-dev-server/scripts/seed/lib/png.mjs`、`lib/aidx.mjs`、`lib/random.mjs`
- Test: `.claude/skills/orb-dev-server/scripts/seed/seed.test.mjs`

**Interfaces:**
- Produces:
  - `png.mjs`: `export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer`、`export function avatarPng(seed: string): Buffer`（256×256、左右対称のドット絵風）、`export function bannerPng(seed: string): Buffer`（1500×500 のグラデーション）、`export function emojiPng(seed: string): Buffer`（128×128、透過背景に図形）、`export function photoPng(seed: string): Buffer`（800×600、添付画像用）
  - `aidx.mjs`: `export function genAidx(timeMs: number, counter: number): string`
  - `random.mjs`: `export function createRandom(seed: number): { next(): number; int(min: number, max: number): number; pick<T>(items: T[]): T; chance(p: number): boolean }`（mulberry32 など）

**手順:**
- [ ] テストを先に書く。`encodePng` の出力が PNG のシグネチャ（`89 50 4E 47 0D 0A 1A 0A`）で始まり、IHDR の幅と高さが指定どおりであること。`avatarPng('alice')` を 2 回呼ぶと同じバイト列になること。`genAidx(946684800000 + 36 ** 3, 0)` の先頭 8 文字が `00001000` になり、全体が 16 文字であること。同じシード値の `createRandom` が同じ列を返すこと
- [ ] RED を確認し（`node --test .claude/skills/orb-dev-server/scripts/seed/seed.test.mjs`）、実装して GREEN にする。PNG は `zlib.deflateSync` と `zlib.crc32` で IHDR、IDAT、IEND の 3 チャンクを書く（フィルタは全行 0）
- [ ] aidx の node 部（4 文字）は乱数で 1 回決め、counter 部は 4 文字の 36 進数にする。`packages/backend/src/misc/id/aidx.ts` を読んで、同じ桁の並びにする
- [ ] commit: `feat(claude): orb-dev-server の seed 用に PNG 生成・aidx・乱数の部品を追加`

### Task 2: API の段（ローカルのデータ）

**Files:**
- Create: `.claude/skills/orb-dev-server/scripts/seed/lib/api.mjs`、`data/texts.mjs`、`seed.mjs`

**Interfaces:**
- Consumes: Task 1 の部品
- Produces:
  - `api.mjs`: `export function createApi(baseUrl: string): { call(endpoint: string, body: object, token?: string): Promise<any>; upload(token: string, name: string, png: Buffer): Promise<{ id: string; url: string }> }`。失敗時はエンドポイント名と応答本文を含めて throw する
  - `seed.mjs`: `node seed.mjs --url http://localhost:3000 --out <dir>` で実行する。`<dir>/seed-result.json`（作ったユーザーの id とトークン、絵文字やファイルの URL）を書き出す。Task 3 がこれを読む

**手順:**
- [ ] 最初に、ユーザーが `admin` しかいないことを確かめる（`admin/show-users` などで件数を見る）。ほかにもいれば「既にデータがある」と表示して終了コード 1 で止まる
- [ ] 実行順: `admin` でサインイン（`signin-flow`）→ `admin/update-meta`（`enableFanoutTimeline: false`、登録の受付などはそのまま）→ シード用ロールの作成と自分への付与 → ユーザー 7 人を `admin/accounts/create` で作り、ロールを付与 → アバターとバナーのアップロードと `i/update` → カスタム絵文字 → フォロー → チャンネル → ノート（リプライとリノートは先に作ったノートを指す）→ アンケート → リアクション → クリップとお気に入り → リスト・アンテナ
- [ ] 各段の開始時に `[seed] ノート 300/700` のような進み具合を出す。失敗したら段の名前と API の応答を出して終了コード 1
- [ ] 本文の素材（`data/texts.mjs`）は、日本語の短文 80 個、MFM の例 15 個（`$[tada ...]`、`$[spin ...]`、`**太字**`、`<center>` など）、ハッシュタグ 10 個、CW の例 10 個を用意する。実在の人物や団体の名前は使わない
- [ ] 確認: `orb-dev.sh up` した環境の web コンテナで `node /workspace/.claude/skills/orb-dev-server/scripts/seed/seed.mjs --url http://localhost:3000 --out /tmp/seed` を実行し、最後まで流れること。ブラウザで `alice` のプロフィールにアバターとバナーが出ること
- [ ] commit: `feat(claude): orb-dev-server に API でローカルの開発用データを作る seed を追加`

### Task 3: SQL の段（リモートのデータ）

**Files:**
- Create: `.claude/skills/orb-dev-server/scripts/seed/remote.mjs`
- Modify: `seed.test.mjs`（SQL 生成のテストを追加）

**Interfaces:**
- Consumes: Task 1 の `genAidx` と `createRandom`、Task 2 の `seed-result.json`
- Produces: `node remote.mjs --result <dir>/seed-result.json --base-url <インスタンスの URL> > remote.sql`。1 つのトランザクション（`BEGIN; ... COMMIT;`）になった SQL を標準出力に書く

**手順:**
- [ ] 対象の列は、`packages/backend/src/models/` の `User.ts`、`UserProfile.ts`、`Instance.ts`、`Note.ts`、`Emoji.ts`、`DriveFile.ts`、`Following.ts`、`NoteReaction.ts` を読んで、NOT NULL で既定値のない列をすべて埋める。値は SQL の文字列リテラルとして必ずエスケープする（`'` を `''` にする関数を 1 つ用意して、すべての値に通す）
- [ ] テストを先に書く。生成された SQL が `BEGIN;` で始まり `COMMIT;` で終わること。リモートユーザー 6 人分の `INSERT INTO "user"` があり、`host` が 2 種類であること。ノートの ID の時刻が過去 30 日の範囲に収まっていること。`'` を含む本文が正しくエスケープされること
- [ ] 実装後、`orb-dev.sh` 経由ではなく手で db コンテナの psql に流して（`docker compose -p <project> -f <state>/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U example-misskey-user misskey < remote.sql`）エラーが出ないこと。ブラウザで、リモートユーザーのページ、インスタンスティッカー、リモートのカスタム絵文字、グローバルタイムラインのリモートのノートを確認する
- [ ] commit: `feat(claude): orb-dev-server の seed にリモート（連合）の表示用データを追加`

### Task 4: orb-dev.sh のサブコマンドと --prod

**Files:**
- Modify: `.claude/skills/orb-dev-server/scripts/orb-dev.sh`

**手順:**
- [ ] `--prod` フラグ: `generate` の web の command を `... && pnpm install --frozen-lockfile && NODE_ENV=production pnpm build && pnpm migrate && NODE_ENV=production pnpm start` にする。`wait_ready` は `Now listening` を待つので変えなくてよいが、待ち時間の上限を本番ビルドの分だけ延ばす（30 分）
- [ ] `seed`: web コンテナで `seed.mjs` を実行し、続けて `remote.mjs` の出力を db の psql（`-v ON_ERROR_STOP=1`）に流す。どちらかが失敗したら止まる。成功したら `snapshot seed` を呼ぶ
- [ ] `snapshot [名前]`: db コンテナで `pg_dump -Fc` を取り、ホストの `snapshots/<最新 migration 名>/<名前>.dump` に保存する。web コンテナで `/workspace/files` を tar にして同じ場所に保存する
- [ ] `restore [名前]`: キーのディレクトリにファイルがなければ、手元にあるキーの一覧を出して止まる。あれば web を止め、DB を作り直して（`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`）`pg_restore` し、`files/` を tar から戻し、redis で `FLUSHALL` してから web を起動し直す
- [ ] `up --seed`: 起動後、キーの合うスナップショットがあれば `restore seed`、なければ `seed`
- [ ] 確認: 新しい環境で `up --seed`（seed が流れてスナップショットが取られる）→ ノートを 1 件手で足す → `restore` → 足したノートが消え、`admin` でログインできること。`--prod` でも `up --seed` が最後まで流れること
- [ ] commit: `feat(claude): orb-dev-server に seed・snapshot・restore と本番モード起動を追加`

### Task 5: SKILL.md と運用の記録

**Files:**
- Modify: `.claude/skills/orb-dev-server/SKILL.md`

**手順:**
- [ ] コマンドの一覧に `seed` / `snapshot` / `restore` / `--prod` / `--seed` を足す。データの中身（ユーザー名とパスワード、主な件数）と、対象外（実際の連合はしない、API のノートは実行時刻になる、FTT を切っている）を書く
- [ ] 「ハマりどころ」に、ホストの Node.js から orb.local を引けないことがあるので seed は web コンテナの中で実行していること、`files/` もスナップショットに含めていることを書く
- [ ] commit: `docs(claude): orb-dev-server スキルに開発用データの使い方を追記`

---

## 別の計画にするもの: claudeImplement を MISTEMS 開発の本拠地にする

会話で出た「claudeImplement を MISTEMS 開発でコミットしたいファイルの本拠地にし、AGENTS.md や上流のスキル・貢献ガイドを MISTEMS 用に上書きする」件は、この計画とは別に計画書を作る。Seeder とは変更範囲（AGENTS.md、CLAUDE.md、CONTRIBUTING.md、`.claude/skills/` の上流由来のもの、`.github/copilot-instructions.md`）も確認方法も違うためである。

その計画で決めておきたいことを挙げておく。

- 上流由来のスキル（`working-on-backend` など）を書き換える場合、上流が同じファイルを更新するたびに `main-統合.sh` でコンフリクトする。上書きよりも、MISTEMS 用のファイルを別名で足し、AGENTS.md からそちらを指す方が、統合の手間が少ない
- 「本拠地」のルール（mistems-main にはコミットしない、スキルを直したら claudeImplement に反映する、など）は、今は各スキルの末尾に散らばっている。AGENTS.md の 1 か所にまとめる
- 計画書の置き場所（今回のようにプロジェクトルートに置くか、`docs/plans/` などにまとめるか）
