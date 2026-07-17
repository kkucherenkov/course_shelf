// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'identify_task_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$IdentifyTaskListDto extends IdentifyTaskListDto {
  @override
  final BuiltList<IdentifyTaskDto> tasks;

  factory _$IdentifyTaskListDto([
    void Function(IdentifyTaskListDtoBuilder)? updates,
  ]) => (IdentifyTaskListDtoBuilder()..update(updates))._build();

  _$IdentifyTaskListDto._({required this.tasks}) : super._();
  @override
  IdentifyTaskListDto rebuild(
    void Function(IdentifyTaskListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  IdentifyTaskListDtoBuilder toBuilder() =>
      IdentifyTaskListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is IdentifyTaskListDto && tasks == other.tasks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tasks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'IdentifyTaskListDto',
    )..add('tasks', tasks)).toString();
  }
}

class IdentifyTaskListDtoBuilder
    implements Builder<IdentifyTaskListDto, IdentifyTaskListDtoBuilder> {
  _$IdentifyTaskListDto? _$v;

  ListBuilder<IdentifyTaskDto>? _tasks;
  ListBuilder<IdentifyTaskDto> get tasks =>
      _$this._tasks ??= ListBuilder<IdentifyTaskDto>();
  set tasks(ListBuilder<IdentifyTaskDto>? tasks) => _$this._tasks = tasks;

  IdentifyTaskListDtoBuilder() {
    IdentifyTaskListDto._defaults(this);
  }

  IdentifyTaskListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tasks = $v.tasks.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(IdentifyTaskListDto other) {
    _$v = other as _$IdentifyTaskListDto;
  }

  @override
  void update(void Function(IdentifyTaskListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  IdentifyTaskListDto build() => _build();

  _$IdentifyTaskListDto _build() {
    _$IdentifyTaskListDto _$result;
    try {
      _$result = _$v ?? _$IdentifyTaskListDto._(tasks: tasks.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tasks';
        tasks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'IdentifyTaskListDto',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
