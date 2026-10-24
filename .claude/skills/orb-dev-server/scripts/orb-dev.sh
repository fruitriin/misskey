#!/usr/bin/env bash
# worktree ごとに独立した Misskey 開発サーバー (pnpm dev + PostgreSQL + Redis) を OrbStack 上で動かす。
# ホストにポートを公開しないので、複数の worktree や他プロジェクトと 3000 / 5173 / 5432 / 6379 を取り合わない。
#
# usage: orb-dev.sh <up|down|logs|status|seed|snapshot|restore> [worktree-path] [名前] [-v] [--prod] [--seed]
#   up        設定を生成して起動し、起動完了を待って URL を表示する (初回は管理者アカウントも作る)
#             --prod を付けると pnpm dev の代わりに本番ビルド (pnpm build → migrate → start) で起動する
#             --seed を付けると、起動後にキーの合うスナップショットがあれば restore、なければ seed を実行する
#   down      停止する。-v を付けると DB・node_modules の volume も消す
#   logs      web コンテナのログを追う
#   status    コンテナの状態と URL を表示する
#   seed      起動中の環境に開発用データを入れ、終わったらスナップショット (seed) を取る
#   snapshot  今の DB と files/ を保存する。名前の既定は seed
#   restore   保存した DB と files/ に戻す。名前の既定は seed。キー (最新 migration 名) が合わなければ戻さない
set -euo pipefail

# seed のスクリプトは対象の worktree ではなく、このスクリプトと同じ場所のものを web コンテナにマウントして使う
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cmd="${1:-}"
[ $# -gt 0 ] && shift
wt_arg="."
wt_set=""
snap_name="seed"
remove_volumes=""
prod=""
with_seed=""
for arg in "$@"; do
	case "$arg" in
		-v|--volumes) remove_volumes="-v" ;;
		--prod) prod="1" ;;
		--seed) with_seed="1" ;;
		-*) echo "不明なオプションです: $arg" >&2; exit 1 ;;
		*)
			# 1 つ目の位置引数は worktree、2 つ目はスナップショットの名前
			if [ -z "$wt_set" ]; then wt_arg="$arg"; wt_set="1"; else snap_name="$arg"; fi
			;;
	esac
done

# スナップショットの名前はファイル名に使うので、パスを含むものや隠しファイルになるものは受け付けない
case "$snap_name" in
	''|.*|*/*)
		echo "スナップショットの名前が不正です: '$snap_name' (空、. で始まる名前、/ を含む名前は使えません)" >&2
		exit 1
		;;
esac

wt="$(cd "$wt_arg" && git rev-parse --show-toplevel)"
# compose のプロジェクト名は [a-z0-9_-] のみ
project="$(basename "$wt" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_-]+/-/g; s/^-+//; s/-+$//')"
state_dir="${XDG_CACHE_HOME:-$HOME/.cache}/misskey-orb-dev/$project"
snapshots_dir="$state_dir/snapshots"
url="http://web.$project.orb.local:3000/"
admin_user="admin"
admin_pass="admin1234"
setup_password="example_password_please_change_this_or_you_will_get_hacked"
db_user="example-misskey-user"
db_name="misskey"

compose() {
	docker compose -p "$project" -f "$state_dir/compose.yml" "$@"
}

psql_db() {
	compose exec -T db psql -v ON_ERROR_STOP=1 -U "$db_user" "$db_name" "$@"
}

generate() {
	mkdir -p "$state_dir"
	local node_ver pnpm_ver
	node_ver="$(tr -d '[:space:]' < "$wt/.node-version")"
	pnpm_ver="$(sed -nE 's/.*"packageManager": *"pnpm@([^"]+)".*/\1/p' "$wt/package.json")"

	cat > "$state_dir/docker.env" <<-EOF
	POSTGRES_USER=$db_user
	POSTGRES_PASSWORD=example-misskey-pass
	POSTGRES_DB=$db_name
	EOF

	# vite は ../../.config/default.yml を固定パスで読むため、生成した設定をそのパスに重ねてマウントする
	# allowedPrivateNetworks: 本番モード (NODE_ENV=production) の Misskey は private IP への取得を遮断する。
	# seed のリモートのアバター・絵文字・添付・インスタンスのアイコンは、この環境自身の orb.local の URL
	# (OrbStack のコンテナの IP は 192.168.x.x / fd07:… の private IP) を proxy 経由で取るので、その範囲を許可する
	awk -v url="$url" -v setup="$setup_password" '
		skip_list && /^#  - / { next }
		{ skip_list = 0 }
		/^[a-zA-Z]/ { section = $1 }
		/^url: / { print "url: " url; next }
		/^# setupPassword: / { print "setupPassword: " setup; next }
		/^#allowedPrivateNetworks:/ {
			print "allowedPrivateNetworks:"
			print "  - \"127.0.0.0/8\""
			print "  - \"192.168.0.0/16\""
			print "  - \"172.16.0.0/12\""
			print "  - \"fd00::/8\""
			skip_list = 1
			next
		}
		section == "db:" && /^  host: / { print "  host: db"; next }
		section == "redis:" && /^  host: / { print "  host: redis"; next }
		{ print }
	' "$wt/.config/example.yml" > "$state_dir/default.yml"

	# ホストの node_modules は macOS 向けのネイティブモジュールを含むので、コンテナ側は volume に分ける
	local nm_mounts="      - nm-root:/workspace/node_modules" nm_volumes="  nm-root:" pkg name
	for pkg in "$wt"/packages/*/package.json; do
		name="$(basename "$(dirname "$pkg")")"
		nm_mounts+=$'\n'"      - nm-$name:/workspace/packages/$name/node_modules"
		nm_volumes+=$'\n'"  nm-$name:"
	done

	# CI=true: modules ディレクトリを作り直すときに、TTY が無いと pnpm install が止まるのを避ける
	local run_cmd="npm i -g pnpm@$pnpm_ver && pnpm config set store-dir /pnpm-store && CI=true pnpm install --frozen-lockfile"
	if [ -n "$prod" ]; then
		run_cmd+=" && NODE_ENV=production pnpm build && pnpm migrate && NODE_ENV=production pnpm start"
	else
		# migrate は built/meta.json (build-pre が書く) と packages/backend/built を読むので、
		# 新しい worktree でも migrate できるよう先に作る。バックエンドのビルドは無いときだけ行う
		run_cmd+=" && pnpm build-pre && { [ -f packages/backend/built/config.js ] || pnpm --filter backend... build; } && pnpm migrate && pnpm dev"
	fi

	cat > "$state_dir/compose.yml" <<-EOF
	services:
	  redis:
	    image: redis:7-alpine
	    healthcheck:
	      test: "redis-cli ping"
	      interval: 5s
	      retries: 20
	  db:
	    image: postgres:18-alpine
	    env_file:
	      - ./docker.env
	    volumes:
	      - db-data:/var/lib/postgresql
	    healthcheck:
	      test: "pg_isready -U \$\$POSTGRES_USER -d \$\$POSTGRES_DB"
	      interval: 5s
	      retries: 20
	  web:
	    image: node:$node_ver-bookworm
	    working_dir: /workspace
	    # Node 25 以降の公式イメージには corepack が無いので npm で入れる
	    command: bash -c "$run_cmd"
	    depends_on:
	      db:
	        condition: service_healthy
	      redis:
	        condition: service_healthy
	    volumes:
	      - $wt:/workspace
	      - ./default.yml:/workspace/.config/default.yml:ro
	      - $script_dir/seed:/orb-seed:ro
	      - pnpm-store:/pnpm-store
	$nm_mounts
	volumes:
	  db-data:
	  pnpm-store:
	$nm_volumes
	EOF
}

# 今の compose.yml が本番モードかどうか (restore で web を起動し直すときの待ち時間に使う)
is_prod_compose() {
	grep -q 'NODE_ENV=production pnpm start' "$state_dir/compose.yml" 2>/dev/null
}

# web のログに "Now listening" が出るまで待つ。
# $1: ログを見始める時刻 (省略するとコンテナの最初から)。web を起動し直したときに前回のログを拾わないために使う
wait_ready() {
	local since="${1:-}" status limit_min=15 since_args=()
	if is_prod_compose; then limit_min=30; fi
	[ -n "$since" ] && since_args=(--since "$since")
	for _ in $(seq 1 $((limit_min * 12))); do
		if compose logs ${since_args[@]+"${since_args[@]}"} web 2>/dev/null | grep -q "Now listening"; then
			return 0
		fi
		status="$(compose ps -a web --format '{{.State}}' 2>/dev/null || true)"
		if [ "$status" = "exited" ]; then
			echo "web コンテナが停止しました。ログ:" >&2
			compose logs --tail 30 web >&2
			return 1
		fi
		sleep 5
	done
	echo "$limit_min 分待っても起動しませんでした。'$0 logs' で確認してください" >&2
	return 1
}

create_admin() {
	# ユーザーが 1 人もいないときだけ成功する。既にいれば何もしない
	curl -s -X POST "${url}api/admin/accounts/create" \
		-H 'Content-Type: application/json' \
		-d "{\"username\":\"$admin_user\",\"password\":\"$admin_pass\",\"setupPassword\":\"$setup_password\"}" \
		| grep -q '"token"' && echo "管理者アカウントを作成しました: $admin_user / $admin_pass" || true
}

# seed / snapshot / restore の前に、この worktree の環境が起動していることを確かめる
require_running() {
	local running
	if [ ! -f "$state_dir/compose.yml" ]; then
		echo "この worktree の環境がありません。先に '$0 up $wt' で起動してください" >&2
		exit 1
	fi
	running="$(compose ps --status running --services 2>/dev/null || true)"
	local svc
	for svc in db redis web; do
		if ! printf '%s\n' "$running" | grep -qx "$svc"; then
			echo "環境が起動していません ($svc が動いていません)。先に '$0 up $wt' で起動してください" >&2
			exit 1
		fi
	done
}

# 同じ名前の worktree が別の場所にあると compose のプロジェクトが共有されてしまうので、
# 壊す操作の前に、compose.yml がこの worktree をマウントしていることを確かめる
require_own_project() {
	if ! grep -qxF "      - $wt:/workspace" "$state_dir/compose.yml"; then
		echo "プロジェクト $project の環境は別の worktree のものです ($state_dir/compose.yml が $wt をマウントしていません)。" >&2
		echo "同じディレクトリ名の worktree が複数あるときは、片方の名前を変えてください。何も変更せずに終了します。" >&2
		exit 1
	fi
}

# スナップショットのキー (DB に適用済みの最新 migration 名) を表示する
snapshot_key() {
	local key
	key="$(psql_db -Atc 'SELECT name FROM migrations ORDER BY id DESC LIMIT 1')"
	if [ -z "$key" ]; then
		echo "migration が 1 件も適用されていません。先に up で起動してください" >&2
		return 1
	fi
	echo "$key"
}

do_snapshot() {
	local key dir
	key="$(snapshot_key)"
	dir="$snapshots_dir/$key"
	mkdir -p "$dir"
	echo "スナップショットを保存しています: $snap_name (キー: $key)"
	# 途中で失敗しても前のスナップショットを壊さないよう、一時ファイルに書いてから置き換える
	compose exec -T db pg_dump -Fc -U "$db_user" "$db_name" > "$dir/$snap_name.dump.tmp"
	# ローカルのドライブのファイルは worktree の files/ (コンテナの /workspace/files) にある
	mkdir -p "$wt/files"
	tar -C "$wt/files" -cf "$dir/$snap_name.files.tar.tmp" .
	mv "$dir/$snap_name.dump.tmp" "$dir/$snap_name.dump"
	mv "$dir/$snap_name.files.tar.tmp" "$dir/$snap_name.files.tar"
	echo "保存しました: $dir/$snap_name.dump, $dir/$snap_name.files.tar"
}

# DB と files/ をスナップショットの内容に置き換える。失敗したら 1 を返す
# (呼び出し側の if の中では set -e が効かないので、1 つずつ確かめる)
apply_snapshot() {
	local dir="$1"
	psql_db -q -c 'SET client_min_messages = warning; DROP SCHEMA public CASCADE; CREATE SCHEMA public;' || return 1
	compose exec -T db pg_restore --single-transaction --exit-on-error --no-owner -U "$db_user" -d "$db_name" \
		< "$dir/$snap_name.dump" || return 1
	rm -rf "$wt/files" || return 1
	mkdir -p "$wt/files" || return 1
	tar -C "$wt/files" -xf "$dir/$snap_name.files.tar" || return 1
}

do_restore() {
	local key dir since
	key="$(snapshot_key)"
	dir="$snapshots_dir/$key"
	if [ ! -f "$dir/$snap_name.dump" ] || [ ! -f "$dir/$snap_name.files.tar" ]; then
		echo "今の DB のキー ($key) に合うスナップショット「${snap_name}」がありません。戻さずに終了します。" >&2
		if [ -d "$snapshots_dir" ] && [ -n "$(ls -A "$snapshots_dir" 2>/dev/null)" ]; then
			echo "手元にあるスナップショット (キー/名前):" >&2
			( cd "$snapshots_dir" && find . -name '*.dump' | sed -E 's|^\./||; s|\.dump$||' | sort ) | sed 's/^/  /' >&2
		else
			echo "手元にスナップショットはありません。" >&2
		fi
		echo "migration が進んだときは、'$0 down $wt -v' で環境を消してから '$0 up $wt --seed' で作り直してください。" >&2
		return 1
	fi

	require_own_project
	# 環境に手を付ける前に、スナップショットが最後まで読めることを確かめる。
	# pg_restore -f /dev/null は DB に触らず dump 全体 (データを含む) を読む
	echo "スナップショット「${snap_name}」を確かめています..."
	if ! compose exec -T db pg_restore -f /dev/null < "$dir/$snap_name.dump"; then
		echo "dump が壊れています: $dir/$snap_name.dump 。環境には何も変更せずに終了します。" >&2
		return 1
	fi
	if ! tar -tf "$dir/$snap_name.files.tar" > /dev/null; then
		echo "files の tar が壊れています: $dir/$snap_name.files.tar 。環境には何も変更せずに終了します。" >&2
		return 1
	fi

	echo "スナップショット「${snap_name}」に戻します (キー: $key)"
	compose stop web
	if ! apply_snapshot "$dir"; then
		echo "戻している途中で失敗しました。DB と files/ は戻し切れていない可能性があり、web は止まったままです。" >&2
		echo "戻し直すには、'$0 up $wt' で起動し直してから (空の DB には migrate がかかる) '$0 restore $wt $snap_name' を実行してください。" >&2
		echo "seed のスナップショットなら '$0 up $wt --seed' だけで戻ります。それでも戻らないときは '$0 down $wt -v' で環境を消してから '$0 up $wt --seed' で作り直してください。" >&2
		exit 1
	fi
	# タイムラインやユーザーなどのキャッシュが戻す前の DB を指したままにならないよう、Redis を空にする
	compose exec -T redis redis-cli FLUSHALL > /dev/null
	since="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	compose start web
	echo "web を起動し直しています..."
	wait_ready "$since"
	echo "戻しました: $url  (ログイン: $admin_user / $admin_pass)"
}

do_seed() {
	# docker compose exec はホストの環境変数を渡さないので、seed の設定に使う変数のうち設定されているものだけ渡す
	local seed_env=() var
	for var in SEED SEED_LOCAL_NOTES SEED_REMOTE_NOTES; do
		if [ -n "${!var:-}" ]; then seed_env+=(-e "$var=${!var}"); fi
	done
	echo "開発用データを入れています (API の段)..."
	compose exec -T web rm -rf /tmp/orb-seed
	if ! compose exec -T ${seed_env[@]+"${seed_env[@]}"} web node /orb-seed/seed.mjs --url http://localhost:3000 --out /tmp/orb-seed; then
		echo "seed (API の段) が失敗したので止めます。スナップショットは取りません。" >&2
		return 1
	fi
	echo "開発用データを入れています (SQL の段)..."
	# bulk.mjs の出力は BEGIN から COMMIT までの 1 つのトランザクション。途中で失敗すれば何も入らない
	if ! compose exec -T ${seed_env[@]+"${seed_env[@]}"} web node /orb-seed/bulk.mjs --result /tmp/orb-seed/seed-result.json --base-url "$url" \
		| psql_db -q > /dev/null; then
		echo "seed (SQL の段) が失敗したので止めます。スナップショットは取りません。" >&2
		echo "API の段のデータは残っています。'$0 down $wt -v' で環境を消してからやり直してください。" >&2
		return 1
	fi
	echo "開発用データを入れました"
	do_snapshot
}

case "$cmd" in
	up)
		generate
		compose up -d
		echo "起動を待っています (初回は依存のインストールで数分かかります)..."
		wait_ready
		create_admin
		echo "起動しました: $url  (ログイン: $admin_user / $admin_pass)"
		if [ -n "$with_seed" ]; then
			snap_name="seed"
			key="$(snapshot_key)"
			if [ -f "$snapshots_dir/$key/seed.dump" ] && [ -f "$snapshots_dir/$key/seed.files.tar" ]; then
				do_restore
			else
				do_seed
			fi
		fi
		;;
	down)
		compose down $remove_volumes
		;;
	logs)
		compose logs -f --tail 100 web
		;;
	status)
		compose ps -a
		echo "URL: $url"
		;;
	seed)
		require_running
		do_seed
		;;
	snapshot)
		require_running
		require_own_project
		do_snapshot
		;;
	restore)
		require_running
		do_restore
		;;
	*)
		sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
		exit 1
		;;
esac
