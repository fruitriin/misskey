/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import type { MiUser } from '@/models/_.ts';
import { toArray, unique } from '@/misc/prelude/array.ts';
import { bindThis } from '@/decorators.ts';
import { isMention } from '../type.ts';
import { Resolver } from '../ApResolverService.ts';
import { ApPersonService } from './ApPersonService.ts';
import type { IObject, IApMention } from '../type.ts';

@Injectable()
export class ApMentionService {
	constructor(
		private apPersonService: ApPersonService,
	) {
	}

	@bindThis
	public async extractApMentions(tags: IObject | IObject[] | null | undefined, resolver: Resolver): Promise<MiUser[]> {
		const hrefs = unique(this.extractApMentionObjects(tags).map(x => x.href));

		const limit = promiseLimit<MiUser | null>(2);
		const mentionedUsers = (await Promise.all(
			hrefs.map(x => limit(() => this.apPersonService.resolvePerson(x, resolver).catch(() => null))),
		)).filter((x): x is MiUser => x != null);

		return mentionedUsers;
	}

	@bindThis
	public extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
		if (tags == null) return [];
		return toArray(tags).filter(isMention);
	}
}
