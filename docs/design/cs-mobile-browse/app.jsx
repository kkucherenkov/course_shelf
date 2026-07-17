const { useState } = React;

// Browse consumes GET /courses (libraryId · status · sort only). Duration &
// instructor facets from the web FilterSheet are intentionally dropped here —
// the mobile card trims filters to what the API backs (see E18-F01-S02 notes).
const STATUS_OPTS = [
  ['not-started', 'Not started'],
  ['in-progress', 'In progress'],
  ['completed', 'Completed'],
];
const SORT_OPTS = [
  ['recently-watched', 'Recently watched'],
  ['newest', 'Newest'],
  ['alphabetical', 'Alphabetical'],
];
const sortLabel = (k) => (SORT_OPTS.find(([v]) => v === k) || SORT_OPTS[0])[1];

// A poster grid over the shared COURSES data. `cols` drives the 2-up (phones)
// vs 3-up (tablet-width) layout the acceptance calls for.
const PosterGrid = ({ cols = 2, courses = COURSES, states = {} }) => (
  <div className="mb-grid" data-cols={cols}>
    {courses.map((c, i) => (
      <CoursePosterCard key={c.title} course={c} state={states[i] || 'auto'} />
    ))}
  </div>
);

const LoadingGrid = ({ cols = 2, count = 6 }) => (
  <div className="mb-grid" data-cols={cols}>
    {Array.from({ length: count }).map((_, i) => (
      <CoursePosterCard key={i} course={COURSES[0]} loading />
    ))}
  </div>
);

// Top bar: title + a Filters trigger that carries an active-filter count badge.
const BrowseTop = ({ activeCount = 0 }) => (
  <div className="mb-top">
    <h1>Browse</h1>
    <div className="mb-top-actions">
      <button type="button" className="mb-filter-btn" aria-label="Filter courses">
        <Icon name="sliders" size={15} />
        Filters
        {activeCount > 0 && <span className="pill-count">{activeCount}</span>}
      </button>
    </div>
  </div>
);

// Count + sort affordance row above the grid.
const BrowseMeta = ({ count, sort = 'recently-watched' }) => (
  <div className="mb-meta">
    <span className="count">{count} courses</span>
    <button type="button" className="sort-btn" aria-label="Change sort order">
      <Icon name="sort" size={14} />
      {sortLabel(sort)}
    </button>
  </div>
);

// Active-filter rail — one removable chip per applied facet, plus Clear all.
const ActiveRail = ({ chips }) => (
  <div className="mb-active-rail">
    {chips.map((label) => (
      <button key={label} type="button" className="chip" aria-label={`Remove filter ${label}`}>
        {label}
        <Icon name="x" size={11} style={{ marginLeft: 4 }} />
      </button>
    ))}
    <button type="button" className="clear" aria-label="Clear all filters">
      Clear all
    </button>
  </div>
);

// Mobile filter bottom sheet — Sort (radios) + Status/Library (checkboxes).
// Trimmed to API-backed facets; reuses the shared .bs-sheet* chrome plus the
// browse-local .mb-sort-section.
const MobileFilterSheet = ({ values, onClose }) => (
  <div className="bs-sheet-backdrop" onClick={onClose}>
    <div className="bs-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="bs-sheet-handle" />
      <div className="bs-sheet-h">
        <h3>Filters &amp; sort</h3>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="bs-sheet-body">
        <div className="mb-sort-section">
          <h4>Sort by</h4>
          <div className="mb-sort-options">
            {SORT_OPTS.map(([k, l]) => (
              <label key={k}>
                <input type="radio" name="sort" defaultChecked={values.sort === k} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="fp">
          <div className="fp-section" data-open="true">
            <div className="fp-section-h" role="button" tabIndex={0} aria-expanded="true">
              <h4>Status</h4>
              <Icon name="chevron-down" size={14} className="chev" />
            </div>
            <div className="fp-options">
              {STATUS_OPTS.map(([k, l]) => (
                <label key={k} className="fp-opt">
                  <input type="checkbox" defaultChecked={(values.status || []).includes(k)} />
                  <span className="fp-opt-label">{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="fp-section" data-open="true">
            <div className="fp-section-h" role="button" tabIndex={0} aria-expanded="true">
              <h4>Library</h4>
              <Icon name="chevron-down" size={14} className="chev" />
            </div>
            <div className="fp-options">
              {LIBRARIES.map((lib) => (
                <label key={lib.id} className="fp-opt">
                  <input type="checkbox" defaultChecked={(values.library || []).includes(lib.id)} />
                  <span className="fp-opt-label">{lib.name}</span>
                  <span className="fp-opt-count">{lib.count}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bs-sheet-foot">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Clear all
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Show 12 courses
        </button>
      </div>
    </div>
  </div>
);

const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  return (
    <div data-screen-label="cs-mobile-browse" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <h1 className="t-display" style={{ marginBottom: 4 }}>
          Mobile · Browse
        </h1>
        <p className="t-mute" style={{ margin: 0, marginBottom: 24, maxWidth: '68ch' }}>
          Poster grid of the catalog — two columns on phones, three at tablet width — with an
          API-backed filter/sort bottom sheet (status · library · sort) and its loading, empty and
          error states.
        </p>

        <div className="mobile-stage">
          {/* GRID · 2-COL (default) */}
          <Phone activeTab="browse" label="GRID · 2-COL">
            <div className="mb-screen">
              <BrowseTop />
              <BrowseMeta count={84} sort="recently-watched" />
              <PosterGrid cols={2} courses={COURSES.slice(0, 6)} />
            </div>
          </Phone>

          {/* GRID · 3-COL (tablet width) */}
          <Phone activeTab="browse" label="GRID · 3-COL (TABLET)">
            <div className="mb-screen">
              <BrowseTop />
              <BrowseMeta count={84} sort="newest" />
              <PosterGrid cols={3} courses={COURSES.slice(0, 6)} />
            </div>
          </Phone>

          {/* FILTERED · active rail */}
          <Phone activeTab="browse" label="FILTERED · ACTIVE RAIL">
            <div className="mb-screen">
              <BrowseTop activeCount={2} />
              <ActiveRail chips={['In progress', 'Databases']} />
              <BrowseMeta count={12} sort="recently-watched" />
              <PosterGrid
                cols={2}
                courses={COURSES.slice(2, 6)}
                states={{ 0: 'in-progress', 1: 'in-progress', 2: 'in-progress', 3: 'in-progress' }}
              />
            </div>
          </Phone>

          {/* FILTER SHEET open */}
          <Phone activeTab="browse" label="FILTER SHEET">
            <div className="mb-screen">
              <BrowseTop activeCount={2} />
              <BrowseMeta count={12} sort="recently-watched" />
              <PosterGrid cols={2} courses={COURSES.slice(2, 4)} states={{ 0: 'in-progress', 1: 'in-progress' }} />
            </div>
            <MobileFilterSheet
              values={{ sort: 'recently-watched', status: ['in-progress'], library: ['db'] }}
              onClose={() => {}}
            />
          </Phone>

          {/* LOADING */}
          <Phone activeTab="browse" label="LOADING">
            <div className="mb-screen">
              <BrowseTop />
              <BrowseMeta count="—" sort="recently-watched" />
              <LoadingGrid cols={2} count={6} />
            </div>
          </Phone>

          {/* EMPTY */}
          <Phone activeTab="browse" label="EMPTY · NO MATCH">
            <div className="mb-screen">
              <BrowseTop activeCount={3} />
              <ActiveRail chips={['Completed', 'Mathematics', 'Art']} />
              <div className="mb-empty">
                <div className="glyph">
                  <Icon name="library" size={24} />
                </div>
                <h3>No courses match</h3>
                <p>Nothing in your library fits these filters. Try clearing one to widen the results.</p>
                <button type="button" className="btn btn-secondary btn-sm">
                  Clear all filters
                </button>
              </div>
            </div>
          </Phone>

          {/* ERROR */}
          <Phone activeTab="browse" label="ERROR">
            <div className="mb-screen">
              <BrowseTop />
              <div className="mb-error">
                <div className="glyph">
                  <Icon name="alert" size={24} />
                </div>
                <h3>Couldn’t load courses</h3>
                <p>Something went wrong reaching the catalog. Check your connection and try again.</p>
                <button type="button" className="btn btn-secondary btn-sm">
                  <Icon name="refresh" size={14} />
                  Retry
                </button>
                <code>GET /courses · network error</code>
              </div>
            </div>
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
