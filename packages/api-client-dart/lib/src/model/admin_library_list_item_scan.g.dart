// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_library_list_item_scan.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminLibraryListItemScan extends AdminLibraryListItemScan {
  @override
  final ScanStatus status;
  @override
  final DateTime startedAt;
  @override
  final DateTime? finishedAt;
  @override
  final int errorsCount;

  factory _$AdminLibraryListItemScan([
    void Function(AdminLibraryListItemScanBuilder)? updates,
  ]) => (AdminLibraryListItemScanBuilder()..update(updates))._build();

  _$AdminLibraryListItemScan._({
    required this.status,
    required this.startedAt,
    this.finishedAt,
    required this.errorsCount,
  }) : super._();
  @override
  AdminLibraryListItemScan rebuild(
    void Function(AdminLibraryListItemScanBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminLibraryListItemScanBuilder toBuilder() =>
      AdminLibraryListItemScanBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminLibraryListItemScan &&
        status == other.status &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt &&
        errorsCount == other.errorsCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jc(_$hash, errorsCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminLibraryListItemScan')
          ..add('status', status)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt)
          ..add('errorsCount', errorsCount))
        .toString();
  }
}

class AdminLibraryListItemScanBuilder
    implements
        Builder<AdminLibraryListItemScan, AdminLibraryListItemScanBuilder> {
  _$AdminLibraryListItemScan? _$v;

  ScanStatus? _status;
  ScanStatus? get status => _$this._status;
  set status(ScanStatus? status) => _$this._status = status;

  DateTime? _startedAt;
  DateTime? get startedAt => _$this._startedAt;
  set startedAt(DateTime? startedAt) => _$this._startedAt = startedAt;

  DateTime? _finishedAt;
  DateTime? get finishedAt => _$this._finishedAt;
  set finishedAt(DateTime? finishedAt) => _$this._finishedAt = finishedAt;

  int? _errorsCount;
  int? get errorsCount => _$this._errorsCount;
  set errorsCount(int? errorsCount) => _$this._errorsCount = errorsCount;

  AdminLibraryListItemScanBuilder() {
    AdminLibraryListItemScan._defaults(this);
  }

  AdminLibraryListItemScanBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _errorsCount = $v.errorsCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminLibraryListItemScan other) {
    _$v = other as _$AdminLibraryListItemScan;
  }

  @override
  void update(void Function(AdminLibraryListItemScanBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminLibraryListItemScan build() => _build();

  _$AdminLibraryListItemScan _build() {
    final _$result =
        _$v ??
        _$AdminLibraryListItemScan._(
          status: BuiltValueNullFieldError.checkNotNull(
            status,
            r'AdminLibraryListItemScan',
            'status',
          ),
          startedAt: BuiltValueNullFieldError.checkNotNull(
            startedAt,
            r'AdminLibraryListItemScan',
            'startedAt',
          ),
          finishedAt: finishedAt,
          errorsCount: BuiltValueNullFieldError.checkNotNull(
            errorsCount,
            r'AdminLibraryListItemScan',
            'errorsCount',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
