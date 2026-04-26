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
import 'package:app_api_client/src/model/course_dto.dart';
import 'package:app_api_client/src/model/course_list_dto.dart';
import 'package:app_api_client/src/model/course_progress.dart';
import 'package:app_api_client/src/model/course_target.dart';
import 'package:app_api_client/src/model/dependency_status.dart';
import 'package:app_api_client/src/model/grant_level.dart';
import 'package:app_api_client/src/model/grant_target.dart';
import 'package:app_api_client/src/model/health_status.dart';
import 'package:app_api_client/src/model/health_status_dependencies.dart';
import 'package:app_api_client/src/model/lesson_dto.dart';
import 'package:app_api_client/src/model/lesson_progress.dart';
import 'package:app_api_client/src/model/library_dto.dart';
import 'package:app_api_client/src/model/library_list_dto.dart';
import 'package:app_api_client/src/model/library_target.dart';
import 'package:app_api_client/src/model/material_dto.dart';
import 'package:app_api_client/src/model/material_kind.dart';
import 'package:app_api_client/src/model/model0.dart';
import 'package:app_api_client/src/model/model1.dart';
import 'package:app_api_client/src/model/problem.dart';
import 'package:app_api_client/src/model/realtime_token.dart';
import 'package:app_api_client/src/model/register_grant_request.dart';
import 'package:app_api_client/src/model/register_library_request.dart';
import 'package:app_api_client/src/model/scan_dto.dart';
import 'package:app_api_client/src/model/scan_error.dart';
import 'package:app_api_client/src/model/scan_status.dart';
import 'package:app_api_client/src/model/section_dto.dart';
import 'package:app_api_client/src/model/subtitle_dto.dart';
import 'package:app_api_client/src/model/update_course_request.dart';

part 'serializers.g.dart';

@SerializersFor([
  AccessGrantDto,
  AccessGrantListDto,
  CourseDto,
  CourseListDto,
  CourseProgress,
  CourseTarget,
  DependencyStatus,
  GrantLevel,
  GrantTarget,
  HealthStatus,
  HealthStatusDependencies,
  LessonDto,
  LessonProgress,
  LibraryDto,
  LibraryListDto,
  LibraryTarget,
  MaterialDto,
  MaterialKind,
  Model0,
  Model1,
  Problem,
  RealtimeToken,
  RegisterGrantRequest,
  RegisterLibraryRequest,
  ScanDto,
  ScanError,
  ScanStatus,
  SectionDto,
  SubtitleDto,
  UpdateCourseRequest,
])
Serializers serializers = (_$serializers.toBuilder()
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer())
    ).build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
