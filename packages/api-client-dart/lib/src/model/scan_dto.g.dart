// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scan_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScanDto extends ScanDto {
  @override
  final String id;
  @override
  final String libraryId;
  @override
  final ScanStatus status;
  @override
  final DateTime startedAt;
  @override
  final DateTime? finishedAt;
  @override
  final int filesScanned;
  @override
  final int filesAdded;
  @override
  final int filesUpdated;
  @override
  final int coursesDiscovered;
  @override
  final BuiltList<ScanError> errors;

  factory _$ScanDto([void Function(ScanDtoBuilder)? updates]) =>
      (ScanDtoBuilder()..update(updates))._build();

  _$ScanDto._({
    required this.id,
    required this.libraryId,
    required this.status,
    required this.startedAt,
    this.finishedAt,
    required this.filesScanned,
    required this.filesAdded,
    required this.filesUpdated,
    required this.coursesDiscovered,
    required this.errors,
  }) : super._();
  @override
  ScanDto rebuild(void Function(ScanDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ScanDtoBuilder toBuilder() => ScanDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScanDto &&
        id == other.id &&
        libraryId == other.libraryId &&
        status == other.status &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        filesScanned == other.filesScanned &&
        filesAdded == other.filesAdded &&
        filesUpdated == other.filesUpdated &&
        coursesDiscovered == other.coursesDiscovered &&
        errors == other.errors;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, filesScanned.hashCode);
    _$hash = $jc(_$hash, filesAdded.hashCode);
    _$hash = $jc(_$hash, filesUpdated.hashCode);
    _$hash = $jc(_$hash, coursesDiscovered.hashCode);
    _$hash = $jc(_$hash, errors.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ScanDto')
          ..add('id', id)
          ..add('libraryId', libraryId)
          ..add('status', status)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('filesScanned', filesScanned)
          ..add('filesAdded', filesAdded)
          ..add('filesUpdated', filesUpdated)
          ..add('coursesDiscovered', coursesDiscovered)
          ..add('errors', errors))
        .toString();
  }
}

class ScanDtoBuilder implements Builder<ScanDto, ScanDtoBuilder> {
  _$ScanDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  ScanStatus? _status;
  ScanStatus? get status => _$this._status;
  set status(ScanStatus? status) => _$this._status = status;

  DateTime? _startedAt;
  DateTime? get startedAt => _$this._startedAt;
  set startedAt(DateTime? startedAt) => _$this._startedAt = startedAt;

  DateTime? _finishedAt;
  DateTime? get finishedAt => _$this._finishedAt;
  set finishedAt(DateTime? finishedAt) => _$this._finishedAt = finishedAt;

  int? _filesScanned;
  int? get filesScanned => _$this._filesScanned;
  set filesScanned(int? filesScanned) => _$this._filesScanned = filesScanned;

  int? _filesAdded;
  int? get filesAdded => _$this._filesAdded;
  set filesAdded(int? filesAdded) => _$this._filesAdded = filesAdded;

  int? _filesUpdated;
  int? get filesUpdated => _$this._filesUpdated;
  set filesUpdated(int? filesUpdated) => _$this._filesUpdated = filesUpdated;

  int? _coursesDiscovered;
  int? get coursesDiscovered => _$this._coursesDiscovered;
  set coursesDiscovered(int? coursesDiscovered) =>
      _$this._coursesDiscovered = coursesDiscovered;

  ListBuilder<ScanError>? _errors;
  ListBuilder<ScanError> get errors =>
      _$this._errors ??= ListBuilder<ScanError>();
  set errors(ListBuilder<ScanError>? errors) => _$this._errors = errors;

  ScanDtoBuilder() {
    ScanDto._defaults(this);
  }

  ScanDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _libraryId = $v.libraryId;
      _status = $v.status;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _filesScanned = $v.filesScanned;
      _filesAdded = $v.filesAdded;
      _filesUpdated = $v.filesUpdated;
      _coursesDiscovered = $v.coursesDiscovered;
      _errors = $v.errors.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScanDto other) {
    _$v = other as _$ScanDto;
  }

  @override
  void update(void Function(ScanDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScanDto build() => _build();

  _$ScanDto _build() {
    _$ScanDto _$result;
    try {
      _$result =
          _$v ??
          _$ScanDto._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'ScanDto', 'id'),
            libraryId: BuiltValueNullFieldError.checkNotNull(
              libraryId,
              r'ScanDto',
              'libraryId',
            ),
            status: BuiltValueNullFieldError.checkNotNull(
              status,
              r'ScanDto',
              'status',
            ),
            startedAt: BuiltValueNullFieldError.checkNotNull(
              startedAt,
              r'ScanDto',
              'startedAt',
            ),
            finishedAt: finishedAt,
            filesScanned: BuiltValueNullFieldError.checkNotNull(
              filesScanned,
              r'ScanDto',
              'filesScanned',
            ),
            filesAdded: BuiltValueNullFieldError.checkNotNull(
              filesAdded,
              r'ScanDto',
              'filesAdded',
            ),
            filesUpdated: BuiltValueNullFieldError.checkNotNull(
              filesUpdated,
              r'ScanDto',
              'filesUpdated',
            ),
            coursesDiscovered: BuiltValueNullFieldError.checkNotNull(
              coursesDiscovered,
              r'ScanDto',
              'coursesDiscovered',
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
          r'ScanDto',
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
