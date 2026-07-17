//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'date_range.g.dart';

/// Half-open interval `[from, to)`, both ISO-8601 with offset.
///
/// Properties:
/// * [from] - Inclusive lower bound.
/// * [to] - Exclusive upper bound.
@BuiltValue()
abstract class DateRange implements Built<DateRange, DateRangeBuilder> {
  /// Inclusive lower bound.
  @BuiltValueField(wireName: r'from')
  DateTime get from;

  /// Exclusive upper bound.
  @BuiltValueField(wireName: r'to')
  DateTime get to;

  DateRange._();

  factory DateRange([void updates(DateRangeBuilder b)]) = _$DateRange;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DateRangeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DateRange> get serializer => _$DateRangeSerializer();
}

class _$DateRangeSerializer implements PrimitiveSerializer<DateRange> {
  @override
  final Iterable<Type> types = const [DateRange, _$DateRange];

  @override
  final String wireName = r'DateRange';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DateRange object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'from';
    yield serializers.serialize(
      object.from,
      specifiedType: const FullType(DateTime),
    );
    yield r'to';
    yield serializers.serialize(
      object.to,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DateRange object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DateRangeBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'from':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.from = valueDes;
          break;
        case r'to':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.to = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DateRange deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DateRangeBuilder();
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

