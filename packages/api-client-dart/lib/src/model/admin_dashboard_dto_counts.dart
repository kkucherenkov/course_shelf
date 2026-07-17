//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_dashboard_dto_counts.g.dart';

/// AdminDashboardDtoCounts
///
/// Properties:
/// * [libraries] 
/// * [users] 
/// * [courses] 
/// * [lessons] 
@BuiltValue()
abstract class AdminDashboardDtoCounts implements Built<AdminDashboardDtoCounts, AdminDashboardDtoCountsBuilder> {
  @BuiltValueField(wireName: r'libraries')
  int get libraries;

  @BuiltValueField(wireName: r'users')
  int get users;

  @BuiltValueField(wireName: r'courses')
  int get courses;

  @BuiltValueField(wireName: r'lessons')
  int get lessons;

  AdminDashboardDtoCounts._();

  factory AdminDashboardDtoCounts([void updates(AdminDashboardDtoCountsBuilder b)]) = _$AdminDashboardDtoCounts;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminDashboardDtoCountsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminDashboardDtoCounts> get serializer => _$AdminDashboardDtoCountsSerializer();
}

class _$AdminDashboardDtoCountsSerializer implements PrimitiveSerializer<AdminDashboardDtoCounts> {
  @override
  final Iterable<Type> types = const [AdminDashboardDtoCounts, _$AdminDashboardDtoCounts];

  @override
  final String wireName = r'AdminDashboardDtoCounts';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminDashboardDtoCounts object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'libraries';
    yield serializers.serialize(
      object.libraries,
      specifiedType: const FullType(int),
    );
    yield r'users';
    yield serializers.serialize(
      object.users,
      specifiedType: const FullType(int),
    );
    yield r'courses';
    yield serializers.serialize(
      object.courses,
      specifiedType: const FullType(int),
    );
    yield r'lessons';
    yield serializers.serialize(
      object.lessons,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminDashboardDtoCounts object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminDashboardDtoCountsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'libraries':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.libraries = valueDes;
          break;
        case r'users':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.users = valueDes;
          break;
        case r'courses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.courses = valueDes;
          break;
        case r'lessons':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessons = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminDashboardDtoCounts deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminDashboardDtoCountsBuilder();
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

