const { useState } = React;

// Course + a representative slice of the curriculum. Section/lesson counts in
// the hero reflect the real course; the rows below are a shown subset.
const COURSE = COURSES[0]; // Distributed Systems Foundations · Martin Kleppmann
const DL_SIZE = '1.2 GB';

const SECTIONS = [
  {
    idx: 1,
    title: 'Foundations',
    lessons: [
      { num: 1, title: 'What is a distributed system?', duration: 12 * 60 + 40 },
      { num: 2, title: 'Reliability, scalability, maintainability', duration: 18 * 60 + 24 },
      { num: 3, title: 'Data models & query languages', duration: 22 * 60 + 10 },
    ],
  },
  {
    idx: 2,
    title: 'Replication',
    lessons: [
      { num: 4, title: 'Single-leader replication', duration: 18 * 60 + 24 },
      { num: 5, title: 'Multi-leader replication', duration: 22 * 60 + 10 },
      { num: 6, title: 'Leaderless replication', duration: 26 * 60 + 18 },
      { num: 7, title: 'Quorum reads & writes', duration: 19 * 60 + 50 },
    ],
  },
];
const secDuration = (sec) => sec.lessons.reduce((t, l) => t + l.duration, 0);

// downloadState per lesson: available | downloading | downloaded | failed | null
const dl = (v) => ({ 1: v, 2: v, 3: v, 4: v, 5: v, 6: v, 7: v });

const RESUME = 'Lesson 05 · Multi-leader replication';
const WATCHING = { completedUpTo: 4, current: 5, currentProgress: 42 }; // 18/42 overall

const SCENARIOS = {
  'default': {
    label: 'DEFAULT · NOT STARTED',
    watch: { completedUpTo: 0, current: null },
    downloads: dl('available'),
    progress: { completed: 0, total: COURSE.lessons },
    primary: { label: 'Start course', icon: 'play', fill: true },
    secondary: { kind: 'download' },
  },
  'in-progress': {
    label: 'IN PROGRESS',
    watch: WATCHING,
    downloads: dl('available'),
    progress: { completed: 18, total: COURSE.lessons },
    primary: { label: 'Resume · 8:12', icon: 'play', fill: true },
    secondary: { kind: 'download' },
    resumeNote: RESUME,
  },
  'completed': {
    label: 'COMPLETED',
    watch: { completedUpTo: 7, current: null },
    downloads: dl('available'),
    progress: { completed: COURSE.lessons, total: COURSE.lessons },
    primary: { label: 'Watch again', icon: 'refresh' },
    secondary: { kind: 'download' },
  },
  'no-access': {
    label: 'NO ACCESS · LOCKED',
    watch: { completedUpTo: 0, current: null, lockedFrom: 2 }, // lesson 01 is a free preview
    downloads: { 1: 'available', 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
    locked: true,
    primary: { label: 'Enroll to unlock', icon: 'lock', disabled: true },
    secondary: { kind: 'download', disabled: true },
  },
  'mid-download': {
    label: 'MID-DOWNLOAD',
    watch: WATCHING,
    downloads: { 1: 'downloaded', 2: 'downloaded', 3: 'downloading', 4: 'downloading', 5: 'downloading', 6: 'available', 7: 'available' },
    progress: { completed: 18, total: COURSE.lessons },
    primary: { label: 'Resume · 8:12', icon: 'play', fill: true },
    secondary: { kind: 'downloading', pct: 34, sub: '410 MB' },
    resumeNote: RESUME,
  },
  'mostly-downloaded': {
    label: 'MOSTLY DOWNLOADED',
    watch: WATCHING,
    downloads: { 1: 'downloaded', 2: 'downloaded', 3: 'downloaded', 4: 'downloaded', 5: 'downloaded', 6: 'downloaded', 7: 'downloading' },
    progress: { completed: 18, total: COURSE.lessons },
    primary: { label: 'Resume · 8:12', icon: 'play', fill: true },
    secondary: { kind: 'downloading', pct: 88, sub: '1.05 GB' },
    resumeNote: RESUME,
  },
  'all-downloaded': {
    label: 'ALL DOWNLOADED',
    watch: WATCHING,
    downloads: dl('downloaded'),
    progress: { completed: 18, total: COURSE.lessons },
    primary: { label: 'Resume · 8:12', icon: 'play', fill: true },
    secondary: { kind: 'downloaded' },
    resumeNote: RESUME,
  },
};

const watchStateFor = (num, w) => {
  if (w.lockedFrom && num >= w.lockedFrom) return 'locked';
  if (num <= (w.completedUpTo || 0)) return 'completed';
  if (w.current === num) return 'in-progress';
  return 'not-started';
};

// Circular translucent control sitting over the cover art (single-corner inset).
const HeroIconBtn = ({ name, label }) => (
  <button
    type="button"
    aria-label={label}
    style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', color: 'white' }}
  >
    <Icon name={name} size={18} />
  </button>
);

const SecondaryCTA = ({ s }) => {
  const k = s.secondary.kind;
  if (k === 'downloaded')
    return (
      <button className="btn btn-secondary" style={{ width: '100%', height: 44, color: 'var(--success)' }}>
        <Icon name="check" size={16} />
        Downloaded · {DL_SIZE}
      </button>
    );
  if (k === 'downloading')
    return (
      <div>
        <button className="btn btn-secondary" style={{ width: '100%', height: 44 }}>
          <div className="pc-buffer-spinner" style={{ width: 16, height: 16, borderColor: 'var(--surface-3)', borderTopColor: 'var(--primary)' }} />
          Downloading · {s.secondary.pct}%
          <span className="t-mono t-mute" style={{ marginLeft: 4, fontSize: 12 }}>{s.secondary.sub}</span>
        </button>
        <div className="progress-linear thin" style={{ marginTop: 6 }}>
          <div className="progress-linear-fill" style={{ width: `${s.secondary.pct}%` }} />
        </div>
      </div>
    );
  return (
    <button className="btn btn-secondary" aria-disabled={s.secondary.disabled || undefined} style={{ width: '100%', height: 44 }}>
      <Icon name="cloud-down" size={16} />
      Download course · {DL_SIZE}
    </button>
  );
};

const CourseDetail = ({ scenario }) => {
  const s = SCENARIOS[scenario];
  const c = COURSE;
  const [downloads, setDownloads] = useState(() => ({ ...s.downloads }));
  const [open, setOpen] = useState({ 1: true, 2: true }); // sections expanded by default

  const queue = (num) =>
    setDownloads((d) => {
      const cur = d[num];
      if (cur == null || cur === 'downloaded') return d;
      return { ...d, [num]: cur === 'available' ? 'downloading' : 'downloaded' };
    });

  const pct = s.progress ? Math.round((s.progress.completed / s.progress.total) * 100) : 0;

  return (
    <div>
      {/* Collapsing cover hero */}
      <div style={{ position: 'relative', height: 200, background: COVER[c.accent], display: 'grid', placeItems: 'center' }}>
        <span className="cc-cover-glyph" style={{ fontSize: 52 }}>{initials(c.title)}</span>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 32%, transparent 48%, rgba(0,0,0,0.88) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
          <HeroIconBtn name="chevron-left" label="Back" />
          <HeroIconBtn name="more" label="More options" />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px', color: 'white' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)' }}>
            {c.library}
          </div>
          <div style={{ fontSize: 19, fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.01em', marginTop: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {c.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{c.instructor}</div>
        </div>
      </div>

      {/* Progress / access */}
      {s.locked ? (
        <div style={{ padding: '12px 16px 4px' }}>
          <div className="banner banner-warning">
            <Icon name="lock" size={16} />
            <div className="banner-body">Preview only — enroll to unlock all {c.lessons} lessons.</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="t-caption t-mute">
              {pct === 100 ? 'Completed' : `${s.progress.completed} of ${s.progress.total} lessons`}
            </span>
            <span className="t-caption t-mono" style={{ color: pct === 100 ? 'var(--success)' : 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div className="progress-linear">
            <div className="progress-linear-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--primary)' }} />
          </div>
        </div>
      )}

      {/* Primary + secondary CTAs */}
      <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" aria-disabled={s.primary.disabled || undefined} style={{ width: '100%', height: 48 }}>
          <Icon name={s.primary.icon} size={16} fill={s.primary.fill} />
          {s.primary.label}
        </button>
        <SecondaryCTA s={s} />
        {s.resumeNote && (
          <div className="t-caption t-mute" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="corner-down-right" size={12} />
            Up next · {s.resumeNote}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Curriculum — sections expanded by default, tap a lesson to queue its download */}
      <div style={{ padding: '4px 6px 12px' }}>
        {SECTIONS.map((sec) => (
          <div key={sec.idx}>
            <SectionHeader
              idx={sec.idx}
              title={sec.title}
              count={sec.lessons.length}
              duration={secDuration(sec)}
              open={open[sec.idx]}
              onToggle={() => setOpen((o) => ({ ...o, [sec.idx]: !o[sec.idx] }))}
            />
            {open[sec.idx] && (
              <div style={{ padding: '4px 0' }}>
                {sec.lessons.map((l) => {
                  const ws = watchStateFor(l.num, s.watch);
                  const ds = downloads[l.num];
                  const isCurrent = s.watch.current === l.num;
                  const tappable = ds != null && ds !== 'downloaded';
                  return (
                    <div
                      key={l.num}
                      onClick={tappable ? () => queue(l.num) : undefined}
                      onKeyDown={
                        tappable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                queue(l.num);
                              }
                            }
                          : undefined
                      }
                      style={{ cursor: tappable ? 'pointer' : 'default' }}
                      title={tappable ? 'Download lesson' : undefined}
                    >
                      <LessonRow
                        num={l.num}
                        title={l.title}
                        duration={l.duration}
                        state={ws}
                        current={isCurrent}
                        progress={isCurrent ? s.watch.currentProgress || 0 : 0}
                        downloadState={ds}
                        mobile
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  const order = ['default', 'in-progress', 'completed', 'no-access', 'mid-download', 'mostly-downloaded', 'all-downloaded'];
  return (
    <div data-screen-label="cs-mobile-course-detail" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1 className="t-display" style={{ marginBottom: 4 }}>
          Mobile · Course detail
        </h1>
        <p className="t-mute" style={{ margin: 0, marginBottom: 24, maxWidth: '68ch' }}>
          Collapsing cover hero, Resume/Start + Download CTAs, sections expanded by default. Tap any lesson row to queue its download. One frame per state.
        </p>
        <div className="mobile-stage">
          {order.map((k) => (
            <Phone key={k} activeTab="browse" label={SCENARIOS[k].label}>
              <CourseDetail scenario={k} />
            </Phone>
          ))}
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
