//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/merge_mode.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'merge_policy_dto.g.dart';

/// Per-field merge mode. Any omitted field defaults to `merge`.
///
/// Properties:
/// * [title] 
/// * [description] 
/// * [level] 
/// * [language] 
/// * [posterUrl] 
/// * [releaseDate] 
/// * [ratingAverage] 
/// * [ratingCount] 
/// * [instructors] 
/// * [studios] 
/// * [tags] 
/// * [externalIds] 
@BuiltValue()
abstract class MergePolicyDto implements Built<MergePolicyDto, MergePolicyDtoBuilder> {
  @BuiltValueField(wireName: r'title')
  MergeMode? get title;
  // enum titleEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'description')
  MergeMode? get description;
  // enum descriptionEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'level')
  MergeMode? get level;
  // enum levelEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'language')
  MergeMode? get language;
  // enum languageEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'posterUrl')
  MergeMode? get posterUrl;
  // enum posterUrlEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'releaseDate')
  MergeMode? get releaseDate;
  // enum releaseDateEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'ratingAverage')
  MergeMode? get ratingAverage;
  // enum ratingAverageEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'ratingCount')
  MergeMode? get ratingCount;
  // enum ratingCountEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'instructors')
  MergeMode? get instructors;
  // enum instructorsEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'studios')
  MergeMode? get studios;
  // enum studiosEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'tags')
  MergeMode? get tags;
  // enum tagsEnum {  merge,  overwrite,  ignore,  };

  @BuiltValueField(wireName: r'externalIds')
  MergeMode? get externalIds;
  // enum externalIdsEnum {  merge,  overwrite,  ignore,  };

  MergePolicyDto._();

  factory MergePolicyDto([void updates(MergePolicyDtoBuilder b)]) = _$MergePolicyDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MergePolicyDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MergePolicyDto> get serializer => _$MergePolicyDtoSerializer();
}

class _$MergePolicyDtoSerializer implements PrimitiveSerializer<MergePolicyDto> {
  @override
  final Iterable<Type> types = const [MergePolicyDto, _$MergePolicyDto];

  @override
  final String wireName = r'MergePolicyDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MergePolicyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.level != null) {
      yield r'level';
      yield serializers.serialize(
        object.level,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.language != null) {
      yield r'language';
      yield serializers.serialize(
        object.language,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.posterUrl != null) {
      yield r'posterUrl';
      yield serializers.serialize(
        object.posterUrl,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.releaseDate != null) {
      yield r'releaseDate';
      yield serializers.serialize(
        object.releaseDate,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.ratingAverage != null) {
      yield r'ratingAverage';
      yield serializers.serialize(
        object.ratingAverage,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.ratingCount != null) {
      yield r'ratingCount';
      yield serializers.serialize(
        object.ratingCount,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.instructors != null) {
      yield r'instructors';
      yield serializers.serialize(
        object.instructors,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.studios != null) {
      yield r'studios';
      yield serializers.serialize(
        object.studios,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(MergeMode),
      );
    }
    if (object.externalIds != null) {
      yield r'externalIds';
      yield serializers.serialize(
        object.externalIds,
        specifiedType: const FullType(MergeMode),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    MergePolicyDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MergePolicyDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.description = valueDes;
          break;
        case r'level':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.level = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.language = valueDes;
          break;
        case r'posterUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.posterUrl = valueDes;
          break;
        case r'releaseDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.releaseDate = valueDes;
          break;
        case r'ratingAverage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.ratingAverage = valueDes;
          break;
        case r'ratingCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.ratingCount = valueDes;
          break;
        case r'instructors':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.instructors = valueDes;
          break;
        case r'studios':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.studios = valueDes;
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.tags = valueDes;
          break;
        case r'externalIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergeMode),
          ) as MergeMode;
          result.externalIds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MergePolicyDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MergePolicyDtoBuilder();
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

