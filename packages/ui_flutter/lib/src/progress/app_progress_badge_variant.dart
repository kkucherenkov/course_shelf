/// The three visual forms of [AppProgressBadge], mirroring the web
/// `AppProgressBadge`'s `variant` union (`ring | bar | pill`).
enum AppProgressBadgeVariant { ring, bar, pill }

/// The lifecycle state of the thing [AppProgressBadge] reports progress for,
/// mirroring the web `AppProgressBadge`'s `state` union (`not-started |
/// in-progress | completed | locked`).
///
/// This — not [AppProgressBadge.completed] / [AppProgressBadge.total] alone
/// — drives the badge's computed percentage: `completed` forces 100%,
/// `notStarted` / `locked` force 0%, and only `inProgress` derives its
/// percentage from `completed` / `total`. See `AppProgressBadge.percent`.
enum AppProgressBadgeState { notStarted, inProgress, completed, locked }
