import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/widgets.dart';

/// A 1x1 solid, opaque terracotta PNG (RGB, no alpha channel), embedded as
/// bytes.
///
/// Widget and golden tests need a deterministic image source for
/// `AppAvatar.image` — a `NetworkImage` never resolves inside the test
/// binary — so anything exercising the "has a photo" path decodes this
/// in-memory PNG instead of hitting the network. See `AppAvatar.image`'s doc
/// for why the widget takes an `ImageProvider` rather than a URL string.
///
/// Deliberately opaque (not the more commonly copy-pasted 1x1 transparent
/// PNG): a transparent pixel would let the avatar's gradient background show
/// straight through, making the "has a photo" golden row visually
/// indistinguishable from the initials-fallback row.
final Uint8List kSampleAvatarPngBytes = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4E6UBAAN0AV/9'
  '4qSCAAAAAElFTkSuQmCC',
);

/// An [ImageProvider] wrapping [kSampleAvatarPngBytes].
ImageProvider sampleAvatarImage() => MemoryImage(kSampleAvatarPngBytes);
