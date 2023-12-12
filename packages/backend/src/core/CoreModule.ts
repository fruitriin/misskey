/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.ts';
import { AccountMoveService } from './AccountMoveService.ts';
import { AccountUpdateService } from './AccountUpdateService.ts';
import { AiService } from './AiService.ts';
import { AnnouncementService } from './AnnouncementService.ts';
import { AntennaService } from './AntennaService.ts';
import { AppLockService } from './AppLockService.ts';
import { AchievementService } from './AchievementService.ts';
import { AvatarDecorationService } from './AvatarDecorationService.ts';
import { CaptchaService } from './CaptchaService.ts';
import { CreateSystemUserService } from './CreateSystemUserService.ts';
import { CustomEmojiService } from './CustomEmojiService.ts';
import { DeleteAccountService } from './DeleteAccountService.ts';
import { DownloadService } from './DownloadService.ts';
import { DriveService } from './DriveService.ts';
import { EmailService } from './EmailService.ts';
import { FederatedInstanceService } from './FederatedInstanceService.ts';
import { FetchInstanceMetadataService } from './FetchInstanceMetadataService.ts';
import { GlobalEventService } from './GlobalEventService.ts';
import { HashtagService } from './HashtagService.ts';
import { HttpRequestService } from './HttpRequestService.ts';
import { IdService } from './IdService.ts';
import { ImageProcessingService } from './ImageProcessingService.ts';
import { InstanceActorService } from './InstanceActorService.ts';
import { InternalStorageService } from './InternalStorageService.ts';
import { MetaService } from './MetaService.ts';
import { MfmService } from './MfmService.ts';
import { ModerationLogService } from './ModerationLogService.ts';
import { NoteCreateService } from './NoteCreateService.ts';
import { NoteDeleteService } from './NoteDeleteService.ts';
import { NotePiningService } from './NotePiningService.ts';
import { NoteReadService } from './NoteReadService.ts';
import { NotificationService } from './NotificationService.ts';
import { PollService } from './PollService.ts';
import { PushNotificationService } from './PushNotificationService.ts';
import { QueryService } from './QueryService.ts';
import { ReactionService } from './ReactionService.ts';
import { RelayService } from './RelayService.ts';
import { RoleService } from './RoleService.ts';
import { S3Service } from './S3Service.ts';
import { SignupService } from './SignupService.ts';
import { WebAuthnService } from './WebAuthnService.ts';
import { UserBlockingService } from './UserBlockingService.ts';
import { CacheService } from './CacheService.ts';
import { UserService } from './UserService.ts';
import { UserFollowingService } from './UserFollowingService.ts';
import { UserKeypairService } from './UserKeypairService.ts';
import { UserListService } from './UserListService.ts';
import { UserMutingService } from './UserMutingService.ts';
import { UserSuspendService } from './UserSuspendService.ts';
import { UserAuthService } from './UserAuthService.ts';
import { VideoProcessingService } from './VideoProcessingService.ts';
import { WebhookService } from './WebhookService.ts';
import { ProxyAccountService } from './ProxyAccountService.ts';
import { UtilityService } from './UtilityService.ts';
import { FileInfoService } from './FileInfoService.ts';
import { SearchService } from './SearchService.ts';
import { ClipService } from './ClipService.ts';
import { FeaturedService } from './FeaturedService.ts';
import { FanoutTimelineService } from './FanoutTimelineService.ts';
import { ChannelFollowingService } from './ChannelFollowingService.ts';
import { RegistryApiService } from './RegistryApiService.ts';
import { ChartLoggerService } from './chart/ChartLoggerService.ts';
import FederationChart from './chart/charts/federation.ts';
import NotesChart from './chart/charts/notes.ts';
import UsersChart from './chart/charts/users.ts';
import ActiveUsersChart from './chart/charts/active-users.ts';
import InstanceChart from './chart/charts/instance.ts';
import PerUserNotesChart from './chart/charts/per-user-notes.ts';
import PerUserPvChart from './chart/charts/per-user-pv.ts';
import DriveChart from './chart/charts/drive.ts';
import PerUserReactionsChart from './chart/charts/per-user-reactions.ts';
import PerUserFollowingChart from './chart/charts/per-user-following.ts';
import PerUserDriveChart from './chart/charts/per-user-drive.ts';
import ApRequestChart from './chart/charts/ap-request.ts';
import { ChartManagementService } from './chart/ChartManagementService.ts';
import { AbuseUserReportEntityService } from './entities/AbuseUserReportEntityService.ts';
import { AntennaEntityService } from './entities/AntennaEntityService.ts';
import { AppEntityService } from './entities/AppEntityService.ts';
import { AuthSessionEntityService } from './entities/AuthSessionEntityService.ts';
import { BlockingEntityService } from './entities/BlockingEntityService.ts';
import { ChannelEntityService } from './entities/ChannelEntityService.ts';
import { ClipEntityService } from './entities/ClipEntityService.ts';
import { DriveFileEntityService } from './entities/DriveFileEntityService.ts';
import { DriveFolderEntityService } from './entities/DriveFolderEntityService.ts';
import { EmojiEntityService } from './entities/EmojiEntityService.ts';
import { FollowingEntityService } from './entities/FollowingEntityService.ts';
import { FollowRequestEntityService } from './entities/FollowRequestEntityService.ts';
import { GalleryLikeEntityService } from './entities/GalleryLikeEntityService.ts';
import { GalleryPostEntityService } from './entities/GalleryPostEntityService.ts';
import { HashtagEntityService } from './entities/HashtagEntityService.ts';
import { InstanceEntityService } from './entities/InstanceEntityService.ts';
import { InviteCodeEntityService } from './entities/InviteCodeEntityService.ts';
import { ModerationLogEntityService } from './entities/ModerationLogEntityService.ts';
import { MutingEntityService } from './entities/MutingEntityService.ts';
import { RenoteMutingEntityService } from './entities/RenoteMutingEntityService.ts';
import { NoteEntityService } from './entities/NoteEntityService.ts';
import { NoteFavoriteEntityService } from './entities/NoteFavoriteEntityService.ts';
import { NoteReactionEntityService } from './entities/NoteReactionEntityService.ts';
import { NotificationEntityService } from './entities/NotificationEntityService.ts';
import { PageEntityService } from './entities/PageEntityService.ts';
import { PageLikeEntityService } from './entities/PageLikeEntityService.ts';
import { SigninEntityService } from './entities/SigninEntityService.ts';
import { UserEntityService } from './entities/UserEntityService.ts';
import { UserListEntityService } from './entities/UserListEntityService.ts';
import { FlashEntityService } from './entities/FlashEntityService.ts';
import { FlashLikeEntityService } from './entities/FlashLikeEntityService.ts';
import { RoleEntityService } from './entities/RoleEntityService.ts';
import { ApAudienceService } from './activitypub/ApAudienceService.ts';
import { ApDbResolverService } from './activitypub/ApDbResolverService.ts';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.ts';
import { ApInboxService } from './activitypub/ApInboxService.ts';
import { ApLoggerService } from './activitypub/ApLoggerService.ts';
import { ApMfmService } from './activitypub/ApMfmService.ts';
import { ApRendererService } from './activitypub/ApRendererService.ts';
import { ApRequestService } from './activitypub/ApRequestService.ts';
import { ApResolverService } from './activitypub/ApResolverService.ts';
import { LdSignatureService } from './activitypub/LdSignatureService.ts';
import { RemoteLoggerService } from './RemoteLoggerService.ts';
import { RemoteUserResolveService } from './RemoteUserResolveService.ts';
import { WebfingerService } from './WebfingerService.ts';
import { ApImageService } from './activitypub/models/ApImageService.ts';
import { ApMentionService } from './activitypub/models/ApMentionService.ts';
import { ApNoteService } from './activitypub/models/ApNoteService.ts';
import { ApPersonService } from './activitypub/models/ApPersonService.ts';
import { ApQuestionService } from './activitypub/models/ApQuestionService.ts';
import { QueueModule } from './QueueModule.ts';
import { QueueService } from './QueueService.ts';
import { LoggerService } from './LoggerService.ts';
import type { Provider } from '@nestjs/common';

//#region 文字列ベースでのinjection用(循環参照対応のため)
const $LoggerService: Provider = { provide: 'LoggerService', useExisting: LoggerService };
const $AccountMoveService: Provider = { provide: 'AccountMoveService', useExisting: AccountMoveService };
const $AccountUpdateService: Provider = { provide: 'AccountUpdateService', useExisting: AccountUpdateService };
const $AiService: Provider = { provide: 'AiService', useExisting: AiService };
const $AnnouncementService: Provider = { provide: 'AnnouncementService', useExisting: AnnouncementService };
const $AntennaService: Provider = { provide: 'AntennaService', useExisting: AntennaService };
const $AppLockService: Provider = { provide: 'AppLockService', useExisting: AppLockService };
const $AchievementService: Provider = { provide: 'AchievementService', useExisting: AchievementService };
const $AvatarDecorationService: Provider = { provide: 'AvatarDecorationService', useExisting: AvatarDecorationService };
const $CaptchaService: Provider = { provide: 'CaptchaService', useExisting: CaptchaService };
const $CreateSystemUserService: Provider = { provide: 'CreateSystemUserService', useExisting: CreateSystemUserService };
const $CustomEmojiService: Provider = { provide: 'CustomEmojiService', useExisting: CustomEmojiService };
const $DeleteAccountService: Provider = { provide: 'DeleteAccountService', useExisting: DeleteAccountService };
const $DownloadService: Provider = { provide: 'DownloadService', useExisting: DownloadService };
const $DriveService: Provider = { provide: 'DriveService', useExisting: DriveService };
const $EmailService: Provider = { provide: 'EmailService', useExisting: EmailService };
const $FederatedInstanceService: Provider = { provide: 'FederatedInstanceService', useExisting: FederatedInstanceService };
const $FetchInstanceMetadataService: Provider = { provide: 'FetchInstanceMetadataService', useExisting: FetchInstanceMetadataService };
const $GlobalEventService: Provider = { provide: 'GlobalEventService', useExisting: GlobalEventService };
const $HashtagService: Provider = { provide: 'HashtagService', useExisting: HashtagService };
const $HttpRequestService: Provider = { provide: 'HttpRequestService', useExisting: HttpRequestService };
const $IdService: Provider = { provide: 'IdService', useExisting: IdService };
const $ImageProcessingService: Provider = { provide: 'ImageProcessingService', useExisting: ImageProcessingService };
const $InstanceActorService: Provider = { provide: 'InstanceActorService', useExisting: InstanceActorService };
const $InternalStorageService: Provider = { provide: 'InternalStorageService', useExisting: InternalStorageService };
const $MetaService: Provider = { provide: 'MetaService', useExisting: MetaService };
const $MfmService: Provider = { provide: 'MfmService', useExisting: MfmService };
const $ModerationLogService: Provider = { provide: 'ModerationLogService', useExisting: ModerationLogService };
const $NoteCreateService: Provider = { provide: 'NoteCreateService', useExisting: NoteCreateService };
const $NoteDeleteService: Provider = { provide: 'NoteDeleteService', useExisting: NoteDeleteService };
const $NotePiningService: Provider = { provide: 'NotePiningService', useExisting: NotePiningService };
const $NoteReadService: Provider = { provide: 'NoteReadService', useExisting: NoteReadService };
const $NotificationService: Provider = { provide: 'NotificationService', useExisting: NotificationService };
const $PollService: Provider = { provide: 'PollService', useExisting: PollService };
const $ProxyAccountService: Provider = { provide: 'ProxyAccountService', useExisting: ProxyAccountService };
const $PushNotificationService: Provider = { provide: 'PushNotificationService', useExisting: PushNotificationService };
const $QueryService: Provider = { provide: 'QueryService', useExisting: QueryService };
const $ReactionService: Provider = { provide: 'ReactionService', useExisting: ReactionService };
const $RelayService: Provider = { provide: 'RelayService', useExisting: RelayService };
const $RoleService: Provider = { provide: 'RoleService', useExisting: RoleService };
const $S3Service: Provider = { provide: 'S3Service', useExisting: S3Service };
const $SignupService: Provider = { provide: 'SignupService', useExisting: SignupService };
const $WebAuthnService: Provider = { provide: 'WebAuthnService', useExisting: WebAuthnService };
const $UserBlockingService: Provider = { provide: 'UserBlockingService', useExisting: UserBlockingService };
const $CacheService: Provider = { provide: 'CacheService', useExisting: CacheService };
const $UserService: Provider = { provide: 'UserService', useExisting: UserService };
const $UserFollowingService: Provider = { provide: 'UserFollowingService', useExisting: UserFollowingService };
const $UserKeypairService: Provider = { provide: 'UserKeypairService', useExisting: UserKeypairService };
const $UserListService: Provider = { provide: 'UserListService', useExisting: UserListService };
const $UserMutingService: Provider = { provide: 'UserMutingService', useExisting: UserMutingService };
const $UserSuspendService: Provider = { provide: 'UserSuspendService', useExisting: UserSuspendService };
const $UserAuthService: Provider = { provide: 'UserAuthService', useExisting: UserAuthService };
const $VideoProcessingService: Provider = { provide: 'VideoProcessingService', useExisting: VideoProcessingService };
const $WebhookService: Provider = { provide: 'WebhookService', useExisting: WebhookService };
const $UtilityService: Provider = { provide: 'UtilityService', useExisting: UtilityService };
const $FileInfoService: Provider = { provide: 'FileInfoService', useExisting: FileInfoService };
const $SearchService: Provider = { provide: 'SearchService', useExisting: SearchService };
const $ClipService: Provider = { provide: 'ClipService', useExisting: ClipService };
const $FeaturedService: Provider = { provide: 'FeaturedService', useExisting: FeaturedService };
const $FanoutTimelineService: Provider = { provide: 'FanoutTimelineService', useExisting: FanoutTimelineService };
const $FanoutTimelineEndpointService: Provider = { provide: 'FanoutTimelineEndpointService', useExisting: FanoutTimelineEndpointService };
const $ChannelFollowingService: Provider = { provide: 'ChannelFollowingService', useExisting: ChannelFollowingService };
const $RegistryApiService: Provider = { provide: 'RegistryApiService', useExisting: RegistryApiService };

const $ChartLoggerService: Provider = { provide: 'ChartLoggerService', useExisting: ChartLoggerService };
const $FederationChart: Provider = { provide: 'FederationChart', useExisting: FederationChart };
const $NotesChart: Provider = { provide: 'NotesChart', useExisting: NotesChart };
const $UsersChart: Provider = { provide: 'UsersChart', useExisting: UsersChart };
const $ActiveUsersChart: Provider = { provide: 'ActiveUsersChart', useExisting: ActiveUsersChart };
const $InstanceChart: Provider = { provide: 'InstanceChart', useExisting: InstanceChart };
const $PerUserNotesChart: Provider = { provide: 'PerUserNotesChart', useExisting: PerUserNotesChart };
const $PerUserPvChart: Provider = { provide: 'PerUserPvChart', useExisting: PerUserPvChart };
const $DriveChart: Provider = { provide: 'DriveChart', useExisting: DriveChart };
const $PerUserReactionsChart: Provider = { provide: 'PerUserReactionsChart', useExisting: PerUserReactionsChart };
const $PerUserFollowingChart: Provider = { provide: 'PerUserFollowingChart', useExisting: PerUserFollowingChart };
const $PerUserDriveChart: Provider = { provide: 'PerUserDriveChart', useExisting: PerUserDriveChart };
const $ApRequestChart: Provider = { provide: 'ApRequestChart', useExisting: ApRequestChart };
const $ChartManagementService: Provider = { provide: 'ChartManagementService', useExisting: ChartManagementService };

const $AbuseUserReportEntityService: Provider = { provide: 'AbuseUserReportEntityService', useExisting: AbuseUserReportEntityService };
const $AntennaEntityService: Provider = { provide: 'AntennaEntityService', useExisting: AntennaEntityService };
const $AppEntityService: Provider = { provide: 'AppEntityService', useExisting: AppEntityService };
const $AuthSessionEntityService: Provider = { provide: 'AuthSessionEntityService', useExisting: AuthSessionEntityService };
const $BlockingEntityService: Provider = { provide: 'BlockingEntityService', useExisting: BlockingEntityService };
const $ChannelEntityService: Provider = { provide: 'ChannelEntityService', useExisting: ChannelEntityService };
const $ClipEntityService: Provider = { provide: 'ClipEntityService', useExisting: ClipEntityService };
const $DriveFileEntityService: Provider = { provide: 'DriveFileEntityService', useExisting: DriveFileEntityService };
const $DriveFolderEntityService: Provider = { provide: 'DriveFolderEntityService', useExisting: DriveFolderEntityService };
const $EmojiEntityService: Provider = { provide: 'EmojiEntityService', useExisting: EmojiEntityService };
const $FollowingEntityService: Provider = { provide: 'FollowingEntityService', useExisting: FollowingEntityService };
const $FollowRequestEntityService: Provider = { provide: 'FollowRequestEntityService', useExisting: FollowRequestEntityService };
const $GalleryLikeEntityService: Provider = { provide: 'GalleryLikeEntityService', useExisting: GalleryLikeEntityService };
const $GalleryPostEntityService: Provider = { provide: 'GalleryPostEntityService', useExisting: GalleryPostEntityService };
const $HashtagEntityService: Provider = { provide: 'HashtagEntityService', useExisting: HashtagEntityService };
const $InstanceEntityService: Provider = { provide: 'InstanceEntityService', useExisting: InstanceEntityService };
const $InviteCodeEntityService: Provider = { provide: 'InviteCodeEntityService', useExisting: InviteCodeEntityService };
const $ModerationLogEntityService: Provider = { provide: 'ModerationLogEntityService', useExisting: ModerationLogEntityService };
const $MutingEntityService: Provider = { provide: 'MutingEntityService', useExisting: MutingEntityService };
const $RenoteMutingEntityService: Provider = { provide: 'RenoteMutingEntityService', useExisting: RenoteMutingEntityService };
const $NoteEntityService: Provider = { provide: 'NoteEntityService', useExisting: NoteEntityService };
const $NoteFavoriteEntityService: Provider = { provide: 'NoteFavoriteEntityService', useExisting: NoteFavoriteEntityService };
const $NoteReactionEntityService: Provider = { provide: 'NoteReactionEntityService', useExisting: NoteReactionEntityService };
const $NotificationEntityService: Provider = { provide: 'NotificationEntityService', useExisting: NotificationEntityService };
const $PageEntityService: Provider = { provide: 'PageEntityService', useExisting: PageEntityService };
const $PageLikeEntityService: Provider = { provide: 'PageLikeEntityService', useExisting: PageLikeEntityService };
const $SigninEntityService: Provider = { provide: 'SigninEntityService', useExisting: SigninEntityService };
const $UserEntityService: Provider = { provide: 'UserEntityService', useExisting: UserEntityService };
const $UserListEntityService: Provider = { provide: 'UserListEntityService', useExisting: UserListEntityService };
const $FlashEntityService: Provider = { provide: 'FlashEntityService', useExisting: FlashEntityService };
const $FlashLikeEntityService: Provider = { provide: 'FlashLikeEntityService', useExisting: FlashLikeEntityService };
const $RoleEntityService: Provider = { provide: 'RoleEntityService', useExisting: RoleEntityService };

const $ApAudienceService: Provider = { provide: 'ApAudienceService', useExisting: ApAudienceService };
const $ApDbResolverService: Provider = { provide: 'ApDbResolverService', useExisting: ApDbResolverService };
const $ApDeliverManagerService: Provider = { provide: 'ApDeliverManagerService', useExisting: ApDeliverManagerService };
const $ApInboxService: Provider = { provide: 'ApInboxService', useExisting: ApInboxService };
const $ApLoggerService: Provider = { provide: 'ApLoggerService', useExisting: ApLoggerService };
const $ApMfmService: Provider = { provide: 'ApMfmService', useExisting: ApMfmService };
const $ApRendererService: Provider = { provide: 'ApRendererService', useExisting: ApRendererService };
const $ApRequestService: Provider = { provide: 'ApRequestService', useExisting: ApRequestService };
const $ApResolverService: Provider = { provide: 'ApResolverService', useExisting: ApResolverService };
const $LdSignatureService: Provider = { provide: 'LdSignatureService', useExisting: LdSignatureService };
const $RemoteLoggerService: Provider = { provide: 'RemoteLoggerService', useExisting: RemoteLoggerService };
const $RemoteUserResolveService: Provider = { provide: 'RemoteUserResolveService', useExisting: RemoteUserResolveService };
const $WebfingerService: Provider = { provide: 'WebfingerService', useExisting: WebfingerService };
const $ApImageService: Provider = { provide: 'ApImageService', useExisting: ApImageService };
const $ApMentionService: Provider = { provide: 'ApMentionService', useExisting: ApMentionService };
const $ApNoteService: Provider = { provide: 'ApNoteService', useExisting: ApNoteService };
const $ApPersonService: Provider = { provide: 'ApPersonService', useExisting: ApPersonService };
const $ApQuestionService: Provider = { provide: 'ApQuestionService', useExisting: ApQuestionService };
//#endregion

@Module({
	imports: [
		QueueModule,
	],
	providers: [
		LoggerService,
		AccountMoveService,
		AccountUpdateService,
		AiService,
		AnnouncementService,
		AntennaService,
		AppLockService,
		AchievementService,
		AvatarDecorationService,
		CaptchaService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		RoleService,
		S3Service,
		SignupService,
		WebAuthnService,
		UserBlockingService,
		CacheService,
		UserService,
		UserFollowingService,
		UserKeypairService,
		UserListService,
		UserMutingService,
		UserSuspendService,
		UserAuthService,
		VideoProcessingService,
		WebhookService,
		UtilityService,
		FileInfoService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		RegistryApiService,
		ChartLoggerService,
		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		PerUserPvChart,
		DriveChart,
		PerUserReactionsChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,
		AbuseUserReportEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
		RoleEntityService,
		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		LdSignatureService,
		RemoteLoggerService,
		RemoteUserResolveService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AccountMoveService,
		$AccountUpdateService,
		$AiService,
		$AnnouncementService,
		$AntennaService,
		$AppLockService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$WebhookService,
		$UtilityService,
		$FileInfoService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$RegistryApiService,
		$ChartLoggerService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,
		$AbuseUserReportEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$LdSignatureService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
	exports: [
		QueueModule,
		LoggerService,
		AccountMoveService,
		AccountUpdateService,
		AiService,
		AnnouncementService,
		AntennaService,
		AppLockService,
		AchievementService,
		AvatarDecorationService,
		CaptchaService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		RoleService,
		S3Service,
		SignupService,
		WebAuthnService,
		UserBlockingService,
		CacheService,
		UserService,
		UserFollowingService,
		UserKeypairService,
		UserListService,
		UserMutingService,
		UserSuspendService,
		UserAuthService,
		VideoProcessingService,
		WebhookService,
		UtilityService,
		FileInfoService,
		SearchService,
		ClipService,
		FeaturedService,
		FanoutTimelineService,
		FanoutTimelineEndpointService,
		ChannelFollowingService,
		RegistryApiService,
		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		PerUserPvChart,
		DriveChart,
		PerUserReactionsChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,
		AbuseUserReportEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		InviteCodeEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		RenoteMutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserListEntityService,
		FlashEntityService,
		FlashLikeEntityService,
		RoleEntityService,
		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		LdSignatureService,
		RemoteLoggerService,
		RemoteUserResolveService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AccountMoveService,
		$AccountUpdateService,
		$AiService,
		$AnnouncementService,
		$AntennaService,
		$AppLockService,
		$AchievementService,
		$AvatarDecorationService,
		$CaptchaService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$RoleService,
		$S3Service,
		$SignupService,
		$WebAuthnService,
		$UserBlockingService,
		$CacheService,
		$UserService,
		$UserFollowingService,
		$UserKeypairService,
		$UserListService,
		$UserMutingService,
		$UserSuspendService,
		$UserAuthService,
		$VideoProcessingService,
		$WebhookService,
		$UtilityService,
		$FileInfoService,
		$SearchService,
		$ClipService,
		$FeaturedService,
		$FanoutTimelineService,
		$FanoutTimelineEndpointService,
		$ChannelFollowingService,
		$RegistryApiService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$PerUserPvChart,
		$DriveChart,
		$PerUserReactionsChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,
		$AbuseUserReportEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$InviteCodeEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$RenoteMutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserListEntityService,
		$FlashEntityService,
		$FlashLikeEntityService,
		$RoleEntityService,
		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$LdSignatureService,
		$RemoteLoggerService,
		$RemoteUserResolveService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
})
export class CoreModule { }
