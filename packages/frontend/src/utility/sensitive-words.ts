/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// サーバー側 (UtilityService.isKeyWordIncluded) と同じ判定をクライアントで再現する。
// バックエンドは RE2 を使うが、クライアントでは ReDoS の影響が自分のタブに限られるため
// ネイティブの RegExp で代替する (後方参照・先読み等の差異により稀に挙動が異なりうる)。

export type SensitiveWordRange = {
	start: number;
	end: number;
};

const regexpLike = /^\/(.+)\/(.*)$/;

function ensureGlobalFlags(flags: string): string {
	return flags.includes('g') ? flags : flags + 'g';
}

function pushAllOccurrences(ranges: SensitiveWordRange[], text: string, word: string): void {
	if (word === '') return;
	let idx = text.indexOf(word);
	while (idx !== -1) {
		ranges.push({ start: idx, end: idx + word.length });
		idx = text.indexOf(word, idx + word.length);
	}
}

function mergeRanges(ranges: SensitiveWordRange[]): SensitiveWordRange[] {
	if (ranges.length <= 1) return ranges;
	const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
	const merged: SensitiveWordRange[] = [{ ...sorted[0] }];
	for (let i = 1; i < sorted.length; i++) {
		const last = merged[merged.length - 1];
		const cur = sorted[i];
		if (cur.start <= last.end) {
			last.end = Math.max(last.end, cur.end);
		} else {
			merged.push({ ...cur });
		}
	}
	return merged;
}

/**
 * テキストに含まれるセンシティブワードを検出する。
 * @returns ranges: ハイライト用にマージ済みの位置情報 / matched: マッチしたフィルタ文字列の一覧
 */
export function detectSensitiveWords(text: string, keyWords: string[]): {
	ranges: SensitiveWordRange[];
	matched: string[];
} {
	if (keyWords.length === 0 || text === '') return { ranges: [], matched: [] };

	const ranges: SensitiveWordRange[] = [];
	const matched: string[] = [];

	for (const filter of keyWords) {
		if (filter === '') continue;
		const regexp = filter.match(regexpLike);
		if (!regexp) {
			// スペース区切りの全単語 AND マッチ
			const words = filter.split(' ').filter(w => w !== '');
			if (words.length === 0) continue;
			if (words.every(w => text.includes(w))) {
				matched.push(filter);
				for (const w of words) {
					pushAllOccurrences(ranges, text, w);
				}
			}
		} else {
			// /pattern/flags 形式 (RE2 相当を RegExp で代替)
			let re: RegExp;
			try {
				re = new RegExp(regexp[1], ensureGlobalFlags(regexp[2]));
			} catch {
				continue;
			}
			let hit = false;
			for (const m of text.matchAll(re)) {
				if (m[0].length === 0) continue; // 0 文字マッチは無限ループ防止のため除外
				hit = true;
				ranges.push({ start: m.index, end: m.index + m[0].length });
			}
			if (hit) matched.push(filter);
		}
	}

	return { ranges: mergeRanges(ranges), matched };
}

const HIGHLIGHT_PREFIX = '$[bg.color=ffff00 $[fg.color=000000 ';
const HIGHLIGHT_SUFFIX = ']]';

/**
 * 指定範囲を MFM の `$[bg]` / `$[fg]` でラップし、黄背景・黒文字で表示できるようにする。
 * MFM パース前に文字列を加工するため、レンダリング後のオフセットずれが起きない。
 * ただしマッチ範囲が既存トークン (URL / 絵文字 / 既存 `$[...]`) を分断する場合や
 * マッチ文字列に `]` 等を含む場合は MFM が崩れうる (ベストエフォート)。
 */
export function annotateSensitiveWords(text: string, ranges: SensitiveWordRange[]): string {
	if (ranges.length === 0) return text;
	// インデックスを保つため後方から適用する (ranges は昇順ソート済み前提)
	let result = text;
	for (let i = ranges.length - 1; i >= 0; i--) {
		const { start, end } = ranges[i];
		result = result.slice(0, start) + HIGHLIGHT_PREFIX + result.slice(start, end) + HIGHLIGHT_SUFFIX + result.slice(end);
	}
	return result;
}

/**
 * テキスト中のセンシティブワードを MFM ハイライト付き文字列に変換する。
 */
export function highlightSensitiveWords(text: string, keyWords: string[]): string {
	return annotateSensitiveWords(text, detectSensitiveWords(text, keyWords).ranges);
}
