//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

import 'package:one_of_serializer/any_of_serializer.dart';
import 'package:one_of_serializer/one_of_serializer.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:app_api_client/src/date_serializer.dart';
import 'package:app_api_client/src/model/date.dart';

import 'package:app_api_client/src/model/access_grant_dto.dart';
import 'package:app_api_client/src/model/access_grant_list_dto.dart';
import 'package:app_api_client/src/model/admin_dashboard_dto.dart';
import 'package:app_api_client/src/model/admin_dashboard_dto_counts.dart';
import 'package:app_api_client/src/model/admin_dashboard_latest_scan.dart';
import 'package:app_api_client/src/model/admin_library_list_dto.dart';
import 'package:app_api_client/src/model/admin_library_list_item.dart';
import 'package:app_api_client/src/model/admin_library_list_item_scan.dart';
import 'package:app_api_client/src/model/admin_scan_list_dto.dart';
import 'package:app_api_client/src/model/admin_scan_list_item.dart';
import 'package:app_api_client/src/model/admin_update_user_request.dart';
import 'package:app_api_client/src/model/admin_user_list_dto.dart';
import 'package:app_api_client/src/model/admin_user_list_item.dart';
import 'package:app_api_client/src/model/admin_user_role.dart';
import 'package:app_api_client/src/model/backfill_job_accepted.dart';
import 'package:app_api_client/src/model/backfill_metadata_request.dart';
import 'package:app_api_client/src/model/batch_progress_item_accepted.dart';
import 'package:app_api_client/src/model/batch_progress_item_forbidden.dart';
import 'package:app_api_client/src/model/batch_progress_item_result.dart';
import 'package:app_api_client/src/model/batch_progress_item_stale.dart';
import 'package:app_api_client/src/model/batch_progress_request.dart';
import 'package:app_api_client/src/model/batch_progress_response.dart';
import 'package:app_api_client/src/model/bookmark_dto.dart';
import 'package:app_api_client/src/model/bookmark_list_dto.dart';
import 'package:app_api_client/src/model/continue_watching_dto.dart';
import 'package:app_api_client/src/model/continue_watching_item.dart';
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:app_api_client/src/model/course_level.dart';
import 'package:app_api_client/src/model/course_list_dto.dart';
import 'package:app_api_client/src/model/course_material_item.dart';
import 'package:app_api_client/src/model/course_outline_dto.dart';
import 'package:app_api_client/src/model/course_outline_summary.dart';
import 'package:app_api_client/src/model/course_progress.dart';
import 'package:app_api_client/src/model/course_target.dart';
import 'package:app_api_client/src/model/create_bookmark_request.dart';
import 'package:app_api_client/src/model/date_range.dart';
import 'package:app_api_client/src/model/dependency_status.dart';
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:app_api_client/src/model/grant_level.dart';
import 'package:app_api_client/src/model/grant_target.dart';
import 'package:app_api_client/src/model/has_users_response.dart';
import 'package:app_api_client/src/model/health_status.dart';
import 'package:app_api_client/src/model/health_status_dependencies.dart';
import 'package:app_api_client/src/model/instance_config_dto.dart';
import 'package:app_api_client/src/model/instructor_detail_dto.dart';
import 'package:app_api_client/src/model/instructor_dto.dart';
import 'package:app_api_client/src/model/instructor_list_dto.dart';
import 'package:app_api_client/src/model/instructor_ref.dart';
import 'package:app_api_client/src/model/lesson_dto.dart';
import 'package:app_api_client/src/model/lesson_outline_item.dart';
import 'package:app_api_client/src/model/lesson_progress.dart';
import 'package:app_api_client/src/model/lesson_progress_dto.dart';
import 'package:app_api_client/src/model/library_dto.dart';
import 'package:app_api_client/src/model/library_list_dto.dart';
import 'package:app_api_client/src/model/library_target.dart';
import 'package:app_api_client/src/model/material_download_url_dto.dart';
import 'package:app_api_client/src/model/material_dto.dart';
import 'package:app_api_client/src/model/material_kind.dart';
import 'package:app_api_client/src/model/me_dto.dart';
import 'package:app_api_client/src/model/model0.dart';
import 'package:app_api_client/src/model/model1.dart';
import 'package:app_api_client/src/model/note_dto.dart';
import 'package:app_api_client/src/model/ping_response.dart';
import 'package:app_api_client/src/model/problem.dart';
import 'package:app_api_client/src/model/realtime_token.dart';
import 'package:app_api_client/src/model/recently_added_dto.dart';
import 'package:app_api_client/src/model/recently_added_item.dart';
import 'package:app_api_client/src/model/recently_completed_dto.dart';
import 'package:app_api_client/src/model/recently_completed_item.dart';
import 'package:app_api_client/src/model/record_progress_request.dart';
import 'package:app_api_client/src/model/register_grant_request.dart';
import 'package:app_api_client/src/model/register_library_request.dart';
import 'package:app_api_client/src/model/scan_dto.dart';
import 'package:app_api_client/src/model/scan_error.dart';
import 'package:app_api_client/src/model/scan_status.dart';
import 'package:app_api_client/src/model/scrape_candidate_dto.dart';
import 'package:app_api_client/src/model/scrape_preview_request.dart';
import 'package:app_api_client/src/model/scrape_preview_response.dart';
import 'package:app_api_client/src/model/scraped_course_fragment_dto.dart';
import 'package:app_api_client/src/model/scraper_info_dto.dart';
import 'package:app_api_client/src/model/scraper_kind.dart';
import 'package:app_api_client/src/model/scraper_list_dto.dart';
import 'package:app_api_client/src/model/search_course_hit.dart';
import 'package:app_api_client/src/model/search_lesson_hit.dart';
import 'package:app_api_client/src/model/search_result_dto.dart';
import 'package:app_api_client/src/model/section_dto.dart';
import 'package:app_api_client/src/model/section_outline.dart';
import 'package:app_api_client/src/model/sso_provider_config.dart';
import 'package:app_api_client/src/model/stream_url_dto.dart';
import 'package:app_api_client/src/model/studio_detail_dto.dart';
import 'package:app_api_client/src/model/studio_dto.dart';
import 'package:app_api_client/src/model/studio_list_dto.dart';
import 'package:app_api_client/src/model/studio_ref.dart';
import 'package:app_api_client/src/model/subtitle_dto.dart';
import 'package:app_api_client/src/model/tag_detail_dto.dart';
import 'package:app_api_client/src/model/tag_dto.dart';
import 'package:app_api_client/src/model/tag_list_dto.dart';
import 'package:app_api_client/src/model/tag_ref.dart';
import 'package:app_api_client/src/model/update_bookmark_request.dart';
import 'package:app_api_client/src/model/update_course_request.dart';
import 'package:app_api_client/src/model/update_library_request.dart';
import 'package:app_api_client/src/model/update_me_request.dart';
import 'package:app_api_client/src/model/upsert_instructor_request.dart';
import 'package:app_api_client/src/model/upsert_note_request.dart';
import 'package:app_api_client/src/model/upsert_studio_request.dart';
import 'package:app_api_client/src/model/upsert_tag_request.dart';
import 'package:app_api_client/src/model/your_week_dto.dart';

part 'serializers.g.dart';

@SerializersFor([
  AccessGrantDto,
  AccessGrantListDto,
  AdminDashboardDto,
  AdminDashboardDtoCounts,
  AdminDashboardLatestScan,
  AdminLibraryListDto,
  AdminLibraryListItem,
  AdminLibraryListItemScan,
  AdminScanListDto,
  AdminScanListItem,
  AdminUpdateUserRequest,
  AdminUserListDto,
  AdminUserListItem,
  AdminUserRole,
  BackfillJobAccepted,
  BackfillMetadataRequest,
  BatchProgressItemAccepted,
  BatchProgressItemForbidden,
  BatchProgressItemResult,
  BatchProgressItemStale,
  BatchProgressRequest,
  BatchProgressResponse,
  BookmarkDto,
  BookmarkListDto,
  ContinueWatchingDto,
  ContinueWatchingItem,
  CourseDto,
  CourseLevel,
  CourseListDto,
  CourseMaterialItem,
  CourseOutlineDto,
  CourseOutlineSummary,
  CourseProgress,
  CourseTarget,
  CreateBookmarkRequest,
  DateRange,
  DependencyStatus,
  ExternalIdRef,
  GrantLevel,
  GrantTarget,
  HasUsersResponse,
  HealthStatus,
  HealthStatusDependencies,
  InstanceConfigDto,
  InstructorDetailDto,
  InstructorDto,
  InstructorListDto,
  InstructorRef,
  LessonDto,
  LessonOutlineItem,
  LessonProgress,
  LessonProgressDto,
  LibraryDto,
  LibraryListDto,
  LibraryTarget,
  MaterialDownloadUrlDto,
  MaterialDto,
  MaterialKind,
  MeDto,
  Model0,
  Model1,
  NoteDto,
  PingResponse,
  Problem,
  RealtimeToken,
  RecentlyAddedDto,
  RecentlyAddedItem,
  RecentlyCompletedDto,
  RecentlyCompletedItem,
  RecordProgressRequest,
  RegisterGrantRequest,
  RegisterLibraryRequest,
  ScanDto,
  ScanError,
  ScanStatus,
  ScrapeCandidateDto,
  ScrapePreviewRequest,
  ScrapePreviewResponse,
  ScrapedCourseFragmentDto,
  ScraperInfoDto,
  ScraperKind,
  ScraperListDto,
  SearchCourseHit,
  SearchLessonHit,
  SearchResultDto,
  SectionDto,
  SectionOutline,
  SsoProviderConfig,
  StreamUrlDto,
  StudioDetailDto,
  StudioDto,
  StudioListDto,
  StudioRef,
  SubtitleDto,
  TagDetailDto,
  TagDto,
  TagListDto,
  TagRef,
  UpdateBookmarkRequest,
  UpdateCourseRequest,
  UpdateLibraryRequest,
  UpdateMeRequest,
  UpsertInstructorRequest,
  UpsertNoteRequest,
  UpsertStudioRequest,
  UpsertTagRequest,
  YourWeekDto,
])
Serializers serializers = (_$serializers.toBuilder()
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer())
    ).build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
