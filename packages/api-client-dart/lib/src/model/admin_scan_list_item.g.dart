// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_scan_list_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminScanListItem extends AdminScanListItem {
  @override
  final String scanId;
  @override
  final String libraryId;
  @override
  final String libraryName;
  @override
  final ScanStatus status;
  @override
  final DateTime startedAt;
  @override
  final DateTime? finishedAt;
  @override
  final int filesScanned;
  @override
  final int coursesAdded;
  @override
  final int errorsCount;

  factory _$AdminScanListItem([
    void Function(AdminScanListItemBuilder)? updates,
  ]) => (AdminScanListItemBuilder()..update(updates))._build();

  _$AdminScanListItem._({
    required this.scanId,
    required this.libraryId,
    required this.libraryName,
    required this.status,
    required this.startedAt,
    this.finishedAt,
    required this.filesScanned,
    required this.coursesAdded,
    required this.errorsCount,
  }) : super._();
  @override
  AdminScanListItem rebuild(void Function(AdminScanListItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminScanListItemBuilder toBuilder() =>
      AdminScanListItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminScanListItem &&
        scanId == other.scanId &&
        libraryId == other.libraryId &&
        libraryName == other.libraryName &&
        status == other.status &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        filesScanned == other.filesScanned &&
        coursesAdded == other.coursesAdded &&
        errorsCount == other.errorsCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, scanId.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, libraryName.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, filesScanned.hashCode);
    _$hash = $jc(_$hash, coursesAdded.hashCode);
    _$hash = $jc(_$hash, errorsCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminScanListItem')
          ..add('scanId', scanId)
          ..add('libraryId', libraryId)
          ..add('libraryName', libraryName)
          ..add('status', status)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('filesScanned', filesScanned)
          ..add('coursesAdded', coursesAdded)
          ..add('errorsCount', errorsCount))
        .toString();
  }
}

class AdminScanListItemBuilder
    implements Builder<AdminScanListItem, AdminScanListItemBuilder> {
  _$AdminScanListItem? _$v;

  String? _scanId;
  String? get scanId => _$this._scanId;
  set scanId(String? scanId) => _$this._scanId = scanId;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  String? _libraryName;
  String? get libraryName => _$this._libraryName;
  set libraryName(String? libraryName) => _$this._libraryName = libraryName;

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

  int? _coursesAdded;
  int? get coursesAdded => _$this._coursesAdded;
  set coursesAdded(int? coursesAdded) => _$this._coursesAdded = coursesAdded;

  int? _errorsCount;
  int? get errorsCount => _$this._errorsCount;
  set errorsCount(int? errorsCount) => _$this._errorsCount = errorsCount;

  AdminScanListItemBuilder() {
    AdminScanListItem._defaults(this);
  }

  AdminScanListItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _scanId = $v.scanId;
      _libraryId = $v.libraryId;
      _libraryName = $v.libraryName;
      _status = $v.status;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _filesScanned = $v.filesScanned;
      _coursesAdded = $v.coursesAdded;
      _errorsCount = $v.errorsCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminScanListItem other) {
    _$v = other as _$AdminScanListItem;
  }

  @override
  void update(void Function(AdminScanListItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminScanListItem build() => _build();

  _$AdminScanListItem _build() {
    final _$result =
        _$v ??
        _$AdminScanListItem._(
          scanId: BuiltValueNullFieldError.checkNotNull(
            scanId,
            r'AdminScanListItem',
            'scanId',
          ),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'AdminScanListItem',
            'libraryId',
          ),
          libraryName: BuiltValueNullFieldError.checkNotNull(
            libraryName,
            r'AdminScanListItem',
            'libraryName',
          ),
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'AdminScanListItem',
            'status',
          ),
          startedAt: BuiltValueNullFieldError.checkNotNull(
            startedAt,
            r'AdminScanListItem',
            'startedAt',
          ),
          finishedAt: finishedAt,
          filesScanned: BuiltValueNullFieldError.checkNotNull(
            filesScanned,
            r'AdminScanListItem',
            'filesScanned',
          ),
          coursesAdded: BuiltValueNullFieldError.checkNotNull(
            coursesAdded,
            r'AdminScanListItem',
            'coursesAdded',
          ),
          errorsCount: BuiltValueNullFieldError.checkNotNull(
            errorsCount,
            r'AdminScanListItem',
            'errorsCount',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
