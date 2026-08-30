// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transcription_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TranscriptionDto extends TranscriptionDto {
  @override
  final String id;
  @override
  final String libraryId;
  @override
  final TranscriptionStatus status;
  @override
  final bool force;
  @override
  final DateTime startedAt;
  @override
  final DateTime? finishedAt;
  @override
  final int lessonsTotal;
  @override
  final int lessonsSkipped;
  @override
  final int lessonsTranscribed;
  @override
  final int lessonsFailed;
  @override
  final BuiltList<TranscriptionErrorDto> errors;

  factory _$TranscriptionDto([
    void Function(TranscriptionDtoBuilder)? updates,
  ]) => (TranscriptionDtoBuilder()..update(updates))._build();

  _$TranscriptionDto._({
    required this.id,
    required this.libraryId,
    required this.status,
    required this.force,
    required this.startedAt,
    this.finishedAt,
    required this.lessonsTotal,
    required this.lessonsSkipped,
    required this.lessonsTranscribed,
    required this.lessonsFailed,
    required this.errors,
  }) : super._();
  @override
  TranscriptionDto rebuild(void Function(TranscriptionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TranscriptionDtoBuilder toBuilder() =>
      TranscriptionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TranscriptionDto &&
        id == other.id &&
        libraryId == other.libraryId &&
        status == other.status &&
        force == other.force &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        lessonsTotal == other.lessonsTotal &&
        lessonsSkipped == other.lessonsSkipped &&
        lessonsTranscribed == other.lessonsTranscribed &&
        lessonsFailed == other.lessonsFailed &&
        errors == other.errors;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, force.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jc(_$hash, lessonsSkipped.hashCode);
    _$hash = $jc(_$hash, lessonsTranscribed.hashCode);
    _$hash = $jc(_$hash, lessonsFailed.hashCode);
    _$hash = $jc(_$hash, errors.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TranscriptionDto')
          ..add('id', id)
          ..add('libraryId', libraryId)
          ..add('status', status)
          ..add('force', force)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('lessonsTotal', lessonsTotal)
          ..add('lessonsSkipped', lessonsSkipped)
          ..add('lessonsTranscribed', lessonsTranscribed)
          ..add('lessonsFailed', lessonsFailed)
          ..add('errors', errors))
        .toString();
  }
}

class TranscriptionDtoBuilder
    implements Builder<TranscriptionDto, TranscriptionDtoBuilder> {
  _$TranscriptionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  TranscriptionStatus? _status;
  TranscriptionStatus? get status => _$this._status;
  set status(TranscriptionStatus? status) => _$this._status = status;

  bool? _force;
  bool? get force => _$this._force;
  set force(bool? force) => _$this._force = force;

  DateTime? _startedAt;
  DateTime? get startedAt => _$this._startedAt;
  set startedAt(DateTime? startedAt) => _$this._startedAt = startedAt;

  DateTime? _finishedAt;
  DateTime? get finishedAt => _$this._finishedAt;
  set finishedAt(DateTime? finishedAt) => _$this._finishedAt = finishedAt;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  int? _lessonsSkipped;
  int? get lessonsSkipped => _$this._lessonsSkipped;
  set lessonsSkipped(int? lessonsSkipped) =>
      _$this._lessonsSkipped = lessonsSkipped;

  int? _lessonsTranscribed;
  int? get lessonsTranscribed => _$this._lessonsTranscribed;
  set lessonsTranscribed(int? lessonsTranscribed) =>
      _$this._lessonsTranscribed = lessonsTranscribed;

  int? _lessonsFailed;
  int? get lessonsFailed => _$this._lessonsFailed;
  set lessonsFailed(int? lessonsFailed) =>
      _$this._lessonsFailed = lessonsFailed;

  ListBuilder<TranscriptionErrorDto>? _errors;
  ListBuilder<TranscriptionErrorDto> get errors =>
      _$this._errors ??= ListBuilder<TranscriptionErrorDto>();
  set errors(ListBuilder<TranscriptionErrorDto>? errors) =>
      _$this._errors = errors;

  TranscriptionDtoBuilder() {
    TranscriptionDto._defaults(this);
  }

  TranscriptionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _libraryId = $v.libraryId;
      _status = $v.status;
      _force = $v.force;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _lessonsTotal = $v.lessonsTotal;
      _lessonsSkipped = $v.lessonsSkipped;
      _lessonsTranscribed = $v.lessonsTranscribed;
      _lessonsFailed = $v.lessonsFailed;
      _errors = $v.errors.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TranscriptionDto other) {
    _$v = other as _$TranscriptionDto;
  }

  @override
  void update(void Function(TranscriptionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TranscriptionDto build() => _build();

  _$TranscriptionDto _build() {
    _$TranscriptionDto _$result;
    try {
      _$result =
          _$v ??
          _$TranscriptionDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'TranscriptionDto',
              'id',
            ),
            libraryId: BuiltValueNullFieldError.checkNotNull(
              libraryId,
              r'TranscriptionDto',
              'libraryId',
            ),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'TranscriptionDto',
              'status',
            ),
            force: BuiltValueNullFieldError.checkNotNull(
              force,
              r'TranscriptionDto',
              'force',
            ),
            startedAt: BuiltValueNullFieldError.checkNotNull(
              startedAt,
              r'TranscriptionDto',
              'startedAt',
            ),
            finishedAt: finishedAt,
            lessonsTotal: BuiltValueNullFieldError.checkNotNull(
              lessonsTotal,
              r'TranscriptionDto',
              'lessonsTotal',
            ),
            lessonsSkipped: BuiltValueNullFieldError.checkNotNull(
              lessonsSkipped,
              r'TranscriptionDto',
              'lessonsSkipped',
            ),
            lessonsTranscribed: BuiltValueNullFieldError.checkNotNull(
              lessonsTranscribed,
              r'TranscriptionDto',
              'lessonsTranscribed',
            ),
            lessonsFailed: BuiltValueNullFieldError.checkNotNull(
              lessonsFailed,
              r'TranscriptionDto',
              'lessonsFailed',
            ),
            errors: errors.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'errors';
        errors.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'TranscriptionDto',
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
