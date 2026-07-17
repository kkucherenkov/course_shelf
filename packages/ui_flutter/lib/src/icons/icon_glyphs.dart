import 'package:app_ui/src/icons/icon_name.dart';

/// Inner SVG markup for each glyph, copied VERBATIM from the web `IconCS`
/// component so both platforms render identical geometry on a 24x24 viewBox.
///
/// Every element paints in `currentColor` (stroke, plus a few `fill="currentColor"`
/// dots); [IconCS] recolours the whole picture with a srcIn `ColorFilter`. The
/// two fillable glyphs ([kFillableIcons]) carry a `__FILL__` sentinel that
/// [buildIconSvg] resolves to `currentColor` (filled) or `none` (outline).
///
/// The five `*Fill` nav glyphs are solid silhouettes, so each of their elements
/// must opt out of the envelope's `stroke="currentColor" stroke-width="1.5"`
/// with an explicit `stroke="none"` — otherwise the silhouette is painted
/// 0.75 units fatter than it was drawn. Where the outline's negative space
/// carries meaning (the `search` lens, the `settings` centre) the hole is a
/// second subpath punched out with `fill-rule="evenodd"`.
const Map<IconName, String> kIconMarkup = {
  IconName.play: '<path d="M7 5l12 7-12 7V5z" fill="__FILL__"/>',
  IconName.pause:
      '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  IconName.next: '<path d="M5 5l10 7-10 7V5z"/><path d="M19 5v14"/>',
  IconName.prev: '<path d="M19 5L9 12l10 7V5z"/><path d="M5 5v14"/>',
  IconName.home:
      '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"/>',
  IconName.homeFill:
      '<path d="M12 3.5L2.7 11.25h1.9v7.45a1.5 1.5 0 001.5 1.5h11.8a1.5 1.5 0 001.5-1.5v-7.45h1.9z" fill="currentColor" stroke="none"/>',
  IconName.library:
      '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M16 5l4 14"/>',
  IconName.libraryFill:
      '<rect x="3" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="9" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="15.8" y="4.7" width="3.4" height="14.6" rx="1" transform="rotate(-16 17.5 12)" fill="currentColor" stroke="none"/>',
  IconName.search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  IconName.searchFill:
      '<path d="M11 4.25a6.75 6.75 0 110 13.5 6.75 6.75 0 010-13.5zm0 2.4a4.35 4.35 0 110 8.7 4.35 4.35 0 010-8.7z" fill="currentColor" fill-rule="evenodd" stroke="none"/><rect x="14.2" y="16.4" width="6.8" height="2.4" rx="1.2" transform="rotate(45 17.6 17.6)" fill="currentColor" stroke="none"/>',
  IconName.settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19 12c0 .5-.05 1-.13 1.5l2 1.5-2 3.5-2.4-1a7 7 0 01-2.6 1.5L13.5 22h-3l-.4-3a7 7 0 01-2.6-1.5l-2.4 1-2-3.5 2-1.5A7 7 0 015 12c0-.5.05-1 .13-1.5l-2-1.5 2-3.5 2.4 1A7 7 0 0110 5L10.5 2h3l.4 3a7 7 0 012.6 1.5l2.4-1 2 3.5-2 1.5c.08.5.13 1 .13 1.5z"/>',
  IconName.settingsFill:
      '<path d="M19 12c0 .5-.05 1-.13 1.5l2 1.5-2 3.5-2.4-1a7 7 0 01-2.6 1.5L13.5 22h-3l-.4-3a7 7 0 01-2.6-1.5l-2.4 1-2-3.5 2-1.5A7 7 0 015 12c0-.5.05-1 .13-1.5l-2-1.5 2-3.5 2.4 1A7 7 0 0110 5L10.5 2h3l.4 3a7 7 0 012.6 1.5l2.4-1 2 3.5-2 1.5c.08.5.13 1 .13 1.5zM12 9a3 3 0 110 6 3 3 0 010-6z" fill="currentColor" fill-rule="evenodd" stroke="none"/>',
  IconName.check: '<path d="M5 12l5 5 9-11"/>',
  IconName.checkCircle:
      '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  IconName.circle: '<circle cx="12" cy="12" r="9"/>',
  IconName.lock:
      '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  IconName.download:
      '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
  IconName.downloadFill:
      '<path d="M10.6 4.7a1.4 1.4 0 012.8 0v6h4.2L12 16.4l-5.6-5.7h4.2z" fill="currentColor" stroke="none"/><rect x="4.5" y="18.9" width="15" height="2.2" rx="1.1" fill="currentColor" stroke="none"/>',
  IconName.cloud:
      '<path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0117 18H7z"/>',
  IconName.cloudDown:
      '<path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.5A4 4 0 0117 18"/><path d="M12 13v6"/><path d="M9 16l3 3 3-3"/>',
  IconName.bookmark: '<path d="M6 4h12v17l-6-4-6 4V4z" fill="__FILL__"/>',
  IconName.note:
      '<path d="M5 4h11l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M16 4v4h4"/><path d="M8 13h8M8 17h5"/>',
  IconName.pdf:
      '<path d="M7 3h8l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M15 3v4h4"/><text x="9" y="17" font-size="6" fill="currentColor" stroke="none" font-family="monospace" font-weight="700">PDF</text>',
  IconName.folder:
      '<path d="M3 6a1 1 0 011-1h4l2 2h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6z"/>',
  IconName.user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  IconName.users:
      '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0"/><path d="M16 3a4 4 0 010 8"/><path d="M22 21a7 7 0 00-7-7"/>',
  IconName.plus: '<path d="M12 5v14M5 12h14"/>',
  IconName.minus: '<path d="M5 12h14"/>',
  IconName.x: '<path d="M6 6l12 12M18 6L6 18"/>',
  IconName.chevronRight: '<path d="M9 5l7 7-7 7"/>',
  IconName.chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  IconName.chevronDown: '<path d="M5 9l7 7 7-7"/>',
  IconName.chevronUp: '<path d="M5 15l7-7 7 7"/>',
  IconName.arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  IconName.sun:
      '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  IconName.moon: '<path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z"/>',
  IconName.volume:
      '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 010 8"/>',
  IconName.volumeMute:
      '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',
  IconName.subtitles:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 14h4M13 14h4M7 11h2M11 11h6"/>',
  IconName.fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  IconName.pip:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor"/>',
  IconName.speed: '<path d="M5 18a8 8 0 1114 0"/><path d="M12 14l4-4"/>',
  IconName.list:
      '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  IconName.grid:
      '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  IconName.filter: '<path d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/>',
  IconName.sort:
      '<path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 4v16M13 16l4 4 4-4"/>',
  IconName.eye:
      '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  IconName.eyeOff:
      '<path d="M3 3l18 18"/><path d="M10.6 6.1A11 11 0 0112 6c6 0 10 7 10 7a16 16 0 01-3 3.7M6 7.5A16 16 0 002 12s4 7 10 7a11 11 0 005.6-1.5"/><path d="M9.5 10a3 3 0 004.2 4.2"/>',
  IconName.mail:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  IconName.key: '<circle cx="8" cy="14" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  IconName.shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
  IconName.alert:
      '<path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/>',
  IconName.info:
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/>',
  IconName.wifiOff:
      '<path d="M3 3l18 18"/><path d="M5 12a10 10 0 0112-1"/><path d="M8 16a5 5 0 016-1"/><circle cx="12" cy="20" r="0.5" fill="currentColor"/>',
  IconName.refresh:
      '<path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 20v-4h4"/>',
  IconName.edit:
      '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 6l3 3"/>',
  IconName.trash:
      '<path d="M5 7h14M9 7V4h6v3M7 7l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13"/>',
  IconName.copy:
      '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  IconName.logout:
      '<path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  IconName.menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  IconName.more:
      '<circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  IconName.clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  IconName.calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  IconName.at:
      '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a9 9 0 10-3.5 7"/>',
  IconName.sliders:
      '<path d="M4 6h10M18 6h2M4 18h2M10 18h10M4 12h6M14 12h6"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="12" cy="12" r="2"/>',
  IconName.arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  IconName.moreH:
      '<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>',
  IconName.cornerDownRight:
      '<path d="M5 4v8a3 3 0 003 3h11"/><path d="M14 10l5 5-5 5"/>',
  IconName.hardDrive:
      '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M5 13l3-7h8l3 7"/><circle cx="7.5" cy="16.5" r="0.6" fill="currentColor"/><circle cx="11" cy="16.5" r="0.6" fill="currentColor"/>',
  IconName.github:
      '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 00-.8-2.3c2.6-.3 5.3-1.3 5.3-5.7 0-1.1-.4-2.2-1.2-3 .4-1 .4-2.2-.1-3.2 0 0-1-.3-3.2 1.2a11 11 0 00-6 0C6.8 2 5.8 2.3 5.8 2.3c-.5 1-.5 2.2-.1 3.2-.8.8-1.2 1.9-1.2 3 0 4.4 2.7 5.4 5.3 5.7a3 3 0 00-.8 2.3V21"/>',
  IconName.banner: '<circle cx="12" cy="12" r="9"/>',
};

/// Glyphs whose interior is filled when `IconCS(fill: true)`.
const Set<IconName> kFillableIcons = {IconName.play, IconName.bookmark};

/// Maps each bottom-tab-bar outline glyph to its filled silhouette.
///
/// These are separate glyphs rather than an `IconCS(fill: true)` toggle: the
/// five nav outlines are open stroked paths, so mechanically filling them
/// paints garbage (a filled `search` collapses into a solid disc). Feed a
/// value to `AppNavigationTab.filledIcon` to give a tab an active-state swap.
const Map<IconName, IconName> kNavFilledIcons = {
  IconName.home: IconName.homeFill,
  IconName.library: IconName.libraryFill,
  IconName.download: IconName.downloadFill,
  IconName.search: IconName.searchFill,
  IconName.settings: IconName.settingsFill,
};

/// Wraps a glyph's inner markup in the shared 24x24 stroke envelope and
/// resolves the `__FILL__` sentinel. The result paints entirely in
/// `currentColor`; [IconCS] recolours it via a srcIn `ColorFilter`.
String buildIconSvg(IconName name, {bool fill = false}) {
  final inner = kIconMarkup[name]!.replaceAll(
    '__FILL__',
    fill ? 'currentColor' : 'none',
  );
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
      'fill="none" stroke="currentColor" stroke-width="1.5" '
      'stroke-linecap="round" stroke-linejoin="round">$inner</svg>';
}
