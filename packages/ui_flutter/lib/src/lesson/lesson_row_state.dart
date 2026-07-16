/// Lesson progress state — Flutter twin of the web `LessonState` union
/// (`packages/ui/src/components/AppLessonRow/AppLessonRow.vue`).
///
/// Drives the leading icon/colour and the progress affordance in
/// [AppLessonRow]. Values are camelCase; the web twin uses kebab-case
/// (`not-started`, `in-progress`).
enum LessonRowState { notStarted, inProgress, completed, locked }
