// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_transcription_list_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminTranscriptionListItem extends AdminTranscriptionListItem {
  @override
  final String transcriptionId;
  @override
  final String libraryId;
  @override
  final String libraryName;
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
  final int lessonsTranscribed;
  @override
  final int errorsCount;

  factory _$AdminTranscriptionListItem([
    void Function(AdminTranscriptionListItemBuilder)? updates,
  ]) => (AdminTranscriptionListItemBuilder()..update(updates))._build();

  _$AdminTranscriptionListItem._({
    required this.transcriptionId,
    required this.libraryId,
    required this.libraryName,
    required this.status,
    required this.force,
    required this.startedAt,
    this.finishedAt,
    required this.lessonsTotal,
    required this.lessonsTranscribed,
    required this.errorsCount,
  }) : super._();
  @override
  AdminTranscriptionListItem rebuild(
    void Function(AdminTranscriptionListItemBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminTranscriptionListItemBuilder toBuilder() =>
      AdminTranscriptionListItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminTranscriptionListItem &&
        transcriptionId == other.transcriptionId &&
        libraryId == other.libraryId &&
        libraryName == other.libraryName &&
        status == other.status &&
        force == other.force &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        lessonsTotal == other.lessonsTotal &&
        lessonsTranscribed == other.lessonsTranscribed &&
        errorsCount == other.errorsCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, transcriptionId.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, libraryName.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, force.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jc(_$hash, lessonsTranscribed.hashCode);
    _$hash = $jc(_$hash, errorsCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminTranscriptionListItem')
          ..add('transcriptionId', transcriptionId)
          ..add('libraryId', libraryId)
          ..add('libraryName', libraryName)
          ..add('status', status)
          ..add('force', force)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('lessonsTotal', lessonsTotal)
          ..add('lessonsTranscribed', lessonsTranscribed)
          ..add('errorsCount', errorsCount))
        .toString();
  }
}

class AdminTranscriptionListItemBuilder
    implements
        Builder<AdminTranscriptionListItem, AdminTranscriptionListItemBuilder> {
  _$AdminTranscriptionListItem? _$v;

  String? _transcriptionId;
  String? get transcriptionId => _$this._transcriptionId;
  set transcriptionId(String? transcriptionId) =>
      _$this._transcriptionId = transcriptionId;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  String? _libraryName;
  String? get libraryName => _$this._libraryName;
  set libraryName(String? libraryName) => _$this._libraryName = libraryName;

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

  int? _lessonsTranscribed;
  int? get lessonsTranscribed => _$this._lessonsTranscribed;
  set lessonsTranscribed(int? lessonsTranscribed) =>
      _$this._lessonsTranscribed = lessonsTranscribed;

  int? _errorsCount;
  int? get errorsCount => _$this._errorsCount;
  set errorsCount(int? errorsCount) => _$this._errorsCount = errorsCount;

  AdminTranscriptionListItemBuilder() {
    AdminTranscriptionListItem._defaults(this);
  }

  AdminTranscriptionListItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _transcriptionId = $v.transcriptionId;
      _libraryId = $v.libraryId;
      _libraryName = $v.libraryName;
      _status = $v.status;
      _force = $v.force;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _lessonsTotal = $v.lessonsTotal;
      _lessonsTranscribed = $v.lessonsTranscribed;
      _errorsCount = $v.errorsCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminTranscriptionListItem other) {
    _$v = other as _$AdminTranscriptionListItem;
  }

  @override
  void update(void Function(AdminTranscriptionListItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminTranscriptionListItem build() => _build();

  _$AdminTranscriptionListItem _build() {
    final _$result =
        _$v ??
        _$AdminTranscriptionListItem._(
          transcriptionId: BuiltValueNullFieldError.checkNotNull(
            transcriptionId,
            r'AdminTranscriptionListItem',
            'transcriptionId',
          ),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'AdminTranscriptionListItem',
            'libraryId',
          ),
          libraryName: BuiltValueNullFieldError.checkNotNull(
            libraryName,
            r'AdminTranscriptionListItem',
            'libraryName',
          ),
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'AdminTranscriptionListItem',
            'status',
          ),
          force: BuiltValueNullFieldError.checkNotNull(
            force,
            r'AdminTranscriptionListItem',
            'force',
          ),
          startedAt: BuiltValueNullFieldError.checkNotNull(
            startedAt,
            r'AdminTranscriptionListItem',
            'startedAt',
          ),
          finishedAt: finishedAt,
          lessonsTotal: BuiltValueNullFieldError.checkNotNull(
            lessonsTotal,
            r'AdminTranscriptionListItem',
            'lessonsTotal',
          ),
          lessonsTranscribed: BuiltValueNullFieldError.checkNotNull(
            lessonsTranscribed,
            r'AdminTranscriptionListItem',
            'lessonsTranscribed',
          ),
          errorsCount: BuiltValueNullFieldError.checkNotNull(
            errorsCount,
            r'AdminTranscriptionListItem',
            'errorsCount',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
