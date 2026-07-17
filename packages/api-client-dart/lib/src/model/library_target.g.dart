// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_target.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LibraryTargetKindEnum _$libraryTargetKindEnum_library_ =
    const LibraryTargetKindEnum._('library_');

LibraryTargetKindEnum _$libraryTargetKindEnumValueOf(String name) {
  switch (name) {
    case 'library_':
      return _$libraryTargetKindEnum_library_;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LibraryTargetKindEnum> _$libraryTargetKindEnumValues =
    BuiltSet<LibraryTargetKindEnum>(const <LibraryTargetKindEnum>[
      _$libraryTargetKindEnum_library_,
    ]);

Serializer<LibraryTargetKindEnum> _$libraryTargetKindEnumSerializer =
    _$LibraryTargetKindEnumSerializer();

class _$LibraryTargetKindEnumSerializer
    implements PrimitiveSerializer<LibraryTargetKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'library_': 'library',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'library': 'library_',
  };

  @override
  final Iterable<Type> types = const <Type>[LibraryTargetKindEnum];
  @override
  final String wireName = 'LibraryTargetKindEnum';

  @override
  Object serialize(
    Serializers serializers,
    LibraryTargetKindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  LibraryTargetKindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => LibraryTargetKindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$LibraryTarget extends LibraryTarget {
  @override
  final LibraryTargetKindEnum kind;
  @override
  final String libraryId;

  factory _$LibraryTarget([void Function(LibraryTargetBuilder)? updates]) =>
      (LibraryTargetBuilder()..update(updates))._build();

  _$LibraryTarget._({required this.kind, required this.libraryId}) : super._();
  @override
  LibraryTarget rebuild(void Function(LibraryTargetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryTargetBuilder toBuilder() => LibraryTargetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryTarget &&
        kind == other.kind &&
        libraryId == other.libraryId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LibraryTarget')
          ..add('kind', kind)
          ..add('libraryId', libraryId))
        .toString();
  }
}

class LibraryTargetBuilder
    implements Builder<LibraryTarget, LibraryTargetBuilder> {
  _$LibraryTarget? _$v;

  LibraryTargetKindEnum? _kind;
  LibraryTargetKindEnum? get kind => _$this._kind;
  set kind(LibraryTargetKindEnum? kind) => _$this._kind = kind;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  LibraryTargetBuilder() {
    LibraryTarget._defaults(this);
  }

  LibraryTargetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _libraryId = $v.libraryId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryTarget other) {
    _$v = other as _$LibraryTarget;
  }

  @override
  void update(void Function(LibraryTargetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryTarget build() => _build();

  _$LibraryTarget _build() {
    final _$result =
        _$v ??
        _$LibraryTarget._(
          kind: BuiltValueNullFieldError.checkNotNull(
            kind,
            r'LibraryTarget',
            'kind',
          ),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'LibraryTarget',
            'libraryId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
