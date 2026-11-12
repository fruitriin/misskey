/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { url as base } from '@@/js/config.js';
import { tryParseUrl } from '@@/js/url.js';

/**
 * RSS を取り直す間隔の下限と既定値 (秒)。
 * RSS は頻繁に更新されるものではなく、取り直すたびにサーバーが相手のサイトへ取りに行くので、長めにとる
 */
export const RSS_MIN_REFRESH_INTERVAL_SEC = 45 * 60;
export const RSS_DEFAULT_REFRESH_INTERVAL_SEC = 180 * 60;

/** 設定の間隔 (秒) を、下限を守ったミリ秒にする */
export function getRssRefreshIntervalMs(sec: number): number {
	const value = Number.isFinite(sec) && sec > 0 ? sec : RSS_DEFAULT_REFRESH_INTERVAL_SEC;
	return Math.max(RSS_MIN_REFRESH_INTERVAL_SEC, value) * 1000;
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
