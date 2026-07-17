// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stream_url_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StreamUrlDto extends StreamUrlDto {
  @override
  final String url;
  @override
  final String token;
  @override
  final DateTime expiresAt;

  factory _$StreamUrlDto([void Function(StreamUrlDtoBuilder)? updates]) =>
      (StreamUrlDtoBuilder()..update(updates))._build();

  _$StreamUrlDto._({
    required this.url,
    required this.token,
    required this.expiresAt,
  }) : super._();
  @override
  StreamUrlDto rebuild(void Function(StreamUrlDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamUrlDtoBuilder toBuilder() => StreamUrlDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamUrlDto &&
        url == other.url &&
        token == other.token &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StreamUrlDto')
          ..add('url', url)
          ..add('token', token)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class StreamUrlDtoBuilder
    implements Builder<StreamUrlDto, StreamUrlDtoBuilder> {
  _$StreamUrlDto? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  StreamUrlDtoBuilder() {
    StreamUrlDto._defaults(this);
  }

  StreamUrlDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _token = $v.token;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamUrlDto other) {
    _$v = other as _$StreamUrlDto;
  }

  @override
  void update(void Function(StreamUrlDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamUrlDto build() => _build();

  _$StreamUrlDto _build() {
    final _$result =
        _$v ??
        _$StreamUrlDto._(
          url: BuiltValueNullFieldError.checkNotNull(
            url,
            r'StreamUrlDto',
            'url',
          ),
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'StreamUrlDto',
            'token',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'StreamUrlDto',
            'expiresAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
