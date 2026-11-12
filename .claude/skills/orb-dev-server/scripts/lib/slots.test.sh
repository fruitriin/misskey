#!/usr/bin/env bash
# lib/slots.sh のテスト。bash lib/slots.test.sh で実行する
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cache_root="$(mktemp -d)"
trap 'rc=$?; rm -rf "$cache_root"; exit $rc' EXIT
# 読み込みに失敗しても bash は終了コード 0 で終わることがあるので、先に確かめる
[ -f "$here/slots.sh" ] || { echo "not ok - slots.sh がありません"; exit 1; }
# shellcheck source=slots.sh
ORB_DEV_SLOT_COUNT=4
. "$here/slots.sh"

# テストでは docker を見ずに、ここに書いたプロジェクトだけコンテナがあることにする
existing=" "
slot_owner_exists() { [[ "$existing" == *" $1 "* ]]; }

fail=0
check() { if [ "$2" = "$3" ]; then echo "ok - $1"; else echo "not ok - $1: 期待 '$3' 実際 '$2'"; fail=1; fi; }

existing=" a b c d e "
check "空きの先頭を取る" "$(slot_claim a /wt/a)" dev1
check "同じプロジェクトは同じ枠" "$(slot_claim a /wt/a)" dev1
check "次の空き" "$(slot_claim b /wt/b)" dev2
check "指定した枠" "$(slot_claim c /wt/c dev4)" dev4
check "持ち主を引く" "$(slot_of_project c)" dev4
check "指定した枠が埋まっていれば失敗" "$(slot_claim d /wt/d dev1 2>/dev/null || echo fail)" fail
check "残りの空き" "$(slot_claim d /wt/d)" dev3
check "全部埋まれば失敗" "$(slot_claim e /wt/e 2>/dev/null || echo fail)" fail
check "持ち主のワークツリー" "$(slot_list | awk -F'\t' '$1=="dev2"{print $3}')" /wt/b

slot_release b
check "返した枠は空き" "$(slot_list | awk -F'\t' '$1=="dev2"{print $2}')" -
check "返した枠を取れる" "$(slot_claim e /wt/e)" dev2

existing=" a b d e "
slot_release e
check "コンテナが無い持ち主の枠は空きとして扱う" "$(slot_claim e /wt/e dev4)" dev4
check "不明な枠名は失敗" "$(slot_claim x /wt/x dev9 2>/dev/null || echo fail)" fail
check "持ち主の無いプロジェクトの release は成功" "$(slot_release nobody && echo ok)" ok

exit $fail
