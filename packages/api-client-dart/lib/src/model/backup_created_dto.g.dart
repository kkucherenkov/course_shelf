// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'backup_created_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BackupCreatedDto extends BackupCreatedDto {
  @override
  final String id;
  @override
  final DateTime createdAt;
  @override
  final int sizeBytes;
  @override
  final String url;
  @override
  final String token;
  @override
  final DateTime expiresAt;

  factory _$BackupCreatedDto([
    void Function(BackupCreatedDtoBuilder)? updates,
  ]) => (BackupCreatedDtoBuilder()..update(updates))._build();

  _$BackupCreatedDto._({
    required this.id,
    required this.createdAt,
    required this.sizeBytes,
    required this.url,
    required this.token,
    required this.expiresAt,
  }) : super._();
  @override
  BackupCreatedDto rebuild(void Function(BackupCreatedDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BackupCreatedDtoBuilder toBuilder() =>
      BackupCreatedDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BackupCreatedDto &&
        id == other.id &&
        createdAt == other.createdAt &&
        sizeBytes == other.sizeBytes &&
        url == other.url &&
        token == other.token &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BackupCreatedDto')
          ..add('id', id)
          ..add('createdAt', createdAt)
          ..add('sizeBytes', sizeBytes)
          ..add('url', url)
          ..add('token', token)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class BackupCreatedDtoBuilder
    implements Builder<BackupCreatedDto, BackupCreatedDtoBuilder> {
  _$BackupCreatedDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  int? _sizeBytes;
  int? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(int? sizeBytes) => _$this._sizeBytes = sizeBytes;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  BackupCreatedDtoBuilder() {
    BackupCreatedDto._defaults(this);
  }

  BackupCreatedDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _createdAt = $v.createdAt;
      _sizeBytes = $v.sizeBytes;
      _url = $v.url;
      _token = $v.token;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BackupCreatedDto other) {
    _$v = other as _$BackupCreatedDto;
  }

  @override
  void update(void Function(BackupCreatedDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BackupCreatedDto build() => _build();

  _$BackupCreatedDto _build() {
    final _$result =
        _$v ??
        _$BackupCreatedDto._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'BackupCreatedDto',
            'id',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'BackupCreatedDto',
            'createdAt',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'BackupCreatedDto',
            'sizeBytes',
          ),
          url: BuiltValueNullFieldError.checkNotNull(
            url,
            r'BackupCreatedDto',
            'url',
          ),
          token: BuiltValueNullFieldError.checkNotNull(
            token,
            r'BackupCreatedDto',
            'token',
          ),
          expiresAt: BuiltValueNullFieldError.checkNotNull(
            expiresAt,
            r'BackupCreatedDto',
            'expiresAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
