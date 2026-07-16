import 'package:flutter_test/flutter_test.dart';

import 'package:app_ui/app_ui.dart';

void main() {
  group('AppPasswordStrength.of', () {
    // Mirrors `AppPasswordField.spec.ts`'s strength-meter matrix verbatim —
    // the web `score` heuristic this is a Dart port of.
    const cases = <(String, AppPasswordStrength)>[
      ('', AppPasswordStrength.empty),
      ('abc', AppPasswordStrength.weak),
      ('aaaaaaaa', AppPasswordStrength.okay), // 8 chars, all lowercase
      ('abcdefghijkl', AppPasswordStrength.okay), // 12 chars, no symbol, ≤16
      ('ab1!', AppPasswordStrength.weak), // 4 chars -> weak (length < 8)
      ('abc!def@', AppPasswordStrength.okay), // 8 chars w/ symbols, <12
      ('abcdefghijkl1!', AppPasswordStrength.strong), // 14 chars w/ symbol
      ('abcdefghijklmnopq', AppPasswordStrength.strong), // 17 chars, no
      // symbol, >16
    ];

    for (final (value, expected) in cases) {
      test('"$value" -> ${expected.name}', () {
        expect(AppPasswordStrength.of(value), expected);
        expect(AppPasswordStrength.of(value).segments, expected.index);
      });
    }

    test('labels match the web scoreLabel computed prop', () {
      expect(AppPasswordStrength.empty.label, 'Empty');
      expect(AppPasswordStrength.weak.label, 'Weak');
      expect(AppPasswordStrength.okay.label, 'Okay');
      expect(AppPasswordStrength.strong.label, 'Strong');
    });
  });
}
