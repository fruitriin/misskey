/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as mfm from 'mfm-js';
import { MfmService } from '@/core/MfmService.ts';
import type { MiNote } from '@/models/Note.ts';
import { bindThis } from '@/decorators.ts';
import { extractApHashtagObjects } from './models/tag.ts';
import type { IObject } from './type.ts';

@Injectable()
export class ApMfmService {
	constructor(
		private mfmService: MfmService,
	) {
	}

	@bindThis
	public htmlToMfm(html: string, tag?: IObject | IObject[]): string {
		const hashtagNames = extractApHashtagObjects(tag).map(x => x.name);
		return this.mfmService.fromHtml(html, hashtagNames);
	}

	@bindThis
	public getNoteHtml(note: MiNote): string | null {
		if (!note.text) return '';
		return this.mfmService.toHtml(mfm.parse(note.text), JSON.parse(note.mentionedRemoteUsers));
	}
}
