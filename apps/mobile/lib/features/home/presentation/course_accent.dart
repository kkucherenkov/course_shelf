import 'package:app_ui/app_ui.dart';

/// Deterministically derives a palette accent from a course id — Flutter twin
/// of web's `accentFromId` (`apps/web/app/utils/course-accent.ts`).
///
/// The server sends no accent field, so both clients hash the id instead. The
/// hash is ported exactly, not merely "something stable": a course opened on
/// web and on the phone has to come out the same colour, and any drift here
/// would be invisible until someone compared two screens side by side.
///
/// Lives in `presentation/` because [CourseAccent] is an `app_ui` type — the
/// domain layer stays free of UI vocabulary.
const List<CourseAccent> _accents = <CourseAccent>[
  CourseAccent.teal,
  CourseAccent.amber,
  CourseAccent.indigo,
  CourseAccent.warm,
  CourseAccent.coral,
  CourseAccent.neutral,
];

CourseAccent accentFromId(String id) {
  // JS: `h = (h * 31 + (id.codePointAt(i) ?? 0)) >>> 0` over UTF-16 indices.
  // Dart's String.length is UTF-16 code units too, so the loop lines up; `>>> 0`
  // is a truncation to 32 unsigned bits, which is what the mask does here.
  var h = 0;
  for (var i = 0; i < id.length; i++) {
    h = (h * 31 + _codePointAt(id, i)) & 0xFFFFFFFF;
  }
  return _accents[h % _accents.length];
}

/// `String.prototype.codePointAt` semantics: at a high surrogate followed by a
/// low surrogate it yields the combined code point; anywhere else it is just
/// the code unit. Dart has no direct equivalent — `runes` iterates whole code
/// points and so would visit a different number of positions than the JS loop,
/// giving a different hash for any id outside the BMP.
int _codePointAt(String s, int i) {
  final unit = s.codeUnitAt(i);
  final isHighSurrogate = unit >= 0xD800 && unit <= 0xDBFF;
  if (isHighSurrogate && i + 1 < s.length) {
    final next = s.codeUnitAt(i + 1);
    final isLowSurrogate = next >= 0xDC00 && next <= 0xDFFF;
    if (isLowSurrogate) {
      return 0x10000 + ((unit - 0xD800) << 10) + (next - 0xDC00);
    }
  }
  return unit;
}
