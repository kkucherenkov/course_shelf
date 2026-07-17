// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MaterialDto extends MaterialDto {
  @override
  final String id;
  @override
  final MaterialKind kind;
  @override
  final String label;
  @override
  final int sizeBytes;

  factory _$MaterialDto([void Function(MaterialDtoBuilder)? updates]) =>
      (MaterialDtoBuilder()..update(updates))._build();

  _$MaterialDto._({
    required this.id,
    required this.kind,
    required this.label,
    required this.sizeBytes,
  }) : super._();
  @override
  MaterialDto rebuild(void Function(MaterialDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MaterialDtoBuilder toBuilder() => MaterialDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MaterialDto &&
        id == other.id &&
        kind == other.kind &&
        label == other.label &&
        sizeBytes == other.sizeBytes;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MaterialDto')
          ..add('id', id)
          ..add('kind', kind)
          ..add('label', label)
          ..add('sizeBytes', sizeBytes))
        .toString();
  }
}

class MaterialDtoBuilder implements Builder<MaterialDto, MaterialDtoBuilder> {
  _$MaterialDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  MaterialKind? _kind;
  MaterialKind? get kind => _$this._kind;
  set kind(MaterialKind? kind) => _$this._kind = kind;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  int? _sizeBytes;
  int? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(int? sizeBytes) => _$this._sizeBytes = sizeBytes;

  MaterialDtoBuilder() {
    MaterialDto._defaults(this);
  }

  MaterialDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _kind = $v.kind;
      _label = $v.label;
      _sizeBytes = $v.sizeBytes;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MaterialDto other) {
    _$v = other as _$MaterialDto;
  }

  @override
  void update(void Function(MaterialDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MaterialDto build() => _build();

  _$MaterialDto _build() {
    final _$result =
        _$v ??
        _$MaterialDto._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'MaterialDto', 'id'),
          kind: BuiltValueNullFieldError.checkNotNull(
            kind,
            r'MaterialDto',
            'kind',
          ),
          label: BuiltValueNullFieldError.checkNotNull(
            label,
            r'MaterialDto',
            'label',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'MaterialDto',
            'sizeBytes',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
