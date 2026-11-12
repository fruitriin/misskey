/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { DirectUploadService } from '@/core/DirectUploadService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { ObjectStorageFinalizeDirectUploadJobData } from '../types.js';

@Injectable()
export class FinalizeDirectUploadProcessorService {
	private logger: Logger;

	constructor(
		private directUploadService: DirectUploadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('finalize-direct-upload');
	}

	@bindThis
	public async process(job: Bull.Job<ObjectStorageFinalizeDirectUploadJobData>): Promise<string> {
		this.logger.info(`finalizing direct upload ${job.data.uploadId}`);
		await this.directUploadService.finalize(job.data.uploadId);
		return 'Success';
	}
}
