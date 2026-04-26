const { useState } = React;
const App = () => {
  const [mode] = useMode('dark');
  return (
    <Shell
      active="home"
      actions={
        <button className="btn btn-secondary btn-sm">
          <Icon name="plus" size={14} />
          Add library
        </button>
      }
    >
      <div data-screen-label="cs-web-home">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
          <h1 className="t-display" style={{ margin: 0 }}>
            Welcome back, Elena
          </h1>
          <span className="chip">User</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div>
            <section className="row-section">
              <div className="row-section-h">
                <h2>Continue watching</h2>
                <span className="more">View all</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                <CourseWideCard course={COURSES[0]} resumeAt={5 * 60 + 24} />
                <CourseWideCard course={COURSES[2]} resumeAt={42 * 60 + 12} />
                <CourseWideCard course={COURSES[4]} resumeAt={18 * 60 + 5} />
                <CourseWideCard course={COURSES[6]} resumeAt={32 * 60 + 50} />
              </div>
            </section>

            <section className="row-section">
              <div className="row-section-h">
                <h2>Recently added</h2>
                <span className="more">View all</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <CoursePosterCard course={COURSES[3]} state="not-started" />
                <CoursePosterCard course={COURSES[7]} state="not-started" />
                <CoursePosterCard course={COURSES[1]} state="completed" />
                <CoursePosterCard course={COURSES[5]} state="completed" />
                <CoursePosterCard course={COURSES[2]} state="in-progress" />
                <CoursePosterCard course={COURSES[6]} state="in-progress" />
              </div>
            </section>

            <section className="row-section">
              <div className="row-section-h">
                <h2>Recently completed</h2>
                <span className="more">
                  <Icon name="chevron-down" size={12} /> Expand
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
                <CourseCompactRow course={COURSES[1]} />
                <CourseCompactRow course={COURSES[5]} />
              </div>
            </section>
          </div>

          {/* Right rail: Your week */}
          <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div className="card card-lg" style={{ padding: 20 }}>
              <div className="t-caption">YOUR WEEK</div>
              <div className="t-display t-mono" style={{ marginTop: 8 }}>
                4h 22m
              </div>
              <div className="t-caption t-mute">watched · 7 lessons completed</div>
              <hr className="divider" style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', gap: 4, height: 60, alignItems: 'flex-end' }}>
                {[12, 28, 45, 60, 18, 38, 8].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i === 6 ? 'var(--primary)' : 'var(--surface-3)',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span
                    key={i}
                    className="t-caption t-mute"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <hr className="divider" style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Streak</span>
                  <span className="t-mono" style={{ fontSize: 13 }}>
                    5 days
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Avg / day</span>
                  <span className="t-mono" style={{ fontSize: 13 }}>
                    38 min
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
