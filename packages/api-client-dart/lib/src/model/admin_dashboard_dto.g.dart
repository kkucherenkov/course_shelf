// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_dashboard_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminDashboardDto extends AdminDashboardDto {
  @override
  final DateTime generatedAt;
  @override
  final AdminDashboardDtoCounts counts;
  @override
  final AdminDashboardLatestScan? latestScan;
  @override
  final int errorsLast24h;

  factory _$AdminDashboardDto([
    void Function(AdminDashboardDtoBuilder)? updates,
  ]) => (AdminDashboardDtoBuilder()..update(updates))._build();

  _$AdminDashboardDto._({
    required this.generatedAt,
    required this.counts,
    this.latestScan,
    required this.errorsLast24h,
  }) : super._();
  @override
  AdminDashboardDto rebuild(void Function(AdminDashboardDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminDashboardDtoBuilder toBuilder() =>
      AdminDashboardDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminDashboardDto &&
        generatedAt == other.generatedAt &&
        counts == other.counts &&
        latestScan == other.latestScan &&
        errorsLast24h == other.errorsLast24h;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, generatedAt.hashCode);
    _$hash = $jc(_$hash, counts.hashCode);
    _$hash = $jc(_$hash, latestScan.hashCode);
    _$hash = $jc(_$hash, errorsLast24h.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminDashboardDto')
          ..add('generatedAt', generatedAt)
          ..add('counts', counts)
          ..add('latestScan', latestScan)
          ..add('errorsLast24h', errorsLast24h))
        .toString();
  }
}

class AdminDashboardDtoBuilder
    implements Builder<AdminDashboardDto, AdminDashboardDtoBuilder> {
  _$AdminDashboardDto? _$v;

  DateTime? _generatedAt;
  DateTime? get generatedAt => _$this._generatedAt;
  set generatedAt(DateTime? generatedAt) => _$this._generatedAt = generatedAt;

  AdminDashboardDtoCountsBuilder? _counts;
  AdminDashboardDtoCountsBuilder get counts =>
      _$this._counts ??= AdminDashboardDtoCountsBuilder();
  set counts(AdminDashboardDtoCountsBuilder? counts) => _$this._counts = counts;

  AdminDashboardLatestScanBuilder? _latestScan;
  AdminDashboardLatestScanBuilder get latestScan =>
      _$this._latestScan ??= AdminDashboardLatestScanBuilder();
  set latestScan(AdminDashboardLatestScanBuilder? latestScan) =>
      _$this._latestScan = latestScan;

  int? _errorsLast24h;
  int? get errorsLast24h => _$this._errorsLast24h;
  set errorsLast24h(int? errorsLast24h) =>
      _$this._errorsLast24h = errorsLast24h;

  AdminDashboardDtoBuilder() {
    AdminDashboardDto._defaults(this);
  }

  AdminDashboardDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _generatedAt = $v.generatedAt;
      _counts = $v.counts.toBuilder();
      _latestScan = $v.latestScan?.toBuilder();
      _errorsLast24h = $v.errorsLast24h;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminDashboardDto other) {
    _$v = other as _$AdminDashboardDto;
  }

  @override
  void update(void Function(AdminDashboardDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminDashboardDto build() => _build();

  _$AdminDashboardDto _build() {
    _$AdminDashboardDto _$result;
    try {
      _$result =
          _$v ??
          _$AdminDashboardDto._(
            generatedAt: BuiltValueNullFieldError.checkNotNull(
              generatedAt,
              r'AdminDashboardDto',
              'generatedAt',
            ),
            counts: counts.build(),
            latestScan: _latestScan?.build(),
            errorsLast24h: BuiltValueNullFieldError.checkNotNull(
              errorsLast24h,
              r'AdminDashboardDto',
              'errorsLast24h',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'counts';
        counts.build();
        _$failedField = 'latestScan';
        _latestScan?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'AdminDashboardDto',
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
