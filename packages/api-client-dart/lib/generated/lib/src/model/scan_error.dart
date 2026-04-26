//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'scan_error.g.dart';

/// A non-fatal error encountered while processing a single file during a scan.
///
/// Properties:
/// * [path] - Filesystem path relative to the library root, e.g. `01 - Intro to DDD/03 - Aggregates.mp4`.
/// * [message] - Human-readable description of what went wrong.
/// * [code] - Machine-readable error key (e.g. `course-json-invalid`, `unreadable-file`, `unsupported-extension`).
@BuiltValue()
abstract class ScanError implements Built<ScanError, ScanErrorBuilder> {
  /// Filesystem path relative to the library root, e.g. `01 - Intro to DDD/03 - Aggregates.mp4`.
  @BuiltValueField(wireName: r'path')
  String get path;

  /// Human-readable description of what went wrong.
  @BuiltValueField(wireName: r'message')
  String get message;

  /// Machine-readable error key (e.g. `course-json-invalid`, `unreadable-file`, `unsupported-extension`).
  @BuiltValueField(wireName: r'code')
  String? get code;

  ScanError._();

  factory ScanError([void updates(ScanErrorBuilder b)]) = _$ScanError;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ScanErrorBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ScanError> get serializer => _$ScanErrorSerializer();
}

class _$ScanErrorSerializer implements PrimitiveSerializer<ScanError> {
  @override
  final Iterable<Type> types = const [ScanError, _$ScanError];

  @override
  final String wireName = r'ScanError';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ScanError object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'path';
    yield serializers.serialize(
      object.path,
      specifiedType: const FullType(String),
    );
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    if (object.code != null) {
      yield r'code';
      yield serializers.serialize(
        object.code,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ScanError object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ScanErrorBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'path':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.path = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ScanError deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ScanErrorBuilder();
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

