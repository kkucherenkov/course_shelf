import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Six single-digit cells for the sign-up verification code.
///
/// Mobile twin of web's `useOtpInput` + the `code-input` row in
/// `docs/design/shared/auth.jsx`. Focus movement lives here rather than in
/// `SignUpCubit` because focus nodes are a widget concern; the cubit owns only
/// the digits.
class OtpCodeField extends StatefulWidget {
  const OtpCodeField({
    required this.digits,
    required this.onChanged,
    required this.groupLabel,
    required this.digitLabel,
    this.onCompleted,
    super.key,
  });

  /// Current cell values, one character each.
  final List<String> digits;

  /// Called with (index, value) as a cell changes.
  final void Function(int index, String value) onChanged;

  /// Localized `role="group"` name for the whole row.
  final String groupLabel;

  /// Localized per-cell name, e.g. "Digit 3" — built by the caller so the
  /// number is interpolated by slang, not string-concatenated here.
  final String Function(int oneBased) digitLabel;

  /// Fired once all six cells are filled.
  final VoidCallback? onCompleted;

  @override
  State<OtpCodeField> createState() => _OtpCodeFieldState();
}

class _OtpCodeFieldState extends State<OtpCodeField> {
  late final List<FocusNode> _nodes;
  late final List<TextEditingController> _controllers;

  /// One OTP cell — 44px wide keeps the row inside the card's 44px hit target
  /// on the narrowest supported phone.
  static const double _cellWidth = 44;
  static const double _cellHeight = 52;

  @override
  void initState() {
    super.initState();
    _nodes = List.generate(6, (_) => FocusNode());
    _controllers = List.generate(
      6,
      (i) => TextEditingController(text: widget.digits[i]),
    );
  }

  @override
  void didUpdateWidget(OtpCodeField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // The cubit is the source of truth; mirror external resets (editEmail
    // clears the code) back into the controllers without stomping the caret
    // while the user types.
    for (var i = 0; i < 6; i++) {
      if (_controllers[i].text != widget.digits[i]) {
        _controllers[i].text = widget.digits[i];
      }
    }
  }

  @override
  void dispose() {
    for (final node in _nodes) {
      node.dispose();
    }
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onCellChanged(int index, String raw) {
    // A paste of the whole code lands in one cell — spread it across the row
    // rather than truncating, mirroring web's `onPaste`.
    if (raw.length > 1) {
      final digits = raw.replaceAll(RegExp(r'\D'), '').split('');
      for (var i = 0; i < 6; i++) {
        final value = i < digits.length ? digits[i] : '';
        _controllers[i].text = value;
        widget.onChanged(i, value);
      }
      final last = digits.length.clamp(0, 5);
      _nodes[last].requestFocus();
      if (digits.length >= 6) widget.onCompleted?.call();
      return;
    }

    widget.onChanged(index, raw);
    if (raw.isNotEmpty && index < 5) {
      _nodes[index + 1].requestFocus();
    }
    if (raw.isNotEmpty && index == 5) {
      widget.onCompleted?.call();
    }
  }

  /// Backspace on an empty cell steps back a cell, as web's `onKeydown` does.
  KeyEventResult _onKey(int index, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey != LogicalKeyboardKey.backspace) {
      return KeyEventResult.ignored;
    }
    if (_controllers[index].text.isEmpty && index > 0) {
      _nodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
      widget.onChanged(index - 1, '');
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      container: true,
      label: widget.groupLabel,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < 6; i++)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: SizedBox(
                width: _cellWidth,
                height: _cellHeight,
                child: Focus(
                  onKeyEvent: (_, event) => _onKey(i, event),
                  child: Semantics(
                    label: widget.digitLabel(i + 1),
                    child: TextField(
                      key: ValueKey('signUpCodeCell$i'),
                      controller: _controllers[i],
                      focusNode: _nodes[i],
                      autofocus: i == 0,
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      // One char per cell, but paste must survive long enough to
                      // be spread across the row — so no maxLength here.
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.zero,
                        labelText: null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                      onChanged: (value) => _onCellChanged(i, value),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
