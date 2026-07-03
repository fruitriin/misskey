---
title: MISTEMS 固有改造の棚卸し（v2026.6.1-alpha.1-MISTEMS.96 時点）
created: 2026-07-03
last_verified: 2026-07-03
depends_on:
  - file: docs/knowhow/mistems-integration-flow.md
status: active
---

# MISTEMS 固有改造の棚卸し（v2026.6.1-alpha.1-MISTEMS.96 時点）

## 発見した知見

`origin/develop..HEAD`（27コミット）と `main-統合.sh` の突合による、upstream Misskey に無い MISTEMS 独自の機能・修正一覧。

### 機能追加

| 機能 | パッケージ | ブランチ | 概要 |
|---|---|---|---|
| チャンネルだいたいぜんぶみる | frontend | `channelIndex` | 全チャンネル閲覧タブ。`MkChannelIndex.vue` |
| タイムマシン & ふぁぼった | backend+frontend | `release/FavstarAndTimemachine` | 過去TL遡行、リアクション閾値の青/赤ふぁぼ表示。`use-timemachine.ts` |
| 投稿機能周辺の拡張 | frontend | `mkPostFormExtend` | チャンネルピッカー、CW⇄本文入替、センシティブワード警告、`registory-item` endpoint、`MkHelp` |
| ノート検索の強化 | backend+frontend | `search-enhance` | 本文のみ/本文+CW切替、期間指定 |
| ハッシュタグミュート | backend+frontend | `hashtag-mutable` | ハッシュタグ単位のミュート |
| MkNote 拡張 | frontend | `mkNoteExtend` | リノート元/先のチャンネル名表示 |
| MkPages エディター拡張 | frontend | `release/mkPages-mkDraggable` | プレビュータブ化、DnDスマホ対応 |
| 絵文字系3点 | frontend | `emojiDetailDialog` / `emojiPickKanaConv` / `emojiChotMiel` | 読み仮名表示、ひらカナ統一検索、折り畳み時先頭4個表示 |
| MkNoteDetailed 返信ロード | frontend | `MkNoteDetailed-loadReplies` | 詳細ページで返信読み込み |
| 無名ユーザーからの通知拒否 | backend | `block-mentions-from-unfamiliar` | MisskeyIO#462 参考 |
| Claude Code GitHub Workflow | .github | — | Issue/PR で Claude が反応 |
| ADDF 導入 | ルート | — | エージェント駆動開発フレームワーク（`.claude/` / `docs/plans/` 等） |

### 修正・調整（ブランチ名のみ）

`fix-stream-indicator`（WS再開時メッセージ）/ `annoy-logs-goneto-debuglevel`（ログレベル）/ `fix/notification-unread-count` / `fix/fanout-timeline`（FTTL歯抜け）/ `fix-textfile-encode`（SJIS）/ `fix/error-page-unhandled` / `clips`（クリップ上限 20→100）/ `fix-signout` / `claude/2fa-register-key-auth-error-*`（パスワードレス+TOTP）/ `fix/emoji-picker-resize-*` / `claude/awesome-volta-*`（切断Tip z-index）/ `drive`（選択状態持ち越し）

## プロジェクトへの適用

- **改造が既に厚い領域**: チャンネル UI、投稿フォーム、絵文字ピッカー、検索。これらを再改造するときは MISTEMS 独自コードとの衝突に注意（upstream との diff だけ見ても把握できない）
- イヴの時間実装でチャンネル・投稿フォームを触る場合、`MkChannelIndex.vue` / `mkPostFormExtend` 由来のコードが前提になる

## 注意点・制約

- この一覧は MISTEMS.96 時点。統合のたびにブランチ構成が変わりうるので、最新はルート `README.md` の変更点リストと `main-統合.sh` を正とする
- ブランチ名は README 上 `riin/xxx` 表記、リポジトリ上は `origin/xxx`

## 参照

- `README.md`（ルート）/ `origin/mistems-readme:main-統合.sh`
- `git log origin/develop..HEAD --oneline`
