/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.ts';
import { GlobalModule } from '@/GlobalModule.ts';
import { QueueLoggerService } from './QueueLoggerService.ts';
import { QueueProcessorService } from './QueueProcessorService.ts';
import { DeliverProcessorService } from './processors/DeliverProcessorService.ts';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.ts';
import { InboxProcessorService } from './processors/InboxProcessorService.ts';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.ts';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.ts';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.ts';
import { CleanProcessorService } from './processors/CleanProcessorService.ts';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.ts';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.ts';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.ts';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.ts';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.ts';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.ts';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.ts';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.ts';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.ts';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.ts';
import { ExportAntennasProcessorService } from './processors/ExportAntennasProcessorService.ts';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.ts';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.ts';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.ts';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.ts';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.ts';
import { ImportAntennasProcessorService } from './processors/ImportAntennasProcessorService.ts';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.ts';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.ts';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.ts';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.ts';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.ts';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		TickChartsProcessorService,
		ResyncChartsProcessorService,
		CleanChartsProcessorService,
		CheckExpiredMutingsProcessorService,
		CleanProcessorService,
		DeleteDriveFilesProcessorService,
		ExportCustomEmojisProcessorService,
		ExportNotesProcessorService,
		ExportFavoritesProcessorService,
		ExportFollowingProcessorService,
		ExportMutingProcessorService,
		ExportBlockingProcessorService,
		ExportUserListsProcessorService,
		ExportAntennasProcessorService,
		ImportFollowingProcessorService,
		ImportMutingProcessorService,
		ImportBlockingProcessorService,
		ImportUserListsProcessorService,
		ImportCustomEmojisProcessorService,
		ImportAntennasProcessorService,
		DeleteAccountProcessorService,
		DeleteFileProcessorService,
		CleanRemoteFilesProcessorService,
		RelationshipProcessorService,
		WebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		AggregateRetentionProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
