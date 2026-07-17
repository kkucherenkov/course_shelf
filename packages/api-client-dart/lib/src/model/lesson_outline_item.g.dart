// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson_outline_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LessonOutlineItemStateEnum _$lessonOutlineItemStateEnum_notStarted =
    const LessonOutlineItemStateEnum._('notStarted');
const LessonOutlineItemStateEnum _$lessonOutlineItemStateEnum_inProgress =
    const LessonOutlineItemStateEnum._('inProgress');
const LessonOutlineItemStateEnum _$lessonOutlineItemStateEnum_completed =
    const LessonOutlineItemStateEnum._('completed');
const LessonOutlineItemStateEnum _$lessonOutlineItemStateEnum_locked =
    const LessonOutlineItemStateEnum._('locked');

LessonOutlineItemStateEnum _$lessonOutlineItemStateEnumValueOf(String name) {
  switch (name) {
    case 'notStarted':
      return _$lessonOutlineItemStateEnum_notStarted;
    case 'inProgress':
      return _$lessonOutlineItemStateEnum_inProgress;
    case 'completed':
      return _$lessonOutlineItemStateEnum_completed;
    case 'locked':
      return _$lessonOutlineItemStateEnum_locked;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LessonOutlineItemStateEnum> _$lessonOutlineItemStateEnumValues =
    BuiltSet<LessonOutlineItemStateEnum>(const <LessonOutlineItemStateEnum>[
      _$lessonOutlineItemStateEnum_notStarted,
      _$lessonOutlineItemStateEnum_inProgress,
      _$lessonOutlineItemStateEnum_completed,
      _$lessonOutlineItemStateEnum_locked,
    ]);

Serializer<LessonOutlineItemStateEnum> _$lessonOutlineItemStateEnumSerializer =
    _$LessonOutlineItemStateEnumSerializer();

class _$LessonOutlineItemStateEnumSerializer
    implements PrimitiveSerializer<LessonOutlineItemStateEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'notStarted': 'not-started',
    'inProgress': 'in-progress',
    'completed': 'completed',
    'locked': 'locked',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'not-started': 'notStarted',
    'in-progress': 'inProgress',
    'completed': 'completed',
    'locked': 'locked',
  };

  @override
  final Iterable<Type> types = const <Type>[LessonOutlineItemStateEnum];
  @override
  final String wireName = 'LessonOutlineItemStateEnum';

  @override
  Object serialize(
    Serializers serializers,
    LessonOutlineItemStateEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  LessonOutlineItemStateEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => LessonOutlineItemStateEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$LessonOutlineItem extends LessonOutlineItem {
  @override
  final String id;
  @override
  final int position;
  @override
  final String title;
  @override
  final int durationSeconds;
  @override
  final bool hasMaterials;
  @override
  final LessonOutlineItemStateEnum state;
  @override
  final int progressPercent;

  factory _$LessonOutlineItem([
    void Function(LessonOutlineItemBuilder)? updates,
  ]) => (LessonOutlineItemBuilder()..update(updates))._build();

  _$LessonOutlineItem._({
    required this.id,
    required this.position,
    required this.title,
    required this.durationSeconds,
    required this.hasMaterials,
    required this.state,
    required this.progressPercent,
  }) : super._();
  @override
  LessonOutlineItem rebuild(void Function(LessonOutlineItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LessonOutlineItemBuilder toBuilder() =>
      LessonOutlineItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LessonOutlineItem &&
        id == other.id &&
        position == other.position &&
        title == other.title &&
        durationSeconds == other.durationSeconds &&
        hasMaterials == other.hasMaterials &&
        state == other.state &&
        progressPercent == other.progressPercent;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, durationSeconds.hashCode);
    _$hash = $jc(_$hash, hasMaterials.hashCode);
    _$hash = $jc(_$hash, state.hashCode);
    _$hash = $jc(_$hash, progressPercent.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LessonOutlineItem')
          ..add('id', id)
          ..add('position', position)
          ..add('title', title)
          ..add('durationSeconds', durationSeconds)
          ..add('hasMaterials', hasMaterials)
          ..add('state', state)
          ..add('progressPercent', progressPercent))
        .toString();
  }
}

class LessonOutlineItemBuilder
    implements Builder<LessonOutlineItem, LessonOutlineItemBuilder> {
  _$LessonOutlineItem? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

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

  bool? _hasMaterials;
  bool? get hasMaterials => _$this._hasMaterials;
  set hasMaterials(bool? hasMaterials) => _$this._hasMaterials = hasMaterials;

  LessonOutlineItemStateEnum? _state;
  LessonOutlineItemStateEnum? get state => _$this._state;
  set state(LessonOutlineItemStateEnum? state) => _$this._state = state;

  int? _progressPercent;
  int? get progressPercent => _$this._progressPercent;
  set progressPercent(int? progressPercent) =>
      _$this._progressPercent = progressPercent;

  LessonOutlineItemBuilder() {
    LessonOutlineItem._defaults(this);
  }

  LessonOutlineItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _position = $v.position;
      _title = $v.title;
      _durationSeconds = $v.durationSeconds;
      _hasMaterials = $v.hasMaterials;
      _state = $v.state;
      _progressPercent = $v.progressPercent;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LessonOutlineItem other) {
    _$v = other as _$LessonOutlineItem;
  }

  @override
  void update(void Function(LessonOutlineItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LessonOutlineItem build() => _build();

  _$LessonOutlineItem _build() {
    final _$result =
        _$v ??
        _$LessonOutlineItem._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'LessonOutlineItem',
            'id',
          ),
          position: BuiltValueNullFieldError.checkNotNull(
            position,
            r'LessonOutlineItem',
            'position',
          ),
          title: BuiltValueNullFieldError.checkNotNull(
            title,
            r'LessonOutlineItem',
            'title',
          ),
          durationSeconds: BuiltValueNullFieldError.checkNotNull(
            durationSeconds,
            r'LessonOutlineItem',
            'durationSeconds',
          ),
          hasMaterials: BuiltValueNullFieldError.checkNotNull(
            hasMaterials,
            r'LessonOutlineItem',
            'hasMaterials',
          ),
          state: BuiltValueNullFieldError.checkNotNull(
            state,
            r'LessonOutlineItem',
            'state',
          ),
          progressPercent: BuiltValueNullFieldError.checkNotNull(
            progressPercent,
            r'LessonOutlineItem',
            'progressPercent',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
