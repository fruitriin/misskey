/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { ServerModule } from '@/server/ServerModule.ts';
import { GlobalModule } from '@/GlobalModule.ts';
import { DaemonModule } from '@/daemons/DaemonModule.ts';

@Module({
	imports: [
		GlobalModule,
		ServerModule,
		DaemonModule,
	],
})
export class MainModule {}
