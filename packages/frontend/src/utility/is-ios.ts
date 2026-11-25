/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * iOS・iPadOS のブラウザかどうかを返す。
 * iOS の WebKit はリンクを長押ししても contextmenu イベントを出さないので、長押しを自前で扱うかの判定に使う。
 */
export function isIOS(): boolean {
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/.test(ua)) return true;
	// iPadOS 13 以降の Safari は Mac と同じ UA を名乗るので、タッチ点の数で見分ける
	return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
