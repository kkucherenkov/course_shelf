//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'bookmark_dto.g.dart';

/// A single user-owned bookmark pinned to a position within a lesson.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this bookmark.
/// * [lessonId] - cuid of the lesson this bookmark belongs to.
/// * [positionSeconds] - Playback position in seconds where the bookmark is pinned.
/// * [label] - Free-form label. Trimmed server-side; absent means the bookmark has no label.
/// * [createdAt] - ISO-8601 instant when the bookmark was created.
/// * [updatedAt] - ISO-8601 instant when the bookmark was last updated.
@BuiltValue()
abstract class BookmarkDto implements Built<BookmarkDto, BookmarkDtoBuilder> {
  /// Server-generated cuid identifying this bookmark.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// cuid of the lesson this bookmark belongs to.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  /// Playback position in seconds where the bookmark is pinned.
  @BuiltValueField(wireName: r'positionSeconds')
  int get positionSeconds;

  /// Free-form label. Trimmed server-side; absent means the bookmark has no label.
  @BuiltValueField(wireName: r'label')
  String? get label;

  /// ISO-8601 instant when the bookmark was created.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// ISO-8601 instant when the bookmark was last updated.
  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  BookmarkDto._();

  factory BookmarkDto([void updates(BookmarkDtoBuilder b)]) = _$BookmarkDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BookmarkDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BookmarkDto> get serializer => _$BookmarkDtoSerializer();
}

class _$BookmarkDtoSerializer implements PrimitiveSerializer<BookmarkDto> {
  @override
  final Iterable<Type> types = const [BookmarkDto, _$BookmarkDto];

  @override
  final String wireName = r'BookmarkDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BookmarkDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'positionSeconds';
    yield serializers.serialize(
      object.positionSeconds,
      specifiedType: const FullType(int),
    );
    if (object.label != null) {
      yield r'label';
      yield serializers.serialize(
        object.label,
        specifiedType: const FullType(String),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BookmarkDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BookmarkDtoBuilder result,
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
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'positionSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.positionSeconds = valueDes;
          break;
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BookmarkDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BookmarkDtoBuilder();
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

