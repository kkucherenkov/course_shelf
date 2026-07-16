import 'package:flutter/material.dart';

/// Placeholder widget that seeds the Widgetbook catalog (card E16-F01-S01).
///
/// Deliberately app-local rather than part of `app_ui`, so it never collides
/// with the real `AppButton` that E17-F01-S02 adds to the component library.
/// It is a thin [FilledButton] wrapper, so it visibly picks up the app theme
/// (`colorScheme.primary`, `filledButtonTheme`). Remove once real `app_ui`
/// components are registered in the catalog.
class CanaryButton extends StatelessWidget {
  const CanaryButton({
    required this.label,
    required this.onPressed,
    super.key,
  });

  /// Text shown inside the button.
  final String label;

  /// Tap handler; when `null` the button renders in its disabled state.
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}
