/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.ts';
import { LoggerService } from '@/core/LoggerService.js';

@Injectable()
export class ClientLoggerService {
	public logger: Logger;

	constructor(
		private loggerService: LoggerService,
	) {
		console.error("FIXME: line LoggerService.ts L:20")
		this.loggerService = new LoggerService()
		this.logger = this.loggerService.getLogger('client');

	}
}
