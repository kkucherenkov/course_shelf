- [x] cs-web-settings
- [x] cs-mobile-browse (B),
- [ ] cs-mobile-course-detail,
- [ ] cs-mobile-downloads,
- [ ] cs-mobile-search-settings (B)

создай новый проект со slug-ом «cs-mobile-course-detail»

Контекст. CourseShelf — self-hosted платформа для видео-курсов. В репо
уже лежат прототипы: docs/design/cs-foundations (foundations canvas),
docs/design/cs-components (доменные компоненты), docs/design/cs-web-home,
cs-web-course-detail, cs-web-lesson-player, cs-web-auth, и три mobile-экрана.
Источник правды для дизайн-токенов — /shared/tokens.json.
Source of truth для иконок — /shared/icons.jsx.
Source of truth для общих auth/shell/util — /shared/.

Бриф проекта.

> Design the mobile **Course Detail** screen.
>
> Top: cover image as a hero (collapsing on scroll). Title, instructor,
> progress, primary "Resume / Start" CTA, secondary "Download course"
> CTA (with size estimate).
>
> Below: sections expanded by default with LessonRows. Each LessonRow
> shows download status (downloaded checkmark / downloading spinner
> with progress / cloud icon / failed). Tapping the download icon
> queues that lesson.
>
> States: default, in-progress, completed, no-access, mid-download,
> mostly-downloaded, all-downloaded.

Соглашения, к которым обязан подчиниться прототип:

- Файлы: app.jsx + index.html (+ styles.css по необходимости).
- index.html подгружает Babel-standalone, shared/tokens.css, shared/util.jsx,
  shared/screens.css, при необходимости shared/shell.jsx и docs/design/
  cs-components/components.jsx (через <script src> с type="text/babel").
- Web-проект показывает три reference width стека по вертикали:
  360 (xs), 1024 (md), 1440 (lg). Mobile-проект — два: 375 (iPhone 13 mini)
  и 428 (iPhone 14 Pro Max), плюс одна Android-проверка 412×915.
- Каждый кластер состояний помечен заголовком вида «State: empty» в
  стиле t-caption t-mono.
- Обе темы (dark + light) видны бок-о-бок.
- Все цвета — через CSS-переменные из shared/tokens.css. Ни одного
  hard-coded hex.
- Иконки — через <Icon name="..." /> из shared/icons.jsx. Если нужной
  иконки нет в наборе, добавляешь её в shared/icons.jsx в этом же
  бандле и в комментарии указываешь: «// New icon: name — adopted into
  shared/icons.jsx in cs-<slug>».
- Доменные компоненты (CourseCard\*, LessonRow, ProgressBadge,
  PlayerChrome, и т.д.) — переиспользуешь из cs-components/components.jsx,
  не переопределяешь. Если для этого экрана нужен новый доменный
  компонент (например, SearchResultGroup, AdminUserRow, FilterPanel,
  DownloadRow), определяй его в app.jsx этого проекта и помечай:
  «// New for cs-<slug>: NameHere — могут вынести в cs-components/ позже».
- Realistic CourseShelf copy: реальные курсы и уроки, никакого
  lorem ipsum, без эмодзи, sentence case в кнопках.
- Acceptance включает все state, перечисленные в брифе: default,
  loading skeleton, empty, error, и доменные state (locked, in-progress,
  и т.д.).
- Доступность: каждый кластер должен пройти WCAG AA (контраст ≥ 4.5:1
  на body); фокусы видимы; информация не передаётся только цветом.

создай новый проект со slug-ом «cs-mobile-downloads»

Контекст. CourseShelf — self-hosted платформа для видео-курсов. В репо
уже лежат прототипы: docs/design/cs-foundations (foundations canvas),
docs/design/cs-components (доменные компоненты), docs/design/cs-web-home,
cs-web-course-detail, cs-web-lesson-player, cs-web-auth, и три mobile-экрана.
Источник правды для дизайн-токенов — /shared/tokens.json.
Source of truth для иконок — /shared/icons.jsx.
Source of truth для общих auth/shell/util — /shared/.

Бриф проекта.

> Design the mobile **Downloads** tab.
>
> Top: storage usage summary — total used by CourseShelf, available on
> device, with a thin proportional bar.
>
> Sections (collapsed by default per course, expandable):
>
> - **In progress**: queued + actively downloading lessons (uses
>   DownloadRow).
> - **Downloaded**: by course, with per-course "delete all" affordance.
> - **Failed**: with retry / clear.
>
> Empty: "Nothing downloaded yet — open a course and tap the download
> icon." Network-aware: when offline, show a banner that uploads /
> retries are paused.

Соглашения, к которым обязан подчиниться прототип:

- Файлы: app.jsx + index.html (+ styles.css по необходимости).
- index.html подгружает Babel-standalone, shared/tokens.css, shared/util.jsx,
  shared/screens.css, при необходимости shared/shell.jsx и docs/design/
  cs-components/components.jsx (через <script src> с type="text/babel").
- Web-проект показывает три reference width стека по вертикали:
  360 (xs), 1024 (md), 1440 (lg). Mobile-проект — два: 375 (iPhone 13 mini)
  и 428 (iPhone 14 Pro Max), плюс одна Android-проверка 412×915.
- Каждый кластер состояний помечен заголовком вида «State: empty» в
  стиле t-caption t-mono.
- Обе темы (dark + light) видны бок-о-бок.
- Все цвета — через CSS-переменные из shared/tokens.css. Ни одного
  hard-coded hex.
- Иконки — через <Icon name="..." /> из shared/icons.jsx. Если нужной
  иконки нет в наборе, добавляешь её в shared/icons.jsx в этом же
  бандле и в комментарии указываешь: «// New icon: name — adopted into
  shared/icons.jsx in cs-<slug>».
- Доменные компоненты (CourseCard\*, LessonRow, ProgressBadge,
  PlayerChrome, и т.д.) — переиспользуешь из cs-components/components.jsx,
  не переопределяешь. Если для этого экрана нужен новый доменный
  компонент (например, SearchResultGroup, AdminUserRow, FilterPanel,
  DownloadRow), определяй его в app.jsx этого проекта и помечай:
  «// New for cs-<slug>: NameHere — могут вынести в cs-components/ позже».
- Realistic CourseShelf copy: реальные курсы и уроки, никакого
  lorem ipsum, без эмодзи, sentence case в кнопках.
- Acceptance включает все state, перечисленные в брифе: default,
  loading skeleton, empty, error, и доменные state (locked, in-progress,
  и т.д.).
- Доступность: каждый кластер должен пройти WCAG AA (контраст ≥ 4.5:1
  на body); фокусы видимы; информация не передаётся только цветом.

создай новый проект со slug-ом «cs-mobile-search-settings»

Контекст. CourseShelf — self-hosted платформа для видео-курсов. В репо
уже лежат прототипы: docs/design/cs-foundations (foundations canvas),
docs/design/cs-components (доменные компоненты), docs/design/cs-web-home,
cs-web-course-detail, cs-web-lesson-player, cs-web-auth, и три mobile-экрана.
Источник правды для дизайн-токенов — /shared/tokens.json.
Source of truth для иконок — /shared/icons.jsx.
Source of truth для общих auth/shell/util — /shared/.

Бриф проекта.

> Design the mobile **Search** tab and **Settings** tab.
>
> Search: a search field at the top, results grouped (Courses /
> Lessons) below, with the same snippet-and-thumbnail treatment as
> web. Recent searches shown when the field is empty.
>
> Settings: same sections as web (Profile, Appearance, Playback,
> Account) styled as a native settings list. Sign-out at the bottom
> with destructive treatment.

Соглашения, к которым обязан подчиниться прототип:

- Файлы: app.jsx + index.html (+ styles.css по необходимости).
- index.html подгружает Babel-standalone, shared/tokens.css, shared/util.jsx,
  shared/screens.css, при необходимости shared/shell.jsx и docs/design/
  cs-components/components.jsx (через <script src> с type="text/babel").
- Web-проект показывает три reference width стека по вертикали:
  360 (xs), 1024 (md), 1440 (lg). Mobile-проект — два: 375 (iPhone 13 mini)
  и 428 (iPhone 14 Pro Max), плюс одна Android-проверка 412×915.
- Каждый кластер состояний помечен заголовком вида «State: empty» в
  стиле t-caption t-mono.
- Обе темы (dark + light) видны бок-о-бок.
- Все цвета — через CSS-переменные из shared/tokens.css. Ни одного
  hard-coded hex.
- Иконки — через <Icon name="..." /> из shared/icons.jsx. Если нужной
  иконки нет в наборе, добавляешь её в shared/icons.jsx в этом же
  бандле и в комментарии указываешь: «// New icon: name — adopted into
  shared/icons.jsx in cs-<slug>».
- Доменные компоненты (CourseCard\*, LessonRow, ProgressBadge,
  PlayerChrome, и т.д.) — переиспользуешь из cs-components/components.jsx,
  не переопределяешь. Если для этого экрана нужен новый доменный
  компонент (например, SearchResultGroup, AdminUserRow, FilterPanel,
  DownloadRow), определяй его в app.jsx этого проекта и помечай:
  «// New for cs-<slug>: NameHere — могут вынести в cs-components/ позже».
- Realistic CourseShelf copy: реальные курсы и уроки, никакого
  lorem ipsum, без эмодзи, sentence case в кнопках.
- Acceptance включает все state, перечисленные в брифе: default,
  loading skeleton, empty, error, и доменные state (locked, in-progress,
  и т.д.).
- Доступность: каждый кластер должен пройти WCAG AA (контраст ≥ 4.5:1
  на body); фокусы видимы; информация не передаётся только цветом.
