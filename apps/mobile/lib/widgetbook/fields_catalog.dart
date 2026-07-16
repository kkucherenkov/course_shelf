import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

const _fruits = <AppSelectOption>[
  AppSelectOption(id: 'apple', label: 'Apple'),
  AppSelectOption(id: 'banana', label: 'Banana'),
  AppSelectOption(id: 'cherry', label: 'Cherry (seasonal)', disabled: true),
];

/// Widgetbook components cataloguing the `app_ui` form-field family —
/// `AppTextField`, `AppNumberField`, `AppSearchField`, `AppSelect`,
/// `AppSwitch`, `AppCheckbox`, and `AppRadio` — one [WidgetbookComponent] per
/// field, one use case per state.
List<WidgetbookComponent> buildFieldComponents() {
  return [
    _buildAppTextFieldComponent(),
    _buildAppNumberFieldComponent(),
    _buildAppSearchFieldComponent(),
    _buildAppSelectComponent(),
    _buildAppSwitchComponent(),
    _buildAppCheckboxComponent(),
    _buildAppRadioComponent(),
  ];
}

Widget _column(List<Widget> children) => Center(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: SizedBox(
      width: 320,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final child in children)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: child,
            ),
        ],
      ),
    ),
  ),
);

WidgetbookComponent _buildAppTextFieldComponent() {
  return WidgetbookComponent(
    name: 'AppTextField',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _textFieldDefault),
      WidgetbookUseCase(name: 'With value', builder: _textFieldWithValue),
      WidgetbookUseCase(name: 'Error', builder: _textFieldError),
      WidgetbookUseCase(name: 'Disabled', builder: _textFieldDisabled),
      WidgetbookUseCase(name: 'Password', builder: _textFieldPassword),
    ],
  );
}

Widget _textFieldDefault(BuildContext context) => _column([
  const AppTextField(
    label: 'Email',
    value: '',
    placeholder: 'you@example.com',
    required: true,
  ),
]);

Widget _textFieldWithValue(BuildContext context) =>
    _column([const AppTextField(label: 'Email', value: 'ada@example.com')]);

Widget _textFieldError(BuildContext context) => _column([
  const AppTextField(
    label: 'Email',
    value: '',
    error: 'This field is required.',
  ),
]);

Widget _textFieldDisabled(BuildContext context) => _column([
  const AppTextField(label: 'Email', value: 'Locked', disabled: true),
]);

Widget _textFieldPassword(BuildContext context) => _column([
  const AppTextField(
    label: 'Password',
    value: 'secret',
    type: AppTextFieldType.password,
  ),
]);

WidgetbookComponent _buildAppNumberFieldComponent() {
  return WidgetbookComponent(
    name: 'AppNumberField',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _numberFieldDefault),
      WidgetbookUseCase(name: 'At min/max', builder: _numberFieldAtLimits),
      WidgetbookUseCase(name: 'Error', builder: _numberFieldError),
      WidgetbookUseCase(name: 'Disabled', builder: _numberFieldDisabled),
    ],
  );
}

Widget _numberFieldDefault(BuildContext context) =>
    _column([const AppNumberField(label: 'Quantity', value: 3)]);

Widget _numberFieldAtLimits(BuildContext context) => _column([
  const AppNumberField(
    label: 'At min (decrement disabled)',
    value: 0,
    min: 0,
    max: 10,
  ),
  const AppNumberField(
    label: 'At max (increment disabled)',
    value: 10,
    min: 0,
    max: 10,
  ),
]);

Widget _numberFieldError(BuildContext context) => _column([
  const AppNumberField(
    label: 'Quantity',
    value: null,
    error: 'Enter a quantity.',
  ),
]);

Widget _numberFieldDisabled(BuildContext context) => _column([
  const AppNumberField(label: 'Quantity', value: 5, disabled: true),
]);

WidgetbookComponent _buildAppSearchFieldComponent() {
  return WidgetbookComponent(
    name: 'AppSearchField',
    useCases: [
      WidgetbookUseCase(name: 'Default', builder: _searchFieldDefault),
      WidgetbookUseCase(name: 'With value', builder: _searchFieldWithValue),
      WidgetbookUseCase(name: 'Error', builder: _searchFieldError),
      WidgetbookUseCase(name: 'Disabled', builder: _searchFieldDisabled),
    ],
  );
}

Widget _searchFieldDefault(BuildContext context) => _column([
  const AppSearchField(
    label: 'Search',
    value: '',
    placeholder: 'Search courses…',
  ),
]);

Widget _searchFieldWithValue(BuildContext context) =>
    _column([const AppSearchField(label: 'Search', value: 'flutter')]);

Widget _searchFieldError(BuildContext context) => _column([
  const AppSearchField(
    label: 'Search',
    value: '',
    error: 'No results match that search.',
  ),
]);

Widget _searchFieldDisabled(BuildContext context) => _column([
  const AppSearchField(label: 'Search', value: 'flutter', disabled: true),
]);

WidgetbookComponent _buildAppSelectComponent() {
  return WidgetbookComponent(
    name: 'AppSelect',
    useCases: [
      WidgetbookUseCase(name: 'Placeholder', builder: _selectPlaceholder),
      WidgetbookUseCase(name: 'With value', builder: _selectWithValue),
      WidgetbookUseCase(name: 'Invalid', builder: _selectInvalid),
      WidgetbookUseCase(name: 'Disabled', builder: _selectDisabled),
    ],
  );
}

Widget _selectPlaceholder(BuildContext context) =>
    _column([const AppSelect(options: _fruits, placeholder: 'Pick a fruit…')]);

Widget _selectWithValue(BuildContext context) =>
    _column([const AppSelect(options: _fruits, value: 'banana')]);

Widget _selectInvalid(BuildContext context) => _column([
  const AppSelect(
    options: _fruits,
    placeholder: 'Pick a fruit…',
    invalid: true,
  ),
]);

Widget _selectDisabled(BuildContext context) => _column([
  const AppSelect(options: _fruits, value: 'apple', disabled: true),
]);

WidgetbookComponent _buildAppSwitchComponent() {
  return WidgetbookComponent(
    name: 'AppSwitch',
    useCases: [
      WidgetbookUseCase(name: 'Sizes', builder: _switchSizes),
      WidgetbookUseCase(name: 'Colors', builder: _switchColors),
      WidgetbookUseCase(name: 'States', builder: _switchStates),
    ],
  );
}

Widget _switchSizes(BuildContext context) => _column([
  for (final size in AppSwitchSize.values)
    AppSwitch(value: true, label: size.name, size: size),
]);

Widget _switchColors(BuildContext context) => _column([
  for (final color in AppSwitchColor.values)
    AppSwitch(value: true, label: color.name, color: color),
]);

Widget _switchStates(BuildContext context) => _column([
  const AppSwitch(value: false, label: 'Off'),
  const AppSwitch(value: true, label: 'On'),
  const AppSwitch(value: true, label: 'Disabled', disabled: true),
]);

WidgetbookComponent _buildAppCheckboxComponent() {
  return WidgetbookComponent(
    name: 'AppCheckbox',
    useCases: [WidgetbookUseCase(name: 'States', builder: _checkboxStates)],
  );
}

Widget _checkboxStates(BuildContext context) => _column([
  const AppCheckbox(value: false, label: 'Unchecked'),
  const AppCheckbox(value: true, label: 'Checked'),
  const AppCheckbox(value: false, indeterminate: true, label: 'Indeterminate'),
  const AppCheckbox(value: true, label: 'Required', required: true),
  const AppCheckbox(value: true, label: 'Disabled', disabled: true),
]);

WidgetbookComponent _buildAppRadioComponent() {
  return WidgetbookComponent(
    name: 'AppRadio',
    useCases: [WidgetbookUseCase(name: 'States', builder: _radioStates)],
  );
}

Widget _radioStates(BuildContext context) => _column([
  const AppRadio<String>(value: 'a', groupValue: 'a', label: 'Selected'),
  const AppRadio<String>(value: 'a', groupValue: 'b', label: 'Unselected'),
  const AppRadio<String>(
    value: 'a',
    groupValue: 'a',
    label: 'Disabled, selected',
    disabled: true,
  ),
  const AppRadio<String>(
    value: 'a',
    groupValue: 'b',
    label: 'Disabled, unselected',
    disabled: true,
  ),
]);
