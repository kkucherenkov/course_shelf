// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_material_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CourseMaterialItemKindEnum _$courseMaterialItemKindEnum_doc =
    const CourseMaterialItemKindEnum._('doc');
const CourseMaterialItemKindEnum _$courseMaterialItemKindEnum_note =
    const CourseMaterialItemKindEnum._('note');
const CourseMaterialItemKindEnum _$courseMaterialItemKindEnum_image =
    const CourseMaterialItemKindEnum._('image');
const CourseMaterialItemKindEnum _$courseMaterialItemKindEnum_slide =
    const CourseMaterialItemKindEnum._('slide');

CourseMaterialItemKindEnum _$courseMaterialItemKindEnumValueOf(String name) {
  switch (name) {
    case 'doc':
      return _$courseMaterialItemKindEnum_doc;
    case 'note':
      return _$courseMaterialItemKindEnum_note;
    case 'image':
      return _$courseMaterialItemKindEnum_image;
    case 'slide':
      return _$courseMaterialItemKindEnum_slide;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CourseMaterialItemKindEnum> _$courseMaterialItemKindEnumValues =
    BuiltSet<CourseMaterialItemKindEnum>(const <CourseMaterialItemKindEnum>[
      _$courseMaterialItemKindEnum_doc,
      _$courseMaterialItemKindEnum_note,
      _$courseMaterialItemKindEnum_image,
      _$courseMaterialItemKindEnum_slide,
    ]);

Serializer<CourseMaterialItemKindEnum> _$courseMaterialItemKindEnumSerializer =
    _$CourseMaterialItemKindEnumSerializer();

class _$CourseMaterialItemKindEnumSerializer
    implements PrimitiveSerializer<CourseMaterialItemKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'doc': 'doc',
    'note': 'note',
    'image': 'image',
    'slide': 'slide',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'doc': 'doc',
    'note': 'note',
    'image': 'image',
    'slide': 'slide',
  };

  @override
  final Iterable<Type> types = const <Type>[CourseMaterialItemKindEnum];
  @override
  final String wireName = 'CourseMaterialItemKindEnum';

  @override
  Object serialize(
    Serializers serializers,
    CourseMaterialItemKindEnum object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  CourseMaterialItemKindEnum deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => CourseMaterialItemKindEnum.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

class _$CourseMaterialItem extends CourseMaterialItem {
  @override
  final String id;
  @override
  final String lessonId;
  @override
  final String sectionId;
  @override
  final String sectionTitle;
  @override
  final CourseMaterialItemKindEnum kind;
  @override
  final String label;
  @override
  final int sizeBytes;

  factory _$CourseMaterialItem([
    void Function(CourseMaterialItemBuilder)? updates,
  ]) => (CourseMaterialItemBuilder()..update(updates))._build();

  _$CourseMaterialItem._({
    required this.id,
    required this.lessonId,
    required this.sectionId,
    required this.sectionTitle,
    required this.kind,
    required this.label,
    required this.sizeBytes,
  }) : super._();
  @override
  CourseMaterialItem rebuild(
    void Function(CourseMaterialItemBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  CourseMaterialItemBuilder toBuilder() =>
      CourseMaterialItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseMaterialItem &&
        id == other.id &&
        lessonId == other.lessonId &&
        sectionId == other.sectionId &&
        sectionTitle == other.sectionTitle &&
        kind == other.kind &&
        label == other.label &&
        sizeBytes == other.sizeBytes;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, sectionId.hashCode);
    _$hash = $jc(_$hash, sectionTitle.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseMaterialItem')
          ..add('id', id)
          ..add('lessonId', lessonId)
          ..add('sectionId', sectionId)
          ..add('sectionTitle', sectionTitle)
          ..add('kind', kind)
          ..add('label', label)
          ..add('sizeBytes', sizeBytes))
        .toString();
  }
}

class CourseMaterialItemBuilder
    implements Builder<CourseMaterialItem, CourseMaterialItemBuilder> {
  _$CourseMaterialItem? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _sectionId;
  String? get sectionId => _$this._sectionId;
  set sectionId(String? sectionId) => _$this._sectionId = sectionId;

  String? _sectionTitle;
  String? get sectionTitle => _$this._sectionTitle;
  set sectionTitle(String? sectionTitle) => _$this._sectionTitle = sectionTitle;

  CourseMaterialItemKindEnum? _kind;
  CourseMaterialItemKindEnum? get kind => _$this._kind;
  set kind(CourseMaterialItemKindEnum? kind) => _$this._kind = kind;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  int? _sizeBytes;
  int? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(int? sizeBytes) => _$this._sizeBytes = sizeBytes;

  CourseMaterialItemBuilder() {
    CourseMaterialItem._defaults(this);
  }

  CourseMaterialItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _lessonId = $v.lessonId;
      _sectionId = $v.sectionId;
      _sectionTitle = $v.sectionTitle;
      _kind = $v.kind;
      _label = $v.label;
      _sizeBytes = $v.sizeBytes;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseMaterialItem other) {
    _$v = other as _$CourseMaterialItem;
  }

  @override
  void update(void Function(CourseMaterialItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseMaterialItem build() => _build();

  _$CourseMaterialItem _build() {
    final _$result =
        _$v ??
        _$CourseMaterialItem._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'CourseMaterialItem',
            'id',
          ),
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'CourseMaterialItem',
            'lessonId',
          ),
          sectionId: BuiltValueNullFieldError.checkNotNull(
            sectionId,
            r'CourseMaterialItem',
            'sectionId',
          ),
          sectionTitle: BuiltValueNullFieldError.checkNotNull(
            sectionTitle,
            r'CourseMaterialItem',
            'sectionTitle',
          ),
          kind: BuiltValueNullFieldError.checkNotNull(
            kind,
            r'CourseMaterialItem',
            'kind',
          ),
          label: BuiltValueNullFieldError.checkNotNull(
            label,
            r'CourseMaterialItem',
            'label',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'CourseMaterialItem',
            'sizeBytes',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
