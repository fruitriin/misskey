/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entity as FederationChart } from './charts/entities/federation.ts';
import { entity as NotesChart } from './charts/entities/notes.ts';
import { entity as UsersChart } from './charts/entities/users.ts';
import { entity as ActiveUsersChart } from './charts/entities/active-users.ts';
import { entity as InstanceChart } from './charts/entities/instance.ts';
import { entity as PerUserNotesChart } from './charts/entities/per-user-notes.ts';
import { entity as PerUserPvChart } from './charts/entities/per-user-pv.ts';
import { entity as DriveChart } from './charts/entities/drive.ts';
import { entity as PerUserReactionsChart } from './charts/entities/per-user-reactions.ts';
import { entity as PerUserFollowingChart } from './charts/entities/per-user-following.ts';
import { entity as PerUserDriveChart } from './charts/entities/per-user-drive.ts';
import { entity as ApRequestChart } from './charts/entities/ap-request.ts';

import { entity as TestChart } from './charts/entities/test.ts';
import { entity as TestGroupedChart } from './charts/entities/test-grouped.ts';
import { entity as TestUniqueChart } from './charts/entities/test-unique.ts';
import { entity as TestIntersectionChart } from './charts/entities/test-intersection.ts';

export const entities = [
	FederationChart.hour, FederationChart.day,
	NotesChart.hour, NotesChart.day,
	UsersChart.hour, UsersChart.day,
	ActiveUsersChart.hour, ActiveUsersChart.day,
	InstanceChart.hour, InstanceChart.day,
	PerUserNotesChart.hour, PerUserNotesChart.day,
	PerUserPvChart.hour, PerUserPvChart.day,
	DriveChart.hour, DriveChart.day,
	PerUserReactionsChart.hour, PerUserReactionsChart.day,
	PerUserFollowingChart.hour, PerUserFollowingChart.day,
	PerUserDriveChart.hour, PerUserDriveChart.day,
	ApRequestChart.hour, ApRequestChart.day,

	...(process.env.NODE_ENV === 'test' ? [
		TestChart.hour, TestChart.day,
		TestGroupedChart.hour, TestGroupedChart.day,
		TestUniqueChart.hour, TestUniqueChart.day,
		TestIntersectionChart.hour, TestIntersectionChart.day,
	] : []),
];
