// cs-web-browse-search · stage assembly
// Renders Browse + Search at three reference widths × dark+light, with state clusters.

const { useState } = React;

// Shrunken sidebar nav for in-frame demos
const FrameSide = ({ active, bp }) => {
  const items = [
    ['home', 'Home', 'home'],
    ['browse', 'Browse', 'library'],
    ['search', 'Search', 'search'],
  ];
  if (bp === 'xs') return null;
  return (
    <aside className="bs-side">
      <div className="bs-brand">
        <div className="bs-brand-mark">CS</div>
        <div className="bs-brand-name">CourseShelf</div>
      </div>
      {items.map(([k, l, ic]) => (
        <div key={k} className="nav-item" aria-current={active === k ? 'page' : undefined}>
          <Icon name={ic} size={16} />
          <span className="label">{l}</span>
        </div>
      ))}
    </aside>
  );
};

// ============================================================================
// Browse content body — reused inside the frame
// ============================================================================
const BrowseContent = ({
  bp,
  state,
  filterValues,
  setFilterValues,
  sort,
  setSort,
  onOpenSheet,
}) => {
  const ALL = COURSES.concat(
    COURSES.map((c, i) => ({
      ...c,
      id: `${c.id}b`,
      title: i % 2 ? `Advanced ${c.title}` : `${c.title} · Workshop`,
    })),
  ); // 16 cards

  const activeChips = [];
  (filterValues.status || []).forEach((s) =>
    activeChips.push({ k: 'status', v: s, label: s.replace('-', ' ') }),
  );
  (filterValues.library || []).forEach((id) =>
    activeChips.push({ k: 'library', v: id, label: LIBRARIES.find((l) => l.id === id)?.name }),
  );
  (filterValues.duration || []).forEach((d) =>
    activeChips.push({
      k: 'duration',
      v: d,
      label: { lt5: '< 5h', '5to10': '5–10h', '10to20': '10–20h', gt20: '> 20h' }[d],
    }),
  );
  (filterValues.instructor || []).forEach((id) =>
    activeChips.push({ k: 'instructor', v: id, label: INSTRUCTORS.find((i) => i.id === id)?.name }),
  );

  const removeChip = (k, v) =>
    setFilterValues({ ...filterValues, [k]: (filterValues[k] || []).filter((x) => x !== v) });

  return (
    <div className={`bs-browse`} data-bp={bp}>
      {bp !== 'xs' && (
        <aside style={{ position: 'sticky', top: 12, alignSelf: 'start' }}>
          <FilterPanel
            values={filterValues}
            onChange={setFilterValues}
            instructorSearch={bp === 'lg'}
          />
        </aside>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="bs-browse-h">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2>Browse</h2>
            <span className="count">
              {state === 'empty' ? '0 courses' : state === 'loading' ? '— loading' : '84 courses'}
            </span>
          </div>
          <div className="bs-browse-controls">
            {bp === 'xs' && (
              <button className="bs-sort" onClick={onOpenSheet} aria-label="Open filters">
                <Icon name="sliders" size={14} />
                Filters
                {activeChips.length > 0 && (
                  <span className="chip chip-primary" style={{ padding: '0 6px', fontSize: 11 }}>
                    {activeChips.length}
                  </span>
                )}
              </button>
            )}
            <div className="bs-sort" role="combobox" aria-label="Sort">
              <Icon name="sort" size={14} />
              <span>Sort: {sort}</span>
              <Icon name="chevron-down" size={12} />
            </div>
            {bp !== 'xs' && (
              <div className="bs-view-toggle" role="group" aria-label="View">
                <button aria-selected="true" aria-label="Grid">
                  <Icon name="grid" size={14} />
                </button>
                <button aria-selected="false" aria-label="List">
                  <Icon name="list" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="bs-active-chips" role="list" aria-label="Active filters">
            {activeChips.map((c, i) => (
              <span key={i} className="bs-active-chip" role="listitem">
                <span style={{ textTransform: 'capitalize' }}>{c.label}</span>
                <button onClick={() => removeChip(c.k, c.v)} aria-label={`Remove ${c.label}`}>
                  <Icon name="x" size={10} />
                </button>
              </span>
            ))}
            <span
              className="bs-clear-all"
              role="button"
              tabIndex={0}
              onClick={() => setFilterValues({})}
            >
              Clear all
            </span>
          </div>
        )}

        {state === 'loading' && (
          <div className="bs-grid" data-bp={bp}>
            {Array.from({ length: bp === 'xs' ? 4 : bp === 'md' ? 8 : 10 }).map((_, i) => (
              <CoursePosterCard key={i} loading />
            ))}
          </div>
        )}

        {state === 'empty' && (
          <div className="bs-empty">
            <div className="bs-empty-icon">
              <Icon name="library" size={22} />
            </div>
            <h3>No courses match those filters</h3>
            <p>Try removing a filter, or clear them all to see every course on your shelf.</p>
            <div className="bs-empty-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setFilterValues({})}>
                Clear all filters
              </button>
              <button className="btn btn-ghost btn-sm">Browse libraries</button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bs-error" role="alert">
            <Icon name="alert" size={20} />
            <h3>Couldn't reach the server</h3>
            <p>
              Your library service didn't respond. Check that{' '}
              <span className="t-mono">courseshelf-server</span> is running, then retry.
            </p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}>
              <Icon name="refresh" size={12} />
              Retry
            </button>
          </div>
        )}

        {state === 'default' && (
          <div className="bs-grid" data-bp={bp}>
            {ALL.slice(0, bp === 'xs' ? 6 : bp === 'md' ? 12 : 15).map((c, i) => {
              const stateMap = [
                'in-progress',
                'completed',
                'not-started',
                'locked',
                'in-progress',
                'not-started',
              ];
              return (
                <CoursePosterCard key={c.id} course={c} state={stateMap[i % stateMap.length]} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Search content body
// ============================================================================
const SearchContent = ({ bp, state, query }) => {
  if (state === 'empty')
    return (
      <div className="bs-empty">
        <div className="bs-empty-icon">
          <Icon name="search" size={22} />
        </div>
        <h3>
          No results for <span className="term">"{query}"</span>
        </h3>
        <p>
          Try a broader search, or remove a filter. Searches look across course titles, lesson
          titles, instructors, and transcript text.
        </p>
        <div className="bs-empty-actions">
          <button className="btn btn-secondary btn-sm">Clear filters</button>
          <button className="btn btn-ghost btn-sm">Search instead in transcripts</button>
        </div>
      </div>
    );

  if (state === 'loading')
    return (
      <div>
        <div className="sr-group">
          <div className="sr-group-h">
            <h3>Courses</h3>
            <span className="count">— loading</span>
          </div>
          <SearchResultSkeleton />
        </div>
        <div className="sr-group">
          <div className="sr-group-h">
            <h3>Lessons</h3>
            <span className="count">— loading</span>
          </div>
          <SearchResultSkeleton />
        </div>
      </div>
    );

  return (
    <div>
      <SearchResultGroup kind="Courses" count={2}>
        <CourseSearchItem
          course={COURSES[0]}
          snippet="Covers <mark>quorum</mark> reads, sloppy <mark>quorums</mark>, and read repair across 4 hours of lessons."
        />
        <CourseSearchItem course={COURSES[2]} />
      </SearchResultGroup>
      <SearchResultGroup kind="Lessons" count={SEARCH_LESSON_RESULTS.length}>
        {SEARCH_LESSON_RESULTS.map((l) => (
          <LessonSearchItem key={l.id} lesson={l} />
        ))}
      </SearchResultGroup>
    </div>
  );
};

// ============================================================================
// One full frame (browser chrome + shell + content)
// ============================================================================
const BrowseFrame = ({ bp, theme, state, view = 'browse' }) => {
  const widthMap = { xs: 360, md: 1024, lg: 1440 };
  const w = widthMap[bp];
  const [filterValues, setFilterValues] = useState(() =>
    state === 'with-filters' || state === 'empty'
      ? { status: ['in-progress'], library: ['cs', 'db'], duration: ['lt5'] }
      : {},
  );
  const [sort, setSort] = useState('Recently watched');
  const [sheet, setSheet] = useState(false);
  const [overlay, setOverlay] = useState(view === 'search-overlay');
  const [query, setQuery] = useState(
    view === 'search-overlay' || view === 'search' ? 'quorum' : '',
  );

  return (
    <div className="bs-frame" data-theme={theme} data-mode={theme} style={{ width: w }}>
      <div className="bs-frame-h">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="url">
          courseshelf.local/{view === 'search' ? 'search?q=quorum' : 'browse'}
        </span>
        <span style={{ width: 30 }} />
      </div>
      <div className="bs-frame-body">
        <div className="bs-shell" data-bp={bp}>
          <FrameSide active={view.includes('search') ? 'search' : 'browse'} bp={bp} />
          <div className="bs-main">
            <header className="bs-topbar">
              {bp === 'xs' && (
                <button className="btn btn-ghost btn-icon btn-sm">
                  <Icon name="menu" size={16} />
                </button>
              )}
              <div
                className="input-with-icon"
                onClick={() => (bp === 'xs' && view === 'browse' ? setOverlay(true) : null)}
              >
                <Icon name="search" size={14} />
                <input
                  className="input"
                  placeholder="Search courses, lessons, transcripts…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  readOnly={bp === 'xs' && view === 'browse'}
                />
              </div>
              {bp !== 'xs' && (
                <button className="btn btn-ghost btn-icon btn-sm" aria-label="Notifications">
                  <Icon name="bookmark" size={16} />
                </button>
              )}
              {bp !== 'xs' && (
                <div className="avatar avatar-sm" aria-label="Account">
                  EL
                </div>
              )}
            </header>
            <div className="bs-content">
              {view === 'browse' && (
                <BrowseContent
                  bp={bp}
                  state={state}
                  filterValues={filterValues}
                  setFilterValues={setFilterValues}
                  sort={sort}
                  setSort={setSort}
                  onOpenSheet={() => setSheet(true)}
                />
              )}
              {(view === 'search' || view === 'search-overlay') && (
                <SearchContent bp={bp} state={state} query={query || 'quorum'} />
              )}
            </div>
          </div>
        </div>

        {bp === 'xs' && view === 'browse' && state !== 'loading' && state !== 'error' && (
          <div className="bs-filter-fab" role="button" tabIndex={0} onClick={() => setSheet(true)}>
            <Icon name="sliders" size={14} />
            Filters
            {Object.values(filterValues).flat().filter(Boolean).length > 0 && (
              <span className="fab-count">
                {Object.values(filterValues).flat().filter(Boolean).length}
              </span>
            )}
          </div>
        )}

        {sheet && (
          <FilterSheet
            values={filterValues}
            onChange={setFilterValues}
            onClose={() => setSheet(false)}
            onApply={() => setSheet(false)}
            onClear={() => {
              setFilterValues({});
              setSheet(false);
            }}
          />
        )}

        {overlay && view === 'search-overlay' && (
          <div className="bs-search-overlay">
            <div className="bs-search-overlay-h">
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setOverlay(false)}
                aria-label="Cancel"
              >
                <Icon name="arrow-left" size={16} />
              </button>
              <div className="input-with-icon">
                <Icon name="search" size={14} />
                <input
                  className="input"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                />
                {query && (
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setQuery('')}
                    aria-label="Clear"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="bs-search-overlay-body">
              {!query && (
                <div className="bs-recent">
                  <div className="bs-recent-h">
                    <span>Recent</span>
                    <span className="bs-clear-all" role="button">
                      Clear
                    </span>
                  </div>
                  {['quorum reads', 'watercolor wet on wet', 'vim macros', 'EXPLAIN ANALYZE'].map(
                    (q) => (
                      <div key={q} className="bs-recent-item">
                        <Icon name="clock" size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="label">{q}</span>
                        <Icon name="x" size={14} className="clear" />
                      </div>
                    ),
                  )}
                </div>
              )}
              {query && <SearchContent bp={bp} state={state} query={query} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Stage — vertical clusters of (xs, md, lg) × (dark, light) frames
// ============================================================================
const BpRow = ({ bps, state, view = 'browse' }) => (
  <div className="bs-bp-row">
    {bps.map((bp) =>
      ['dark', 'light'].map((theme) => (
        <div key={`${bp}-${theme}`} className="bs-bp">
          <div className="bs-bp-label">
            <span className="pill">
              {bp === 'xs' ? 'xs · 360' : bp === 'md' ? 'md · 1024' : 'lg · 1440'}
            </span>
            <span className="pill">{theme}</span>
          </div>
          <BrowseFrame bp={bp} theme={theme} state={state} view={view} />
        </div>
      )),
    )}
  </div>
);

const App = () => {
  // Page itself follows current root mode; individual frames override per-frame for side-by-side dark+light
  useMode('dark');
  return (
    <div className="bs-stage" data-screen-label="01 cs-web-browse-search">
      <div className="bs-stage-h">
        <div>
          <div className="t-caption t-mono">CS-WEB-BROWSE-SEARCH</div>
          <h1 className="t-display" style={{ margin: '4px 0 0' }}>
            Browse + Search · web
          </h1>
        </div>
        <p
          className="t-mute"
          style={{ margin: 0, maxWidth: '70ch', flex: '1 1 320px', minWidth: 280 }}
        >
          Three reference widths stacked vertically: <span className="t-mono">xs · 360</span>,{' '}
          <span className="t-mono">md · 1024</span>,<span className="t-mono"> lg · 1440</span>. Each
          cluster shows dark + light side-by-side. Filters live in a left rail at md+ and a bottom
          sheet at xs. Search is a persistent top-bar input on md+ and a full-screen overlay on xs.
        </p>
      </div>

      <section>
        <div className="bs-cluster-h">State: default · with mixed course states</div>
        <BpRow bps={['xs', 'md', 'lg']} state="default" />
      </section>

      <section>
        <div className="bs-cluster-h">State: filtered · 3 facets active</div>
        <BpRow bps={['md', 'lg']} state="with-filters" />
      </section>

      <section>
        <div className="bs-cluster-h">State: loading · skeleton grid</div>
        <BpRow bps={['xs', 'lg']} state="loading" />
      </section>

      <section>
        <div className="bs-cluster-h">State: empty · filters return zero results</div>
        <BpRow bps={['md']} state="empty" />
      </section>

      <section>
        <div className="bs-cluster-h">State: error · server unreachable</div>
        <BpRow bps={['lg']} state="error" />
      </section>

      <section>
        <div className="bs-cluster-h">Search · default results · grouped by Courses + Lessons</div>
        <BpRow bps={['md', 'lg']} state="default" view="search" />
      </section>

      <section>
        <div className="bs-cluster-h">Search · loading skeleton</div>
        <BpRow bps={['lg']} state="loading" view="search" />
      </section>

      <section>
        <div className="bs-cluster-h">Search · empty</div>
        <BpRow bps={['md']} state="empty" view="search" />
      </section>

      <section>
        <div className="bs-cluster-h">Search · xs full-screen overlay</div>
        <BpRow bps={['xs']} state="default" view="search-overlay" />
      </section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
