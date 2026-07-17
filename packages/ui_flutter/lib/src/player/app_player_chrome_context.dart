/// Layout context driving [AppPlayerChrome]'s aspect box and edge affordances.
///
/// Mirrors the web `PlayerChrome`'s `context` prop
/// (`docs/design/cs-components/components.jsx` `§PlayerChrome`), whose
/// `isMobile = context === 'mobile-landscape'` switch toggles the `19/9`
/// aspect and the double-tap edge hints. The shipped `AppPlayerChrome.vue`
/// only ever renders the `16/9` desktop layout, so this Flutter enum is the
/// first place either code stack parametrises the two contexts as one
/// component.
///
/// * [mobileLandscape] — the immersive full-bleed player: a `19/9` box with
///   double-tap skip edge hints and pinch-to-dismiss, used when the device is
///   rotated to landscape.
/// * [portrait] — the embedded `16/9` stage that sits above the lesson tab
///   strip. Same chrome (top bar, scrubber, transport row, state banners),
///   minus the landscape-only edge hints and pinch gesture.
enum AppPlayerChromeContext { mobileLandscape, portrait }
