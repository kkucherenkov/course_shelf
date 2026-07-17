//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/identify_task_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'identify_task_list_dto.g.dart';

/// Identify tasks, newest first.
///
/// Properties:
/// * [tasks] 
@BuiltValue()
abstract class IdentifyTaskListDto implements Built<IdentifyTaskListDto, IdentifyTaskListDtoBuilder> {
  @BuiltValueField(wireName: r'tasks')
  BuiltList<IdentifyTaskDto> get tasks;

  IdentifyTaskListDto._();

  factory IdentifyTaskListDto([void updates(IdentifyTaskListDtoBuilder b)]) = _$IdentifyTaskListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(IdentifyTaskListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<IdentifyTaskListDto> get serializer => _$IdentifyTaskListDtoSerializer();
}

class _$IdentifyTaskListDtoSerializer implements PrimitiveSerializer<IdentifyTaskListDto> {
  @override
  final Iterable<Type> types = const [IdentifyTaskListDto, _$IdentifyTaskListDto];

  @override
  final String wireName = r'IdentifyTaskListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    IdentifyTaskListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tasks';
    yield serializers.serialize(
      object.tasks,
      specifiedType: const FullType(BuiltList, [FullType(IdentifyTaskDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    IdentifyTaskListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required IdentifyTaskListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tasks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(IdentifyTaskDto)]),
          ) as BuiltList<IdentifyTaskDto>;
          result.tasks.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  IdentifyTaskListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = IdentifyTaskListDtoBuilder();
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

