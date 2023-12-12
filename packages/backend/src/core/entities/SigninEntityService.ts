/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { } from '@/models/Blocking.ts';
import type { MiSignin } from '@/models/Signin.ts';
import { bindThis } from '@/decorators.ts';
import { IdService } from '@/core/IdService.ts';

@Injectable()
export class SigninEntityService {
	constructor(
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiSignin,
	) {
		return {
			id: src.id,
			createdAt: this.idService.parse(src.id).date.toISOString(),
			ip: src.ip,
			headers: src.headers,
			success: src.success,
		};
	}
}

