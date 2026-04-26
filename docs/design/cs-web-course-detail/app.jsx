const { useState } = React;
const c = COURSES[0]; // Distributed Systems

const SECTIONS = [
  {
    idx: 1,
    title: 'Foundations',
    count: 4,
    duration: 1 * 3600 + 12 * 60,
    lessons: [
      { n: 1, title: "What this course is (and isn't)", d: 8 * 60 + 12, s: 'completed' },
      { n: 2, title: 'A model for distributed systems', d: 18 * 60 + 45, s: 'completed' },
      { n: 3, title: 'Failure modes — partial, total, Byzantine', d: 22 * 60 + 8, s: 'completed' },
      { n: 4, title: 'The CAP & PACELC trade-offs', d: 23 * 60 + 15, s: 'completed' },
    ],
  },
  {
    idx: 2,
    title: 'Time & order',
    count: 5,
    duration: 2 * 3600 + 8 * 60,
    lessons: [
      { n: 1, title: 'Physical vs logical time', d: 14 * 60 + 22, s: 'completed' },
      { n: 2, title: 'Lamport clocks', d: 21 * 60 + 5, s: 'completed' },
      { n: 3, title: 'Vector clocks', d: 28 * 60 + 50, s: 'in-progress', p: 62, materials: true },
      { n: 4, title: 'Hybrid logical clocks', d: 24 * 60 + 18, s: 'not-started' },
      { n: 5, title: 'Total-order broadcast', d: 38 * 60 + 45, s: 'not-started', materials: true },
    ],
  },
  {
    idx: 3,
    title: 'Replication',
    count: 6,
    duration: 3 * 3600 + 45 * 60,
    lessons: [
      { n: 1, title: 'Single-leader replication', d: 18 * 60 + 24, s: 'not-started' },
      { n: 2, title: 'Multi-leader replication', d: 22 * 60 + 10, s: 'not-started' },
      {
        n: 3,
        title: 'Leaderless replication & quorums',
        d: 26 * 60 + 18,
        s: 'not-started',
        current: true,
        materials: true,
      },
      { n: 4, title: 'Conflict resolution strategies', d: 19 * 60 + 50, s: 'not-started' },
      {
        n: 5,
        title: 'Read-your-writes consistency',
        d: 14 * 60 + 30,
        s: 'not-started',
        materials: true,
      },
      { n: 6, title: 'Causal consistency (admin-only)', d: 28 * 60, s: 'locked' },
    ],
  },
];

const App = () => {
  const [mode] = useMode('dark');
  const [openSecs, setOpenSecs] = useState({ 1: true, 2: true, 3: true });

  return (
    <Shell active="browse">
      <div data-screen-label="cs-web-course-detail">
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 16,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <span>Browse</span>
          <Icon name="chevron-right" size={12} />
          <span>Computer Science</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: 'var(--text)' }}>Distributed Systems Foundations</span>
        </div>

        <div className="cd-hero">
          <div className="cd-cover" style={{ background: COVER[c.accent] }}>
            <span className="cd-cover-glyph">{initials(c.title)}</span>
            <div className="cc-cover-overlay" />
          </div>
          <div>
            <div className="t-caption" style={{ marginBottom: 8 }}>
              COMPUTER SCIENCE · 2024
            </div>
            <h1 className="t-display" style={{ margin: '0 0 4px' }}>
              {c.title}
            </h1>
            <div className="t-mute" style={{ fontSize: 14 }}>
              by {c.instructor}
            </div>
            <p style={{ maxWidth: '68ch', color: 'var(--text)', marginTop: 16, marginBottom: 0 }}>
              The first-principles tour through replication, consensus, and failure models. Designed
              to bridge from "I read the DDIA book" to "I can read the Raft paper". Every concept
              ships with a worked example you can run locally.
            </p>
            <div className="cd-meta-grid">
              <div className="cd-meta-item">
                <div className="label">Progress</div>
                <div className="value">{Math.round((c.completed / c.lessons) * 100)}%</div>
              </div>
              <div className="cd-meta-item">
                <div className="label">Lessons</div>
                <div className="value">
                  {c.completed} / {c.lessons}
                </div>
              </div>
              <div className="cd-meta-item">
                <div className="label">Duration</div>
                <div className="value">{fmtDuration(c.duration)}</div>
              </div>
              <div className="cd-meta-item">
                <div className="label">Sections</div>
                <div className="value">{c.sections}</div>
              </div>
            </div>
            <div className="progress-linear" style={{ margin: '8px 0 20px' }}>
              <div
                className="progress-linear-fill"
                style={{ width: `${Math.round((c.completed / c.lessons) * 100)}%` }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg">
                <Icon name="play" size={16} fill />
                Resume — Section 03 · L3
              </button>
              <button className="btn btn-secondary">
                <Icon name="check" size={14} />
                Mark complete
              </button>
              <button className="btn btn-ghost">
                <Icon name="refresh" size={14} />
                Reset progress
              </button>
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-icon">
                <Icon name="more" />
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div>
            <div className="row-section-h">
              <h2>Lessons</h2>
              <div className="seg">
                <button aria-selected={true}>
                  <Icon name="list" size={12} />
                </button>
                <button aria-selected={false}>
                  <Icon name="grid" size={12} />
                </button>
              </div>
            </div>
            <div className="card" style={{ padding: 4 }}>
              {SECTIONS.map((sec) => (
                <React.Fragment key={sec.idx}>
                  <SectionHeader
                    idx={sec.idx}
                    title={sec.title}
                    count={sec.count}
                    duration={sec.duration}
                    open={openSecs[sec.idx]}
                    onToggle={() => setOpenSecs((o) => ({ ...o, [sec.idx]: !o[sec.idx] }))}
                  />
                  {openSecs[sec.idx] &&
                    sec.lessons.map((l) => (
                      <LessonRow
                        key={l.n}
                        num={l.n}
                        title={l.title}
                        duration={l.d}
                        state={l.s}
                        current={l.current}
                        progress={l.p}
                        materials={l.materials}
                      />
                    ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <aside
            style={{
              position: 'sticky',
              top: 80,
              alignSelf: 'start',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div className="card">
              <div className="t-title" style={{ marginBottom: 12 }}>
                Materials
              </div>
              <div className="dc-stack">
                {[
                  ['Course syllabus', 'PDF · 124 KB'],
                  ['Quorum reads — worked example', 'MD · 8 KB'],
                  ['Reading list', 'MD · 3 KB'],
                  ['Errata', 'MD · 1 KB'],
                ].map(([t, m]) => (
                  <div key={t} className="row" style={{ padding: '6px 8px' }}>
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
            </div>
            <div className="card">
              <div className="t-title" style={{ marginBottom: 8 }}>
                Library
              </div>
              <div className="t-mute" style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                /srv/courses/cs/distributed-systems
              </div>
              <div className="fs-row" style={{ marginTop: 12 }}>
                <span className="chip">Computer Science</span>
                <span className="chip">2024</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
