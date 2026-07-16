/// Password strength levels shown by [AppPasswordField]'s meter — Flutter
/// twin of the `score` heuristic computed inside the web `AppPasswordField`
/// (`packages/ui/src/components/AppPasswordField/AppPasswordField.vue`).
///
/// Enum declaration order doubles as the 0-3 score the web component derives
/// (`empty` == 0 … `strong` == 3), so [segments] below is a plain `index`
/// read rather than a second mapping that could drift out of sync.
enum AppPasswordStrength {
  empty,
  weak,
  okay,
  strong;

  /// Computes the strength for [value] — a verbatim port of the web
  /// heuristic (comment there: "Score heuristic copied verbatim from
  /// `docs/design/shared/auth.jsx` §PasswordField"):
  ///
  /// - empty string -> [empty]
  /// - fewer than 8 chars -> [weak]
  /// - fewer than 12 chars -> [okay]
  /// - a non-alphanumeric char, OR longer than 16 chars -> [strong]
  /// - otherwise (8-16 alphanumeric chars) -> [okay]
  factory AppPasswordStrength.of(String value) {
    if (value.isEmpty) return AppPasswordStrength.empty;
    if (value.length < 8) return AppPasswordStrength.weak;
    if (value.length < 12) return AppPasswordStrength.okay;
    if (_hasSymbol(value) || value.length > 16) {
      return AppPasswordStrength.strong;
    }
    return AppPasswordStrength.okay;
  }

  static final RegExp _nonAlphaNumeric = RegExp(
    '[^a-z0-9]',
    caseSensitive: false,
  );

  static bool _hasSymbol(String value) => _nonAlphaNumeric.hasMatch(value);

  /// Number of the 3 meter segments that should render filled — mirrors the
  /// web `v-for="i in 3"` / `score >= i` comparison directly (`empty` -> 0,
  /// `weak` -> 1, `okay` -> 2, `strong` -> 3).
  int get segments => index;

  /// English label matching the web `scoreLabel` computed prop. Not a widget
  /// constructor parameter on the web twin (no prop overrides it there
  /// either) — kept as a fixed literal here for the same reason.
  String get label => switch (this) {
    AppPasswordStrength.empty => 'Empty',
    AppPasswordStrength.weak => 'Weak',
    AppPasswordStrength.okay => 'Okay',
    AppPasswordStrength.strong => 'Strong',
  };
}
