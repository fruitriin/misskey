/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 歯抜けマーカーの動作確認用のワンショットのコード。確認するときだけ cherry-pick し、終わったら revert する。
// タイムラインの API の応答とストリームのメッセージを、ブラウザの中で作ったダミーのノートに差し替えて、シナリオの状況を作る

import * as Misskey from 'misskey-js';
import { nextTick } from 'vue';
import { useStream } from '@/stream.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';

type Note = Misskey.entities.Note;

export type ScenarioContext = {
	/** タイムラインを読み込み直す (paginator.reload) */
	reload: () => Promise<void>;
	getRoot: () => HTMLElement | null;
	getScrollContainer: () => HTMLElement | null;
	/** タイムラインのチャンネル名 (homeTimeline など) */
	channel: string;
	log: (text: string) => void;
};

export type Scenario = {
	label: string;
	expected: string;
	run: (ctx: ScenarioContext) => Promise<void>;
};

const TIME2000 = 946684800000;
const RANGE_DELAY_MS = 700;

const state = {
	active: false,
	/** 偽のサーバーにあるノート */
	notes: [] as Note[],
	/** sinceId 付きの取得 (歯抜けの補給) を失敗させる残り回数 */
	failRangeCount: 0,
	serial: 0,
	lastTime: 0,
};

export function isActive(): boolean {
	return state.active;
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => window.setTimeout(resolve, ms));
}

/** backend の aid と同じ形式 (時刻 8 桁 + 2 桁)。時刻はノートごとに変えるので、文字列の大小が時刻順になる */
function genId(time: number): string {
	return (time - TIME2000).toString(36).padStart(8, '0') + (state.serial % 1296).toString(36).padStart(2, '0');
}

function makeNote(label: string, time: number = Date.now()): Note {
	const t = Math.max(time, state.lastTime + 1);
	state.lastTime = t;
	state.serial++;
	const user = {
		id: $i!.id,
		name: $i!.name,
		username: $i!.username,
		host: null,
		avatarUrl: $i!.avatarUrl,
		avatarBlurhash: $i!.avatarBlurhash,
		avatarDecorations: [],
		isBot: false,
		isCat: false,
		emojis: {},
		onlineStatus: 'online',
		badgeRoles: [],
	};
	return {
		id: genId(t),
		createdAt: new Date(t).toISOString(),
		userId: user.id,
		user,
		text: `ダミー #${state.serial} (${label})`,
		cw: null,
		visibility: 'public',
		localOnly: false,
		reactionAcceptance: null,
		renoteCount: 0,
		repliesCount: 0,
		reactionCount: 0,
		reactions: {},
		reactionEmojis: {},
		emojis: {},
		fileIds: [],
		files: [],
		replyId: null,
		renoteId: null,
		clippedCount: 0,
		myReaction: null,
	} as unknown as Note;
}

/** 偽のサーバーにノートを足す (ストリームには流さない = 切断中に投稿されたもの) */
function addSilently(count: number, label: string, from: number, step: number): Note[] {
	const added: Note[] = [];
	for (let i = 0; i < count; i++) added.push(makeNote(label, from + i * step));
	state.notes.push(...added);
	return added;
}

function byIdDesc(a: Note, b: Note): number {
	return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function respondTimeline(params: { sinceId?: string; untilId?: string; limit?: number }): Promise<Response> {
	const sinceId = params.sinceId != null && params.sinceId !== '0' ? params.sinceId : null;
	const untilId = params.untilId ?? null;
	if (sinceId != null) {
		// 補給中の表示 (読み込み中) を目で確かめられるように少し待つ
		await sleep(RANGE_DELAY_MS);
		if (state.failRangeCount > 0) {
			state.failRangeCount--;
			return jsonResponse(500, { error: { message: 'ダミーの失敗', code: 'DUMMY_FAILURE', id: '00000000-0000-0000-0000-000000000000' } });
		}
	}
	const limit = params.limit ?? 10;
	let list = state.notes.toSorted(byIdDesc);
	if (untilId != null) list = list.filter(n => n.id < untilId);
	if (sinceId != null) list = list.filter(n => n.id > sinceId);
	// backend と同じく、sinceId だけのときは古い順に limit 件、それ以外は新しい順に limit 件
	const res = sinceId != null && untilId == null ? list.toReversed().slice(0, limit) : list.slice(0, limit);
	return jsonResponse(200, res);
}

const TIMELINE_PATH = /\/api\/notes\/(timeline|local-timeline|hybrid-timeline|global-timeline)$/;
let fetchInstalled = false;

function installFetch(): void {
	if (fetchInstalled) return;
	fetchInstalled = true;
	const originalFetch = window.fetch.bind(window);
	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		if (!state.active || !TIMELINE_PATH.test(new URL(url, window.location.href).pathname)) return originalFetch(input, init);
		const params = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
		return respondTimeline(params);
	};
}

// misskey-js の Stream の内部 (private) を直接触る。ワンショットのコードなので型は緩める
type StreamInternals = {
	stream: { addEventListener: (type: string, fn: (ev: { data: string }) => void) => void; removeEventListener: (type: string, fn: (ev: { data: string }) => void) => void; reconnect: () => void };
	onMessage: (ev: { data: string }) => void;
	sharedConnections: { channel: string; id: string }[];
	nonSharedConnections: { channel: string; id: string }[];
	on: (event: string, fn: () => void) => void;
	off: (event: string, fn: () => void) => void;
};

let streamInstalled = false;

function getStream(): StreamInternals {
	return useStream() as unknown as StreamInternals;
}

/** シナリオの実行中は、サーバーから届いた本物のノートを捨てる */
function installStream(): void {
	if (streamInstalled) return;
	streamInstalled = true;
	const s = getStream();
	const original = s.onMessage;
	s.stream.removeEventListener('message', original);
	s.stream.addEventListener('message', (ev) => {
		if (state.active) {
			const { type, body } = JSON.parse(ev.data);
			if (type === 'channel' && body?.type === 'note') return;
		}
		original(ev);
	});
}

/** ストリームでノートを流す (サーバーから届いたように Stream の受信処理に渡す) */
function streamNote(channel: string, note: Note): void {
	const s = getStream();
	// タイムラインは引数付きで接続するので、共有しない接続のほうにいる
	const conn = [...s.nonSharedConnections, ...s.sharedConnections].find(c => c.channel === channel);
	if (conn == null) throw new Error(`チャンネル ${channel} に接続していない`);
	s.onMessage({ data: JSON.stringify({ type: 'channel', body: { id: conn.id, type: 'note', body: note } }) });
}

function streamNewNotes(ctx: ScenarioContext, count: number, label: string): Note[] {
	const added: Note[] = [];
	for (let i = 0; i < count; i++) {
		const note = makeNote(label);
		state.notes.push(note);
		streamNote(ctx.channel, note);
		added.push(note);
	}
	return added;
}

function streamNoteDeleted(noteId: string): void {
	state.notes = state.notes.filter(n => n.id !== noteId);
	getStream().onMessage({ data: JSON.stringify({ type: 'noteUpdated', body: { id: noteId, type: 'deleted', body: { deletedAt: new Date().toISOString() } } }) });
}

/** 本物のソケットを閉じ、Stream が再接続するまで待つ */
async function reconnect(ctx: ScenarioContext, beforeReconnect: () => void): Promise<void> {
	const s = getStream();
	await new Promise<void>((resolve) => {
		const onConnected = () => {
			s.off('_connected_', onConnected);
			resolve();
		};
		const onDisconnected = () => {
			s.off('_disconnected_', onDisconnected);
			ctx.log('切断した');
			beforeReconnect();
		};
		s.on('_disconnected_', onDisconnected);
		s.on('_connected_', onConnected);
		s.stream.reconnect();
	});
	ctx.log('再接続した');
	// チャンネルの接続し直しが届くまで少し待つ
	await sleep(300);
}

const DUMMY_AD_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="80"><rect width="600" height="80" fill="#f4c542"/><text x="300" y="50" font-size="28" text-anchor="middle" font-family="sans-serif">ダミー広告</text></svg>');
let adBackup: { ads: typeof instance.ads; notesPerOneAd: number; canHideAds: boolean } | null = null;

/**
 * ブラウザの中だけ、偽の広告を every 件ごとに出す (サーバーには登録しない)。
 * canHideAds を持つユーザーには広告が出ないので、それも外す
 */
function enableDummyAds(every: number, imageUrl: string = DUMMY_AD_IMAGE): void {
	if (adBackup == null) adBackup = { ads: instance.ads, notesPerOneAd: instance.notesPerOneAd, canHideAds: $i!.policies.canHideAds };
	instance.ads = [{ id: 'dummy-ad', url: 'https://example.com/', place: 'horizontal', ratio: 1, imageUrl, dayOfWeek: 0 }];
	instance.notesPerOneAd = every;
	$i!.policies.canHideAds = false;
}

function restoreAds(): void {
	if (adBackup == null) return;
	instance.ads = adBackup.ads;
	instance.notesPerOneAd = adBackup.notesPerOneAd;
	$i!.policies.canHideAds = adBackup.canHideAds;
	adBackup = null;
}

/** 偽のサーバーを初期化し、初期のノート (60 件、3 時間前から 1 分おき) でタイムラインを読み込み直す */
async function start(ctx: ScenarioContext): Promise<void> {
	installFetch();
	installStream();
	restoreAds();
	state.active = true;
	state.notes = [];
	state.failRangeCount = 0;
	state.serial = 0;
	state.lastTime = 0;
	addSilently(60, '初期', Date.now() - 1000 * 60 * 60 * 3, 1000 * 60);
	await ctx.reload();
	await waitForNotes(ctx);
	ctx.getScrollContainer()?.scrollTo({ top: 0 });
	await sleep(300);
}

async function waitForNotes(ctx: ScenarioContext): Promise<void> {
	for (let i = 0; i < 50; i++) {
		if (ctx.getRoot()?.querySelector('[data-scroll-anchor]') != null) return;
		await sleep(100);
	}
}

export async function stop(ctx: ScenarioContext): Promise<void> {
	state.active = false;
	restoreAds();
	state.notes = [];
	await ctx.reload();
}

/**
 * 切断中に missed 件のノートが作られた状態で再接続する (直近の数分に 1 秒おき)。
 * 5 分より古いノートはストリームで購読されず、削除の通知が届かないので、直近に置く
 */
async function reconnectWithMissed(ctx: ScenarioContext, missed: number): Promise<void> {
	await reconnect(ctx, () => {
		addSilently(missed, '切断中', Date.now() - 1000 * (missed + 30), 1000);
		if (missed > 0) ctx.log(`切断中に ${missed} 件`);
	});
}

function getGapElement(ctx: ScenarioContext): HTMLElement | null {
	return ctx.getRoot()?.querySelector<HTMLElement>('[data-gap-id]') ?? null;
}

/** マーカーの直前 (上) と直後 (下) のノートの要素 */
function getNeighbors(ctx: ScenarioContext): { gap: HTMLElement; above: HTMLElement | null; below: HTMLElement | null } | null {
	const gap = getGapElement(ctx);
	const root = ctx.getRoot();
	if (gap == null || root == null) return null;
	let above: HTMLElement | null = null;
	let below: HTMLElement | null = null;
	for (const el of root.querySelectorAll<HTMLElement>('[data-scroll-anchor]')) {
		if (gap.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) above = el;
		else if (below == null) below = el;
	}
	return { gap, above, below };
}

/** マーカーが画面の縦 40% の位置に来るようにスクロールする */
function scrollGapToMiddle(ctx: ScenarioContext): void {
	const gap = getGapElement(ctx);
	const container = ctx.getScrollContainer();
	if (gap == null || container == null) return;
	const containerTop = container.getBoundingClientRect().top;
	const target = containerTop + container.clientHeight * 0.4;
	container.scrollBy({ top: gap.getBoundingClientRect().top - target });
}

/**
 * マーカーのボタンを押したときに、位置を保つべき要素のずれを測って記録する。
 * 手で押したときも測れるよう、クリックを capture で拾う
 */
export function measureOnGapButtonClick(ctx: ScenarioContext, report: (text: string) => void): () => void {
	const onClick = (ev: MouseEvent) => {
		if (!state.active) return;
		const button = (ev.target as HTMLElement).closest('button');
		const gap = button?.closest<HTMLElement>('[data-gap-id]');
		if (button == null || gap == null || !ctx.getRoot()?.contains(gap)) return;
		const buttons = [...gap.querySelectorAll('button')];
		const keep = buttons.indexOf(button) === 0 ? 'newer' : 'older';
		const n = getNeighbors(ctx);
		if (n == null) return;
		const target = keep === 'newer' ? (n.above ?? n.gap) : n.below;
		if (target == null) return;
		const name = keep === 'newer' ? (n.above != null ? 'マーカーの上のノート' : 'マーカー自身') : 'マーカーの下のノート';
		const before = target.getBoundingClientRect().top;
		const label = keep === 'newer' ? '上の続きからもっと' : '下の続きからもっと';
		// 移動のアニメーション (TransitionGroup の move、0.7 秒) が終わってから測る
		window.setTimeout(() => {
			if (!target.isConnected) {
				report(`${label}: ${name}が消えた (区間を埋め終えてマーカーが消えた) ので測れない`);
				return;
			}
			const delta = Math.round(target.getBoundingClientRect().top - before);
			report(`${label}: ${name}のずれ ${delta}px ${Math.abs(delta) <= 1 ? '(OK)' : '(NG)'}`);
		}, RANGE_DELAY_MS + 3000);
	};
	// 読み込み直すとルート要素が作り直されるので、document で拾う
	window.document.addEventListener('click', onClick, true);
	return () => window.document.removeEventListener('click', onClick, true);
}

async function clickGapButton(ctx: ScenarioContext, keep: 'newer' | 'older'): Promise<void> {
	await sleep(1500);
	const gap = getGapElement(ctx);
	const buttons = gap?.querySelectorAll<HTMLButtonElement>('button');
	if (buttons == null || buttons.length < 2) {
		ctx.log('マーカーのボタンが見つからない');
		return;
	}
	ctx.log(`「${keep === 'newer' ? '上の続きからもっと' : '下の続きからもっと'}」を押す`);
	buttons[keep === 'newer' ? 0 : 1]!.click();
}

/** 自動補給 (1 ページ) が終わり、マーカーが残るまで待つ */
async function waitForAutoFill(): Promise<void> {
	await sleep(RANGE_DELAY_MS + 800);
}

/**
 * 切断中に missed 件 → 再接続 → 自動補給 (30 件) のあとにマーカーが残る状況を作り、
 * 上に新着を above 件流して、マーカーを画面の中ほどに置く
 */
async function prepareGapWithAbove(ctx: ScenarioContext, missed: number, above: number): Promise<void> {
	await start(ctx);
	await prepareGapWithAboveAfterStart(ctx, missed, above);
}

async function prepareGapWithAboveAfterStart(ctx: ScenarioContext, missed: number, above: number): Promise<void> {
	await reconnectWithMissed(ctx, missed);
	await waitForAutoFill();
	if (above > 0) {
		streamNewNotes(ctx, above, '新着');
		ctx.log(`新着を ${above} 件流した`);
		await sleep(800);
		scrollGapToMiddle(ctx);
	}
}

function scrollPositionScenario(above: number, keep: 'newer' | 'older'): Scenario {
	const button = keep === 'newer' ? '上の続きからもっと' : '下の続きからもっと';
	const kept = keep === 'newer' ? (above > 0 ? 'マーカーの上のノート' : 'マーカー自身') : 'マーカーの下のノート';
	return {
		label: `上 ${above} 件・${button}`,
		expected: `切断中に 80 件 → 再接続 → 自動補給 (30 件) のあとにマーカーが残る。${above > 0 ? `新着を ${above} 件流してマーカーを画面の中ほどに置き、` : ''}1.5 秒後に「${button}」を押す。${kept}の位置が動かない (ずれ 0px)`,
		run: async (ctx) => {
			await prepareGapWithAbove(ctx, 80, above);
			await clickGapButton(ctx, keep);
		},
	};
}

/**
 * 3 件ごとに偽の広告を出して、マーカーの上か下に広告を混ぜ、残り数ページで止める (手で押す)。
 * 新着を流すと表示が 30 件に切り詰められ、切断の前のノートは消えるので、上と下の両方には混ぜられない
 */
function adScenario(where: 'above' | 'below'): Scenario {
	const above = where === 'above' ? 20 : 0;
	return {
		label: `広告がマーカーの${where === 'above' ? '上' : '下'}・残り数ページで止める (手で押す)`,
		expected: `3 件ごとに偽の広告を出す。${where === 'above' ? '切断中に 140 件 → 再接続 → 自動補給 (30 件) → 新着 20 件で、マーカーの上の新着に広告が付く。マーカーを画面の中ほどに置いて止まる' : '切断の前に 12 件流して広告を付け、切断中に 140 件 → 再接続 → 自動補給 (30 件)。マーカーの下 (自動補給の 30 件のさらに下) に広告が付いたノートがある'}。ボタンを手で押す。位置を保つべきノートのずれが 0px で、広告が付いたノートと一緒に動き、広告が増えたり消えたりしない (補給したノートには広告を付けない)`,
		run: async (ctx) => {
			await start(ctx);
			enableDummyAds(3);
			if (where === 'below') {
				streamNewNotes(ctx, 12, '接続中');
				ctx.log('3 件ごとに広告を出す設定にして、切断の前に 12 件流した');
				await sleep(800);
			} else {
				ctx.log('3 件ごとに広告を出す設定にした');
			}
			await prepareGapWithAboveAfterStart(ctx, 140, above);
			ctx.log(`準備できた (残り 110 件、広告 ${ctx.getRoot()?.querySelectorAll('[class*="MkStreamingNotesTimeline-ad"] img').length ?? 0} 個)。マーカーのボタンを押す`);
		},
	};
}

/** 状況を作るところで止め、マーカーのボタンは手で押す。残りの件数 = missed - 30 (自動補給の分) */
function manualScenario(above: number, missed: number): Scenario {
	const remaining = missed - 30;
	const pages = remaining < 30 ? '1 ページ未満' : '数ページ';
	return {
		label: `上 ${above} 件・残り ${pages}で止める (手で押す)`,
		expected: `切断中に ${missed} 件 → 再接続 → 自動補給 (30 件) のあとに ${remaining} 件残る。${above > 0 ? `新着を ${above} 件流してマーカーを画面の中ほどに置き、` : ''}ここで止まるので、マーカーのボタンを手で押す。${remaining < 30 ? '1 回押すと残りが埋まり、マーカーが消える' : `30 件ずつ読み込み、${Math.ceil(remaining / 30)} 回目でマーカーが消える`}。押すたびに、位置を保つべきノートのずれをログに出す。大きくスクロールした直後に押すと、まだ描かれていなかったノートの高さが変わる分 (content-visibility) もずれとして数えるので、スクロールが落ち着いてから押す`,
		run: async (ctx) => {
			await prepareGapWithAbove(ctx, missed, above);
			ctx.log(`準備できた (残り ${remaining} 件)。マーカーのボタンを押す`);
		},
	};
}

export const scenarios: Scenario[] = [{
	label: '1. 自動補給で埋まる',
	expected: '切断中に 8 件 → 再接続 → 新着 1 件。マーカーが出て、自動補給で 8 件が入り、マーカーが消える',
	run: async (ctx) => {
		await start(ctx);
		await reconnectWithMissed(ctx, 8);
		await waitForAutoFill();
		streamNewNotes(ctx, 1, '新着');
		ctx.log('新着を 1 件流した');
	},
}, {
	label: '2. 1 ページに収まらない',
	expected: '切断中に 200 件 → 再接続。自動補給は 1 ページ (30 件) で止まり、マーカーが残る',
	run: async (ctx) => {
		await start(ctx);
		await reconnectWithMissed(ctx, 200);
	},
}, {
	label: '3. 補給が失敗する',
	expected: '切断中に 10 件 → 再接続。自動補給の 1 回目は 500 で失敗してマーカーが残る。ボタンを押すと成功してマーカーが消える',
	run: async (ctx) => {
		await start(ctx);
		state.failRangeCount = 1;
		await reconnectWithMissed(ctx, 10);
		ctx.log('次の補給は失敗させる (1 回だけ)');
	},
}, {
	label: '4. 区間が空',
	expected: '切断中は 0 件 → 再接続。マーカーが出て (読み込み中)、すぐに消える',
	run: async (ctx) => {
		await start(ctx);
		await reconnectWithMissed(ctx, 0);
	},
}, {
	label: '5. 先読みキューがあふれる',
	expected: '少し下にスクロールしてから 125 件を流す。キュー (100 件) からあふれた 25 件の区間にマーカーが立つ。「新しいノート」で先頭に戻すと 30 件に切り詰められ、古い区間ごとマーカーが消える。「もっと見る」で捨てられた 25 件も続けて読める',
	run: async (ctx) => {
		await start(ctx);
		ctx.getScrollContainer()?.scrollBy({ top: 400 });
		await sleep(500);
		streamNewNotes(ctx, 125, 'キュー');
		ctx.log('先頭から離れた状態で 125 件を流した。「新しいノート」で先頭に戻して確かめる');
	},
}, {
	label: '6. 長い非表示から復帰',
	expected: '非表示 → 時計を 6 分進める → 非表示の間に 5 件 → 表示に戻す (切断はしない)。マーカーが出て、自動補給で 5 件が入り、マーカーが消える',
	run: async (ctx) => {
		await start(ctx);
		const originalNow = Date.now;
		const setVisibility = (v: DocumentVisibilityState) => {
			Object.defineProperty(window.document, 'visibilityState', { configurable: true, get: () => v });
			window.document.dispatchEvent(new Event('visibilitychange'));
		};
		setVisibility('hidden');
		ctx.log('非表示にした');
		await sleep(500);
		addSilently(5, '非表示中', originalNow() - 1000 * 60 * 30, 1000 * 10);
		ctx.log('非表示の間に 5 件');
		Date.now = () => originalNow() + 1000 * 60 * 6;
		setVisibility('visible');
		ctx.log('時計を 6 分進めて表示に戻した');
		await nextTick();
		await sleep(0);
		Date.now = originalNow;
		delete (window.document as { visibilityState?: unknown }).visibilityState;
	},
}, {
	label: '7. 境目のノートの削除',
	expected: '2 と同じ状況を作り、マーカーのすぐ下のノートの削除通知をストリームで流す。マーカーが 1 つ下のノートに付け替わって残る',
	run: async (ctx) => {
		await start(ctx);
		await reconnectWithMissed(ctx, 200);
		await waitForAutoFill();
		await sleep(700);
		const below = getNeighbors(ctx)?.below;
		const noteId = below?.dataset.scrollAnchor;
		if (noteId == null) {
			ctx.log('マーカーの下のノートが見つからない');
			return;
		}
		const text = below?.querySelector('[class*="text"]')?.textContent ?? noteId;
		ctx.log(`削除通知を流す: ${text.trim()}`);
		streamNoteDeleted(noteId);
	},
},
scrollPositionScenario(0, 'newer'),
scrollPositionScenario(0, 'older'),
scrollPositionScenario(20, 'newer'),
scrollPositionScenario(20, 'older'),
manualScenario(0, 40),
manualScenario(0, 140),
manualScenario(20, 40),
manualScenario(20, 140),
adScenario('above'),
adScenario('below'),
].map((s, i) => i >= 7 ? { ...s, label: `${i + 1}. ${s.label}` } : s);

export type PrepareOptions = {
	/** 何件ごとに広告を出すか。null なら出さない */
	adsEvery: number | null;
	/** 広告の画像の URL (読み込みの遅い画像を試すとき) */
	adImageUrl?: string;
	/** 切断の前にストリームで流す件数 (広告が付く) */
	before: number;
	/** 切断中に作る件数 */
	missed: number;
	/** 再接続のあとに流す新着の件数 (広告が付く) */
	above: number;
	/** 自動補給を失敗させる (マーカーのすぐ下に、切断の前のノートを残す) */
	failAutoFill: boolean;
};

/** 自動テスト用: 条件を引数で指定して状況を作り、マーカーのボタンを押す直前で止める */
export async function prepareCustom(ctx: ScenarioContext, o: PrepareOptions): Promise<void> {
	await start(ctx);
	if (o.adsEvery != null) enableDummyAds(o.adsEvery, o.adImageUrl);
	if (o.before > 0) {
		streamNewNotes(ctx, o.before, '接続中');
		await sleep(800);
	}
	if (o.failAutoFill) state.failRangeCount = 1;
	await reconnectWithMissed(ctx, o.missed);
	await waitForAutoFill();
	if (o.above > 0) {
		streamNewNotes(ctx, o.above, '新着');
		await sleep(800);
	}
	ctx.log(`準備できた (${JSON.stringify(o)})`);
}
