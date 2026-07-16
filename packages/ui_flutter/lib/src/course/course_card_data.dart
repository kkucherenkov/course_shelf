import 'package:flutter/material.dart';

/// Accent identity for a course's cover — Flutter twin of the web
/// `CourseAccent` union (`packages/ui/src/components/CourseCard/types.ts`).
enum CourseAccent { teal, amber, indigo, warm, coral, neutral }

/// The requested display state for a course card — Flutter twin of the web
/// `CourseState` union. `auto` derives the real state from
/// [CourseCardData.completed] / [CourseCardData.lessons] (see
/// [courseCardRealState]); the other four values pin it explicitly.
enum CourseCardState { auto, notStarted, inProgress, completed, locked }

/// The resolved, non-`auto` state a card actually renders — Flutter twin of
/// the web `CourseRealState` union.
enum CourseCardRealState { notStarted, inProgress, completed, locked }

/// Plain presentational view-model for the CourseCard family — Flutter twin
/// of the web `Course` interface. NOT a domain entity or API type: it exists
/// purely to feed [CoursePosterCard]/[CourseWideCard]/[CourseCompactRow],
/// which stay pure-presentational (data in, callbacks out).
@immutable
class CourseCardData {
  const CourseCardData({
    required this.id,
    required this.title,
    required this.instructor,
    required this.lessons,
    required this.completed,
    required this.accent,
    this.cover,
  });

  final String id;
  final String title;

  /// Empty string omits the instructor line entirely (mirrors the web
  /// `v-if="course.instructor"` guard) rather than rendering a blank line.
  final String instructor;
  final int lessons;
  final int completed;
  final CourseAccent accent;

  /// Solid cover-colour override. The web `Course.cover` is an arbitrary CSS
  /// `background` string (colour, gradient, or image); Flutter has no such
  /// generic value, so this twin narrows it to a solid [Color] — the common
  /// case — and falls back to [courseAccentColor] when omitted, exactly like
  /// the web `coverStyle` fallback.
  final Color? cover;
}

/// Locally-owned accent → colour swatch, mirroring the web `COVER` map
/// (`cover-map.ts`) verbatim. Neither list is generated from
/// `docs/design/shared/tokens.json` — the web map is itself a hand-written
/// constant, not a design token, so this is a 1:1 port rather than a
/// deviation from the shared token scale.
const Map<CourseAccent, Color> _courseAccentColors = <CourseAccent, Color>{
  CourseAccent.teal: Color(0xFF3F8C84),
  CourseAccent.amber: Color(0xFFC8821C),
  CourseAccent.indigo: Color(0xFF6B72B8),
  CourseAccent.warm: Color(0xFF5C5644),
  CourseAccent.coral: Color(0xFFD26B5C),
  CourseAccent.neutral: Color(0xFF454952),
};

/// Resolves a [CourseAccent] to its cover colour (web: `COVER[accent]`).
Color courseAccentColor(CourseAccent accent) => _courseAccentColors[accent]!;

/// Derives cover initials from a course title — Flutter twin of the web
/// `initials()` (`cover-map.ts`): the first letter of up to the first two
/// words longer than two characters, upper-cased.
String courseCardInitials(String title) {
  final Iterable<String> words = title
      .split(' ')
      .where((String w) => w.length > 2)
      .take(2);
  return words.map((String w) => w.isEmpty ? '' : w[0]).join().toUpperCase();
}

/// Completion percentage (0..100) — Flutter twin of the web
/// `useCourseProgress().pct`. Independent of [courseCardRealState]: even a
/// `state: auto` course reports its raw completed/lessons ratio here.
int courseCardPercent(CourseCardData course, CourseCardState state) {
  if (state == CourseCardState.completed) return 100;
  if (state == CourseCardState.notStarted || state == CourseCardState.locked) {
    return 0;
  }
  if (course.lessons <= 0) return 0;
  final int pct = ((course.completed / course.lessons) * 100).round();
  return pct.clamp(0, 100);
}

/// Resolves `state: auto` against [courseCardPercent] — Flutter twin of the
/// web `useCourseProgress().realState`. Non-`auto` states pass straight
/// through.
CourseCardRealState courseCardRealState(
  CourseCardData course,
  CourseCardState state,
) {
  switch (state) {
    case CourseCardState.notStarted:
      return CourseCardRealState.notStarted;
    case CourseCardState.inProgress:
      return CourseCardRealState.inProgress;
    case CourseCardState.completed:
      return CourseCardRealState.completed;
    case CourseCardState.locked:
      return CourseCardRealState.locked;
    case CourseCardState.auto:
      final int pct = courseCardPercent(course, state);
      if (pct == 100) return CourseCardRealState.completed;
      if (pct > 0) return CourseCardRealState.inProgress;
      return CourseCardRealState.notStarted;
  }
}
