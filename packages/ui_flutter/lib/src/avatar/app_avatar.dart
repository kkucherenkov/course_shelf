import 'package:flutter/material.dart';

import 'package:app_ui/src/avatar/app_avatar_size.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// The brand avatar — Flutter twin of the web `AppAvatar`.
///
/// Shows [image] when provided, otherwise falls back to initials: [initials]
/// (explicit, uppercased) takes priority over initials derived from [name]
/// (first letter of up to the first two words). An optional [role] decorates
/// the circle with a small admin/guest badge in the bottom-right corner,
/// mirroring the web component's `role` prop.
class AppAvatar extends StatelessWidget {
  const AppAvatar({
    this.image,
    this.initials,
    this.name,
    this.size = AppAvatarSize.md,
    this.role,
    super.key,
  });

  /// Avatar photo. An [ImageProvider] rather than the web's raw URL string:
  /// callers pass `NetworkImage(url)` in production and an `AssetImage` /
  /// `MemoryImage` in tests and goldens, since a `NetworkImage` never
  /// resolves inside the test binary. When null, initials are shown instead.
  final ImageProvider? image;

  /// Explicit initials; uppercased and shown verbatim, taking priority over
  /// initials derived from [name].
  final String? initials;

  /// Display name. Used to derive initials (first letter of up to the first
  /// two whitespace-separated words) when [initials] is absent, and as the
  /// image's semantic label — mirroring the web `:alt="name ?? 'Avatar'"`.
  final String? name;

  /// Circle diameter. Defaults to [AppAvatarSize.md], matching the web
  /// default.
  final AppAvatarSize size;

  /// Renders a small role badge in the bottom-right corner when set.
  final AppAvatarRole? role;

  String get _initials {
    final explicit = initials;
    if (explicit != null && explicit.isNotEmpty) {
      return explicit.toUpperCase();
    }
    final trimmedName = name?.trim();
    if (trimmedName == null || trimmedName.isEmpty) {
      return '';
    }
    final words = trimmedName.split(RegExp(r'\s+'));
    return words
        .take(2)
        .map((word) => word.isEmpty ? '' : word[0].toUpperCase())
        .join();
  }

  String? get _roleLetter => switch (role) {
    AppAvatarRole.admin => 'A',
    AppAvatarRole.guest => 'G',
    null => null,
  };

  String? get _roleLabel => switch (role) {
    AppAvatarRole.admin => 'Administrator',
    AppAvatarRole.guest => 'Guest',
    null => null,
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final diameter = size.diameter;
    final hasImage = image != null;

    Widget circle = Container(
      width: diameter,
      height: diameter,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        // web: `linear-gradient(135deg, var(--surface-overlay), var(--surface-raised))`.
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[cs.surfaceContainerHighest, sem.raised],
        ),
        border: Border.all(color: cs.outline),
      ),
      child: hasImage
          ? Image(image: image!, fit: BoxFit.cover)
          : Center(
              child: Text(
                _initials,
                style: (theme.textTheme.labelLarge ?? const TextStyle())
                    .copyWith(
                      fontSize: size.initialsFontSize,
                      fontWeight: AppFontWeight.medium,
                      color: cs.onSurface,
                      height: 1,
                    ),
              ),
            ),
    );

    if (hasImage) {
      circle = Semantics(image: true, label: name ?? 'Avatar', child: circle);
    }

    if (role == null) {
      return circle;
    }

    return Stack(
      clipBehavior: Clip.none,
      children: <Widget>[
        circle,
        Positioned(
          right: -_RoleBadge.offset,
          bottom: -_RoleBadge.offset,
          child: Semantics(
            image: true,
            label: _roleLabel,
            // The glyph is decorative — mirrors the web `role="img"
            // aria-label="…"`, where the letter itself carries no separate
            // accessible text. Without this, the badge's `Text` contributes
            // its own implicit label and merges into "Guest\nG" instead of
            // the exact "Guest".
            excludeSemantics: true,
            child: Container(
              width: _RoleBadge.diameter,
              height: _RoleBadge.diameter,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: role == AppAvatarRole.admin ? cs.primary : sem.infoFg,
                border: Border.all(
                  color: sem.pageBackground,
                  width: _RoleBadge.borderWidth,
                ),
              ),
              child: Text(
                _roleLetter!,
                style: (theme.textTheme.labelSmall ?? const TextStyle())
                    .copyWith(
                      fontSize: _RoleBadge.fontSize,
                      fontWeight: AppFontWeight.bold,
                      height: 1,
                      // `cs.onError` is the only brightness-adaptive slot the
                      // ColorScheme has for "always-legible text on a
                      // saturated fill" (it resolves to the same textInverse
                      // token AppTheme binds onError to); there's no onInfo
                      // slot for the guest fill (`sem.infoFg`), so it's reused
                      // here. The admin fill is `cs.primary`, so it gets the
                      // chromatically exact `cs.onPrimary` instead.
                      color: role == AppAvatarRole.admin
                          ? cs.onPrimary
                          : cs.onError,
                    ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Role badge geometry — a locally-owned micro-scale mirroring the web
/// `.app-avatar__role` SCSS block (12px circle, 2px ring, -2px inset, 7px
/// glyph), which is itself hard-coded there rather than tokenised.
abstract final class _RoleBadge {
  static const double diameter = 12;
  static const double borderWidth = 2;
  static const double offset = 2;
  static const double fontSize = 7;
}
