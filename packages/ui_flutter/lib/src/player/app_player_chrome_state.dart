/// Playback state driving [AppPlayerChrome]'s overlay content.
///
/// Mirrors the web `PlayerChrome`'s `state` prop union
/// (`docs/design/cs-components/components.jsx` `§PlayerChrome`). `playing`
/// and `paused` only flip the play/pause glyph; `buffering` layers a centred
/// `AppSpinner` on top of the ordinary scrubber/control row; `error`,
/// `locked`, and `end` replace the scrubber/control row with a centred state
/// banner (alert+retry / lock+message / up-next respectively) while the top
/// bar (section label, lesson title, settings) stays put.
enum AppPlayerChromeState { playing, paused, buffering, error, locked, end }
