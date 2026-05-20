/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, beforeEach, test, expect, vi } from 'vitest';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import type { MiNote } from '@/models/Note.js';
import type { FanoutTimelineName } from '@/core/FanoutTimelineService.js';

// timemachine ブランチで追加された FanoutTimelineEndpointService.getMiNotes の論理矛盾を表現するテスト。
//
// 背景:
//   timemachine ブランチは「過去の untilId を持つリクエストでも Redis に乗っていない範囲は
//   DB に落とす」ことを意図して、以下 3 箇所を改変した:
//
//   (a) L86  shouldFallbackToDb に `ps.untilId > newestNoteId` を OR で追加
//   (b) L186 内側ループの早期 return 条件に `!isUntilIdOutOfRange &&` を追加
//   (c) L201 partial fallback の dbUntil を `ps.untilId ?? noteIds[last]` に変更
//
// しかし FanoutTimelineService.getMulti のフィルタは厳密不等号 `id < untilId` (排他的) のため:
//   - (a) は「untilId が指定されているとき」常に真 → 全ての untilId 付きクエリで Redis が無効化される
//   - (b) は内側ブロックに入った時点で必ず偽 → 死コード
//   - (c) は内側ブロックに入る = untilId が null である ことを意味する → 左辺常に null = 元コードと等価
//
// しかも「初回ロード (untilId/sinceId なし) で Redis に飛地があるケース」は依然として塞がっていない。
describe('FanoutTimelineEndpointService.getMiNotes - timemachine 追加ロジックの論理矛盾', () => {
	let service: FanoutTimelineEndpointService;
	let virtualDb: Map<string, MiNote>;
	let redisIds: string[];
	let mockCreateQueryBuilder: ReturnType<typeof vi.fn>;
	let mockGetMulti: ReturnType<typeof vi.fn>;

	// Misskey の AIDX は固定長文字列なので文字列比較 = 時系列比較。
	// テストでも固定長 (4桁) にパディングして string compare と numeric compare を一致させる。
	const id = (n: number) => n.toString().padStart(4, '0');

	function makeNote(id: string): MiNote {
		return {
			id,
			userId: 'u-system',
			renoteUserId: null,
			replyUserId: null,
			userHost: null,
			renoteUserHost: null,
			replyUserHost: null,
			fileIds: [],
			user: { isSuspended: false },
			renote: null,
			reply: null,
		} as unknown as MiNote;
	}

	function makeDbFallback() {
		return vi.fn(async (untilId: string | null, sinceId: string | null, limit: number) => {
			const all = Array.from(virtualDb.values()).filter(n =>
				(untilId == null || n.id < untilId) && (sinceId == null || n.id > sinceId),
			);
			all.sort((a, b) => a.id > b.id ? -1 : 1);
			return all.slice(0, limit);
		});
	}

	function callOptions(over: Record<string, any> = {}) {
		return {
			untilId: null as string | null,
			sinceId: null as string | null,
			limit: 10,
			allowPartial: true,
			useDbFallback: true,
			excludePureRenotes: false,
			redisTimelines: ['homeTimeline:test' as FanoutTimelineName],
			dbFallback: makeDbFallback(),
			...over,
		};
	}

	beforeEach(() => {
		virtualDb = new Map();
		redisIds = [];

		// 実機 FanoutTimelineService.getMulti と等価な挙動 (id < untilId, id > sinceId 排他的)
		mockGetMulti = vi.fn(async (_names: any, untilId?: string | null, sinceId?: string | null) => {
			let ids = redisIds.slice();
			if (untilId != null && sinceId != null) ids = ids.filter(id => id < untilId && id > sinceId);
			else if (untilId != null) ids = ids.filter(id => id < untilId);
			else if (sinceId != null) ids = ids.filter(id => id > sinceId);
			ids.sort((a, b) => a > b ? -1 : 1);
			return [ids];
		});

		// notesRepository.createQueryBuilder のチェイン mock。
		// where で渡された noteIds 配列を virtualDb から引いて getMany で返す。
		mockCreateQueryBuilder = vi.fn(() => {
			let capturedIds: string[] = [];
			const qb: any = {
				where: vi.fn((_sql: string, params: any) => {
					capturedIds = params?.noteIds ?? [];
					return qb;
				}),
				innerJoinAndSelect: vi.fn(() => qb),
				leftJoinAndSelect: vi.fn(() => qb),
				getMany: vi.fn(async () =>
					capturedIds.map(id => virtualDb.get(id)).filter((n): n is MiNote => n != null),
				),
			};
			return qb;
		});

		service = new FanoutTimelineEndpointService(
			{ createQueryBuilder: mockCreateQueryBuilder } as any,
			{ blockedHosts: [] } as any,
			{ packMany: vi.fn() } as any,
			{
				userMutingsCache: { fetch: vi.fn(async () => new Set()) },
				renoteMutingsCache: { fetch: vi.fn(async () => new Set()) },
				userBlockedCache: { fetch: vi.fn(async () => new Set()) },
				userProfileCache: { fetch: vi.fn(async () => ({ mutedInstances: [] })) },
			} as any,
			{ getMulti: mockGetMulti } as any,
			{ isBlockedHost: () => false } as any,
			{ mutingChannelsCache: { fetch: vi.fn(async () => new Set()) } } as any,
		);
	});

	// ----------------------------------------------------------------------
	// Hole 1: 初回ロード (untilId/sinceId なし) で Redis に飛地があると、
	//         返却に Redis 上の飛地ノートしか含まれずギャップ帯が欠落する。
	//         (timemachine の追加ロジックはこの経路を救済しない)
	// ----------------------------------------------------------------------
	describe('Hole 1: 初回ロードで Redis 飛地のギャップ帯が欠落する', () => {
		test('Redis に [0201,0200,0199, 0100,0099,0098] (0101-0198 欠落) で limit=10, allowPartial=true を要求すると連続10件にならない', async () => {
			redisIds = [id(201), id(200), id(199), id(100), id(99), id(98)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));
			// DB は完全な連続帯を持つ (95..201)
			for (let i = 95; i <= 201; i++) virtualDb.set(id(i), makeNote(id(i)));

			const result = await service.getMiNotes(callOptions({ limit: 10, allowPartial: true }));
			const ids = result.map(n => n.id);

			// 期待: 連続した最新 10 件
			const continuous = [id(201), id(200), id(199), id(198), id(197), id(196), id(195), id(194), id(193), id(192)];
			expect(ids).toEqual(continuous);
		});

		test('allowPartial=false でも partial fallback の dbUntil=noteIds[last]=0098 で続きを取りに行き、0198..0101 が永遠に取得されない', async () => {
			redisIds = [id(201), id(200), id(199), id(100), id(99), id(98)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));
			for (let i = 50; i <= 201; i++) virtualDb.set(id(i), makeNote(id(i)));

			const dbFallback = makeDbFallback();
			const result = await service.getMiNotes(callOptions({
				limit: 10, allowPartial: false, dbFallback,
			}));
			const ids = result.map(n => n.id);

			// partial fallback が 0098 より古い方を取りに行く事実
			expect(dbFallback).toHaveBeenCalledWith(id(98), null, 4);

			// 期待: ギャップ帯の代表 0150 が連続帯として含まれる
			// 実態: 0150 は Redis にも返却にもなく、ギャップは塞がれない
			expect(ids).toContain(id(150));
		});
	});

	// ----------------------------------------------------------------------
	// Hole 2: untilId 付きクエリで shouldFallbackToDb が必ず真になる。
	//         Redis のフィルタが `id < untilId` 排他的なので
	//         newestNoteId < untilId は必ず成立し、L86 の追加条件
	//         `ps.untilId > newestNoteId` が untilId 付きで常に真になる。
	//         結果として Redis 経路 (notesRepository.createQueryBuilder) は
	//         呼ばれず、直接 dbFallback に飛ぶ = キャッシュ完全バイパス。
	// ----------------------------------------------------------------------
	describe('Hole 2: untilId 付きクエリで Redis が完全にバイパスされる', () => {
		test('Redis に連続した必要十分なデータがあっても、untilId が来れば Redis 経路 (createQueryBuilder) は呼ばれない', async () => {
			redisIds = [id(200), id(199), id(198), id(197), id(196), id(195), id(194), id(193), id(192), id(191), id(190)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));

			const dbFallback = makeDbFallback();
			await service.getMiNotes(callOptions({
				untilId: id(201), limit: 5, allowPartial: false, dbFallback,
			}));

			// 期待: Redis にデータがあるので Redis 経路で取り出される
			// 実態: untilId 付きは常に L208 フルフォールバックに飛び、Redis ノート取得は走らない
			expect(mockCreateQueryBuilder).toHaveBeenCalled();
		});

		test('untilId 付きは L208 のフルフォールバックに直行する (Redis 内側ループは無視)', async () => {
			redisIds = [id(200), id(199), id(198), id(197), id(196), id(195)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));

			const dbFallback = makeDbFallback();
			await service.getMiNotes(callOptions({
				untilId: id(201), limit: 5, allowPartial: false, dbFallback,
			}));

			// dbFallback が untilId/sinceId をそのままに 1 回だけ呼ばれる
			expect(dbFallback).toHaveBeenCalledTimes(1);
			expect(dbFallback).toHaveBeenCalledWith(id(201), null, 5);
			// Redis 内ループ (createQueryBuilder) は走らない
			expect(mockCreateQueryBuilder).not.toHaveBeenCalled();
		});
	});

	// ----------------------------------------------------------------------
	// Hole 3: L186 の `!isUntilIdOutOfRange &&` 追加は到達不能 (死コード)。
	//         内側ブロックに入る = shouldFallbackToDb=false
	//         shouldFallbackToDb の disjunct に isUntilIdOutOfRange が含まれている
	//         ので、内側では isUntilIdOutOfRange は必ず false。
	//         よって追加された `!isUntilIdOutOfRange &&` は常に true で挙動を変えない。
	// ----------------------------------------------------------------------
	describe('Hole 3: L186 isUntilIdOutOfRange は死コード (内側ブロック内で常に false)', () => {
		test('内側に入った時点で untilId は null か untilId<=newestNoteId のいずれか → 追加条件は早期 return の挙動を変えない', async () => {
			// untilId なし → 内側ブロックに入る
			redisIds = [id(200), id(199), id(198), id(197), id(196)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));

			const dbFallback = makeDbFallback();
			const result = await service.getMiNotes(callOptions({
				untilId: null, limit: 3, allowPartial: true, dbFallback,
			}));

			// 新コード `!isUntilIdOutOfRange &&` を挟もうが挟むまいが Redis 経路で 3 件取れて早期 return
			expect(result.map(n => n.id)).toEqual([id(200), id(199), id(198)]);
			expect(dbFallback).not.toHaveBeenCalled();
		});
	});

	// ----------------------------------------------------------------------
	// Hole 4: L201 `dbUntil = ps.untilId ?? noteIds[last]` 変更も死コード。
	//         partial fallback (内側ブロック末尾) に到達できるのは
	//         shouldFallbackToDb=false の場合のみ。それは untilId が null の時。
	//         よって `ps.untilId ??` の左辺は常に null = 右辺評価 = 元コードと等価。
	// ----------------------------------------------------------------------
	describe('Hole 4: L201 `ps.untilId ?? noteIds[last]` の左辺が常に null', () => {
		test('untilId 付きは内側ブロックを経由しないため partial fallback の左辺評価は到達不能', async () => {
			redisIds = [id(199), id(198)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));

			const dbFallback = makeDbFallback();
			await service.getMiNotes(callOptions({
				untilId: id(200), limit: 10, allowPartial: false, dbFallback,
			}));

			// 唯一の dbFallback 呼び出しはフルフォールバック (L208) のみ。
			// partial fallback (L194-204) には到達しない。
			expect(dbFallback).toHaveBeenCalledTimes(1);
			expect(dbFallback).toHaveBeenCalledWith(id(200), null, 10);
		});

		test('untilId なし + Redis に飛地ありで partial fallback に入ると、dbUntil は ps.untilId ではなく noteIds[last] になる', async () => {
			redisIds = [id(200), id(100)]; // 大ギャップ
			for (const x of redisIds) virtualDb.set(x, makeNote(x));
			for (let i = 50; i <= 200; i++) virtualDb.set(id(i), makeNote(id(i)));

			const dbFallback = makeDbFallback();
			await service.getMiNotes(callOptions({
				untilId: null, limit: 10, allowPartial: false, dbFallback,
			}));

			// 左辺 ps.untilId は null なので右辺の noteIds[last]=0100 が dbUntil になる
			// → 0100 より古い方しか取れず、0199..0101 のギャップは塞がらない
			expect(dbFallback).toHaveBeenCalledWith(id(100), null, 8);
		});
	});

	// ----------------------------------------------------------------------
	// 対照: 正常系 (Redis 連続帯, カーソル無し) は素直に動く。
	//       バグは「飛地」または「untilId 付き」に局所化されていることを確認。
	// ----------------------------------------------------------------------
	describe('正常系: Redis が連続でカーソル無しなら期待通り動く', () => {
		test('Redis [0200..0191] で limit=5 を要求すると上位 5 件が返り、DB は叩かれない', async () => {
			redisIds = [id(200), id(199), id(198), id(197), id(196), id(195), id(194), id(193), id(192), id(191)];
			for (const x of redisIds) virtualDb.set(x, makeNote(x));

			const dbFallback = makeDbFallback();
			const result = await service.getMiNotes(callOptions({
				untilId: null, limit: 5, allowPartial: true, dbFallback,
			}));

			expect(result.map(n => n.id)).toEqual([id(200), id(199), id(198), id(197), id(196)]);
			expect(dbFallback).not.toHaveBeenCalled();
		});
	});
});
