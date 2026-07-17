import 'package:equatable/equatable.dart';

/// Where the decoded bytes come from.
///
/// The distinction is user-visible: [LessonVideoSourceKind.localFile] is what
/// raises the "Watching offline" indicator (DESIGN_BRIEF §7.6 — *"when the
/// lesson source is the local file"*).
enum LessonVideoSourceKind { network, localFile }

/// A resolved, playable lesson source.
///
/// NOTE — E19 seam. `downloaded_lessons.filePath` points at an **AES-GCM
/// encrypted** file (see the table's own doc comment), so a [localFile] source
/// is not something `video_player` can open as-is: E19-F01-S01 owns the
/// device-bound key and the decrypting read path. This card wires the
/// *detection* and the resulting state, per its acceptance ("Offline
/// indicator ... (from E19)"); until E19 lands, no `downloaded_lessons` row is
/// ever written, so [resolve] always takes the network branch.
class LessonVideoSource extends Equatable {
  const LessonVideoSource.network(this.uri)
    : kind = LessonVideoSourceKind.network;

  const LessonVideoSource.localFile(this.uri)
    : kind = LessonVideoSourceKind.localFile;

  /// A network URL, or an absolute on-device path for [localFile].
  final String uri;
  final LessonVideoSourceKind kind;

  /// Drives the "Watching offline" indicator.
  bool get isOffline => kind == LessonVideoSourceKind.localFile;

  @override
  List<Object?> get props => <Object?>[uri, kind];
}

/// A lesson attachment (`MaterialDto`).
class LessonMaterial extends Equatable {
  const LessonMaterial({
    required this.id,
    required this.kind,
    required this.label,
    required this.sizeBytes,
  });

  final String id;

  /// Wire `MaterialKind` (e.g. `pdf`, `zip`), kept as a string — the player
  /// only forwards it to an icon choice.
  final String kind;
  final String label;
  final int sizeBytes;

  @override
  List<Object?> get props => <Object?>[id, kind, label, sizeBytes];
}

/// The lesson being played (`GET /api/v1/lessons/{id}`).
class LessonPlayback extends Equatable {
  const LessonPlayback({
    required this.id,
    required this.courseId,
    required this.sectionId,
    required this.title,
    required this.duration,
    required this.resumeAt,
    this.materials = const <LessonMaterial>[],
  });

  final String id;
  final String courseId;
  final String sectionId;
  final String title;

  /// `durationSeconds`; [Duration.zero] when the wire field is null.
  final Duration duration;

  /// `progress.lastSeenAtSeconds` — where playback resumes, mirroring web's
  /// `onVideoLoadedMetadata` seek.
  final Duration resumeAt;

  final List<LessonMaterial> materials;

  @override
  List<Object?> get props => <Object?>[
    id,
    courseId,
    sectionId,
    title,
    duration,
    resumeAt,
    materials,
  ];
}

/// Mirrors the wire `LessonOutlineItem.state` enum.
enum LessonOutlineEntryState { notStarted, inProgress, completed, locked }

/// One lesson in the course outline — feeds the Sections tab.
class LessonOutlineEntry extends Equatable {
  const LessonOutlineEntry({
    required this.id,
    required this.position,
    required this.title,
    required this.duration,
    required this.state,
    this.progressPercent = 0,
    this.hasMaterials = false,
  });

  final String id;
  final int position;
  final String title;
  final Duration duration;
  final LessonOutlineEntryState state;
  final int progressPercent;
  final bool hasMaterials;

  @override
  List<Object?> get props => <Object?>[
    id,
    position,
    title,
    duration,
    state,
    progressPercent,
    hasMaterials,
  ];
}

/// A course section (`SectionOutline`).
class LessonOutlineSection extends Equatable {
  const LessonOutlineSection({
    required this.id,
    required this.position,
    required this.title,
    required this.totalDuration,
    required this.lessons,
  });

  final String id;
  final int position;
  final String title;
  final Duration totalDuration;
  final List<LessonOutlineEntry> lessons;

  @override
  List<Object?> get props => <Object?>[
    id,
    position,
    title,
    totalDuration,
    lessons,
  ];
}

/// A bookmark (`BookmarkDto`), positioned in playback time.
class LessonBookmark extends Equatable {
  const LessonBookmark({
    required this.id,
    required this.position,
    this.label = '',
  });

  final String id;
  final Duration position;
  final String label;

  @override
  List<Object?> get props => <Object?>[id, position, label];
}
