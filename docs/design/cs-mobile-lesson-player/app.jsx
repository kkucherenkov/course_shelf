const { useState } = React;
const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  const [tab, setTab] = useState('sections');
  const c = COURSES[0];
  return (
    <div data-screen-label="cs-mobile-lesson-player" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h1 className="t-display" style={{ marginBottom: 4 }}>
          Mobile · Lesson player
        </h1>
        <p className="t-mute" style={{ margin: 0, marginBottom: 24, maxWidth: '68ch' }}>
          Portrait with tabs below the player; landscape full-screen with edge-revealed gestures.
        </p>

        <div className="mobile-stage">
          <Phone label="PORTRAIT · WATCHING">
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="chevron-left" size={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="t-caption t-mute"
                  style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  Section 03
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-loud)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Leaderless replication
                </div>
              </div>
              <Icon name="more" size={18} />
            </div>
            <PlayerChrome context="desktop" state="playing" />
            <div
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <Icon name="cloud-down" size={12} style={{ color: 'var(--success)' }} />
              Watching offline
            </div>
            <div style={{ padding: '0 4px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 2,
                  padding: 4,
                  borderBottom: '1px solid var(--border)',
                  overflowX: 'auto',
                }}
              >
                {[
                  ['sections', 'Sections'],
                  ['notes', 'Notes'],
                  ['bookmarks', 'Bookmarks'],
                  ['materials', 'Materials'],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    className="tab"
                    aria-selected={tab === k}
                    onClick={() => setTab(k)}
                    style={{ padding: '8px 10px', fontSize: 12 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {tab === 'sections' && (
                <div style={{ padding: 4 }}>
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
                    title="Leaderless replication"
                    duration={26 * 60 + 18}
                    state="in-progress"
                    progress={42}
                    current
                  />
                  <LessonRow
                    num={4}
                    title="Conflict resolution"
                    duration={19 * 60 + 50}
                    state="not-started"
                  />
                </div>
              )}
              {tab === 'bookmarks' && (
                <div style={{ padding: 4 }}>
                  <Bookmark time={2 * 60 + 14} label="Definition of N, R, W" editable={false} />
                  <Bookmark time={5 * 60 + 47} label="Worked example" editable={false} />
                  <Bookmark time={11 * 60 + 22} label="" editable={false} />
                </div>
              )}
              {tab === 'notes' && (
                <div style={{ padding: 6 }}>
                  <NoteEditor />
                </div>
              )}
              {tab === 'materials' && (
                <div style={{ padding: 4 }}>
                  <div className="row">
                    <Icon name="pdf" size={16} />
                    <div className="row-body">
                      <div className="row-title" style={{ fontSize: 12 }}>
                        Section 03 slides
                      </div>
                      <div className="row-sub">PDF · 1.2 MB</div>
                    </div>
                    <Icon name="download" size={12} />
                  </div>
                </div>
              )}
            </div>
          </Phone>
          <Phone landscape label="LANDSCAPE · IMMERSIVE">
            <PlayerChrome context="mobile-landscape" state="playing" />
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
