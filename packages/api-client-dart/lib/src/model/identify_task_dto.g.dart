// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'identify_task_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$IdentifyTaskDto extends IdentifyTaskDto {
  @override
  final String id;
  @override
  final String courseId;
  @override
  final IdentifyTaskStatus status;
  @override
  final String source_;
  @override
  final String? sourceUrl;
  @override
  final ScrapedCourseFragmentDto scrapedFragment;
  @override
  final MergePolicyDto mergePolicy;
  @override
  final DateTime createdAt;
  @override
  final DateTime? completedAt;

  factory _$IdentifyTaskDto([void Function(IdentifyTaskDtoBuilder)? updates]) =>
      (IdentifyTaskDtoBuilder()..update(updates))._build();

  _$IdentifyTaskDto._({
    required this.id,
    required this.courseId,
    required this.status,
    required this.source_,
    this.sourceUrl,
    required this.scrapedFragment,
    required this.mergePolicy,
    required this.createdAt,
    this.completedAt,
  }) : super._();
  @override
  IdentifyTaskDto rebuild(void Function(IdentifyTaskDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  IdentifyTaskDtoBuilder toBuilder() => IdentifyTaskDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is IdentifyTaskDto &&
        id == other.id &&
        courseId == other.courseId &&
        status == other.status &&
        source_ == other.source_ &&
        sourceUrl == other.sourceUrl &&
        scrapedFragment == other.scrapedFragment &&
        mergePolicy == other.mergePolicy &&
        createdAt == other.createdAt &&
        completedAt == other.completedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceUrl.hashCode);
    _$hash = $jc(_$hash, scrapedFragment.hashCode);
    _$hash = $jc(_$hash, mergePolicy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'IdentifyTaskDto')
          ..add('id', id)
          ..add('courseId', courseId)
          ..add('status', status)
          ..add('source_', source_)
          ..add('sourceUrl', sourceUrl)
          ..add('scrapedFragment', scrapedFragment)
          ..add('mergePolicy', mergePolicy)
          ..add('createdAt', createdAt)
          ..add('completedAt', completedAt))
        .toString();
  }
}

class IdentifyTaskDtoBuilder
    implements Builder<IdentifyTaskDto, IdentifyTaskDtoBuilder> {
  _$IdentifyTaskDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  IdentifyTaskStatus? _status;
  IdentifyTaskStatus? get status => _$this._status;
  set status(IdentifyTaskStatus? status) => _$this._status = status;

  String? _source_;
  String? get source_ => _$this._source_;
  set source_(String? source_) => _$this._source_ = source_;

  String? _sourceUrl;
  String? get sourceUrl => _$this._sourceUrl;
  set sourceUrl(String? sourceUrl) => _$this._sourceUrl = sourceUrl;

  ScrapedCourseFragmentDtoBuilder? _scrapedFragment;
  ScrapedCourseFragmentDtoBuilder get scrapedFragment =>
      _$this._scrapedFragment ??= ScrapedCourseFragmentDtoBuilder();
  set scrapedFragment(ScrapedCourseFragmentDtoBuilder? scrapedFragment) =>
      _$this._scrapedFragment = scrapedFragment;

  MergePolicyDtoBuilder? _mergePolicy;
  MergePolicyDtoBuilder get mergePolicy =>
      _$this._mergePolicy ??= MergePolicyDtoBuilder();
  set mergePolicy(MergePolicyDtoBuilder? mergePolicy) =>
      _$this._mergePolicy = mergePolicy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _completedAt;
  DateTime? get completedAt => _$this._completedAt;
  set completedAt(DateTime? completedAt) => _$this._completedAt = completedAt;

  IdentifyTaskDtoBuilder() {
    IdentifyTaskDto._defaults(this);
  }

  IdentifyTaskDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _courseId = $v.courseId;
      _status = $v.status;
      _source_ = $v.source_;
      _sourceUrl = $v.sourceUrl;
      _scrapedFragment = $v.scrapedFragment.toBuilder();
      _mergePolicy = $v.mergePolicy.toBuilder();
      _createdAt = $v.createdAt;
      _completedAt = $v.completedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(IdentifyTaskDto other) {
    _$v = other as _$IdentifyTaskDto;
  }

  @override
  void update(void Function(IdentifyTaskDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  IdentifyTaskDto build() => _build();

  _$IdentifyTaskDto _build() {
    _$IdentifyTaskDto _$result;
    try {
      _$result =
          _$v ??
          _$IdentifyTaskDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'IdentifyTaskDto',
              'id',
            ),
            courseId: BuiltValueNullFieldError.checkNotNull(
              courseId,
              r'IdentifyTaskDto',
              'courseId',
            ),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'IdentifyTaskDto',
              'status',
            ),
            source_: BuiltValueNullFieldError.checkNotNull(
              source_,
              r'IdentifyTaskDto',
              'source_',
            ),
            sourceUrl: sourceUrl,
            scrapedFragment: scrapedFragment.build(),
            mergePolicy: mergePolicy.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'IdentifyTaskDto',
              'createdAt',
            ),
            completedAt: completedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'scrapedFragment';
        scrapedFragment.build();
        _$failedField = 'mergePolicy';
        mergePolicy.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'IdentifyTaskDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
