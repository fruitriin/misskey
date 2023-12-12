/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.ts';
import type { NotesRepository, PollsRepository } from '@/models/_.ts';
import type { Config } from '@/config.ts';
import type { IPoll } from '@/models/Poll.ts';
import type Logger from '@/logger.ts';
import { bindThis } from '@/decorators.ts';
import { isQuestion } from '../type.ts';
import { ApLoggerService } from '../ApLoggerService.ts';
import { ApResolverService } from '../ApResolverService.ts';
import type { Resolver } from '../ApResolverService.ts';
import type { IObject, IQuestion } from '../type.ts';

@Injectable()
export class ApQuestionService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		private apResolverService: ApResolverService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	@bindThis
	public async extractPollFromQuestion(source: string | IObject, resolver?: Resolver): Promise<IPoll> {
		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();

		const question = await resolver.resolve(source);
		if (!isQuestion(question)) throw new Error('invalid type');

		const multiple = question.oneOf === undefined;
		if (multiple && question.anyOf === undefined) throw new Error('invalid question');

		const expiresAt = question.endTime ? new Date(question.endTime) : question.closed ? new Date(question.closed) : null;

		const choices = question[multiple ? 'anyOf' : 'oneOf']
			?.map((x) => x.name)
			.filter((x): x is string => typeof x === 'string')
			?? [];

		const votes = question[multiple ? 'anyOf' : 'oneOf']?.map((x) => x.replies?.totalItems ?? x._misskey_votes ?? 0);

		return { choices, votes, multiple, expiresAt };
	}

	/**
	 * Update votes of Question
	 * @param uri URI of AP Question object
	 * @returns true if updated
	 */
	@bindThis
	public async updateQuestion(value: string | IObject, resolver?: Resolver): Promise<boolean> {
		const uri = typeof value === 'string' ? value : value.id;
		if (uri == null) throw new Error('uri is null');

		// URIがこのサーバーを指しているならスキップ
		if (uri.startsWith(this.config.url + '/')) throw new Error('uri points local');

		//#region このサーバーに既に登録されているか
		const note = await this.notesRepository.findOneBy({ uri });
		if (note == null) throw new Error('Question is not registed');

		const poll = await this.pollsRepository.findOneBy({ noteId: note.id });
		if (poll == null) throw new Error('Question is not registed');
		//#endregion

		// resolve new Question object
		// eslint-disable-next-line no-param-reassign
		if (resolver == null) resolver = this.apResolverService.createResolver();
		const question = await resolver.resolve(value) as IQuestion;
		this.logger.debug(`fetched question: ${JSON.stringify(question, null, 2)}`);

		if (question.type !== 'Question') throw new Error('object is not a Question');

		const apChoices = question.oneOf ?? question.anyOf;
		if (apChoices == null) throw new Error('invalid apChoices: ' + apChoices);

		let changed = false;

		for (const choice of poll.choices) {
			const oldCount = poll.votes[poll.choices.indexOf(choice)];
			const newCount = apChoices.filter(ap => ap.name === choice).at(0)?.replies?.totalItems;
			if (newCount == null) throw new Error('invalid newCount: ' + newCount);

			if (oldCount !== newCount) {
				changed = true;
				poll.votes[poll.choices.indexOf(choice)] = newCount;
			}
		}

		await this.pollsRepository.update({ noteId: note.id }, { votes: poll.votes });

		return changed;
	}
}
