# 枠の台帳。orb-dev.sh から source して使う。cache_root を先に決めておくこと
#
# 枠 (devN) ごとに $cache_root/slots/devN/ を置き、中の owner に
# 「プロジェクト名」「ワークツリーのパス」「取った時刻 (UTC)」を 1 行ずつ書く。
# 枠を取るのは mkdir の成否で決めるので、並行セッションが同時に up しても同じ枠を取り合わない

slot_names="$(seq -f 'dev%g' 1 "${ORB_DEV_SLOT_COUNT:-10}" | tr '\n' ' ')"
slot_names="${slot_names% }"

# 持ち主の web コンテナがあるか。止まっているだけなら「ある」とする (Mac の再起動などで止まった環境の枠を奪わない)
slot_owner_exists() {
	docker inspect "$1-web-1" >/dev/null 2>&1
}

slot_dir() { echo "$cache_root/slots/$1"; }

slot_owner() {
	sed -n 1p "$(slot_dir "$1")/owner" 2>/dev/null || true
}

slot_of_project() {
	local s
	for s in $slot_names; do
		if [ "$(slot_owner "$s")" = "$1" ]; then
			echo "$s"
			return 0
		fi
	done
	return 1
}

slot_write_owner() {
	printf '%s\n%s\n%s\n' "$2" "$3" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$(slot_dir "$1")/owner"
}

# $1: プロジェクト名  $2: ワークツリーのパス  $3: 欲しい枠 (省略すると空いている最初の枠)
slot_claim() {
	local project="$1" wt="$2" wanted="${3:-}" s owner candidates
	if [ -n "$wanted" ] && [[ " $slot_names " != *" $wanted "* ]]; then
		echo "枠の名前が不正です: $wanted (使えるのは $slot_names)" >&2
		return 1
	fi
	if s="$(slot_of_project "$project")"; then
		if [ -n "$wanted" ] && [ "$wanted" != "$s" ]; then
			echo "$project は既に枠 $s を持っています。枠を替えるときは先に down してください" >&2
			return 1
		fi
		echo "$s"
		return 0
	fi
	mkdir -p "$cache_root/slots"
	candidates="${wanted:-$slot_names}"
	for s in $candidates; do
		if mkdir "$(slot_dir "$s")" 2>/dev/null; then
			slot_write_owner "$s" "$project" "$wt"
			echo "$s"
			return 0
		fi
		# 持ち主の web コンテナが無い枠は空きとして扱う。owner がまだ書かれていない (別のセッションが取っている途中) 枠は奪わない
		owner="$(slot_owner "$s")"
		if [ -n "$owner" ] && ! slot_owner_exists "$owner"; then
			rm -rf "$(slot_dir "$s")"
			if mkdir "$(slot_dir "$s")" 2>/dev/null; then
				slot_write_owner "$s" "$project" "$wt"
				echo "$s"
				return 0
			fi
		fi
	done
	if [ -n "$wanted" ]; then
		echo "枠 $wanted は $(slot_owner "$wanted") が使っています" >&2
	else
		echo "空いている枠がありません" >&2
	fi
	return 1
}

slot_release() {
	local s
	if s="$(slot_of_project "$1")"; then
		rm -rf "$(slot_dir "$s")"
	fi
	return 0
}

slot_list() {
	local s f
	for s in $slot_names; do
		f="$(slot_dir "$s")/owner"
		if [ -f "$f" ]; then
			printf '%s\t%s\t%s\t%s\n' "$s" "$(sed -n 1p "$f")" "$(sed -n 2p "$f")" "$(sed -n 3p "$f")"
		else
			printf '%s\t-\t-\t-\n' "$s"
		fi
	done
}
