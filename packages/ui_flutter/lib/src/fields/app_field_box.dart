import 'package:flutter/material.dart';

import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Bordered, focus-aware box shared by [AppTextField], [AppNumberField], and
/// [AppSearchField] — Flutter twin of the web `AppInput` chrome (background,
/// border, radius, focus ring).
///
/// Deliberately carries no error/invalid flag: the web `AppInput` has no
/// `[aria-invalid]` styling of its own (unlike `AppSelect`, which does) — its
/// error state surfaces only through [AppFieldFrame]'s message text below,
/// never the border. Omitting the flag here keeps that fidelity rather than
/// inventing a look the source doesn't have.
class AppFieldBox extends StatefulWidget {
  const AppFieldBox({
    required this.child,
    required this.focusNode,
    required this.size,
    this.enabled = true,
    this.padding,
    super.key,
  });

  final Widget child;
  final FocusNode focusNode;
  final AppFieldSize size;
  final bool enabled;
  final EdgeInsetsGeometry? padding;

  @override
  State<AppFieldBox> createState() => _AppFieldBoxState();
}

class _AppFieldBoxState extends State<AppFieldBox> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(covariant AppFieldBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode.removeListener(_onFocusChange);
      widget.focusNode.addListener(_onFocusChange);
    }
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusChange);
    super.dispose();
  }

  void _onFocusChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final sem = context.semanticColors;
    final focused = widget.focusNode.hasFocus;

    return AnimatedContainer(
      duration: AppDuration.fast,
      curve: AppEasing.easeDefault,
      height: widget.size.height,
      padding:
          widget.padding ??
          EdgeInsets.symmetric(horizontal: widget.size.horizontalPadding),
      decoration: BoxDecoration(
        color: widget.enabled ? cs.surface : sem.raised,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: focused ? cs.primary : cs.outline),
        boxShadow: focused ? context.shadows.focus : null,
      ),
      alignment: Alignment.centerLeft,
      child: widget.child,
    );
  }
}
