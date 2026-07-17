import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:app_ui/src/bookmarks/bookmark_draft.dart';
import 'package:app_ui/src/bookmarks/bookmark_time.dart';
import 'package:app_ui/src/buttons/app_button.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/fields/app_field_box.dart';
import 'package:app_ui/src/fields/app_field_size.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The "add a bookmark at the current time" affordance — Flutter twin of the
/// web `AppBookmarkAdd`.
///
/// A [time] chip, a bare label input (owns its text via an internal
/// controller — unlike `AppTextField`, there is no visible field label here,
/// matching the web's bare `<AppInput>`), a cancel [AppIconButton], and a Save
/// [AppButton]. [onSave] fires with a [BookmarkDraft] (`time` + the trimmed
/// label) and clears the input; [onCancel] fires (and also clears) on either
/// the cancel control or Escape.
///
/// Deviations from the web `AppBookmarkAdd.vue` (documented, not
/// oversights):
///  - **[AppFieldBox], not [AppTextField].** `AppTextField` always renders a
///    label row via `AppFieldFrame`; the web's bare `AppInput` (`size="sm"`,
///    `aria-label` only, no visible label) has no such row. `AppFieldBox` is
///    the web `AppInput`'s own chrome (background/border/radius/focus ring)
///    without the label wrapper — the correct-shaped primitive to reuse.
///  - **Solid border, not dashed.** The web wrapper is `1px dashed`; this
///    package has no dashed-border primitive (out of this card's scope to
///    add one). Solid, same colour/width, is the closest approximation.
///  - **A visible cancel control, which the web has no counterpart for.**
///    The web offers cancel on Escape only — sound there, since a browser
///    always has a keyboard. On a touch phone that makes `onCancel`
///    unreachable, so the sole trigger would be dead code on this package's
///    primary platform. The Escape binding is kept (external keyboards and
///    tablets exist) and both paths route through the same handler; the
///    icon-only control takes [cancelLabel] as its accessible name. A
///    mobile-idiom divergence, not a parity break.
///
/// [submitting] gates cancel exactly as it gates Save: mid-save the row is
/// inert (field disabled, Save spinning), and cancel cannot abort a request
/// this widget has no handle on — firing [onCancel] then would tell the
/// parent "dismissed" while the create still lands, orphaning a bookmark the
/// user believes they discarded. The disabled field already denies focus, so
/// Escape was inert while submitting regardless; the guard in the handler
/// makes that explicit rather than emergent.
class AppBookmarkAdd extends StatefulWidget {
  const AppBookmarkAdd({
    required this.time,
    this.submitting = false,
    this.placeholder = 'Add a label (optional)',
    this.cancelLabel = 'Cancel adding bookmark',
    this.onSave,
    this.onCancel,
    super.key,
  });

  /// Current playhead time, in seconds.
  final double time;

  /// Disables Save (and blocks Enter-to-save) while a parent is persisting
  /// the bookmark.
  final bool submitting;

  /// Visible placeholder for the label input.
  final String placeholder;

  /// Accessible name for the cancel control (it is icon-only).
  final String cancelLabel;

  final ValueChanged<BookmarkDraft>? onSave;
  final VoidCallback? onCancel;

  @override
  State<AppBookmarkAdd> createState() => _AppBookmarkAddState();
}

class _AppBookmarkAddState extends State<AppBookmarkAdd> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleSave() {
    if (widget.submitting) return;
    widget.onSave?.call(
      BookmarkDraft(time: widget.time, label: _controller.text.trim()),
    );
    _controller.clear();
  }

  void _handleCancel() {
    if (widget.submitting) return;
    _controller.clear();
    widget.onCancel?.call();
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final TextStyle textStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFieldSize.sm.fontSize,
          color: widget.submitting ? sem.textDisabled : cs.onSurface,
        );
    final TextStyle placeholderStyle = textStyle.copyWith(
      color: widget.submitting ? sem.textDisabled : sem.textTertiary,
    );

    return Semantics(
      container: true,
      label: 'Add bookmark',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: AppSpacing.s2,
        ),
        decoration: BoxDecoration(
          color: sem.raised,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: cs.outline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            BookmarkTimeChip(time: widget.time),
            const SizedBox(width: AppSpacing.s2),
            Expanded(
              child: CallbackShortcuts(
                bindings: <ShortcutActivator, VoidCallback>{
                  const SingleActivator(LogicalKeyboardKey.escape):
                      _handleCancel,
                },
                child: AppFieldBox(
                  focusNode: _focusNode,
                  size: AppFieldSize.sm,
                  enabled: !widget.submitting,
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    enabled: !widget.submitting,
                    style: textStyle,
                    textAlignVertical: TextAlignVertical.center,
                    cursorColor: cs.primary,
                    decoration: InputDecoration(
                      isCollapsed: true,
                      border: InputBorder.none,
                      hintText: widget.placeholder,
                      hintStyle: placeholderStyle,
                    ),
                    onSubmitted: (_) => _handleSave(),
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.s2),
            AppIconButton(
              name: IconName.x,
              semanticLabel: widget.cancelLabel,
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              disabled: widget.submitting,
              onPressed: _handleCancel,
            ),
            const SizedBox(width: AppSpacing.s1),
            AppButton(
              label: 'Save',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.sm,
              loading: widget.submitting,
              onPressed: _handleSave,
            ),
          ],
        ),
      ),
    );
  }
}
