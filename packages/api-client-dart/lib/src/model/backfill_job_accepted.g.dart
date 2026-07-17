// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'backfill_job_accepted.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BackfillJobAccepted extends BackfillJobAccepted {
  @override
  final String jobId;

  factory _$BackfillJobAccepted([
    void Function(BackfillJobAcceptedBuilder)? updates,
  ]) => (BackfillJobAcceptedBuilder()..update(updates))._build();

  _$BackfillJobAccepted._({required this.jobId}) : super._();
  @override
  BackfillJobAccepted rebuild(
    void Function(BackfillJobAcceptedBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  BackfillJobAcceptedBuilder toBuilder() =>
      BackfillJobAcceptedBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BackfillJobAccepted && jobId == other.jobId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, jobId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'BackfillJobAccepted',
    )..add('jobId', jobId)).toString();
  }
}

class BackfillJobAcceptedBuilder
    implements Builder<BackfillJobAccepted, BackfillJobAcceptedBuilder> {
  _$BackfillJobAccepted? _$v;

  String? _jobId;
  String? get jobId => _$this._jobId;
  set jobId(String? jobId) => _$this._jobId = jobId;

  BackfillJobAcceptedBuilder() {
    BackfillJobAccepted._defaults(this);
  }

  BackfillJobAcceptedBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _jobId = $v.jobId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BackfillJobAccepted other) {
    _$v = other as _$BackfillJobAccepted;
  }

  @override
  void update(void Function(BackfillJobAcceptedBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BackfillJobAccepted build() => _build();

  _$BackfillJobAccepted _build() {
    final _$result =
        _$v ??
        _$BackfillJobAccepted._(
          jobId: BuiltValueNullFieldError.checkNotNull(
            jobId,
            r'BackfillJobAccepted',
            'jobId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
