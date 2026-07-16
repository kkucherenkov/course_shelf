import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

/// Widgetbook component cataloguing the `app_ui` [AppAvatar] across its size
/// ramp, image vs. initials fallback, and admin/guest role badges.
WidgetbookComponent buildAvatarComponent() {
  return WidgetbookComponent(
    name: 'AppAvatar',
    useCases: [
      WidgetbookUseCase(name: 'Sizes', builder: _sizes),
      WidgetbookUseCase(name: 'Image', builder: _image),
      WidgetbookUseCase(name: 'Initials', builder: _initials),
      WidgetbookUseCase(name: 'Admin badge', builder: _adminBadge),
      WidgetbookUseCase(name: 'Guest badge', builder: _guestBadge),
    ],
  );
}

/// A 1x1 solid, opaque slate-blue PNG, embedded as bytes so the "Image" use
/// case renders without a network round-trip (Widgetbook has no guarantee of
/// connectivity in every environment it runs in).
final Uint8List _samplePngBytes = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPwz5kCAAJdAVA/'
  '0tzdAAAAAElFTkSuQmCC',
);

ImageProvider _sampleImage() => MemoryImage(_samplePngBytes);

Widget _row(List<Widget> children) => Center(
  child: Wrap(
    spacing: 16,
    runSpacing: 16,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: children,
  ),
);

Widget _sizes(BuildContext context) => _row(<Widget>[
  for (final size in AppAvatarSize.values)
    AppAvatar(name: size.name, size: size),
]);

Widget _image(BuildContext context) => _row(<Widget>[
  for (final size in AppAvatarSize.values)
    AppAvatar(image: _sampleImage(), name: 'Jane Smith', size: size),
]);

Widget _initials(BuildContext context) => _row(<Widget>[
  const AppAvatar(name: 'John Doe', size: AppAvatarSize.lg),
  const AppAvatar(name: 'Mary Jane Watson', size: AppAvatarSize.lg),
  const AppAvatar(initials: 'zz', size: AppAvatarSize.lg),
  const AppAvatar(size: AppAvatarSize.lg),
]);

Widget _adminBadge(BuildContext context) => _row(<Widget>[
  const AppAvatar(
    name: 'Ann Lee',
    size: AppAvatarSize.xl,
    role: AppAvatarRole.admin,
  ),
  AppAvatar(
    image: _sampleImage(),
    name: 'Ann Lee',
    size: AppAvatarSize.xl,
    role: AppAvatarRole.admin,
  ),
]);

Widget _guestBadge(BuildContext context) => _row(<Widget>[
  const AppAvatar(
    name: 'Guest User',
    size: AppAvatarSize.xl,
    role: AppAvatarRole.guest,
  ),
  AppAvatar(
    image: _sampleImage(),
    name: 'Guest User',
    size: AppAvatarSize.xl,
    role: AppAvatarRole.guest,
  ),
]);
