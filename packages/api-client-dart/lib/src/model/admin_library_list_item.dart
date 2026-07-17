//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_library_list_item_scan.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_library_list_item.g.dart';

/// One row in the admin libraries list. Same backbone as `LibraryDto` plus computed `coursesCount`, `lessonsCount` and an embedded `lastScan` summary (or `null` when no scan has ever run).
///
/// Properties:
/// * [id] 
/// * [name] 
/// * [rootPath] 
/// * [coursesCount] 
/// * [lessonsCount] 
/// * [lastScan] 
@BuiltValue()
abstract class AdminLibraryListItem implements Built<AdminLibraryListItem, AdminLibraryListItemBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'rootPath')
  String get rootPath;

  @BuiltValueField(wireName: r'coursesCount')
  int get coursesCount;

  @BuiltValueField(wireName: r'lessonsCount')
  int get lessonsCount;

  @BuiltValueField(wireName: r'lastScan')
  AdminLibraryListItemScan? get lastScan;

  AdminLibraryListItem._();

  factory AdminLibraryListItem([void updates(AdminLibraryListItemBuilder b)]) = _$AdminLibraryListItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminLibraryListItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminLibraryListItem> get serializer => _$AdminLibraryListItemSerializer();
}

class _$AdminLibraryListItemSerializer implements PrimitiveSerializer<AdminLibraryListItem> {
  @override
  final Iterable<Type> types = const [AdminLibraryListItem, _$AdminLibraryListItem];

  @override
  final String wireName = r'AdminLibraryListItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminLibraryListItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'rootPath';
    yield serializers.serialize(
      object.rootPath,
      specifiedType: const FullType(String),
    );
    yield r'coursesCount';
    yield serializers.serialize(
      object.coursesCount,
      specifiedType: const FullType(int),
    );
    yield r'lessonsCount';
    yield serializers.serialize(
      object.lessonsCount,
      specifiedType: const FullType(int),
    );
    yield r'lastScan';
    yield object.lastScan == null ? null : serializers.serialize(
      object.lastScan,
      specifiedType: const FullType.nullable(AdminLibraryListItemScan),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminLibraryListItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminLibraryListItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'rootPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.rootPath = valueDes;
          break;
        case r'coursesCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.coursesCount = valueDes;
          break;
        case r'lessonsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsCount = valueDes;
          break;
        case r'lastScan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(AdminLibraryListItemScan),
          ) as AdminLibraryListItemScan?;
          if (valueDes == null) continue;
          result.lastScan.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminLibraryListItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminLibraryListItemBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

