// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_dashboard_latest_scan.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminDashboardLatestScan extends AdminDashboardLatestScan {
  @override
  final String scanId;
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
  final int errorsCount;

  factory _$AdminDashboardLatestScan([
    void Function(AdminDashboardLatestScanBuilder)? updates,
  ]) => (AdminDashboardLatestScanBuilder()..update(updates))._build();

  _$AdminDashboardLatestScan._({
    required this.scanId,
    required this.libraryId,
    required this.status,
    required this.startedAt,
    this.finishedAt,
    required this.filesScanned,
    required this.errorsCount,
  }) : super._();
  @override
  AdminDashboardLatestScan rebuild(
    void Function(AdminDashboardLatestScanBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminDashboardLatestScanBuilder toBuilder() =>
      AdminDashboardLatestScanBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminDashboardLatestScan &&
        scanId == other.scanId &&
        libraryId == other.libraryId &&
        status == other.status &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        filesScanned == other.filesScanned &&
        errorsCount == other.errorsCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, scanId.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, filesScanned.hashCode);
    _$hash = $jc(_$hash, errorsCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminDashboardLatestScan')
          ..add('scanId', scanId)
          ..add('libraryId', libraryId)
          ..add('status', status)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('filesScanned', filesScanned)
          ..add('errorsCount', errorsCount))
        .toString();
  }
}

class AdminDashboardLatestScanBuilder
    implements
        Builder<AdminDashboardLatestScan, AdminDashboardLatestScanBuilder> {
  _$AdminDashboardLatestScan? _$v;

  String? _scanId;
  String? get scanId => _$this._scanId;
  set scanId(String? scanId) => _$this._scanId = scanId;

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

  int? _errorsCount;
  int? get errorsCount => _$this._errorsCount;
  set errorsCount(int? errorsCount) => _$this._errorsCount = errorsCount;

  AdminDashboardLatestScanBuilder() {
    AdminDashboardLatestScan._defaults(this);
  }

  AdminDashboardLatestScanBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _scanId = $v.scanId;
      _libraryId = $v.libraryId;
      _status = $v.status;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _filesScanned = $v.filesScanned;
      _errorsCount = $v.errorsCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminDashboardLatestScan other) {
    _$v = other as _$AdminDashboardLatestScan;
  }

  @override
  void update(void Function(AdminDashboardLatestScanBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminDashboardLatestScan build() => _build();

  _$AdminDashboardLatestScan _build() {
    final _$result =
        _$v ??
        _$AdminDashboardLatestScan._(
          scanId: BuiltValueNullFieldError.checkNotNull(
            scanId,
            r'AdminDashboardLatestScan',
            'scanId',
          ),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'AdminDashboardLatestScan',
            'libraryId',
          ),
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'AdminDashboardLatestScan',
            'status',
          ),
          startedAt: BuiltValueNullFieldError.checkNotNull(
            startedAt,
            r'AdminDashboardLatestScan',
            'startedAt',
          ),
          finishedAt: finishedAt,
          filesScanned: BuiltValueNullFieldError.checkNotNull(
            filesScanned,
            r'AdminDashboardLatestScan',
            'filesScanned',
          ),
          errorsCount: BuiltValueNullFieldError.checkNotNull(
            errorsCount,
            r'AdminDashboardLatestScan',
            'errorsCount',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
