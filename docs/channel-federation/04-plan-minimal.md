# 計画書(改訂版): Type4ny 系最小方式によるチャンネルノート連合

[01-plan.md](01-plan.md)(当初計画)・[02-fork-comparison.md](02-fork-comparison.md)(フォーク比較)・[03-consideration.md](03-consideration.md)(考察) を経た議論の結論として採用する実装計画。01 を置き換える実行計画であり、01/03 は検討過程の記録として残す。

## 0. 方針転換の理由

03 までの検討は「チャンネルというスコープをどうプロトコルに乗せるか」を軸にしていたが、以下の 2 つの現実認識により軸を変える。

1. **受信側へコードを配れない。** `_misskey_channel` 語彙も Group Actor も、受信側が対応実装を動かして初めて意味を持つ。フォーク実装をそのまま採用するサーバーは実質作者本人だけであり (02 の調査でも 10 フォーク中 8 つは本家挙動のまま)、追いかける相互運用相手が存在しない。読む実装が現れない語彙の価値はゼロである。
2. **空間の非対称。** こちらはサーバー内の公開タイムラインを避けたくてチャンネルにいるが、やりとりしたいリモートの相手は最初からパブリックタイムラインで暮らしている。相手側には「チャンネルに閉じこもる」必要がそもそもない。つまり**連合させたいのはノート (やりとり) であって、スコープ (場) ではない**。スコープは自サーバー内の読まれ方を制御する装置であり、輸出する必要がない。

この枠組みでは、チャンネル所属をプロトコルに載せず「本文にチャンネル URL を付記した通常ノート」として連合する Type4ny 方式 (02 §1) は手抜きではなく、**問題のスコープを正しく切った実装**である。本計画はこれを土台に、受信側にコードを配れない制約と矛盾しない 3 点 (オプトイン既定 / home 送出 / 自サーバー側の還流整理) だけを修正して採用する。

副次的な利点として、本家からの差分が最小になるため、**フォークとして本家アップデートに追従し続けるコストが最も小さい**。これは 01 案 C (Actor 方式、約 20 ファイル + ユーザー機構への相乗り) と比べたときの決定的な運用上の差である。

### やらないと決めたこと

- チャンネル Actor / Group 化 (01 Phase 3、03 §4 の前倒し提案は**撤回**)
- `_misskey_channel` / `audience` 等の独自語彙の送出
- リモートチャンネルの表現 (channel.host)、チャンネルフォローの連合、場としての購読

「話題の場として外から購読されたい」需要が実際に生まれた時点で Actor 化を再訪する。本計画はその扉を閉じない (チャンネル URL は将来 Actor URI に昇格させられる)。

## 1. 要件

| # | 要件 | 実現手段 |
|---|---|---|
| R1 | 自サーバーの LTL / STL / GTL に載らない (現行チャンネルと同一) | 現行の `channelId IS NULL` フィルタ群を無変更で維持 |
| R2 | リモートから閲覧・リプライ・リノート・引用・リアクションできる | localOnly 強制の条件化 |
| R3 | リモートからのリプライ・リアクションがチャンネルに還流する | 自サーバー受信側の整理 (§2.5) |
| R4 | **相手が既に実装している標準セマンティクスのみに依存する** | AP 上は home (unlisted) で送出。独自語彙なし |
| R5 | チャンネル単位オプトイン。既定は現行どおり非連合 | `channel.federateNotes` (default false) |
| R6 | 連合先のパブリック TL に載せない | home 送出 (`cc: as:Public`) は Mastodon / Misskey が今日すでに解釈する |
| R7 | `allowRenoteToExternal: false` のチャンネルは連合不可 | API バリデーション |

R6 の補足: 「受信側に何も配れない」制約下で唯一相手側の挙動を制御できるのは、相手が既に実装している標準セマンティクスだけである。unlisted はその数少ない一つであり、リモートの LTL/GTL 露出と、リモートユーザーのリノートが自サーバーへ還流してくる確率を下げる。やりとりの主経路 (フォロワーの HTL・リプライ・URL 照会・検索) は損なわれない。

## 2. 設計

### 2.1 スキーマ (migration 1 本)

```ts
// packages/backend/src/models/Channel.ts (allowRenoteToExternal の後に追加)
@Column('boolean', {
	default: false,
	comment: 'Whether notes in this channel are federated (as unlisted notes).',
})
public federateNotes: boolean;
```

- boolean とし、送出可視性は home 固定 (将来 public 送出を許すなら enum へ migration で昇格)
- 新規 migration は `up()` / `down()` 両実装。`pnpm --filter backend check-migrations` で pending DDL 0 件を確認
- `channels/create` / `channels/update` の paramDef に `federateNotes` を追加し、`allowRenoteToExternal === false` との同時指定を弾く (R7)。既存チャンネルの設定変更は許可 (過去ノートには遡及しない旨を UI で警告)
- packed channel (`models/json-schema/channel.ts`, `ChannelEntityService`) に `federateNotes` を追加
- API 変更につき `pnpm build-misskey-js-with-types` で autogen 再生成

### 2.2 localOnly 強制の条件化 (送信側の核心)

`packages/backend/src/core/NoteCreateService.ts:466-470` (現行):

```ts
if (data.channel != null) data.visibility = 'public';
if (data.channel != null) data.visibleUsers = [];
if (data.channel != null) data.localOnly = true;
```

変更後:

```ts
if (data.channel != null) data.visibility = 'public';
if (data.channel != null) data.visibleUsers = [];
if (data.channel != null && this.userEntityService.isLocalUser(user)) {
	data.localOnly = data.channel.federateNotes ? (data.localOnly ?? false) : true;
}
```

- **DB 上の visibility は `public` のまま維持する** (チャンネル TL・FTTL・可視性 4 実装の前提を一切崩さないため)。AP 上の見え方だけを §2.3 で home に変換する
- 連合チャンネルでも**ノート単位の `localOnly: true` は尊重**する (チャンネルは連合可でも、このノートだけはローカルに留めたい、を許す)
- `isLocalUser` 条件は §2.5 の受信側整理と対 (リモート由来ノートに localOnly を立てない)

localOnly が false になれば、Create / Delete / Like / 投票 Update / ピン留めの配送 12 箇所 (01 §1.2) はすべて既存コードのまま機能する。追加の配送実装は不要。

### 2.3 AP 上の実効可視性: home 送出

チャンネルノートの AP 表現を決める箇所に「実効可視性」ヘルパーを 1 つ挟む:

```ts
// ApRendererService 内 (または misc/)
function apEffectiveVisibility(note: MiNote): 'public' | 'home' | 'followers' | 'specified' {
	if (note.channelId != null && note.visibility === 'public') return 'home';
	return note.visibility;
}
```

適用箇所 (いずれも visibility の分岐を実効可視性で行うだけ):

- `ApRendererService.renderNote` の to/cc 決定 (`ApRendererService.ts:404-418`) → `to: [<author>/followers]`, `cc: ['as:Public', ...mentions]`
- `ApRendererService.renderAnnounce` の to/cc 決定 (同 99-110) — チャンネル内リノートを連合させる場合も home 相当で
- `NoteCreateService.ts:906` のリレー配送判定 — 実効 home なので**自動的にリレー対象外**になる (public のみリレーのため、コード変更不要なことをテストで固定する)

配送先は既存の followers recipe (`NoteCreateService.ts:902`) のまま = 投稿者のリモートフォロワーへ届く。チャンネルフォロワーという配送単位は作らない (場を輸出しないため)。

### 2.4 本文へのチャンネル URL 付記 (Type4ny 方式の非破壊版)

リモートの人間の読者に「これはチャンネル文脈の投稿である」ことを伝える唯一の手段として、AP 出力時に本文へチャンネルへのリンクを付記する。

Type4ny は `renderNote` 内で `note.text` を**破壊的に**書き換えている (`note.text = note.text + '\n\nFrom https://...'`) が、レンダリング経路によっては二重付記や DB 外への副作用の芽になるため、**ローカル変数で非破壊に**行う:

```ts
// ApRendererService.renderNote 内、getNoteHtml へ渡す直前
let apText = note.text;
if (note.channelId != null) {
	apText = `${apText ?? ''}\n\nRE: ${this.config.url}/channels/${note.channelId}`.trim();
}
```

- HTML (`content`) 側は既存の quote-inline と同様に `<span class="quote-inline">` 相当で装飾してもよい (Mastodon 側で折りたたみ表示される慣行に乗る)
- `_misskey_content` / `source` (MFM 原文) には**付記しない** (Misskey 系受信側では原文が優先されるため、対応不要の受信側 = 非 Misskey にのみ届けばよい。Misskey 系はプレーンな URL 付き content を見る)
  - 注: 受信側 Misskey は `source.content` → `_misskey_content` → `content` の順で本文を採用する (`ApNoteService.ts:187-194`)。Misskey 系に URL を見せたい場合は全てに付記する判断もある。実装時に表示確認して決める (初期実装は content のみ付記 → 相手が Misskey なら URL なしの素のノートに見える、で問題ない: チャンネル URL はあくまで人間向けの補助情報)

### 2.5 自サーバー受信側の整理 (還流ループを閉じる)

「受信側にコードを配れない」の唯一の例外は自分のサーバーである。往復に必要な受信側処理は既にほぼ存在する:

1. **リプライのチャンネル還流**: `NoteCreateService.ts:461-463` の「リプライ先がチャンネル投稿なら同じチャンネルに入れる」は受信ノートにも効く (受信も同じ `create()` を通るため)。リモートからのリプライは**追加実装なしで**チャンネルスレッドに入り、チャンネル TL に表示される
2. **localOnly ワートの修正**: 現行のままだと上記還流時に `NoteCreateService.ts:470` がリモートノートへ `localOnly: true` を立てる。§2.2 の `isLocalUser(user)` 条件がこれを解消する (リモートノートは常に `localOnly: false`、`ApNoteService.ts:324` の固定値とも整合)
3. **リアクション・リノートの還流**: 対象ノート単位で既存実装のまま動く (チャンネル概念に触れないため変更不要)
4. 連合をオフに戻したチャンネルへのリプライが後から届いた場合も、スレッド整合を優先してチャンネルに入れる (配送済みノートは取り消せないため、還流だけ拒否しても意味がない)

### 2.6 新規露出の遮断

localOnly 解除により、匿名公開の新着一覧 `packages/backend/src/server/api/endpoints/notes.ts:55-56` (`visibility='public' AND localOnly=FALSE` のみ) に連合チャンネルノートが**新たに載ってしまう** (01 §4 Phase 1-5 で発見済みの唯一の露出点)。ここに `channelId IS NULL` を追加する。featured 系はチャンネル別ランキングに分離済みで影響なし (`ReactionService.ts:224-230`)。

AP サーバー側は変更不要: `/notes/:note` は `visibility IN (public,home) AND localOnly=false` なので連合チャンネルノートを返すようになる (意図どおり)。outbox の既存フィルタも同様に通る。

### 2.7 フロントエンド

- チャンネル作成・編集画面に「ノートを連合する」トグル (`federateNotes`) + `allowRenoteToExternal` オフとの排他をフォーム側でも表現
- チャンネルヘッダと投稿フォームに連合状態を常時表示 (地球アイコン等)。**「連合中のチャンネルへの投稿はサーバー外に公開される」ことを投稿前に視認できる**こと (R5 の期待保護の要)
- 設定切替時の確認ダイアログ: 「過去のノートには影響しません。今後のノートが連合されます」
- `locales/ja-JP.yml` のみ編集 (他言語 yml は触らない)

## 3. 変更ファイル一覧 (見積り)

| ファイル | 変更 |
|---|---|
| `packages/backend/migration/<ts>-channel-federate-notes.js` | 新規 (up/down) |
| `packages/backend/src/models/Channel.ts` | カラム追加 |
| `packages/backend/src/models/json-schema/channel.ts` | packed スキーマ |
| `packages/backend/src/core/entities/ChannelEntityService.ts` | pack に追加 |
| `packages/backend/src/core/NoteCreateService.ts` | §2.2 (466-470 付近) |
| `packages/backend/src/core/activitypub/ApRendererService.ts` | §2.3 実効可視性 + §2.4 URL 付記 |
| `packages/backend/src/server/api/endpoints/channels/create.ts` / `update.ts` | paramDef + R7 バリデーション |
| `packages/backend/src/server/api/endpoints/notes.ts` | §2.6 `channelId IS NULL` |
| `packages/misskey-js/src/autogen/*` | 再生成 |
| frontend: チャンネル編集/ヘッダ/投稿フォーム + `locales/ja-JP.yml` | §2.7 |

backend 実質 8 ファイル + migration 1 本。Type4ny (3 ファイル) との差は、非破壊付記・home 送出ヘルパー・オプトインバリデーション・露出遮断の分であり、いずれも安全側の追加。

## 4. 挙動マトリクス

| 観点 | federateNotes: false (既定) | federateNotes: true |
|---|---|---|
| 自サーバー LTL/STL/GTL | 載らない | 載らない (変更なし) |
| チャンネル TL / フォロワー HTL | 載る | 載る (変更なし) |
| リモートへの配送 | なし | 投稿者のリモートフォロワー + メンション/リプライ先 |
| リレー | なし | なし (実効 home のため) |
| リモートの LTL/GTL | — | 載らない (unlisted) |
| リモートでの見え方 | — | 「チャンネル URL 付きの unlisted ノート」 |
| リモートからのリプライ | — | チャンネルスレッドに還流 |
| リモートからのリノートの自サーバーへの還流 | — | **起こりうる** (通常のリモートノートとして STL/HTL に載る。§5-2) |
| ノート単位 localOnly | 常に true 扱い | ユーザー指定を尊重 |

## 5. 限界とリスク (ユーザーに伝えるべきこと)

1. **紳士協定の上限**: unlisted は受信側実装が尊重して成立する慣行であり、連合した瞬間にノートは技術的に公開情報になる。保証は「見られない」ではなく「積極的に見せて回らない」まで。UI 文言もこの線で書く
2. **還流は防げない**: リモートユーザーがリノートすれば、それは通常のリモートノートとして自サーバーの STL/HTL に載りうる (リノート自体に channelId は付かない)。home 送出は確率を下げるだけで、ゼロにはしない
3. **チャンネル文脈は人間可読情報のみ**: リモート側 UI にチャンネル名が出ることはなく、本文の URL だけが手がかり。機械可読な所属表現は意図的に捨てている (§0)
4. **本家との将来衝突は最小**: 独自語彙を出さないため、本家がチャンネル連合を実装しても衝突するのは `federateNotes` カラム名程度。追従は migration 1 本で済む見込み

## 6. テスト計画

- unit (`pnpm --filter backend test`): `NoteCreateService` の localOnly 決定 (federateNotes × ノート単位 localOnly × リモートユーザーの組合せ)、`ApRendererService` の実効可視性 (to/cc が home 構成になること・URL 付記が非破壊であること)
- fed (`pnpm --filter backend test:fed`): 「連合チャンネルノート配送 → 受信側で unlisted 表示 → リプライ還流でチャンネル入り (localOnly が立たないこと)」「federateNotes: false チャンネルが一切配送されないこと」「リレーに流れないこと」
- 回帰: 既存チャンネル (federateNotes: false) の全挙動が無変更であること、`/api/notes` に連合チャンネルノートが出ないこと
- 手動: 本家 Misskey / Mastodon 相手に、unlisted ノートとして表示されリプライが還流することを確認

## 7. 実装順序

1. migration + entity + packed schema + autogen (§2.1)
2. NoteCreateService の localOnly 条件化 + notes.ts の露出遮断 (§2.2, §2.6) — この時点で unit テスト
3. ApRendererService の実効可視性 + URL 付記 (§2.3, §2.4) — fed テスト
4. channels/create・update のバリデーションと frontend (§2.1, §2.7)
5. shipping-misskey-change チェックリスト (lint / autogen / check-migrations / CHANGELOG の `### General` に Feat 1 行 / ja-JP.yml のみ確認) を通して PR
