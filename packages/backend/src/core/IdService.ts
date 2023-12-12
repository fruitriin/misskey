/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DI } from '@/di-symbols.ts';
import type { Config } from '@/config.ts';
import { genAid, isSafeAidT, parseAid } from '@/misc/id/aid.ts';
import { genAidx, isSafeAidxT, parseAidx } from '@/misc/id/aidx.ts';
import { genMeid, isSafeMeidT, parseMeid } from '@/misc/id/meid.ts';
import { genMeidg, isSafeMeidgT, parseMeidg } from '@/misc/id/meidg.ts';
import { genObjectId, isSafeObjectIdT, parseObjectId } from '@/misc/id/object-id.ts';
import { bindThis } from '@/decorators.ts';
import { parseUlid } from '@/misc/id/ulid.ts';

@Injectable()
export class IdService {
	private method: string;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.method = config.id.toLowerCase();
	}

	@bindThis
	public isSafeT(t: number): boolean {
		switch (this.method) {
			case 'aid': return isSafeAidT(t);
			case 'aidx': return isSafeAidxT(t);
			case 'meid': return isSafeMeidT(t);
			case 'meidg': return isSafeMeidgT(t);
			case 'ulid': return t > 0;
			case 'objectid': return isSafeObjectIdT(t);
			default: throw new Error('unrecognized id generation method');
		}
	}

	/**
	 * 時間を元にIDを生成します(省略時は現在日時)
	 * @param time 日時
	 */
	@bindThis
	public gen(time?: number): string {
		const t = (!time || (time > Date.now())) ? Date.now() : time;

		switch (this.method) {
			case 'aid': return genAid(t);
			case 'aidx': return genAidx(t);
			case 'meid': return genMeid(t);
			case 'meidg': return genMeidg(t);
			case 'ulid': return ulid(t);
			case 'objectid': return genObjectId(t);
			default: throw new Error('unrecognized id generation method');
		}
	}

	@bindThis
	public parse(id: string): { date: Date; } {
		switch (this.method) {
			case 'aid': return parseAid(id);
			case 'aidx': return parseAidx(id);
			case 'objectid': return parseObjectId(id);
			case 'meid': return parseMeid(id);
			case 'meidg': return parseMeidg(id);
			case 'ulid': return parseUlid(id);
			default: throw new Error('unrecognized id generation method');
		}
	}
}
