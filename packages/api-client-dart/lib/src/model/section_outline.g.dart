// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'section_outline.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SectionOutline extends SectionOutline {
  @override
  final String id;
  @override
  final int position;
  @override
  final String title;
  @override
  final int totalDurationSeconds;
  @override
  final BuiltList<LessonOutlineItem> lessons;

  factory _$SectionOutline([void Function(SectionOutlineBuilder)? updates]) =>
      (SectionOutlineBuilder()..update(updates))._build();

  _$SectionOutline._({
    required this.id,
    required this.position,
    required this.title,
    required this.totalDurationSeconds,
    required this.lessons,
  }) : super._();
  @override
  SectionOutline rebuild(void Function(SectionOutlineBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SectionOutlineBuilder toBuilder() => SectionOutlineBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SectionOutline &&
        id == other.id &&
        position == other.position &&
        title == other.title &&
        totalDurationSeconds == other.totalDurationSeconds &&
        lessons == other.lessons;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, totalDurationSeconds.hashCode);
    _$hash = $jc(_$hash, lessons.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SectionOutline')
          ..add('id', id)
          ..add('position', position)
          ..add('title', title)
          ..add('totalDurationSeconds', totalDurationSeconds)
          ..add('lessons', lessons))
        .toString();
  }
}

class SectionOutlineBuilder
    implements Builder<SectionOutline, SectionOutlineBuilder> {
  _$SectionOutline? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  int? _totalDurationSeconds;
  int? get totalDurationSeconds => _$this._totalDurationSeconds;
  set totalDurationSeconds(int? totalDurationSeconds) =>
      _$this._totalDurationSeconds = totalDurationSeconds;

  ListBuilder<LessonOutlineItem>? _lessons;
  ListBuilder<LessonOutlineItem> get lessons =>
      _$this._lessons ??= ListBuilder<LessonOutlineItem>();
  set lessons(ListBuilder<LessonOutlineItem>? lessons) =>
      _$this._lessons = lessons;

  SectionOutlineBuilder() {
    SectionOutline._defaults(this);
  }

  SectionOutlineBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _position = $v.position;
      _title = $v.title;
      _totalDurationSeconds = $v.totalDurationSeconds;
      _lessons = $v.lessons.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SectionOutline other) {
    _$v = other as _$SectionOutline;
  }

  @override
  void update(void Function(SectionOutlineBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SectionOutline build() => _build();

  _$SectionOutline _build() {
    _$SectionOutline _$result;
    try {
      _$result =
          _$v ??
          _$SectionOutline._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'SectionOutline',
              'id',
            ),
            position: BuiltValueNullFieldError.checkNotNull(
              position,
              r'SectionOutline',
              'position',
            ),
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'SectionOutline',
              'title',
            ),
            totalDurationSeconds: BuiltValueNullFieldError.checkNotNull(
              totalDurationSeconds,
              r'SectionOutline',
              'totalDurationSeconds',
            ),
            lessons: lessons.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'lessons';
        lessons.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'SectionOutline',
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
