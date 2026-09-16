// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'flashcard_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FlashcardDto extends FlashcardDto {
  @override
  final String id;
  @override
  final String lessonId;
  @override
  final String front;
  @override
  final String back;
  @override
  final String? sourceCueId;
  @override
  final double easeFactor;
  @override
  final int intervalDays;
  @override
  final int repetitions;
  @override
  final DateTime dueAt;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$FlashcardDto([void Function(FlashcardDtoBuilder)? updates]) =>
      (FlashcardDtoBuilder()..update(updates))._build();

  _$FlashcardDto._({
    required this.id,
    required this.lessonId,
    required this.front,
    required this.back,
    this.sourceCueId,
    required this.easeFactor,
    required this.intervalDays,
    required this.repetitions,
    required this.dueAt,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  FlashcardDto rebuild(void Function(FlashcardDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FlashcardDtoBuilder toBuilder() => FlashcardDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FlashcardDto &&
        id == other.id &&
        lessonId == other.lessonId &&
        front == other.front &&
        back == other.back &&
        sourceCueId == other.sourceCueId &&
        easeFactor == other.easeFactor &&
        intervalDays == other.intervalDays &&
        repetitions == other.repetitions &&
        dueAt == other.dueAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, front.hashCode);
    _$hash = $jc(_$hash, back.hashCode);
    _$hash = $jc(_$hash, sourceCueId.hashCode);
    _$hash = $jc(_$hash, easeFactor.hashCode);
    _$hash = $jc(_$hash, intervalDays.hashCode);
    _$hash = $jc(_$hash, repetitions.hashCode);
    _$hash = $jc(_$hash, dueAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'FlashcardDto')
          ..add('id', id)
          ..add('lessonId', lessonId)
          ..add('front', front)
          ..add('back', back)
          ..add('sourceCueId', sourceCueId)
          ..add('easeFactor', easeFactor)
          ..add('intervalDays', intervalDays)
          ..add('repetitions', repetitions)
          ..add('dueAt', dueAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class FlashcardDtoBuilder
    implements Builder<FlashcardDto, FlashcardDtoBuilder> {
  _$FlashcardDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _front;
  String? get front => _$this._front;
  set front(String? front) => _$this._front = front;

  String? _back;
  String? get back => _$this._back;
  set back(String? back) => _$this._back = back;

  String? _sourceCueId;
  String? get sourceCueId => _$this._sourceCueId;
  set sourceCueId(String? sourceCueId) => _$this._sourceCueId = sourceCueId;

  double? _easeFactor;
  double? get easeFactor => _$this._easeFactor;
  set easeFactor(double? easeFactor) => _$this._easeFactor = easeFactor;

  int? _intervalDays;
  int? get intervalDays => _$this._intervalDays;
  set intervalDays(int? intervalDays) => _$this._intervalDays = intervalDays;

  int? _repetitions;
  int? get repetitions => _$this._repetitions;
  set repetitions(int? repetitions) => _$this._repetitions = repetitions;

  DateTime? _dueAt;
  DateTime? get dueAt => _$this._dueAt;
  set dueAt(DateTime? dueAt) => _$this._dueAt = dueAt;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  FlashcardDtoBuilder() {
    FlashcardDto._defaults(this);
  }

  FlashcardDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _lessonId = $v.lessonId;
      _front = $v.front;
      _back = $v.back;
      _sourceCueId = $v.sourceCueId;
      _easeFactor = $v.easeFactor;
      _intervalDays = $v.intervalDays;
      _repetitions = $v.repetitions;
      _dueAt = $v.dueAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FlashcardDto other) {
    _$v = other as _$FlashcardDto;
  }

  @override
  void update(void Function(FlashcardDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FlashcardDto build() => _build();

  _$FlashcardDto _build() {
    final _$result =
        _$v ??
        _$FlashcardDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'FlashcardDto', 'id'),
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'FlashcardDto',
            'lessonId',
          ),
          front: BuiltValueNullFieldError.checkNotNull(
            front,
            r'FlashcardDto',
            'front',
          ),
          back: BuiltValueNullFieldError.checkNotNull(
            back,
            r'FlashcardDto',
            'back',
          ),
          sourceCueId: sourceCueId,
          easeFactor: BuiltValueNullFieldError.checkNotNull(
            easeFactor,
            r'FlashcardDto',
            'easeFactor',
          ),
          intervalDays: BuiltValueNullFieldError.checkNotNull(
            intervalDays,
            r'FlashcardDto',
            'intervalDays',
          ),
          repetitions: BuiltValueNullFieldError.checkNotNull(
            repetitions,
            r'FlashcardDto',
            'repetitions',
          ),
          dueAt: BuiltValueNullFieldError.checkNotNull(
            dueAt,
            r'FlashcardDto',
            'dueAt',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'FlashcardDto',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'FlashcardDto',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
