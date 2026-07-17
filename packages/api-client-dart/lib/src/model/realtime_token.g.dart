// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'realtime_token.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RealtimeToken extends RealtimeToken {
  @override
  final String? token;
  @override
  final DateTime? expiresAt;

  factory _$RealtimeToken([void Function(RealtimeTokenBuilder)? updates]) =>
      (RealtimeTokenBuilder()..update(updates))._build();

  _$RealtimeToken._({this.token, this.expiresAt}) : super._();
  @override
  RealtimeToken rebuild(void Function(RealtimeTokenBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RealtimeTokenBuilder toBuilder() => RealtimeTokenBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RealtimeToken &&
        token == other.token &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RealtimeToken')
          ..add('token', token)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class RealtimeTokenBuilder
    implements Builder<RealtimeToken, RealtimeTokenBuilder> {
  _$RealtimeToken? _$v;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  RealtimeTokenBuilder() {
    RealtimeToken._defaults(this);
  }

  RealtimeTokenBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _token = $v.token;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RealtimeToken other) {
    _$v = other as _$RealtimeToken;
  }

  @override
  void update(void Function(RealtimeTokenBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RealtimeToken build() => _build();

  _$RealtimeToken _build() {
    final _$result =
        _$v ?? _$RealtimeToken._(token: token, expiresAt: expiresAt);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
