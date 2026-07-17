// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scraper_info_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ScraperInfoDto extends ScraperInfoDto {
  @override
  final String id;
  @override
  final BuiltList<ScraperKind> supportedKinds;
  @override
  final bool configured;

  factory _$ScraperInfoDto([void Function(ScraperInfoDtoBuilder)? updates]) =>
      (ScraperInfoDtoBuilder()..update(updates))._build();

  _$ScraperInfoDto._({
    required this.id,
    required this.supportedKinds,
    required this.configured,
  }) : super._();
  @override
  ScraperInfoDto rebuild(void Function(ScraperInfoDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ScraperInfoDtoBuilder toBuilder() => ScraperInfoDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ScraperInfoDto &&
        id == other.id &&
        supportedKinds == other.supportedKinds &&
        configured == other.configured;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, supportedKinds.hashCode);
    _$hash = $jc(_$hash, configured.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ScraperInfoDto')
          ..add('id', id)
          ..add('supportedKinds', supportedKinds)
          ..add('configured', configured))
        .toString();
  }
}

class ScraperInfoDtoBuilder
    implements Builder<ScraperInfoDto, ScraperInfoDtoBuilder> {
  _$ScraperInfoDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  ListBuilder<ScraperKind>? _supportedKinds;
  ListBuilder<ScraperKind> get supportedKinds =>
      _$this._supportedKinds ??= ListBuilder<ScraperKind>();
  set supportedKinds(ListBuilder<ScraperKind>? supportedKinds) =>
      _$this._supportedKinds = supportedKinds;

  bool? _configured;
  bool? get configured => _$this._configured;
  set configured(bool? configured) => _$this._configured = configured;

  ScraperInfoDtoBuilder() {
    ScraperInfoDto._defaults(this);
  }

  ScraperInfoDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _supportedKinds = $v.supportedKinds.toBuilder();
      _configured = $v.configured;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ScraperInfoDto other) {
    _$v = other as _$ScraperInfoDto;
  }

  @override
  void update(void Function(ScraperInfoDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ScraperInfoDto build() => _build();

  _$ScraperInfoDto _build() {
    _$ScraperInfoDto _$result;
    try {
      _$result =
          _$v ??
          _$ScraperInfoDto._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'ScraperInfoDto',
              'id',
            ),
            supportedKinds: supportedKinds.build(),
            configured: BuiltValueNullFieldError.checkNotNull(
              configured,
              r'ScraperInfoDto',
              'configured',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'supportedKinds';
        supportedKinds.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ScraperInfoDto',
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
