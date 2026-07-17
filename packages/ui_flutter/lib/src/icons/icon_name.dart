/// The 71 named glyphs of the CourseShelf brand icon family.
///
/// Mirrors the `IconName` union of the web `IconCS` component
/// (`packages/ui/src/components/IconCS/IconCS.vue`) so a glyph referenced by
/// name renders identically on web and mobile. Values are camelCase; [token]
/// yields the web/kebab-case spelling used for lookup and golden labels.
///
/// The `*Fill` entries are hand-drawn filled silhouettes of their outline
/// sibling — the active-state glyphs of the bottom-tab bar
/// (`AppNavigationTab.filledIcon`). They are distinct glyphs, not the
/// `IconCS(fill: true)` toggle, which only applies to [kFillableIcons].
enum IconName {
  play,
  pause,
  next,
  prev,
  home,
  homeFill,
  library,
  libraryFill,
  search,
  searchFill,
  settings,
  settingsFill,
  check,
  checkCircle,
  circle,
  lock,
  download,
  downloadFill,
  cloud,
  cloudDown,
  bookmark,
  note,
  pdf,
  folder,
  user,
  users,
  plus,
  minus,
  x,
  chevronRight,
  chevronLeft,
  chevronDown,
  chevronUp,
  arrowRight,
  sun,
  moon,
  volume,
  volumeMute,
  subtitles,
  fullscreen,
  pip,
  speed,
  list,
  grid,
  filter,
  sort,
  eye,
  eyeOff,
  mail,
  key,
  shield,
  alert,
  info,
  wifiOff,
  refresh,
  edit,
  trash,
  copy,
  logout,
  menu,
  more,
  clock,
  calendar,
  at,
  sliders,
  arrowLeft,
  moreH,
  cornerDownRight,
  hardDrive,
  github,
  banner;

  /// The kebab-case token for this glyph (`checkCircle` -> `check-circle`),
  /// matching the string name the web component uses.
  String get token =>
      name.replaceAllMapped(RegExp('[A-Z]'), (m) => '-${m[0]!.toLowerCase()}');
}
