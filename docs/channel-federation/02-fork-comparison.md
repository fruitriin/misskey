# 比較: チャンネル連合を達成した Misskey 系フォークの実装

成果物 2/3。[01-plan.md](01-plan.md) の計画を前提に、チャンネル連合 (またはそれに準ずる機能) を実際に実装・運用しているフォークのソースコードを取得して読み、本計画と比較する。

## 0. 調査方法と対象

2026-08-01 時点の各フォークの既定ブランチ HEAD を shallow clone し、`packages/backend/src` を対象に (1) `core/activitypub/` 配下の channel 言及、(2) `NoteCreateService` のチャンネル投稿への localOnly 強制の有無、を機械的に確認した。

| フォーク | 系統 | チャンネル連合 | 判定根拠 |
|---|---|---|---|
| **yojo-art/cherrypick** (よじょあーと) | CherryPick 派生 (縁側をマージ) | **あり (双方向・Actor 方式)** | AP 層の広範な channel 対応、`Channel.host` / `actorId` カラム |
| **Type4ny-Project/Type4ny** | Misskey 派生 (Type4ny-Project / まっちゃてぃー氏) | **あり (送信のみ・平文方式)** | CHANGELOG「チャンネルの投稿が連合できるようになりました」、`Channel.isLocalOnly` |
| kokonect-link/cherrypick (CherryPick 本家) | Misskey 派生 | なし | localOnly 強制が本家どおり |
| hideki0403/kakurega.app (隠れ家) | Misskey 派生 | なし | 同上 (AP 層に channel 言及 0 件) |
| TeamNijimiss/misskey (にじみす) | Misskey 派生 | なし | 同上 |
| paricafe/misskey | Misskey 派生 | なし | 同上 |
| lqvp/misskey | Misskey 派生 | なし | 同上 |
| MisskeyIO/misskey | Misskey 派生 | なし | 同上 |
| shrimpia/misskey (シュリンピア) | Misskey 派生 | なし | 同上 |
| team-shahu/misskey | Misskey 派生 | なし | 同上 |

チャンネル連合を「達成」しているのは調査した範囲では **yojo-art** と **Type4ny** の 2 系統で、両者はアプローチが対照的である。以下それぞれを読み、最後に本計画 (案 B → 案 C 段階導入) と突き合わせる。

> 補足: Firefish / Iceshrimp / Sharkey 等の欧米系フォークはチャンネル機能自体を重視しておらず (Sharkey は GitLab 系ホストのため今回の環境からソース取得不可)、チャンネル連合の実装は確認できていない。参考実装としてはむしろ Misskey 系外の Lemmy (FEP-1b12) と PeerTube (動画チャンネル = Group Actor) が挙げられる。

---

## 1. Type4ny: 「チャンネルノートをただの公開ノートとして連合させる」最小実装

### 1.1 スキーマ

`Channel` に boolean 1 個を足しただけ (`packages/backend/src/models/Channel.ts`):

```ts
@Column('boolean', { default: false })
public isLocalOnly: boolean;
```

注目すべきは既定値が `false`、つまり **Type4ny ではチャンネルは既定で連合する (オプトアウト方式)**。`channels/create` でも `isLocalOnly: ps.isLocalOnly ?? false`。

### 1.2 送信側

`NoteCreateService` の強制ブロックが次のように変わる:

```ts
if (data.channel != null) {
    data.visibility = 'public';
    data.visibleUsers = [];
    if (data.channel.isLocalOnly) {
        data.localOnly = true;
    }
}
```

visibility は `public` のまま。AP 表現には**チャンネル専用の語彙を一切足さず**、代わりに `ApRendererService.renderNote` で本文末尾へ平文でチャンネル URL を付記する:

```ts
if (note.text && note.channelId) {
    note.text = note.text + '\n\nFrom https://' + this.config.host + '/channels/' + note.channelId;
}
```

to/cc の決定・配送先 (フォロワー recipe + public はリレー) は本家と同一。つまりリモートには「本文にチャンネルへのリンクが書いてある普通の public ノート」が届く。

### 1.3 受信側

**受信側の実装は存在しない。** リモートノートに channelId が付くことはなく、リモートチャンネルという概念もない。リモートからのリプライは (本家由来の「リプライ先チャンネル追従」ロジックにより) チャンネルスレッドに還流し得るが、それはプロトコルではなく reply チェーンの副作用である。

### 1.4 特徴と限界

- 変更量は実質 3 ファイル + migration 1 本と極小。graceful degradation は完全 (何も拡張していないので)。
- 「タイムライン避け」の意味論はリモート側で**失われる**。public で送るためリモートの GTL・連合 TL・検索に載る。
- チャンネル所属が機械可読でない (本文の平文 URL のみ)。受信側での UI 表示・モデレーション単位・購読はいずれも不可能。
- 既定オプトアウトは「知らずに連合してしまう」リスクがあり、既存ユーザーの期待 (チャンネル = 連合しない場) を裏切りうる。本計画が R5 で既定 `none` を採ったのと対照的。

---

## 2. yojo-art: 「チャンネルを Actor にする」本格実装

<!-- yojo-art 詳細調査の結果をここに記載 -->

---

## 3. 参照実装としての本家ドラフトと標準

### 3.1 misskey-hub-next#289 (`_misskey_channel` ドラフト)

本家の語彙ドラフトは「チャンネル = システムユーザーとしての `Application` Actor」+ Note / Actor 双方への `_misskey_channel` プロパティ (url / name / description / isSensitive / allowRenoteToExternal) という設計。受信側の義務として

- `isSensitive: true` → 当該ノートの実効可視性を home 扱いにする
- `allowRenoteToExternal: false` → チャンネル文脈外へのリノート・引用を受信側でも禁止する
- チャンネル (システムユーザー) の suspend → 当該チャンネルの全ノート拒否、silence → home 降格

まで規定しており、モデレーション論点 (misskey#14048) への回答を仕様に織り込んでいる。

### 3.2 FEP-1b12 (Lemmy 方式)

コミュニティ = `Group` Actor。メンバーが Group 宛に投稿 (`audience` で指定) → Group が自分のフォロワーへ `Announce` して再配送する。購読・配送・モデレーション (Group 管理者による削除の連合) が Actor モデルに自然に載る。Discussion #14049 でも「FEP-1b12 の拡張で実現可能」との指摘があり、tesaguri 氏の段階案 (inbox なし Group + Note.audience) は FEP-1b12 への漸進経路として設計されている。

---

## 4. 本計画との比較表

<!-- yojo-art 調査反映後に確定 -->
