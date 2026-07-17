const { useState } = React;

// Highlight the matched query substring inside a result string.
const hl = (text, q) => {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark
        style={{
          background: 'var(--primary-soft)',
          color: 'var(--primary-hover)',
          borderRadius: 2,
          padding: '0 1px',
        }}
      >
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
};

// ---- Search bits (local, presentational) ----
const SearchField = ({ value = '', placeholder = 'Search courses, lessons…' }) => (
  <div style={{ padding: '4px 16px 12px' }}>
    <div className="input-with-icon">
      <Icon name="search" size={15} />
      <input
        className="input"
        type="search"
        aria-label="Search courses and lessons"
        defaultValue={value}
        placeholder={placeholder}
        style={{ height: 38, paddingRight: value ? 34 : 12, background: 'var(--surface-2)' }}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  </div>
);

const RecentRow = ({ term }) => (
  <div className="row" style={{ borderRadius: 'var(--radius-md)', gap: 12 }}>
    <button
      type="button"
      aria-label={`Search “${term}” again`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
      }}
    >
      <Icon name="clock" size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
      <span
        style={{
          fontSize: 13,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {term}
      </span>
    </button>
    <button
      type="button"
      aria-label={`Remove “${term}” from recent searches`}
      style={{
        width: 24,
        height: 24,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-subtle)',
        flexShrink: 0,
      }}
    >
      <Icon name="x" size={13} />
    </button>
  </div>
);

const ResultRow = ({ kind = 'course', accent = 'teal', glyph, title, snippet, meta, q }) => (
  <button
    type="button"
    className="row"
    style={{
      borderRadius: 'var(--radius-md)',
      alignItems: 'flex-start',
      gap: 12,
      width: '100%',
      textAlign: 'left',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 'var(--radius-sm)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: COVER[accent],
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {kind === 'course' ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          {glyph}
        </span>
      ) : (
        <Icon name="play" size={16} fill style={{ color: 'rgba(255,255,255,0.92)' }} />
      )}
      <div className="cc-cover-overlay" />
    </div>
    <div className="row-body">
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-loud)', lineHeight: '17px' }}>
        {hl(title, q)}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 2,
          lineHeight: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {hl(snippet, q)}
      </div>
      {meta && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 3,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {meta}
        </div>
      )}
    </div>
    <Icon
      name="chevron-right"
      size={15}
      style={{ color: 'var(--text-subtle)', marginTop: 2, flexShrink: 0 }}
    />
  </button>
);

// ---- Settings bits (local, presentational) — native grouped list from tokens + .row ----
const Toggle = ({ defaultOn = false }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((o) => !o)}
      style={{ flexShrink: 0 }}
    >
      <div className="switch-track">
        <div className="switch-thumb" />
      </div>
    </button>
  );
};

const SettingsSection = ({ title, children }) => (
  <div style={{ padding: '0 16px', marginBottom: 18 }}>
    {title && (
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-subtle)',
          padding: '0 6px 6px',
        }}
      >
        {title}
      </div>
    )}
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {React.Children.toArray(children).map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={{ height: 1, background: 'var(--border)', marginLeft: 52 }} />}
          {child}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const SettingsRow = ({ icon, label, sub, value, control, danger = false }) => {
  // Atomic nav / destructive rows are real buttons; rows hosting their own
  // control (a Toggle) stay a div so we never nest interactive elements.
  const Tag = control ? 'div' : 'button';
  return (
    <Tag
      className="row"
      {...(control ? {} : { type: 'button' })}
      style={{ borderRadius: 0, gap: 12, width: '100%', textAlign: 'left' }}
    >
    {icon && (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: danger ? 'var(--error-soft)' : 'var(--surface-3)',
          color: danger ? 'var(--error)' : 'var(--text)',
        }}
      >
        <Icon name={icon} size={15} />
      </div>
    )}
    <div className="row-body">
      <div
        style={{
          fontSize: 14,
          color: danger ? 'var(--error)' : 'var(--text-loud)',
          fontWeight: danger ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {sub && (
        <div className="row-sub" style={{ marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
    {control ? (
      control
    ) : value || !danger ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {value && (
          <span
            style={{ fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </span>
        )}
        {!danger && (
          <Icon name="chevron-right" size={15} style={{ color: 'var(--text-subtle)' }} />
        )}
      </div>
    ) : null}
    </Tag>
  );
};

const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  return (
    <div data-screen-label="cs-mobile-search-settings" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>
        <h1 className="t-display" style={{ marginBottom: 4 }}>
          Mobile · Search &amp; Settings
        </h1>
        <p className="t-mute" style={{ margin: 0, marginBottom: 24, maxWidth: '68ch' }}>
          Search tab across its three states — recent, grouped results, no match — beside the native
          Settings list with a pinned destructive sign-out.
        </p>

        <div className="mobile-stage">
          {/* ---------------- SEARCH · RECENT (empty) ---------------- */}
          <Phone activeTab="search" label="SEARCH · RECENT">
            <div className="mobile-large-title">
              <h1>Search</h1>
            </div>
            <SearchField />
            <div className="mobile-section-h">
              <h3>Recent</h3>
              <button
                type="button"
                className="t-caption"
                aria-label="Clear recent searches"
                style={{ color: 'var(--primary)', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            <div style={{ padding: '0 8px' }}>
              <RecentRow term="distributed systems" />
              <RecentRow term="quorum reads" />
              <RecentRow term="postgres replication" />
              <RecentRow term="watercolor landscapes" />
              <RecentRow term="linear algebra" />
            </div>
            <div className="mobile-section-h">
              <h3>Browse by subject</h3>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Computer Science', 'Databases', 'Mathematics', 'Art', 'Production', 'Tooling'].map(
                (s) => (
                  <button key={s} type="button" className="chip" style={{ cursor: 'pointer' }}>
                    {s}
                  </button>
                ),
              )}
            </div>
          </Phone>

          {/* ---------------- SEARCH · RESULTS (populated) ---------------- */}
          <Phone activeTab="search" label="SEARCH · RESULTS">
            <div className="mobile-large-title">
              <h1>Search</h1>
            </div>
            <SearchField value="replication" />
            <div className="mobile-section-h">
              <h3>Courses</h3>
              <span className="t-caption t-mute t-mono">2</span>
            </div>
            <div style={{ padding: '0 8px' }}>
              <ResultRow
                kind="course"
                accent="teal"
                glyph="DS"
                title="Distributed Systems Foundations"
                snippet="Section 05 covers leaderless replication, quorum reads and conflict resolution."
                meta="42 lessons · Martin Kleppmann"
                q="replication"
              />
              <ResultRow
                kind="course"
                accent="indigo"
                glyph="MP"
                title="Modern PostgreSQL — Performance Deep Dive"
                snippet="Streaming replication, WAL shipping and hot standbys for read scaling."
                meta="36 lessons · Lukas Fittl"
                q="replication"
              />
            </div>
            <div className="mobile-section-h">
              <h3>Lessons</h3>
              <span className="t-caption t-mute t-mono">3</span>
            </div>
            <div style={{ padding: '0 8px 16px' }}>
              <ResultRow
                kind="lesson"
                accent="teal"
                title="Single-leader replication"
                snippet="The leader processes all writes and replicates them to followers asynchronously."
                meta="Distributed Systems · 18:24"
                q="replication"
              />
              <ResultRow
                kind="lesson"
                accent="teal"
                title="Multi-leader replication"
                snippet="Each leader accepts writes independently; conflicts are resolved at merge time."
                meta="Distributed Systems · 22:10"
                q="replication"
              />
              <ResultRow
                kind="lesson"
                accent="indigo"
                title="Logical replication in Postgres"
                snippet="Publish and subscribe at the row level using replication slots and publications."
                meta="Modern PostgreSQL · 14:52"
                q="replication"
              />
            </div>
          </Phone>

          {/* ---------------- SEARCH · NO RESULTS ---------------- */}
          <Phone activeTab="search" label="SEARCH · NO RESULTS">
            <div className="mobile-large-title">
              <h1>Search</h1>
            </div>
            <SearchField value="kubernetes" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '64px 32px',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-subtle)',
                }}
              >
                <Icon name="search" size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-loud)' }}>
                No results for “kubernetes”
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: '18px' }}>
                Nothing in your library matches that yet. Try a different term or browse the full
                catalog.
              </div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 4 }}>
                <Icon name="library" size={14} />
                Browse library
              </button>
            </div>
          </Phone>

          {/* ---------------- SETTINGS ---------------- */}
          <Phone activeTab="settings" label="SETTINGS">
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
              <div className="mobile-large-title">
                <h1>Settings</h1>
              </div>

              <SettingsSection title="Profile">
                <button
                  type="button"
                  className="row"
                  style={{ borderRadius: 0, gap: 12, padding: '12px', width: '100%', textAlign: 'left' }}
                >
                  <div className="avatar avatar-lg">EL</div>
                  <div className="row-body">
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-loud)' }}>
                      Elena Lin
                    </div>
                    <div className="row-sub">elena.lin@example.com</div>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={16}
                    style={{ color: 'var(--text-subtle)', flexShrink: 0 }}
                  />
                </button>
              </SettingsSection>

              <SettingsSection title="Appearance">
                <SettingsRow icon="moon" label="Theme" value="Dark" />
                <SettingsRow icon="sliders" label="Text size" value="Default" />
                <SettingsRow icon="eye" label="Reduce motion" control={<Toggle />} />
              </SettingsSection>

              <SettingsSection title="Playback">
                <SettingsRow icon="play" label="Autoplay next lesson" control={<Toggle defaultOn />} />
                <SettingsRow icon="speed" label="Default speed" value="1.0×" />
                <SettingsRow icon="subtitles" label="Subtitles" value="English" />
                <SettingsRow
                  icon="cloud-down"
                  label="Download over Wi-Fi only"
                  control={<Toggle defaultOn />}
                />
              </SettingsSection>

              <SettingsSection title="Account">
                <SettingsRow icon="calendar" label="Subscription" value="Pro" />
                <SettingsRow icon="hard-drive" label="Storage & downloads" value="3.2 GB" />
                <SettingsRow icon="mail" label="Notifications" value="On" />
                <SettingsRow icon="shield" label="Privacy & security" />
                <SettingsRow icon="info" label="Help & support" />
              </SettingsSection>

              <div style={{ flex: 1, minHeight: 16 }} />

              <div style={{ padding: '0 16px 8px' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <SettingsRow icon="logout" label="Sign out" danger />
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-subtle)',
                  padding: '4px 0 20px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                CourseShelf 3.4.1 · build 812
              </div>
            </div>
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
