// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LessonDto extends LessonDto {
  @override
  final String id;
  @override
  final String courseId;
  @override
  final String sectionId;
  @override
  final int position;
  @override
  final String title;
  @override
  final int? durationSeconds;
  @override
  final BuiltList<MaterialDto> materials;
  @override
  final BuiltList<SubtitleDto> subtitles;
  @override
  final LessonProgress progress;

  factory _$LessonDto([void Function(LessonDtoBuilder)? updates]) =>
      (LessonDtoBuilder()..update(updates))._build();

  _$LessonDto._({
    required this.id,
    required this.courseId,
    required this.sectionId,
    required this.position,
    required this.title,
    this.durationSeconds,
    required this.materials,
    required this.subtitles,
    required this.progress,
  }) : super._();
  @override
  LessonDto rebuild(void Function(LessonDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LessonDtoBuilder toBuilder() => LessonDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LessonDto &&
        id == other.id &&
        courseId == other.courseId &&
        sectionId == other.sectionId &&
        position == other.position &&
        title == other.title &&
        durationSeconds == other.durationSeconds &&
        materials == other.materials &&
        subtitles == other.subtitles &&
        progress == other.progress;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, sectionId.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, durationSeconds.hashCode);
    _$hash = $jc(_$hash, materials.hashCode);
    _$hash = $jc(_$hash, subtitles.hashCode);
    _$hash = $jc(_$hash, progress.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LessonDto')
          ..add('id', id)
          ..add('courseId', courseId)
          ..add('sectionId', sectionId)
          ..add('position', position)
          ..add('title', title)
          ..add('durationSeconds', durationSeconds)
          ..add('materials', materials)
          ..add('subtitles', subtitles)
          ..add('progress', progress))
        .toString();
  }
}

class LessonDtoBuilder implements Builder<LessonDto, LessonDtoBuilder> {
  _$LessonDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _sectionId;
  String? get sectionId => _$this._sectionId;
  set sectionId(String? sectionId) => _$this._sectionId = sectionId;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  int? _durationSeconds;
  int? get durationSeconds => _$this._durationSeconds;
  set durationSeconds(int? durationSeconds) =>
      _$this._durationSeconds = durationSeconds;

  ListBuilder<MaterialDto>? _materials;
  ListBuilder<MaterialDto> get materials =>
      _$this._materials ??= ListBuilder<MaterialDto>();
  set materials(ListBuilder<MaterialDto>? materials) =>
      _$this._materials = materials;

  ListBuilder<SubtitleDto>? _subtitles;
  ListBuilder<SubtitleDto> get subtitles =>
      _$this._subtitles ??= ListBuilder<SubtitleDto>();
  set subtitles(ListBuilder<SubtitleDto>? subtitles) =>
      _$this._subtitles = subtitles;

  LessonProgressBuilder? _progress;
  LessonProgressBuilder get progress =>
      _$this._progress ??= LessonProgressBuilder();
  set progress(LessonProgressBuilder? progress) => _$this._progress = progress;

  LessonDtoBuilder() {
    LessonDto._defaults(this);
  }

  LessonDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _courseId = $v.courseId;
      _sectionId = $v.sectionId;
      _position = $v.position;
      _title = $v.title;
      _durationSeconds = $v.durationSeconds;
      _materials = $v.materials.toBuilder();
      _subtitles = $v.subtitles.toBuilder();
      _progress = $v.progress.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LessonDto other) {
    _$v = other as _$LessonDto;
  }

  @override
  void update(void Function(LessonDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LessonDto build() => _build();

  _$LessonDto _build() {
    _$LessonDto _$result;
    try {
      _$result =
          _$v ??
          _$LessonDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'LessonDto', 'id'),
            courseId: BuiltValueNullFieldError.checkNotNull(
              courseId,
              r'LessonDto',
              'courseId',
            ),
            sectionId: BuiltValueNullFieldError.checkNotNull(
              sectionId,
              r'LessonDto',
              'sectionId',
            ),
            position: BuiltValueNullFieldError.checkNotNull(
              position,
              r'LessonDto',
              'position',
            ),
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'LessonDto',
              'title',
            ),
            durationSeconds: durationSeconds,
            materials: materials.build(),
            subtitles: subtitles.build(),
            progress: progress.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'materials';
        materials.build();
        _$failedField = 'subtitles';
        subtitles.build();
        _$failedField = 'progress';
        progress.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'LessonDto',
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
