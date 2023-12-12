/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.ts';
import { LoggerService } from '@/core/LoggerService.ts';

@Injectable()
export class ApiLoggerService {
	public logger: Logger;

	constructor(
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('api');
	}
}
