// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_flashcard_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateFlashcardRequest extends UpdateFlashcardRequest {
  @override
  final String? front;
  @override
  final String? back;

  factory _$UpdateFlashcardRequest([
    void Function(UpdateFlashcardRequestBuilder)? updates,
  ]) => (UpdateFlashcardRequestBuilder()..update(updates))._build();

  _$UpdateFlashcardRequest._({this.front, this.back}) : super._();
  @override
  UpdateFlashcardRequest rebuild(
    void Function(UpdateFlashcardRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpdateFlashcardRequestBuilder toBuilder() =>
      UpdateFlashcardRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateFlashcardRequest &&
        front == other.front &&
        back == other.back;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, front.hashCode);
    _$hash = $jc(_$hash, back.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateFlashcardRequest')
          ..add('front', front)
          ..add('back', back))
        .toString();
  }
}

class UpdateFlashcardRequestBuilder
    implements Builder<UpdateFlashcardRequest, UpdateFlashcardRequestBuilder> {
  _$UpdateFlashcardRequest? _$v;

  String? _front;
  String? get front => _$this._front;
  set front(String? front) => _$this._front = front;

  String? _back;
  String? get back => _$this._back;
  set back(String? back) => _$this._back = back;

  UpdateFlashcardRequestBuilder() {
    UpdateFlashcardRequest._defaults(this);
  }

  UpdateFlashcardRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _front = $v.front;
      _back = $v.back;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateFlashcardRequest other) {
    _$v = other as _$UpdateFlashcardRequest;
  }

  @override
  void update(void Function(UpdateFlashcardRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateFlashcardRequest build() => _build();

  _$UpdateFlashcardRequest _build() {
    final _$result =
        _$v ?? _$UpdateFlashcardRequest._(front: front, back: back);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
