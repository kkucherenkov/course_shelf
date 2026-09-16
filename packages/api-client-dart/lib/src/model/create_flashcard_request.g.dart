// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_flashcard_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateFlashcardRequest extends CreateFlashcardRequest {
  @override
  final String front;
  @override
  final String back;
  @override
  final String? sourceCueId;

  factory _$CreateFlashcardRequest([
    void Function(CreateFlashcardRequestBuilder)? updates,
  ]) => (CreateFlashcardRequestBuilder()..update(updates))._build();

  _$CreateFlashcardRequest._({
    required this.front,
    required this.back,
    this.sourceCueId,
  }) : super._();
  @override
  CreateFlashcardRequest rebuild(
    void Function(CreateFlashcardRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  CreateFlashcardRequestBuilder toBuilder() =>
      CreateFlashcardRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateFlashcardRequest &&
        front == other.front &&
        back == other.back &&
        sourceCueId == other.sourceCueId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, front.hashCode);
    _$hash = $jc(_$hash, back.hashCode);
    _$hash = $jc(_$hash, sourceCueId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateFlashcardRequest')
          ..add('front', front)
          ..add('back', back)
          ..add('sourceCueId', sourceCueId))
        .toString();
  }
}

class CreateFlashcardRequestBuilder
    implements Builder<CreateFlashcardRequest, CreateFlashcardRequestBuilder> {
  _$CreateFlashcardRequest? _$v;

  String? _front;
  String? get front => _$this._front;
  set front(String? front) => _$this._front = front;

  String? _back;
  String? get back => _$this._back;
  set back(String? back) => _$this._back = back;

  String? _sourceCueId;
  String? get sourceCueId => _$this._sourceCueId;
  set sourceCueId(String? sourceCueId) => _$this._sourceCueId = sourceCueId;

  CreateFlashcardRequestBuilder() {
    CreateFlashcardRequest._defaults(this);
  }

  CreateFlashcardRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _front = $v.front;
      _back = $v.back;
      _sourceCueId = $v.sourceCueId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateFlashcardRequest other) {
    _$v = other as _$CreateFlashcardRequest;
  }

  @override
  void update(void Function(CreateFlashcardRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateFlashcardRequest build() => _build();

  _$CreateFlashcardRequest _build() {
    final _$result =
        _$v ??
        _$CreateFlashcardRequest._(
          front: BuiltValueNullFieldError.checkNotNull(
            front,
            r'CreateFlashcardRequest',
            'front',
          ),
          back: BuiltValueNullFieldError.checkNotNull(
            back,
            r'CreateFlashcardRequest',
            'back',
          ),
          sourceCueId: sourceCueId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
