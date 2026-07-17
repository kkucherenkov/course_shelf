// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_download_estimate_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseDownloadEstimateDto extends CourseDownloadEstimateDto {
  @override
  final String courseId;
  @override
  final int totalBytes;
  @override
  final int lessonCount;

  factory _$CourseDownloadEstimateDto([
    void Function(CourseDownloadEstimateDtoBuilder)? updates,
  ]) => (CourseDownloadEstimateDtoBuilder()..update(updates))._build();

  _$CourseDownloadEstimateDto._({
    required this.courseId,
    required this.totalBytes,
    required this.lessonCount,
  }) : super._();
  @override
  CourseDownloadEstimateDto rebuild(
    void Function(CourseDownloadEstimateDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  CourseDownloadEstimateDtoBuilder toBuilder() =>
      CourseDownloadEstimateDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseDownloadEstimateDto &&
        courseId == other.courseId &&
        totalBytes == other.totalBytes &&
        lessonCount == other.lessonCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, totalBytes.hashCode);
    _$hash = $jc(_$hash, lessonCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseDownloadEstimateDto')
          ..add('courseId', courseId)
          ..add('totalBytes', totalBytes)
          ..add('lessonCount', lessonCount))
        .toString();
  }
}

class CourseDownloadEstimateDtoBuilder
    implements
        Builder<CourseDownloadEstimateDto, CourseDownloadEstimateDtoBuilder> {
  _$CourseDownloadEstimateDto? _$v;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  int? _totalBytes;
  int? get totalBytes => _$this._totalBytes;
  set totalBytes(int? totalBytes) => _$this._totalBytes = totalBytes;

  int? _lessonCount;
  int? get lessonCount => _$this._lessonCount;
  set lessonCount(int? lessonCount) => _$this._lessonCount = lessonCount;

  CourseDownloadEstimateDtoBuilder() {
    CourseDownloadEstimateDto._defaults(this);
  }

  CourseDownloadEstimateDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _courseId = $v.courseId;
      _totalBytes = $v.totalBytes;
      _lessonCount = $v.lessonCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseDownloadEstimateDto other) {
    _$v = other as _$CourseDownloadEstimateDto;
  }

  @override
  void update(void Function(CourseDownloadEstimateDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseDownloadEstimateDto build() => _build();

  _$CourseDownloadEstimateDto _build() {
    final _$result =
        _$v ??
        _$CourseDownloadEstimateDto._(
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'CourseDownloadEstimateDto',
            'courseId',
          ),
          totalBytes: BuiltValueNullFieldError.checkNotNull(
            totalBytes,
            r'CourseDownloadEstimateDto',
            'totalBytes',
          ),
          lessonCount: BuiltValueNullFieldError.checkNotNull(
            lessonCount,
            r'CourseDownloadEstimateDto',
            'lessonCount',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
