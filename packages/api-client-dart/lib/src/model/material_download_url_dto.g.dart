// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_download_url_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MaterialDownloadUrlDto extends MaterialDownloadUrlDto {
  @override
  final String url;
  @override
  final String token;
  @override
  final DateTime expiresAt;

  factory _$MaterialDownloadUrlDto([
    void Function(MaterialDownloadUrlDtoBuilder)? updates,
  ]) => (MaterialDownloadUrlDtoBuilder()..update(updates))._build();

  _$MaterialDownloadUrlDto._({
    required this.url,
    required this.token,
    required this.expiresAt,
  }) : super._();
  @override
  MaterialDownloadUrlDto rebuild(
    void Function(MaterialDownloadUrlDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  MaterialDownloadUrlDtoBuilder toBuilder() =>
      MaterialDownloadUrlDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MaterialDownloadUrlDto &&
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
    return (newBuiltValueToStringHelper(r'MaterialDownloadUrlDto')
          ..add('url', url)
          ..add('token', token)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class MaterialDownloadUrlDtoBuilder
    implements Builder<MaterialDownloadUrlDto, MaterialDownloadUrlDtoBuilder> {
  _$MaterialDownloadUrlDto? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  MaterialDownloadUrlDtoBuilder() {
    MaterialDownloadUrlDto._defaults(this);
  }

  MaterialDownloadUrlDtoBuilder get _$this {
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
  void replace(MaterialDownloadUrlDto other) {
    _$v = other as _$MaterialDownloadUrlDto;
  }

  @override
  void update(void Function(MaterialDownloadUrlDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MaterialDownloadUrlDto build() => _build();

  _$MaterialDownloadUrlDto _build() {
    final _$result =
        _$v ??
        _$MaterialDownloadUrlDto._(
          url: BuiltValueNullFieldError.checkNotNull(
            url,
            r'MaterialDownloadUrlDto',
            'url',
          ),
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'MaterialDownloadUrlDto',
            'token',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'MaterialDownloadUrlDto',
            'expiresAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
