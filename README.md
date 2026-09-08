# MISTEMS

ほしい機能詰め込み改造Misskey  
諸般の事情により実際にデプロイするブランチは mistems-main で mistems-readme ブランチはダミーである  
mistems-mainの現在の差分はおそらくこちら  
https://github.com/misskey-dev/misskey/compare/develop...mistems:mistems:mistems-main


## 変更点

このPRをだいたいぜんぶ入れる
https://github.com/mistems/mistems/pulls

- セキュリティ
  - ローカルフォロワーが0人のリモートユーザーからのメンション/リプライ/リノートを拒否できるように（環境変数 `MISSKEY_BLOCK_MENTIONS_FROM_UNFAMILIAR_REMOTE_USERS` で有効化）
  - パスワードレス+TOTP併用時のサインインをパスワード経由ではTOTPに統一
  - ファイル配信時に `X-Content-Type-Options: nosniff` を常時付与（content sniffing 対策）

- 投稿フォーム
  - 公開範囲ピッカーに「チャンネル」を追加（お気に入りチャンネルから宛先を選べる）
  - 宛先チャンネル名を投稿フォーム内に表示
  - CWと本文の入れ替えボタン　追加
  - センシティブワード（自動ホーム送りになる語）を含む投稿に警告バナー＋プレビューで黄色ハイライト
  - 添付ファイル・アップロード中ファイルをドラッグで並べ替えられるように
  - 長文ペースト時の「テキストファイルとして添付」のしきい値を固定1000文字→自分の投稿上限文字数に変更、確認ダイアログの文言も明確化
  - スマホで投稿フォームの上・横の余白をタップしても閉じないように（下側タップのみで閉じる）
  - ショートカットキー刷新: p=通常投稿 / n=文脈依存投稿（チャンネルページではチャンネル宛）/ h=ショートカットヘルプ

- チャンネル
  - チャンネル一覧に「だいたいぜんぶ」タブ　追加（サーバー上のチャンネルをほぼ全件、更新順で一覧。表示モード切替・センシティブ表示トグル付き）
  - チャンネル検索をキャッシュからのクライアント側絞り込みに変更（高速化）
  - フォロー/お気に入りボタンに「何が起きるか」の説明文を追加
  - チャンネルページにローカルタイムライン投稿ボタンも表示する設定を追加（既定OFF）
  - チャンネルの既読位置をサーバーに保存し端末間で同期

- 検索
  - 検索対象を「本文のみ / 本文+CW」で切り替えられるように
  - チャンネル指定検索（お気に入りチャンネルから選択）
  - 添付ファイルの「あり限定 / なし限定」絞り込み
  - 期間指定ショートカット（今日・直近3日・直近1か月・直近3か月）
  - 検索がタイムアウトしたら期間を絞った再検索を提案
  - 検索ボタンに連打防止（6秒）
  - デフォルト検索範囲をローカルに変更
  - サーバー側: 検索クエリに15秒タイムアウト、PGroonga 列単独インデックス対応（管理者向け: 推奨インデックス定義を .config サンプルに記載）

- ノート・タイムライン
  - リノート行にリノートした人のインスタンス情報（ティッカー）を表示
  - チャンネル由来ノートのリノートに「どのチャンネルから来たか」のリンクを表示
  - リノート折りたたみ表示のレイアウト刷新
  - ノート詳細を開いたとき返信を自動で読み込む
  - blueskyの投稿埋め込み表示に対応（handle→did 解決つき）
  - ハッシュタグを長押し/右クリックでメニュー（新しいウィンドウで開く・リンクをコピー・ワードミュート・ハードワードミュートに追加）

- リアクション・絵文字
  - リアクション詳細ツールチップにヨミ（エイリアス）・ライセンス・ローカルのみ・センシティブを表示
  - ピッカーの検索がひらがな/カタカナを区別しなくなる
  - カテゴリが閉じている状態でも先頭4個は見えている状態になる
  - 絵文字ピッカーを開いた後に背景更新で位置がガクッと動かないように
  - クライアントを閉じている間に追加されたカスタム絵文字が自動反映されるように（`emojis/stats` API 新設・キャッシュ1時間制限を撤廃）

- ふぁぼったー・タイムマシン
  - リアクションがたくさんついたノートは「みつける＞注目」で青ふぁぼ/赤ふぁぼになる（ON/OFFトグルあり）
  - しきい値・採用確率・除外絵文字はコンパネ＞サーバー設定＞ハイライトの調整から設定
  - ハイライト色はユーザーごとにカラーピッカーで変更可能（プリセット付き）
  - タイムマシン（過去のタイムラインを遡れる /timemachine ページ・デッキ列）
    - タイムシフト再生（早送り）とタイムフュージョン（リアルタイム統合）モード
    - ノートの時刻を右クリック→「この時刻にタイムマシンで移動」
    - 利用可否・遡れる範囲はロールポリシーで制限可能（既定は利用不可）

- ページエディター
  - 設定/コンテンツのタブ化、コンテンツ編集は常時プレビュー併設（狭い画面ではタブ切替）
  - テキストブロックに MFM 挿入ツールバー（$MFM・各種装飾・#・絵文字ピッカー）
  - ページ一覧のカードに本文の簡易プレビューを表示
  - 未保存のまま離脱しようとしたら確認
  - ドラッグアンドドロップ全面刷新: スマホの長押しドラッグ・自動スクロール・アニメーション対応

- クリップ
  - clipへのノート登録レートリミットを 20→100 へ緩和

- アカウント管理
  - ログアウト時に「このアカウントのみ / すべてのアカウント」を選べるように（従来は全アカウントのデータが消えていた）
  - アカウント管理ページ刷新: ログイン中バッジ・一括ログアウト・一覧の即時反映・取得不能アカウントの掃除

- UI・UX
  - 接続が瞬断してすぐ復旧した場合は「サーバーから切断されました」を出さない（5秒待ってから表示）
  - 接続切断Tipがモーダル表示中でもクリックできるように
  - 複数タブでMisskeyを開いている場合、そのうちの一つだけでサウンドを再生するように
  - ホームタイムラインが空のとき「みつける」やローカルタイムラインに誘導するように（新規登録直後はウェルカム表示）
  - お知らせの既読をリセットできるように（管理者向け、モデレーションログにも記録）

- パフォーマンス
  - フォロー数が多い（50人以上）ユーザーのホームタイムライン構築を高速化（LATERAL方式）
  - ノート検索・チャート・メンション補完のDBインデックス最適化（管理者向け: 大規模サーバーは `MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` 推奨）

- バグ修正
  - 未読通知バッジが消えない・数が合わないバグを修正（表示できない通知をカウントから除外、99+で飽和）
  - FTT（ファンアウトタイムライン）の歯抜けバグを根本修正、FTT ON/OFF 切替時のキャッシュパージも安全に
  - 添付テキストファイルが iOS Safari 等で文字化けする問題を修正（charset=utf-8 付与）
  - エラー画面で操作不能になることがあるのを修正
  - ドライブでフォルダを移動しても選択状態が持ち越されるバグの修正
  - リバーシの制限時間がバックグラウンドで遅れる問題を修正
  - ダークテーマ時にX (Twitter) の埋め込みの余白が白く表示される問題を修正
  - resyncCharts が大規模サーバーで statement timeout で失敗する問題を修正

- 開発・運用
  - 正常系・相手都合のAPログをデバッグレベルに落とす（error に残るのは本当に異常なものだけに）
  - Claude Code GitHub Workflow追加（Issue, PRでClaudeが反応）
  - node-fetch の AbortError にリクエストURLを含める診断パッチ

# 開発者向けドキュメント
## MISTEMSの作り方

リモートブランチにたいして squash mergeする  
CHANGELOGはしぬほどコンフリクトするのでなかったことにする  
それ以外のコンフリクトは git rerere で解除方法を覚えてもらう  
rerere が全部自動解決したときはスクリプトが自動で続行する

具体的には以下のようなshellscriptを実行している

```
#!/usr/bin/env fish

git fetch origin
git fetch riin
git switch mistems-main
git reset origin/develop --hard

# ブランチ存在チェック付き squash merge
function squash_merge
    set -l branch $argv[1]
    if not command git rev-parse --verify $branch >/dev/null 2>&1
        echo "エラー: ブランチ '$branch' が見つかりません。スクリプトを終了します。" >&2
        exit 1
    end
    command git merge --squash $branch
    set -l merge_status $status
    # NOTE: grep は rg の alias なので使わない (rg -c はマッチ 0 件で無出力になる)
    set -l unmerged (command git ls-files -u | count)
    # merge が失敗したのにコンフリクトが無い = stash failed 等の異常終了。
    # ただし rerere が全コンフリクトを自動解消済み (staged あり) なら正常系として続行する
    if test $merge_status -ne 0 -a $unmerged -eq 0
        if command git diff --cached --quiet
            echo "エラー: ブランチ '$branch' のマージに失敗しました (exit status: $merge_status)。スクリプトを終了します。" >&2
            exit 1
        end
    end
    # CHANGELOG.md は毎回破棄するので、コンフリクト判定の前に解消
    command git checkout HEAD -- CHANGELOG.md 2>/dev/null
    # CHANGELOG.md 以外にコンフリクトがあったらストップ
    # ただしマーカー残存なし = rerere が全て自動解決済みなので、ステージして続行する
    # (rerere は解決してもステージしないため git add が必要)
    if command git status --porcelain | command grep -q "^U"
        set -l conflicted (command git ls-files -u | command awk '{print $4}' | command sort -u)
        if command grep -q '^<<<<<<<' $conflicted
            echo "コンフリクトが発生しました ($branch)。手動で解決してください。"
            echo "解決が完了したら 'Y' を入力してください（それ以外は終了します）: "
            read -l response
            if test "$response" != "Y"
                echo "スクリプトを終了します。"
                exit 1
            end
        else
            echo "rerere により自動解決済み ($branch): $conflicted"
            command git add -- $conflicted
        end
    end
end


git switch mistems-main
git reset origin/develop --hard


squash_merge riin/add-claude-github-actions-1762310148415
git commit -a -m "Add Claude Code GitHub Workflow(Issue, PRでClaudeが反応), mistems skill"


squash_merge riin/channelIndex
git commit -a -m "チャンネルだいたいぜんぶみる" # フォローとお気に入りの説明を統合

squash_merge riin/mkNoteExtend
git commit -a -m "MkNote拡張（チャンネルRenoteどこからきてどこへいくのか）"

# ノートに表示されているリアクションにホバーしたときに出るやつ MkReactionsViewer.details.vue
squash_merge riin/emojiDetailDialog
git commit -a -m "MkReactionViewer拡張（よみがなさっと見る）" # ここまで2025.10.0 おわり

# ピッカーの入力補助機能拡張
# MkEmojiPicker.vue と packages/frontend/src/custom-emojis.ts で カタカナをひらがなに寄せる
squash_merge riin/emojiPickKanaConv
git commit -a -m "絵文字検索ひらカナ大統一"

# ピッカーのリストから選ぶ方の機能
# packages/frontend/src/components/MkEmojiPicker.section.vue
squash_merge riin/emojiChotMiel
git commit -a -m "絵文字ちょっと見えてほしい"

squash_merge riin/hashtag-mutable
git commit -a -m "ハッシュタグでミュートできるようにする"

# 検索を本文のみと 本文+CWにできるように
squash_merge riin/search-enhance
git commit -a -m "ノート検索の強化"

squash_merge riin/index-optimize
git commit -a -m "ノート検索のインデックス大改造"


squash_merge riin/MkNoteDetailed-loadReplies
git commit -a -m "MkNoteDetailedで返信を読み込む"

squash_merge kakkokari-gtyih/fix-stream-indicator
git commit -a -m "WSが再開したらサーバー切断メッセージを閉じる"

squash_merge riin/block-mentions-from-unfamiliar
git commit -a -m "無名のユーザーからの通知を拒否する(MisskeyIO/misskey/#462)"


squash_merge riin/annoy-logs-goneto-debuglevel
git commit -a -m "正常系ログをデバッグレベルに落とす"

squash_merge riin/fix/notification-unread-count
git commit -a -m "通知の残カウントバグを直す"

# -------------------------------------
# squash_merge riin/mkPages
# git commit -a -m "MkPagesエディター拡張"
# riin/mkdraggable-animation
# git commit -a -m "MkDraggable アニメーションとスマホ対応"

squash_merge riin/release/mkPages-mkDraggable
git commit -a -m "MkPagesエディター拡張/ドラッグアンドドロップのスマホ拡張とアニメーション"
# --------------------------------------



squash_merge riin/fix/fanout-timeline
git commit -a -m "FTTLの歯抜けバグ修正"


# riin/favstar (favstar-rebased を採用・リネーム済) + riin/timemachine
squash_merge riin/release/FavstarAndTimemachine
git commit -a -m "タイムマシンとふぁぼった"



squash_merge riin/fix-textfile-encode
git commit -a -m "添付ファイルのエンコーディングがSJISになるバグの修正"



# MkPostFormの宛先にチャンネルを追加, 翻訳を追加 swap-CW
# チャンネルの既読を同期, registory-item endpointを追加 router.definition, main-boot
# 追加, MkHelp, 投稿フォームでセンシティブワードを警告・ハイライト表示
squash_merge  riin/mkPostFormExtend # チャンネル既読の同期を統合
git commit -a -m "投稿機能周の拡張"


# コンフリクトしたので取り込んでない
# squash_merge riin/safe-rss &&\
# git commit -a -m "saferRSS" &&\

# コンフリクトの修正が必要
#squash_merge riin/readble-message-ratelimitservice
#git commit -a -m "BRIEF_REQUEST_INTERVAL を人間に意味のあるメッセージにする"


#  #17533
squash_merge riin/fix/error-page-unhandled
git commit -a -m "fix(frontend): エラー画面で操作不能になることがあるのを修正"


squash_merge  riin/fix-textfile-encode
git commit -a -m "fix: 添付されるテキストのエンコーディングを修正"


squash_merge riin/clips
git commit -a -m "enhance: clipへのノート登録レートリミットを 20->100へ緩和"


squash_merge kakkokari-gtyih/fix-signout
git commit -a -m "fix(frontend): すべてのアカウントからログアウトされる問題を修正"

# https://github.com/fruitriin/misskey/pull/50
squash_merge riin/claude/2fa-register-key-auth-error-w3c1m5
git commit -a -m "fix(backend): パスワードレス+TOTP併用時のサインインをパスワード経由ではTOTPに統一"

# https://github.com/fruitriin/misskey/pull/49
squash_merge riin/fix/emoji-picker-resize-when-arrive-new-note
git commit -a -m "fix(frontend): 絵文字ピッカーを開いた後に背景更新で動かないようにする"

squash_merge riin/claude/awesome-volta-vljoz9
git commit -a -m "fix(frontend): 接続切断Tipがモーダル表示中にクリックできない問題を修正"

squash_merge riin/drive
git commit -a -m "fix(frontend): ドライブの選択状態持ち越しバグの修正"

squash_merge riin/fix/resync-charts-timeout
git commit -a -m "fix(backend): resyncCharts が statement timeout で失敗する問題を修正"

# unhandled rejection の leak 元 URL を特定する診断パッチ (本修正は URL 特定後)
squash_merge riin/fix/http-request-abort-timer
git commit -a -m "debug(backend): node-fetch の AbortError に request.url を含める診断パッチ"

# フォロー数が多いユーザーのホームタイムライン DB フォールバックが
# キャッシュ非ウォーム時に数秒〜十秒級の遅延を起こす問題の高速化 (LATERAL 方式)
squash_merge riin/fix/timeline-dbfallback-lateral
git commit -a -m "perf(backend): フォロー数が多いユーザーのホームタイムライン DB フォールバックを高速化"

# X 埋め込み展開時、ダークテーマだと color-scheme 不一致で iframe の透過背景が白く描画される問題
# NOTE: ローカルブランチ (worktree: misskey/worktrees/fix-x-embed-color-scheme)。riin へ push したら riin/ プレフィックスに読み替えること
squash_merge fix-x-embed-color-scheme
git commit -a -m "fix(frontend): ダークテーマ時にX (Twitter) ポスト展開でカード周囲の余白が白く表示される問題を修正"


# ---- 仮氏パーティ (misskey-dev の kakkokari-gtyih PR 取り込み) ----
# NOTE: ブランチはローカル party/* として整備済。riin へ push したら riin/ プレフィックスに読み替えること
# 詳細は 仮氏パーティ.md を参照

# https://github.com/misskey-dev/misskey/pull/16974
squash_merge party/16974-multitab-sound
git commit -a -m "複数タブでMisskeyを開いている場合、そのうちの一つだけでサウンドを再生するように (misskey-dev#16974)"

# https://github.com/misskey-dev/misskey/pull/17770
squash_merge party/17770-reversi-timer
git commit -a -m "リバーシの制限時間がバックグラウンドで遅れる問題を修正 (misskey-dev#17770)"

# https://github.com/misskey-dev/misskey/pull/17158
squash_merge party/17158-htl-onboarding
git commit -a -m "ホームタイムラインが空のとき「みつける」やローカルに誘導するように (misskey-dev#17158)"

# https://github.com/misskey-dev/misskey/pull/15049
squash_merge party/15049-announce-reset-reads
git commit -a -m "お知らせの既読をリセットできるように (misskey-dev#15049)"

# https://github.com/misskey-dev/misskey/pull/17474
#squash_merge party/17474-drafts-menu
#git commit -a -m "投稿フォームの下書き・予約投稿メニューを整理 (misskey-dev#17474)"

# https://github.com/misskey-dev/misskey/pull/14933
squash_merge party/14933-bsky-embed
git commit -a -m "blueskyの投稿埋め込み表示に対応 (misskey-dev#14933)"

# https://github.com/misskey-dev/misskey/pull/16891
#squash_merge party/16891-follow-search
#git commit -a -m "フォロー・フォロワーを検索できるように (misskey-dev#16891)"

# https://github.com/misskey-dev/misskey/pull/17758
# NOTE: custom-emojis.ts で「絵文字検索ひらカナ大統一」とコンフリクトする。
#       解消方針: PR の新 fetchCustomEmojis を採用し、ひらカナ正規化は setCustomEmojis 内に移設 (rerere 学習済)
squash_merge party/17758-emoji-cache
git commit -a -m "カスタム絵文字の更新をサーバーに確認してクライアントキャッシュを更新するように (misskey-dev#17758)"

# ---- 仮氏パーティ ここまで ----


pnpm run build-misskey-js-with-types
git commit -a -m "misskey-js autogen 再生成 (仮氏パーティ統合後の整合)"

set MISVER 104
set file_path "package.json"
# JSONからversionを取得 -MISTEMS.XX を追加した新しいバージョンを作成
set current_version (jq -r '.version' $file_path)
set new_version "$current_version-MISTEMS.$MISVER"

# package.jsonのversionを新しいものに書き換え
jq --arg new_version "$new_version" '.version = $new_version' $file_path > tmp.json && mv tmp.json $file_path
npx prettier -w $file_path

# mistems-readme ブランチから README.md をコピー
git show riin/mistems-readme:README.md > README.md

echo "Version updated to: $new_version"
git commit -a -m "Version updated to: $new_version"
git tag -a "$new_version" -m "MISTEMS.$MISVER"
```

### 管理用ブランチ

- mistems-main  - 後述の方法で misskey/develop 最新に機能ブランチを取り込んだブランチ デプロイするときはこれを使う コミットログはあまり当てにならない
- mistems-readme - READMEが置いてあるだけで何も無い

### ブランチの取り込み方
PRのと見込みはGitHub上ではなくローカルで行う
```
git merge --squash 任意ブランチ
git commit -a -m "メッセージ"
```

### squash マージ同士の共存（コンフリクトの解除）
コンフリクトした場合、適宜解決する
が、毎回コンフリクト解除するのはやってられないので、 git rerere に乗っかる
rerere が全コンフリクトを自動解決した場合（マーカー残存なし）はスクリプトが自動でステージして続行する

【Git】同じコンフリクト解消を繰り返している人に教えたい「git rerere」 #初心者 - Qiita https://qiita.com/_ken_/items/64856e91e062b325590f

### 機能ブランチを最新に追従させる方法
feature ブランチを rebase してコンフリクトを解除したのち、mainでsquashする
featureブランチが複数のコミットからなっていて繰り返しコンフリクトする場合、コミットを1つに圧縮する
上流が対象ファイルを削除・別実装に置き換えるなど大きく書き換えた場合は、その場で解決し続けず、
いったん統合からスキップしてブランチを作り直す（詳細は .claude/skills/rebase-to-develop 参照）
