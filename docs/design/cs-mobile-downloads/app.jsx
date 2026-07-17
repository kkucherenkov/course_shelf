const { useState, useId } = React;

// ---- Local presentational bits (tokens only; reuse everything else) ----

// Thin proportional device-storage bar.
const StorageBar = ({ used = 4.2, other = 59.8, total = 128 }) => {
  const free = Math.max(0, total - used - other);
  const w = (v) => `${Math.max(0, (v / total) * 100)}%`;
  return (
    <div className="card" data-od-id="storage-summary" style={{ padding: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span className="t-body-strong" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="hard-drive" size={14} style={{ color: 'var(--text-muted)' }} />
          CourseShelf
        </span>
        <span className="t-caption t-mono t-mute">
          {used.toFixed(1)} GB / {free.toFixed(0)} GB free
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 6,
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          background: 'var(--surface-3)',
        }}
      >
        <div style={{ width: w(used), background: 'var(--primary)' }} />
        <div style={{ width: w(other), background: 'var(--border-strong)' }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
        {[
          ['var(--primary)', 'CourseShelf'],
          ['var(--border-strong)', 'Other apps'],
          ['var(--surface-3)', 'Free'],
        ].map(([c, l]) => (
          <span
            key={l}
            className="t-caption t-mute"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

// Collapsible per-section group header + body.
const Group = ({ title, count, tone, action, defaultOpen = true, id, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId(); // unique per instance — the same group renders in >1 frame
  const toggle = () => setOpen((o) => !o);
  return (
    <div data-od-id={id}>
      <div className="mobile-section-h" style={{ alignItems: 'center' }}>
        {/* Disclosure trigger: role=button (a native <button> can't wrap the <h3>),
            keyboard-operable, announces expand state. Left cluster only so the
            sibling action button below never nests inside an interactive. */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, cursor: 'pointer' }}
        >
          <Icon
            name="chevron-down"
            size={14}
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'none' : 'rotate(-90deg)',
              transition: 'transform var(--d-fast)',
            }}
          />
          <h3 style={tone ? { color: tone } : undefined}>{title}</h3>
          <span className="t-caption t-mono t-mute">· {count}</span>
        </div>
        {action}
      </div>
      <div id={bodyId} hidden={!open}>
        {children}
      </div>
    </div>
  );
};

// Per-course subgroup header inside "Downloaded", with a Delete-all affordance.
const CourseSubhead = ({ course, accent }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 4px' }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: COVER[accent], flexShrink: 0 }} />
    <span
      className="t-caption t-mute"
      style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {course}
    </span>
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      aria-label={`Delete all downloads for ${course}`}
      style={{ color: 'var(--text-muted)' }}
    >
      <Icon name="trash" size={13} />
      Delete all
    </button>
  </div>
);

// Network-aware banner shown when the device is offline.
const OfflineBanner = () => (
  <div className="banner banner-warning" data-od-id="offline-banner" style={{ margin: '0 16px 4px' }}>
    <Icon name="wifi-off" size={16} />
    <div className="banner-body">
      <div className="banner-title">You're offline</div>
      Downloads and retries are paused — they resume automatically when you reconnect.
    </div>
  </div>
);

// Nothing-downloaded-yet state.
const EmptyState = () => (
  <div
    style={{
      padding: '56px 32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
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
        color: 'var(--text-muted)',
      }}
    >
      <Icon name="cloud-down" size={24} />
    </div>
    <div className="t-title">No downloads yet</div>
    <p className="t-caption t-mute" style={{ margin: 0, maxWidth: '30ch' }}>
      Nothing downloaded yet — open a course and tap the download icon.
    </p>
  </div>
);

// ---- Mock data ----
const IN_PROGRESS = [
  {
    lesson: 'Quorum reads & writes',
    course: 'Distributed Systems',
    size: '186 MB',
    state: 'downloading',
    progress: 62,
    accent: 'teal',
  },
  {
    lesson: 'Conflict resolution',
    course: 'Distributed Systems',
    size: '172 MB',
    state: 'queued',
    accent: 'teal',
  },
  {
    lesson: 'Causal consistency',
    course: 'Distributed Systems',
    size: '220 MB',
    state: 'queued',
    accent: 'teal',
  },
];
const DOWNLOADED = [
  {
    course: 'Distributed Systems',
    accent: 'teal',
    rows: [
      { lesson: 'Single-leader replication', size: '124 MB' },
      { lesson: 'Multi-leader replication', size: '132 MB' },
    ],
  },
  {
    course: 'Modern PostgreSQL',
    accent: 'indigo',
    rows: [
      { lesson: 'Query planning basics', size: '88 MB' },
      { lesson: 'Index internals & B-trees', size: '140 MB' },
    ],
  },
];
const FAILED = [
  {
    lesson: 'Eigenvectors & eigenvalues',
    course: 'Linear Algebra for ML',
    size: '142 MB',
    accent: 'teal',
  },
];
const DOWNLOADED_COUNT = DOWNLOADED.reduce((n, g) => n + g.rows.length, 0);

const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');

  // "In progress" — active downloads read as Paused while offline.
  const InProgress = ({ offline = false }) => (
    <Group id="grp-in-progress" title="In progress" count={IN_PROGRESS.length}>
      {IN_PROGRESS.map((d, i) => (
        <DownloadRow
          key={i}
          {...d}
          state={offline && d.state === 'downloading' ? 'paused' : d.state}
        />
      ))}
    </Group>
  );

  const Downloaded = () => (
    <Group id="grp-downloaded" title="Downloaded" count={DOWNLOADED_COUNT}>
      {DOWNLOADED.map((g) => (
        <div key={g.course}>
          <CourseSubhead course={g.course} accent={g.accent} />
          {g.rows.map((r, i) => (
            <DownloadRow
              key={i}
              lesson={r.lesson}
              course={g.course}
              size={r.size}
              state="ready"
              accent={g.accent}
            />
          ))}
        </div>
      ))}
    </Group>
  );

  const Failed = () => (
    <Group
      id="grp-failed"
      title="Failed"
      tone="var(--error)"
      count={FAILED.length}
      action={
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Clear failed downloads"
          style={{ color: 'var(--text-muted)' }}
        >
          Clear
        </button>
      }
    >
      {FAILED.map((d, i) => (
        <DownloadRow key={i} {...d} state="failed" />
      ))}
    </Group>
  );

  return (
    <div data-screen-label="cs-mobile-downloads" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h1 className="t-display" style={{ marginBottom: 4 }}>
          Mobile · Downloads
        </h1>
        <p className="t-mute" style={{ margin: 0, marginBottom: 24, maxWidth: '68ch' }}>
          Offline library: a storage summary, collapsible per-course groups, and failed retries —
          shown populated, empty, and offline.
        </p>

        <div className="mobile-stage">
          <Phone activeTab="downloads" label="POPULATED">
            <div className="mobile-large-title">
              <h1>Downloads</h1>
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              <StorageBar used={4.2} other={59.8} total={128} />
            </div>
            <InProgress />
            <Downloaded />
            <Failed />
          </Phone>

          <Phone activeTab="downloads" label="EMPTY">
            <div className="mobile-large-title">
              <h1>Downloads</h1>
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              <StorageBar used={0} other={59.8} total={128} />
            </div>
            <EmptyState />
          </Phone>

          <Phone activeTab="downloads" label="OFFLINE">
            <div className="mobile-large-title">
              <h1>Downloads</h1>
            </div>
            <OfflineBanner />
            <div style={{ padding: '4px 16px 8px' }}>
              <StorageBar used={4.2} other={59.8} total={128} />
            </div>
            <InProgress offline />
            <Downloaded />
            <Failed />
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
