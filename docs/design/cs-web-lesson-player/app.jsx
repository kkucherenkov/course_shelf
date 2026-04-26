const { useState } = React;
const App = () => {
  useMode('dark');
  const [tab, setTab] = useState('sections');
  const c = COURSES[0];
  return (
    <Shell active="browse">
      <div
        className="lp"
        data-screen-label="cs-web-lesson-player"
        style={{ padding: 0, marginTop: -4 }}
      >
        <div className="lp-main">
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 12,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            <span>{c.title}</span>
            <Icon name="chevron-right" size={12} />
            <span>Section 03 · Replication</span>
          </div>
          <PlayerChrome context="desktop" state="playing" />
          <div style={{ marginTop: 16 }}>
            <h1 className="t-heading" style={{ margin: '0 0 4px' }}>
              Leaderless replication & quorums
            </h1>
            <div className="t-mute" style={{ fontSize: 13 }}>
              Lesson 3 of 6 · Section 03 · with {c.instructor}
            </div>
          </div>
          <div className="lp-bottom">
            <button className="btn btn-secondary">
              <Icon name="prev" size={14} />
              Previous
            </button>
            <button className="btn btn-secondary">
              Next
              <Icon name="next" size={14} />
            </button>
            <span style={{ flex: 1 }} />
            <span
              className="t-caption t-mute"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="check" size={11} style={{ color: 'var(--success)' }} /> Progress synced ·
              2s ago
            </span>
            <button className="btn btn-ghost btn-icon">
              <Icon name="bookmark" />
            </button>
            <button className="btn btn-ghost btn-icon">
              <Icon name="more" />
            </button>
          </div>
        </div>
        <aside className="lp-side">
          <div className="lp-side-tabs">
            {[
              ['sections', 'Sections'],
              ['notes', 'Notes'],
              ['bookmarks', 'Bookmarks'],
              ['materials', 'Materials'],
            ].map(([k, l]) => (
              <button key={k} aria-selected={tab === k} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="lp-side-content">
            {tab === 'sections' && (
              <div>
                <SectionHeader
                  idx={3}
                  title="Replication"
                  count={6}
                  duration={3 * 3600 + 45 * 60}
                  open={true}
                  onToggle={() => {}}
                />
                <LessonRow
                  num={1}
                  title="Single-leader replication"
                  duration={18 * 60 + 24}
                  state="completed"
                />
                <LessonRow
                  num={2}
                  title="Multi-leader replication"
                  duration={22 * 60 + 10}
                  state="completed"
                />
                <LessonRow
                  num={3}
                  title="Leaderless replication & quorums"
                  duration={26 * 60 + 18}
                  state="in-progress"
                  progress={42}
                  current
                  materials
                />
                <LessonRow
                  num={4}
                  title="Conflict resolution strategies"
                  duration={19 * 60 + 50}
                  state="not-started"
                />
                <LessonRow
                  num={5}
                  title="Read-your-writes consistency"
                  duration={14 * 60 + 30}
                  state="not-started"
                />
                <LessonRow num={6} title="Causal consistency" duration={28 * 60} state="locked" />
              </div>
            )}
            {tab === 'notes' && (
              <div style={{ padding: 8 }}>
                <NoteEditor />
              </div>
            )}
            {tab === 'bookmarks' && (
              <div style={{ padding: 4 }}>
                <BookmarkAdd time={11 * 60 + 8} />
                <div style={{ marginTop: 8 }}>
                  <Bookmark time={2 * 60 + 14} label="Definition of N, R, W" />
                  <Bookmark time={5 * 60 + 47} label="Worked example: N=5, R=W=3" />
                  <Bookmark time={11 * 60 + 22} label="" />
                  <Bookmark time={14 * 60 + 8} label="Read repair vs anti-entropy" />
                </div>
              </div>
            )}
            {tab === 'materials' && (
              <div style={{ padding: 8 }}>
                {[
                  ['Quorum reads — worked example', 'MD · 8 KB'],
                  ['Slides — Section 03', 'PDF · 1.2 MB'],
                  ['Reading list', 'MD · 3 KB'],
                ].map(([t, m]) => (
                  <div key={t} className="row">
                    <Icon name="pdf" size={16} />
                    <div className="row-body">
                      <div className="row-title" style={{ fontSize: 13 }}>
                        {t}
                      </div>
                      <div className="row-sub">{m}</div>
                    </div>
                    <Icon name="download" size={14} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
