# CLAUDE.repo.md

このリポジトリは **ADDF 利用プロジェクト** です。

## プロジェクト概要

MISTEMS — ほしい機能詰め込み改造Misskey。
Misskey をベースに独自の拡張機能を追加した分散型SNSプラットフォーム。

## コミットログ規約

Conventional Commits 風、日本語で書く。形式:

```
fix(scope): 変更内容の要約
enhance: 変更内容の要約
feat(scope): 変更内容の要約
```

スコープ例: `frontend`, `backend`

---

## ビルド・Lint・テスト

| 用途 | コマンド |
| --- | --- |
| 全体ビルド | `pnpm build` |
| 全体 lint (typecheck + eslint) | `pnpm lint` |
| 全体テスト | `pnpm test` |
| Backend unit test | `pnpm --filter backend test` |
| Backend e2e test | `pnpm --filter backend test:e2e` |
| Backend federation test | `pnpm --filter backend test:fed` |
| Frontend unit test | `pnpm --filter frontend test` |
| Migration 差分検査 (pending DDL) | `pnpm --filter backend check-migrations` |
| `misskey-js` 再生成 (API 変更後必須) | `pnpm build-misskey-js-with-types` |
| 開発サーバー (backend + frontend watch) | `pnpm dev` |

**注意:** backend テスト実行前に `.config/test.yml` が必要 (`cp .github/misskey/test.yml .config/test.yml`)。

---

## Misskey 固有の AI エージェント規約

ルール本体は [AGENTS.md](AGENTS.md) に記載。以下は要約:

### 絶対にやってはいけない事

1. SPDX ヘッダー欠落のまま AGPL 管轄ディレクトリへ新規ファイルを追加しない（`.ts`/`.js`/`.vue`等）
2. `locales/ja-JP.yml` 以外の locale YAML を手動編集しない（Crowdin 管理）
3. マージ済 migration ファイルを編集しない
4. `git push --force` を `main`/`develop`/`master` にしない
5. `git commit --no-verify` で hook をスキップしない
6. secrets / 認証情報をリポジトリにコミットしない

### スキル呼び出し要件

- `packages/backend/` 編集前に `working-on-backend` スキルを参照
- `packages/frontend/` 編集前に `working-on-frontend` スキルを参照
- commit / PR 作成前に `shipping-misskey-change` スキルを参照
- Issue / PR 起票前に `creating-issues-and-prs` スキルを参照

### 変更前チェック

1. `pnpm lint` が通る
2. backend API 変更時: `pnpm build-misskey-js-with-types` 実行
3. entity/migration 変更時: `pnpm --filter backend check-migrations` が通る
4. 新規ファイル: SPDX ヘッダー付与
5. ユーザー影響変更: `CHANGELOG.md` の `## Unreleased` に追記
6. locale safety: `ja-JP.yml` 以外に差分が無いことを確認

@AGENTS.md
