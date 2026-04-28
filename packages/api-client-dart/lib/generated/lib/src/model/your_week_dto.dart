//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/date_range.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'your_week_dto.g.dart';

/// Roll-up of the requester's activity over the trailing seven days.
///
/// Properties:
/// * [minutesWatched] - Total whole minutes watched by the requester in the window. Computed by summing duration across `LessonProgress` rows whose `updatedAt` falls inside `range`.
/// * [lessonsCompleted] - Number of lessons the requester completed during the window. Counted from `LessonProgress.completedAt`.
/// * [range] 
@BuiltValue()
abstract class YourWeekDto implements Built<YourWeekDto, YourWeekDtoBuilder> {
  /// Total whole minutes watched by the requester in the window. Computed by summing duration across `LessonProgress` rows whose `updatedAt` falls inside `range`.
  @BuiltValueField(wireName: r'minutesWatched')
  int get minutesWatched;

  /// Number of lessons the requester completed during the window. Counted from `LessonProgress.completedAt`.
  @BuiltValueField(wireName: r'lessonsCompleted')
  int get lessonsCompleted;

  @BuiltValueField(wireName: r'range')
  DateRange get range;

  YourWeekDto._();

  factory YourWeekDto([void updates(YourWeekDtoBuilder b)]) = _$YourWeekDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(YourWeekDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<YourWeekDto> get serializer => _$YourWeekDtoSerializer();
}

class _$YourWeekDtoSerializer implements PrimitiveSerializer<YourWeekDto> {
  @override
  final Iterable<Type> types = const [YourWeekDto, _$YourWeekDto];

  @override
  final String wireName = r'YourWeekDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    YourWeekDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'minutesWatched';
    yield serializers.serialize(
      object.minutesWatched,
      specifiedType: const FullType(int),
    );
    yield r'lessonsCompleted';
    yield serializers.serialize(
      object.lessonsCompleted,
      specifiedType: const FullType(int),
    );
    yield r'range';
    yield serializers.serialize(
      object.range,
      specifiedType: const FullType(DateRange),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    YourWeekDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required YourWeekDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'minutesWatched':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.minutesWatched = valueDes;
          break;
        case r'lessonsCompleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsCompleted = valueDes;
          break;
        case r'range':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateRange),
          ) as DateRange;
          result.range.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  YourWeekDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = YourWeekDtoBuilder();
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

