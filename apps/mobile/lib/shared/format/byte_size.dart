/// Formats a byte count for display, e.g.
/// `1288490188` -> `'1.2 GB'`, `429981696` -> `'410 MB'`.
///
/// Binary (1024-based) steps, colloquially labelled `KB`/`MB`/`GB`/`TB` — the
/// same casual convention iOS/Android download-size UI uses, not strict
/// `KiB`/`MiB`/`GiB`. One decimal place under 10 units of the chosen step
/// (`'1.2 GB'`), none at or above (`'410 MB'`, `'12 GB'`) — matches the sizes
/// shown in `docs/design/cs-mobile-course-detail/app.jsx`.
///
/// Lives in `shared/` rather than in one feature: the course-detail CTA and
/// the Downloads tab's rows and storage bar all render byte counts, and a
/// second copy would drift the moment one of them changed its rounding.
String formatDownloadBytes(int bytes) {
  if (bytes <= 0) return '0 B';

  const List<String> units = <String>['B', 'KB', 'MB', 'GB', 'TB'];
  double value = bytes.toDouble();
  int unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  final String formatted = unitIndex == 0
      ? value.round().toString()
      : value.toStringAsFixed(value < 10 ? 1 : 0);
  return '$formatted ${units[unitIndex]}';
}
