import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// The "CS · CourseShelf" lockup at the top of every auth screen.
///
/// Mobile twin of `apps/web/app/components/auth/AuthBrand.vue` and of
/// `AuthBrand` in `docs/design/shared/auth.jsx`. Deliberately an **app-level**
/// widget, not an `app_ui` component: web's lockup is app-level too
/// (`app/components/auth/`, not `@app/ui`), and the card's call for an
/// `AppBrand` catalog component describes something neither platform has.
///
/// The mark is decorative — the wordmark next to it already names the app, so
/// announcing "CS" as well would just be noise to a screen reader.
class AuthBrand extends StatelessWidget {
  const AuthBrand({super.key});

  /// Brand lockup square. Not a spacing token — it is the logo's own size.
  static const double _markSize = 36;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ExcludeSemantics(
          child: Container(
            width: _markSize,
            height: _markSize,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Text(
              'CS',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.s3),
        Text(
          // The product name is a proper noun — it is not translated, and
          // `common.appTitle` is the same literal in all four locales.
          'CourseShelf',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
