import 'dart:async';

import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Edit / read-only mode — Flutter twin of the web `AppNoteEditor`'s
/// `mode: 'edit' | 'view'` prop.
enum AppNoteMode { edit, view }

/// Sync status — Flutter twin of the web `AppNoteEditor`'s `NoteSyncState`
/// union (`'syncing' | 'saved' | 'failed' | 'offline'`).
enum AppNoteSyncState { syncing, saved, failed, offline }

/// A Markdown note editor with a formatting toolbar, edit/preview modes, and
/// a debounced autosave — Flutter twin of the web `AppNoteEditor`.
///
/// Fully controlled: [modelValue] is the source of truth (every keystroke
/// and every toolbar action calls [onChanged] with the next string rather
/// than mutating local state); [mode] is likewise driven by [onModeChanged].
/// After [debounceMs] (default 600) of quiet following a [modelValue]
/// change, [onSave] fires once with the current value. [syncState] +
/// [savedAt] drive the status row; [onRetry] fires from its Retry button
/// (shown only when [syncState] is `failed`).
///
/// Deviations from the web `AppNoteEditor.vue` (documented, not oversights):
///  - **No live "Ns ago" ticker.** The web reruns its saved-label formatter
///    every second via `setInterval` while `syncState == 'saved'`. A
///    self-driving wall-clock timer inside an otherwise pure,
///    controlled-value-in/callbacks-out widget is its own can of worms (it
///    also can't be started here without leaking a live `Timer` past the
///    common "build once, never touch again" widget-test lifecycle). The
///    "Ns ago" text is recomputed on every rebuild instead — accurate
///    whenever a prop changes, static in between.
///  - **No real markdown-preview link navigation.** `v-html` lets the web
///    preview render a real, clickable `<a href>`; Flutter has no HTML
///    sink, so `[label](url)` renders as styled (`textLink`-coloured,
///    underlined) but inert text — a presentational component in this
///    package has no business depending on a URL-launcher plugin. Because
///    Flutter's `Text`/`TextSpan` never interpret markup, there is also no
///    injection surface to sanitise, unlike the web's `escapeHtml` +
///    scheme-allowlisting.
///  - **Toolbar shape.** Bold/Italic/Heading reuse [AppButton] (`ghost`/
///    `sm`) with a "B"/"I"/"H" glyph as its `child`; the web's fixed
///    28×28 box isn't reproduced exactly because no primitive renders an
///    arbitrary text glyph in a forced square (unlike List/Link, which are
///    real icons and do get an exact 28×28 [AppIconButton]).
class AppNoteEditor extends StatefulWidget {
  const AppNoteEditor({
    required this.modelValue,
    this.mode = AppNoteMode.edit,
    this.syncState = AppNoteSyncState.saved,
    this.savedAt,
    this.debounceMs = 600,
    this.placeholder =
        'Write a note in Markdown — # heading, **bold**, *italic*, - list',
    this.onChanged,
    this.onModeChanged,
    this.onSave,
    this.onRetry,
    super.key,
  });

  final String modelValue;
  final AppNoteMode mode;
  final AppNoteSyncState syncState;

  /// Last successful save timestamp — drives the "Ns ago" label.
  final DateTime? savedAt;

  /// Debounce window for [onSave], in milliseconds.
  final int debounceMs;

  /// Visible while editing.
  final String placeholder;

  final ValueChanged<String>? onChanged;
  final ValueChanged<AppNoteMode>? onModeChanged;
  final ValueChanged<String>? onSave;
  final VoidCallback? onRetry;

  @override
  State<AppNoteEditor> createState() => _AppNoteEditorState();
}

class _AppNoteEditorState extends State<AppNoteEditor> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.modelValue,
  );
  Timer? _debounce;

  @override
  void didUpdateWidget(covariant AppNoteEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.modelValue != _controller.text) {
      _controller.value = _controller.value.copyWith(
        text: widget.modelValue,
        selection: TextSelection.collapsed(offset: widget.modelValue.length),
        composing: TextRange.empty,
      );
    }
    if (widget.modelValue != oldWidget.modelValue) {
      _restartDebounce();
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _restartDebounce() {
    _debounce?.cancel();
    _debounce = Timer(Duration(milliseconds: widget.debounceMs), () {
      widget.onSave?.call(widget.modelValue);
    });
  }

  void _handleInput(String value) => widget.onChanged?.call(value);

  void _toggleMode() {
    widget.onModeChanged?.call(
      widget.mode == AppNoteMode.edit ? AppNoteMode.view : AppNoteMode.edit,
    );
  }

  TextSelection _selectionOrEnd(String text) {
    final TextSelection selection = _controller.selection;
    if (!selection.isValid || selection.start < 0 || selection.end < 0) {
      return TextSelection.collapsed(offset: text.length);
    }
    return selection;
  }

  void _setText(String next, TextSelection selection) {
    _controller.value = TextEditingValue(text: next, selection: selection);
    widget.onChanged?.call(next);
  }

  void _applyWrap(String marker) {
    final String text = _controller.text;
    final TextSelection selection = _selectionOrEnd(text);
    final int start = selection.start.clamp(0, text.length);
    final int end = selection.end.clamp(0, text.length);
    final String before = text.substring(0, start);
    final String selected = text.substring(start, end);
    final String after = text.substring(end);
    final String next = '$before$marker$selected$marker$after';
    _setText(
      next,
      TextSelection(
        baseOffset: start + marker.length,
        extentOffset: end + marker.length,
      ),
    );
  }

  int _lineStartBefore(String text, int caret) {
    if (caret <= 0) return 0;
    final int idx = text.lastIndexOf('\n', caret - 1);
    return idx == -1 ? 0 : idx + 1;
  }

  void _applyLinePrefix(String prefix) {
    final String text = _controller.text;
    final int caret = _selectionOrEnd(text).start.clamp(0, text.length);
    final int lineStart = _lineStartBefore(text, caret);
    final String before = text.substring(0, lineStart);
    final String after = text.substring(lineStart);
    final String next = '$before$prefix$after';
    _setText(next, TextSelection.collapsed(offset: caret + prefix.length));
  }

  void _applyLink() {
    final String text = _controller.text;
    final TextSelection selection = _selectionOrEnd(text);
    final int start = selection.start.clamp(0, text.length);
    final int end = selection.end.clamp(0, text.length);
    final String selected = text.substring(start, end);
    final String label = selected.isEmpty ? 'link' : selected;
    final String before = text.substring(0, start);
    final String after = text.substring(end);
    final String wrapped = '[$label](url)';
    final String next = '$before$wrapped$after';
    final int urlStart = start + wrapped.indexOf('(') + 1;
    final int urlEnd = urlStart + 'url'.length;
    _setText(next, TextSelection(baseOffset: urlStart, extentOffset: urlEnd));
  }

  String _formatAgo(DateTime at) {
    final int seconds = DateTime.now().difference(at).inSeconds;
    final int clamped = seconds < 0 ? 0 : seconds;
    if (clamped < 5) return 'just now';
    if (clamped < 60) return '${clamped}s ago';
    final int minutes = clamped ~/ 60;
    if (minutes < 60) return '${minutes}m ago';
    final int hours = minutes ~/ 60;
    if (hours < 24) return '${hours}h ago';
    final int days = hours ~/ 24;
    return '${days}d ago';
  }

  Widget _toolButton({
    required String semanticLabel,
    required bool enabled,
    required VoidCallback onPressed,
    required Widget child,
  }) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: semanticLabel,
      child: ExcludeSemantics(
        child: AppButton(
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          disabled: !enabled,
          onPressed: onPressed,
          child: child,
        ),
      ),
    );
  }

  Widget _buildToolbar(BuildContext context, ThemeData theme) {
    final ColorScheme cs = theme.colorScheme;
    final bool enabled = widget.mode == AppNoteMode.edit;
    final TextStyle glyphStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.md,
          color: cs.onSurface,
        );
    final bool isView = widget.mode == AppNoteMode.view;

    return Padding(
      padding: const EdgeInsets.all(6),
      child: Row(
        children: <Widget>[
          _toolButton(
            semanticLabel: 'Bold',
            enabled: enabled,
            onPressed: () => _applyWrap('**'),
            child: Text(
              'B',
              style: glyphStyle.copyWith(fontWeight: AppFontWeight.bold),
            ),
          ),
          const SizedBox(width: AppSpacing.s1),
          _toolButton(
            semanticLabel: 'Italic',
            enabled: enabled,
            onPressed: () => _applyWrap('*'),
            child: Text(
              'I',
              style: glyphStyle.copyWith(fontStyle: FontStyle.italic),
            ),
          ),
          const SizedBox(width: AppSpacing.s1),
          _toolButton(
            semanticLabel: 'Heading',
            enabled: enabled,
            onPressed: () => _applyLinePrefix('# '),
            child: Text(
              'H',
              style: glyphStyle.copyWith(fontWeight: AppFontWeight.semibold),
            ),
          ),
          const SizedBox(width: AppSpacing.s1),
          AppIconButton(
            name: IconName.list,
            semanticLabel: 'List',
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.sm,
            disabled: !enabled,
            onPressed: () => _applyLinePrefix('- '),
          ),
          const SizedBox(width: AppSpacing.s1),
          AppIconButton(
            name: IconName.copy,
            semanticLabel: 'Link',
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.sm,
            disabled: !enabled,
            onPressed: _applyLink,
          ),
          const Spacer(),
          Semantics(
            button: true,
            toggled: isView,
            label: isView ? 'Edit' : 'Preview',
            child: ExcludeSemantics(
              child: AppButton(
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.sm,
                label: isView ? 'Edit' : 'Preview',
                onPressed: _toggleMode,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditBody(BuildContext context, ThemeData theme) {
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;
    final TextStyle textStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurface,
          height: 20 / AppFontSize.sm,
        );
    final TextStyle placeholderStyle = textStyle.copyWith(
      color: sem.textTertiary,
    );

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s3),
      child: TextField(
        controller: _controller,
        minLines: 5,
        maxLines: null,
        keyboardType: TextInputType.multiline,
        style: textStyle,
        cursorColor: cs.primary,
        onChanged: _handleInput,
        decoration: InputDecoration(
          isCollapsed: true,
          border: InputBorder.none,
          hintText: widget.placeholder,
          hintStyle: placeholderStyle,
        ),
      ),
    );
  }

  Widget _buildPreviewBody(BuildContext context, ThemeData theme) {
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;
    final TextStyle bodyStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          color: cs.onSurface,
          height: 20 / AppFontSize.sm,
        );

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: _buildMarkdownWidgets(
          input: widget.modelValue,
          bodyStyle: bodyStyle,
          linkColor: sem.textLink,
        ),
      ),
    );
  }

  Widget _buildSyncRow(BuildContext context, ThemeData theme) {
    final ColorScheme cs = theme.colorScheme;
    final AppSemanticColors sem = context.semanticColors;

    final Color iconColor = switch (widget.syncState) {
      AppNoteSyncState.syncing => cs.primary,
      AppNoteSyncState.failed => cs.error,
      AppNoteSyncState.offline => sem.warningFg,
      AppNoteSyncState.saved => sem.successFg,
    };
    final IconName icon = switch (widget.syncState) {
      AppNoteSyncState.syncing => IconName.cloud,
      AppNoteSyncState.failed => IconName.alert,
      AppNoteSyncState.offline => IconName.cloudDown,
      AppNoteSyncState.saved => IconName.check,
    };
    final String label = switch (widget.syncState) {
      AppNoteSyncState.syncing => 'Syncing…',
      AppNoteSyncState.failed => 'Failed — retrying',
      AppNoteSyncState.offline => 'Offline — queued',
      AppNoteSyncState.saved =>
        widget.savedAt == null
            ? 'Saved'
            : 'Saved · ${_formatAgo(widget.savedAt!)}',
    };

    final TextStyle labelStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.xs,
          color: cs.onSurfaceVariant,
        );

    return Semantics(
      container: true,
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          children: <Widget>[
            IconCS(name: icon, size: 11, color: iconColor),
            const SizedBox(width: 6),
            Expanded(child: Text(label, style: labelStyle)),
            if (widget.syncState == AppNoteSyncState.failed)
              AppButton(
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.sm,
                onPressed: widget.onRetry,
                child: Text(
                  'Retry',
                  style: labelStyle.copyWith(
                    color: cs.primary,
                    fontWeight: AppFontWeight.medium,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final ColorScheme cs = theme.colorScheme;
    final bool isView = widget.mode == AppNoteMode.view;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border.all(color: cs.outline),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          DecoratedBox(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: cs.outline)),
            ),
            child: _buildToolbar(context, theme),
          ),
          isView
              ? _buildPreviewBody(context, theme)
              : _buildEditBody(context, theme),
          DecoratedBox(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: cs.outline)),
            ),
            child: _buildSyncRow(context, theme),
          ),
        ],
      ),
    );
  }
}

final RegExp _headingPattern = RegExp(r'^(#{1,3})\s+(.+)$');
final RegExp _inlinePattern = RegExp(
  r'\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(?<![*])\*([^*\n]+)\*(?![*])',
);

List<Widget> _buildMarkdownWidgets({
  required String input,
  required TextStyle bodyStyle,
  required Color linkColor,
}) {
  if (input.trim().isEmpty) return const <Widget>[];
  final List<String> blocks = input.split(RegExp(r'\n{2,}'));
  final List<Widget> widgets = <Widget>[];

  for (final String block in blocks) {
    final List<String> lines = block.split('\n');
    final RegExpMatch? heading = lines.length == 1
        ? _headingPattern.firstMatch(lines.first)
        : null;

    if (heading != null) {
      final int level = heading.group(1)!.length;
      final double size = switch (level) {
        1 => AppFontSize.xl,
        2 => AppFontSize.lg,
        _ => AppFontSize.md,
      };
      final TextStyle style = bodyStyle.copyWith(
        fontSize: size,
        fontWeight: AppFontWeight.semibold,
      );
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s2),
          child: Text.rich(
            TextSpan(
              children: _parseInline(heading.group(2)!, style, linkColor),
            ),
            style: style,
          ),
        ),
      );
      continue;
    }

    if (lines.every((String l) => l.startsWith('- '))) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              for (final String line in lines)
                Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('•  ', style: bodyStyle),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            children: _parseInline(
                              line.substring(2),
                              bodyStyle,
                              linkColor,
                            ),
                          ),
                          style: bodyStyle,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      );
      continue;
    }

    final List<InlineSpan> spans = <InlineSpan>[];
    for (int i = 0; i < lines.length; i++) {
      spans.addAll(_parseInline(lines[i], bodyStyle, linkColor));
      if (i != lines.length - 1) spans.add(const TextSpan(text: '\n'));
    }
    widgets.add(
      Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.s2),
        child: Text.rich(TextSpan(children: spans), style: bodyStyle),
      ),
    );
  }
  return widgets;
}

List<InlineSpan> _parseInline(String line, TextStyle base, Color linkColor) {
  final List<InlineSpan> spans = <InlineSpan>[];
  int last = 0;
  for (final RegExpMatch match in _inlinePattern.allMatches(line)) {
    if (match.start > last) {
      spans.add(TextSpan(text: line.substring(last, match.start)));
    }
    final String? linkLabel = match.group(1);
    final String? bold = match.group(3);
    final String? italic = match.group(4);
    if (linkLabel != null) {
      spans.add(
        TextSpan(
          text: linkLabel,
          style: base.copyWith(
            color: linkColor,
            decoration: TextDecoration.underline,
          ),
        ),
      );
    } else if (bold != null) {
      spans.add(
        TextSpan(
          text: bold,
          style: base.copyWith(fontWeight: AppFontWeight.semibold),
        ),
      );
    } else if (italic != null) {
      spans.add(
        TextSpan(
          text: italic,
          style: base.copyWith(fontStyle: FontStyle.italic),
        ),
      );
    }
    last = match.end;
  }
  if (last < line.length) {
    spans.add(TextSpan(text: line.substring(last)));
  }
  return spans;
}
