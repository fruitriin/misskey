/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { url as base } from '@@/js/config.js';
import { tryParseUrl } from '@@/js/url.js';

/**
 * RSS を取り直す間隔の下限・上限・既定値 (分)。
 * RSS は頻繁に更新されるものではなく、取り直すたびにサーバーが相手のサイトへ取りに行くので、長めにとる
 */
export const RSS_MIN_REFRESH_INTERVAL_MIN = 45;
export const RSS_MAX_REFRESH_INTERVAL_MIN = 24 * 60;
export const RSS_DEFAULT_REFRESH_INTERVAL_MIN = 180;
/** 設定画面のスライダーの刻み (分) */
export const RSS_REFRESH_INTERVAL_STEP_MIN = 15;

/** 設定の間隔 (分) を、下限を守ったミリ秒にする */
export function getRssRefreshIntervalMs(min: number): number {
	const value = Number.isFinite(min) && min > 0 ? min : RSS_DEFAULT_REFRESH_INTERVAL_MIN;
	return Math.max(RSS_MIN_REFRESH_INTERVAL_MIN, value) * 60 * 1000;
}

type RssItem = Misskey.entities.FetchRssResponse['items'][number];

/**
 * fetch-rss でフィードを取る。取れなかったとき (サーバーがエラーを返した、通信に失敗した) は null を返す。
 * 項目は、http・https のリンクを持つものだけを返す
 */
export async function fetchRssItems(feedUrl: string): Promise<RssItem[] | null> {
	const endpoint = new URL('/api/fetch-rss', base);
	endpoint.searchParams.set('url', feedUrl);

	let feed: Partial<Misskey.entities.FetchRssResponse>;
	try {
		const res = await window.fetch(endpoint.toString());
		if (!res.ok) return null;
		feed = await res.json();
	} catch {
		return null;
	}
	if (!Array.isArray(feed.items)) return null;

	return feed.items.filter((item) => {
		if (!item.link) return false;
		const itemUrl = tryParseUrl(item.link, base);
		return itemUrl != null && ['http:', 'https:'].includes(itemUrl.protocol);
	});
}
