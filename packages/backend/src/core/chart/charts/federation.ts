/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FollowingsRepository, InstancesRepository } from '@/models/_.ts';
import { AppLockService } from '@/core/AppLockService.ts';
import { DI } from '@/di-symbols.ts';
import { MetaService } from '@/core/MetaService.ts';
import { bindThis } from '@/decorators.ts';
import Chart from '../core.ts';
import { ChartLoggerService } from '../ChartLoggerService.ts';
import { name, schema } from './entities/federation.ts';
import type { KVs } from '../core.ts';

/**
 * フェデレーションに関するチャート
 */
@Injectable()
export default class FederationChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private metaService: MetaService,
		private appLockService: AppLockService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		const meta = await this.metaService.fetch();

		const suspendedInstancesQuery = this.instancesRepository.createQueryBuilder('instance')
			.select('instance.host')
			.where('instance.isSuspended = true');

		const pubsubSubQuery = this.followingsRepository.createQueryBuilder('f')
			.select('f.followerHost')
			.where('f.followerHost IS NOT NULL');

		const subInstancesQuery = this.followingsRepository.createQueryBuilder('f')
			.select('f.followeeHost')
			.where('f.followeeHost IS NOT NULL');

		const pubInstancesQuery = this.followingsRepository.createQueryBuilder('f')
			.select('f.followerHost')
			.where('f.followerHost IS NOT NULL');

		const [sub, pub, pubsub, subActive, pubActive] = await Promise.all([
			this.followingsRepository.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'following.followeeHost NOT ILIKE ANY(ARRAY[:...blocked])', { blocked: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) })
				.andWhere(`following.followeeHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			this.followingsRepository.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followerHost)')
				.where('following.followerHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'following.followerHost NOT ILIKE ANY(ARRAY[:...blocked])', { blocked: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) })
				.andWhere(`following.followerHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			this.followingsRepository.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'following.followeeHost NOT ILIKE ANY(ARRAY[:...blocked])', { blocked: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) })
				.andWhere(`following.followeeHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.andWhere(`following.followeeHost IN (${ pubsubSubQuery.getQuery() })`)
				.setParameters(pubsubSubQuery.getParameters())
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			this.instancesRepository.createQueryBuilder('instance')
				.select('COUNT(instance.id)')
				.where(`instance.host IN (${ subInstancesQuery.getQuery() })`)
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'instance.host NOT ILIKE ANY(ARRAY[:...blocked])', { blocked: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) })
				.andWhere('instance.isSuspended = false')
				.andWhere('instance.isNotResponding = false')
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			this.instancesRepository.createQueryBuilder('instance')
				.select('COUNT(instance.id)')
				.where(`instance.host IN (${ pubInstancesQuery.getQuery() })`)
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'instance.host NOT ILIKE ANY(ARRAY[:...blocked])', { blocked: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) })
				.andWhere('instance.isSuspended = false')
				.andWhere('instance.isNotResponding = false')
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
		]);

		return {
			'sub': sub,
			'pub': pub,
			'pubsub': pubsub,
			'subActive': subActive,
			'pubActive': pubActive,
		};
	}

	@bindThis
	public async deliverd(host: string, succeeded: boolean): Promise<void> {
		await this.commit(succeeded ? {
			'deliveredInstances': [host],
		} : {
			'stalled': [host],
		});
	}

	@bindThis
	public async inbox(host: string): Promise<void> {
		await this.commit({
			'inboxInstances': [host],
		});
	}
}
