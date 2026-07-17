import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

/// One step in [AuthStepper]. [label] is already localized by the caller.
class AuthStepDef {
  const AuthStepDef({required this.id, required this.label});

  final String id;
  final String label;
}

/// Progress header for the sign-up wizard.
///
/// Mobile twin of `apps/web/app/components/auth/AuthStepper.vue` and the
/// `auth-stepper` block in `docs/design/shared/auth.jsx`: a numbered dot per
/// step, a tick once passed, connectors between.
///
/// The step list is *derived* by the caller — when the instance does not
/// require email verification the wizard is 2 steps, not 3, so numbering must
/// come from position in [steps] rather than a fixed 1..3.
class AuthStepper extends StatelessWidget {
  const AuthStepper({
    required this.steps,
    required this.current,
    this.semanticLabel = 'Progress',
    super.key,
  });

  final List<AuthStepDef> steps;

  /// [AuthStepDef.id] of the active step.
  final String current;

  /// Web renders `<nav aria-label="Progress">`; the app layer supplies the
  /// localized string, per the catalog's string-injection convention.
  final String semanticLabel;

  /// Step dot. Sized to the design's 24px circle, not a spacing token.
  static const double _dotSize = 24;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentIndex = steps.indexWhere((s) => s.id == current);

    return Semantics(
      container: true,
      label: semanticLabel,
      child: Row(
        children: [
          for (final (index, step) in steps.indexed) ...[
            _StepDot(
              index: index,
              currentIndex: currentIndex,
              label: step.label,
              size: _dotSize,
            ),
            if (index < steps.length - 1)
              Expanded(
                child: Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
                  color: index < currentIndex
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outlineVariant,
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({
    required this.index,
    required this.currentIndex,
    required this.label,
    required this.size,
  });

  final int index;
  final int currentIndex;
  final String label;
  final double size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDone = index < currentIndex;
    final isCurrent = index == currentIndex;

    final background = isDone || isCurrent
        ? theme.colorScheme.primary
        : theme.colorScheme.surfaceContainerHighest;
    final foreground = isDone || isCurrent
        ? theme.colorScheme.onPrimary
        : theme.colorScheme.onSurfaceVariant;

    return Semantics(
      // Web marks the active step `aria-current="step"`; this is the closest
      // Flutter equivalent that still reads the label out.
      selected: isCurrent,
      label: label,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ExcludeSemantics(
            child: Container(
              width: size,
              height: size,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: background,
                shape: BoxShape.circle,
              ),
              child: isDone
                  ? IconCS(name: IconName.check, size: 12, color: foreground)
                  : Text(
                      '${index + 1}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: foreground,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: AppSpacing.s2),
          ExcludeSemantics(
            child: Text(
              label,
              style: theme.textTheme.labelMedium?.copyWith(
                color: isCurrent
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
