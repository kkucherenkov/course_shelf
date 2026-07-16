/// Mobile-only lesson download state — the `downloadState` prop on the
/// mobile branch of the design bundle's `LessonRow`
/// (`docs/design/cs-components/components.jsx` §LessonRow, `mobile: true`;
/// see also `docs/roadmap/tasks/E17-F02-S02.md`).
///
/// The web `AppLessonRow.vue` has no equivalent prop — downloading is a
/// mobile-native affordance. A `null` [AppLessonRow.downloadState] means
/// "not downloadable / no download affordance shown", matching the bundle's
/// `downloadState = null` default.
///
/// Drives the trailing download icon in [AppLessonRow]:
/// [available] → cloud-down icon (tappable — fires `onDownload`),
/// [downloading] → spinner, [downloaded] → check, [failed] → alert.
enum LessonDownloadState { available, downloading, downloaded, failed }
