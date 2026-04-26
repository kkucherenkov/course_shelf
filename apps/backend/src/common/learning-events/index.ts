/**
 * WHY this file exists:
 * The boundaries/element-types ESLint rule prevents the `catalog` module from
 * importing Learning domain events directly from `src/modules/learning/**`.
 * Re-exporting through `src/common/` (which is in the `allow` zone for all
 * module types) keeps cross-context coupling explicit and boundary-clean.
 *
 * Symbol identity is preserved — re-export does not create new classes; Nest's
 * EventBus routes by class reference so the token that the publisher emits is
 * identical to the one the @EventsHandler decorator registers.
 *
 * Add only events that multiple bounded contexts genuinely subscribe to.
 * Events consumed within Learning only belong in Learning's domain layer.
 */

export { LessonCompleted } from '../../modules/learning/domain/progress/lesson-completed.event';
export { LessonProgressRecorded } from '../../modules/learning/domain/progress/lesson-progress-recorded.event';
