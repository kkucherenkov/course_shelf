// Reusable domain components for CourseShelf
const { useState, useEffect, useRef } = React;

// Helper: get cover bg
const COVER = {
  teal: '#3F8C84',
  amber: '#C8821C',
  indigo: '#6B72B8',
  warm: '#5C5644',
  coral: '#D26B5C',
  neutral: '#454952',
};
const initials = (title) =>
  title
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// ============ CourseCard ============
const CoursePosterCard = ({ course, state = 'auto', loading = false }) => {
  if (loading)
    return (
      <div className="cc-poster" style={{ cursor: 'default' }}>
        <div className="skel" style={{ aspectRatio: '3/4', borderRadius: 0 }} />
        <div style={{ padding: 12 }}>
          <div className="skel" style={{ height: 14, width: '80%', marginBottom: 6 }} />
          <div className="skel" style={{ height: 10, width: '50%' }} />
        </div>
      </div>
    );
  const c = course;
  const pct =
    state === 'completed'
      ? 100
      : state === 'not-started'
        ? 0
        : Math.round((c.completed / c.lessons) * 100);
  const realState =
    state === 'auto'
      ? pct === 100
        ? 'completed'
        : pct > 0
          ? 'in-progress'
          : 'not-started'
      : state;
  return (
    <div className="cc-poster" tabIndex={0}>
      <div className="cc-cover" style={{ background: COVER[c.accent] || c.cover }}>
        <span className="cc-cover-glyph">{initials(c.title)}</span>
        <div className="cc-cover-overlay" />
        {realState === 'completed' && (
          <div className="cc-cover-completed-badge">
            <Icon name="check" size={16} />
          </div>
        )}
        {realState === 'locked' && (
          <div className="cc-cover-locked">
            <Icon name="lock" size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
        )}
        {realState !== 'completed' && realState !== 'locked' && (
          <div className="cc-cover-strip">
            <div className="cc-cover-strip-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div className="cc-poster-body">
        <div className="cc-poster-title">{c.title}</div>
        <div className="cc-poster-instructor">{c.instructor}</div>
      </div>
    </div>
  );
};

const CourseWideCard = ({ course, resumeAt = null }) => {
  const c = course;
  const pct = Math.round((c.completed / c.lessons) * 100);
  return (
    <div className="cc-wide" tabIndex={0}>
      <div className="cc-wide-thumb" style={{ background: COVER[c.accent] || c.cover }}>
        <span className="cc-cover-glyph" style={{ fontSize: 18 }}>
          {initials(c.title)}
        </span>
        <div className="cc-cover-overlay" />
        <div className="cc-cover-strip">
          <div className="cc-cover-strip-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="cc-wide-body">
        <div className="cc-wide-title">{c.title}</div>
        <div className="cc-wide-instructor">{c.instructor}</div>
        <div className="cc-wide-meta">
          <span className="cc-wide-resume">
            <Icon name="play" size={12} fill />
            {resumeAt ? `Resume ${fmtTime(resumeAt)}` : `${pct}%`}
          </span>
          <span>·</span>
          <span className="t-mono">
            {c.completed}/{c.lessons}
          </span>
        </div>
      </div>
    </div>
  );
};

const CourseCompactRow = ({ course }) => {
  const c = course;
  const pct = Math.round((c.completed / c.lessons) * 100);
  return (
    <div className="cc-compact" tabIndex={0}>
      <div className="cc-compact-thumb" style={{ background: COVER[c.accent] || c.cover }} />
      <div className="cc-compact-body">
        <div className="cc-compact-title">{c.title}</div>
        <div className="cc-compact-bar">
          <div className="cc-compact-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="t-caption t-mono t-mute">{pct}%</div>
    </div>
  );
};

// ============ LessonRow ============
const LessonRow = ({
  num,
  title,
  duration,
  state = 'not-started',
  materials = false,
  downloadState = null,
  progress = 0,
  current = false,
  loading = false,
  mobile = false,
}) => {
  if (loading)
    return (
      <div className="lr" style={{ cursor: 'default' }}>
        <div className="lr-num skel" style={{ height: 12 }} />
        <div className="skel" style={{ width: 18, height: 18, borderRadius: '50%' }} />
        <div className="lr-body">
          <div className="skel" style={{ height: 12, width: '70%' }} />
        </div>
        <div className="skel" style={{ width: 40, height: 12 }} />
      </div>
    );
  const iconName =
    state === 'completed'
      ? 'check-circle'
      : current
        ? 'play'
        : state === 'locked'
          ? 'lock'
          : 'circle';
  return (
    <div className="lr" data-current={current} data-state={state} tabIndex={0}>
      <div className="lr-num">{String(num).padStart(2, '0')}</div>
      <div className="lr-icon" data-state={current ? 'current' : state}>
        <Icon name={iconName} size={18} fill={current} />
      </div>
      <div className="lr-body">
        <div className="lr-title">{title}</div>
        {state === 'in-progress' && progress > 0 && (
          <div
            style={{
              marginTop: 6,
              height: 2,
              background: 'var(--surface-3)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)' }} />
          </div>
        )}
        {state === 'in-progress' && (
          <div className="lr-meta">
            <span>{progress}% watched</span>
          </div>
        )}
      </div>
      <div className="lr-trailing">
        {materials && (
          <Icon
            name="pdf"
            size={14}
            title="Materials available"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
        {mobile && downloadState === 'downloaded' && (
          <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
        )}
        {mobile && downloadState === 'downloading' && (
          <div
            className="pc-buffer-spinner"
            style={{
              width: 14,
              height: 14,
              borderTopColor: 'var(--primary)',
              borderColor: 'var(--surface-3)',
            }}
          />
        )}
        {mobile && downloadState === 'available' && <Icon name="cloud-down" size={14} />}
        {mobile && downloadState === 'failed' && (
          <Icon name="alert" size={14} style={{ color: 'var(--error)' }} />
        )}
        <span className="t-mono">{fmtTime(duration)}</span>
      </div>
    </div>
  );
};

const SectionHeader = ({ idx, title, count, duration, open, onToggle }) => (
  <div className="lr-section-header" data-open={open} onClick={onToggle}>
    <Icon name="chevron-down" size={14} className="chev" />
    <div className="lr-section-title">
      Section {String(idx).padStart(2, '0')} · {title}
    </div>
    <div className="lr-section-meta">
      {count} lessons · {fmtDuration(duration)}
    </div>
  </div>
);

// ============ PlayerChrome ============
const PlayerChrome = ({ context = 'desktop', state = 'playing', initialPos = 0.42 }) => {
  const [pos, setPos] = useState(initialPos);
  const [playing, setPlaying] = useState(state === 'playing');
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState('overlay'); // overlay | minimal
  const total = 18 * 60 + 24;
  const cur = pos * total;
  const buffered = Math.min(1, pos + 0.18);

  const onScrub = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const isMobile = context === 'mobile-landscape';
  return (
    <div className={`pc ${isMobile ? 'pc-mobile-landscape' : ''}`} data-state={mode}>
      <div className="pc-frame">video frame · 16:9 · placeholder</div>

      {state === 'buffering' && (
        <div className="pc-state-overlay">
          <div className="pc-buffer-spinner" />
        </div>
      )}
      {state === 'error' && (
        <div className="pc-state-overlay" style={{ flexDirection: 'column', gap: 8 }}>
          <Icon name="alert" size={28} style={{ color: 'var(--error)' }} />
          <span style={{ fontSize: 13 }}>Playback failed</span>
          <button className="btn btn-secondary btn-sm">Try again</button>
        </div>
      )}
      {state === 'locked' && (
        <div className="pc-state-overlay" style={{ flexDirection: 'column', gap: 8 }}>
          <Icon name="lock" size={28} />
          <span style={{ fontSize: 13 }}>You don't have access to this lesson</span>
        </div>
      )}
      {state === 'end' && (
        <div className="pc-end-banner">
          <div style={{ fontSize: 13, opacity: 0.8 }}>Up next in 5s</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Lesson 13 · Causal consistency</div>
          <div className="fs-row">
            <button className="btn btn-secondary btn-sm">Stay here</button>
            <button className="btn btn-primary btn-sm">
              <Icon name="next" size={14} />
              Play next
            </button>
          </div>
        </div>
      )}

      {isMobile && <div className="pc-edge-hint">⟲ 10</div>}
      {isMobile && <div className="pc-edge-hint right">10 ⟳</div>}

      <div className="pc-overlay">
        <div className="pc-top">
          <div>
            <div className="pc-lesson-sub">SECTION 04 · CONSENSUS</div>
            <div className="pc-lesson-title">Lesson 12 · Quorum reads</div>
          </div>
          <div className="fs-row" style={{ gap: 4 }}>
            {!isMobile && (
              <div className="pc-btn" title="Picture in picture">
                <Icon name="pip" size={16} />
              </div>
            )}
            <div className="pc-btn" title="Settings">
              <Icon name="settings" size={16} />
            </div>
          </div>
        </div>
        <div className="pc-bottom">
          <div className="pc-scrubber" onClick={onScrub}>
            <div className="pc-scrubber-track" />
            <div className="pc-scrubber-buf" style={{ width: `${buffered * 100}%` }} />
            <div className="pc-scrubber-played" style={{ width: `${pos * 100}%` }} />
            <div className="pc-scrubber-thumb" style={{ left: `${pos * 100}%` }} />
            {[0.18, 0.45, 0.72].map((t) => (
              <div key={t} className="pc-scrubber-chap" style={{ left: `${t * 100}%` }} />
            ))}
            <div className="pc-scrubber-bm" style={{ left: '58%' }}>
              <Icon name="bookmark" size={10} fill />
            </div>
          </div>
          <div className="pc-controls">
            <div className="pc-btn" onClick={() => setPlaying((p) => !p)}>
              <Icon name={playing ? 'pause' : 'play'} size={16} fill />
            </div>
            <div className="pc-btn">
              <Icon name="prev" size={16} />
            </div>
            <div className="pc-btn">
              <Icon name="next" size={16} />
            </div>
            <div className="pc-btn" onClick={() => setMuted((m) => !m)}>
              <Icon name={muted ? 'volume-mute' : 'volume'} size={16} />
            </div>
            <span className="pc-time">
              {fmtTime(cur)} / {fmtTime(total)}
            </span>
            <span className="pc-spacer" />
            <div className="pc-btn" title="Speed">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>1.0×</span>
            </div>
            <div className="pc-btn">
              <Icon name="subtitles" size={16} />
            </div>
            <div className="pc-btn">
              <Icon name="fullscreen" size={16} />
            </div>
          </div>
        </div>
      </div>
      <div className="pc-mini">
        <div className="pc-scrubber" style={{ height: 8 }}>
          <div className="pc-scrubber-track" style={{ height: 2 }} />
          <div className="pc-scrubber-played" style={{ width: `${pos * 100}%`, height: 2 }} />
        </div>
      </div>

      {/* Toggle minimal mode */}
      <button
        className="btn btn-ghost btn-sm"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'rgba(255,255,255,0.5)',
          background: 'rgba(0,0,0,0.4)',
        }}
        onClick={() => setMode((m) => (m === 'overlay' ? 'minimal' : 'overlay'))}
      >
        {mode === 'overlay' ? 'show minimal' : 'show overlay'}
      </button>
    </div>
  );
};

// ============ Bookmark / Note ============
const Bookmark = ({ time, label, editable = true }) => (
  <div className="bm" tabIndex={0}>
    <div className="bm-time">{fmtTime(time)}</div>
    <div className="bm-label">{label}</div>
    {editable && (
      <div className="bm-actions">
        <button className="btn btn-ghost btn-icon btn-sm">
          <Icon name="edit" size={14} />
        </button>
        <button className="btn btn-ghost btn-icon btn-sm">
          <Icon name="trash" size={14} />
        </button>
      </div>
    )}
  </div>
);

const BookmarkAdd = ({ time }) => {
  const [label, setLabel] = useState('');
  return (
    <div className="bm-add">
      <span className="bm-time">{fmtTime(time)}</span>
      <input
        className="input"
        style={{ height: 28, background: 'var(--surface)', flex: 1 }}
        placeholder="Add a label (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <button className="btn btn-primary btn-sm">Save</button>
    </div>
  );
};

const NoteEditor = () => {
  const [mode, setMode] = useState('edit');
  const [text, setText] = useState(
    'Quorum reads — N=5, R=3, W=3 satisfies R+W>N so we get strong reads. Linearizable only when paired with a leader, otherwise we still see stale within a session.\n\nFollow up: read **Designing Data-Intensive Applications** ch. 9.',
  );
  return (
    <div className="note-editor" data-mode={mode}>
      <div className="note-toolbar">
        <button className="note-tool" title="Bold">
          <b>B</b>
        </button>
        <button className="note-tool" title="Italic">
          <i>I</i>
        </button>
        <button className="note-tool" title="Heading">
          H
        </button>
        <button className="note-tool" title="List">
          <Icon name="list" size={14} />
        </button>
        <button className="note-tool" title="Link">
          <Icon name="copy" size={14} />
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
        >
          {mode === 'edit' ? 'Preview' : 'Edit'}
        </button>
      </div>
      <div
        className="note-body"
        contentEditable={mode === 'edit'}
        suppressContentEditableWarning
        onBlur={(e) => setText(e.target.innerText)}
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {text}
      </div>
      <div className="note-sync">
        <Icon name="check" size={11} style={{ color: 'var(--success)' }} />
        Saved · 2s ago
      </div>
    </div>
  );
};

// ============ ProgressBadge ============
const ProgressBadge = ({
  variant = 'pill',
  state = 'in-progress',
  completed = 4,
  total = 12,
  accent = 'amber',
}) => {
  const pct =
    state === 'completed'
      ? 100
      : state === 'not-started' || state === 'locked'
        ? 0
        : Math.round((completed / total) * 100);
  if (variant === 'ring') {
    return (
      <div
        className="pb-ring"
        style={{
          background:
            state === 'locked'
              ? 'var(--surface-3)'
              : `conic-gradient(var(--primary) ${pct}%, var(--surface-3) 0)`,
        }}
      >
        <div className="pb-ring-inner" style={{ background: COVER[accent] }}>
          {state === 'completed' ? (
            <Icon name="check" size={14} style={{ color: 'white' }} />
          ) : state === 'locked' ? (
            <Icon name="lock" size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
          ) : (
            <span>{pct}%</span>
          )}
        </div>
      </div>
    );
  }
  if (variant === 'bar') {
    return (
      <div className="pb-bar-wrap">
        <div className="pb-bar">
          <div
            className="pb-bar-fill"
            style={{
              width: `${pct}%`,
              background: state === 'completed' ? 'var(--success)' : 'var(--primary)',
            }}
          />
        </div>
        <span className="t-caption t-mono t-mute">{pct}%</span>
      </div>
    );
  }
  // pill
  return (
    <span className="pb-pill" data-state={state}>
      {state === 'completed' ? (
        <>
          <Icon name="check" size={10} />
          Done
        </>
      ) : state === 'locked' ? (
        <>
          <Icon name="lock" size={10} />
          Locked
        </>
      ) : state === 'not-started' ? (
        '—'
      ) : (
        <>
          {completed} of {total}
        </>
      )}
    </span>
  );
};

// ============ ScanProgressIndicator ============
const ScanProgress = ({ status = 'running' }) => {
  const [files, setFiles] = useState(1247);
  const [total] = useState(2104);
  const [added, setAdded] = useState(38);
  const [updated, setUpdated] = useState(7);
  const [errors, setErrors] = useState(2);
  useEffect(() => {
    if (status !== 'running') return;
    const i = setInterval(() => {
      setFiles((f) => Math.min(total, f + 17));
      if (Math.random() < 0.3) setAdded((a) => a + 1);
      if (Math.random() < 0.1) setUpdated((u) => u + 1);
    }, 800);
    return () => clearInterval(i);
  }, [status, total]);
  const pct = (files / total) * 100;
  return (
    <div className="scan">
      <div className="scan-h">
        <span className={`scan-status-dot ${status}`} />
        <div className="t-title">
          {status === 'running'
            ? 'Scanning'
            : status === 'success'
              ? 'Scan complete'
              : 'Scan failed'}{' '}
          · Computer Science
        </div>
        <span style={{ flex: 1 }} />
        <span className="t-caption t-mono t-mute">
          {Math.floor((files / total) * 100)}% · 00:04:18
        </span>
        {status === 'running' && <button className="btn btn-ghost btn-sm">Cancel</button>}
        {errors > 0 && (
          <button className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }}>
            <Icon name="alert" size={12} />
            {errors} errors
          </button>
        )}
      </div>
      <div className="scan-bar">
        <div className="scan-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="scan-stats">
        <div className="scan-stat">
          <div className="scan-stat-num t-mono">{files}</div>
          <div className="scan-stat-label">Scanned</div>
        </div>
        <div className="scan-stat">
          <div className="scan-stat-num t-mono">{added}</div>
          <div className="scan-stat-label">Added</div>
        </div>
        <div className="scan-stat">
          <div className="scan-stat-num t-mono">{updated}</div>
          <div className="scan-stat-label">Updated</div>
        </div>
        <div className="scan-stat">
          <div
            className="scan-stat-num t-mono"
            style={{ color: errors > 0 ? 'var(--error)' : 'inherit' }}
          >
            {errors}
          </div>
          <div className="scan-stat-label">Errors</div>
        </div>
      </div>
      {status === 'running' && (
        <div
          className="scan-current"
          title="/srv/courses/cs/distributed-systems/04-consensus/12-quorum-reads.mp4"
        >
          /srv/courses/cs/distributed-systems/04-consensus/12-quorum-reads.mp4
        </div>
      )}
    </div>
  );
};

// ============ DownloadRow ============
const DownloadRow = ({
  lesson,
  course,
  size,
  state = 'downloading',
  progress = 42,
  accent = 'teal',
}) => {
  const action =
    state === 'downloading' || state === 'queued' ? (
      <button type="button" className="dl-action" aria-label={`Cancel download of ${lesson}`}>
        <Icon name="x" size={16} />
      </button>
    ) : state === 'failed' ? (
      <button
        type="button"
        className="dl-action error"
        aria-label={`Retry download of ${lesson}`}
      >
        <Icon name="refresh" size={16} />
      </button>
    ) : (
      <button type="button" className="dl-action" aria-label={`More options for ${lesson}`}>
        <Icon name="more" size={16} />
      </button>
    );
  return (
    <div className="dl">
      <div className="dl-thumb" style={{ background: COVER[accent] }} />
      <div className="dl-body">
        <div className="dl-title">{lesson}</div>
        <div className="dl-sub">
          <span>{course}</span>
          <span>·</span>
          <span className="t-mono">{size}</span>
          {state === 'queued' && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--text-muted)' }}>Queued</span>
            </>
          )}
          {state === 'downloading' && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--primary)' }}>{progress}%</span>
            </>
          )}
          {state === 'paused' && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--warning)' }}>Paused</span>
            </>
          )}
          {state === 'ready' && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--success)' }}>
                <Icon name="check" size={10} /> Ready
              </span>
            </>
          )}
          {state === 'failed' && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--error)' }}>Failed — tap to retry</span>
            </>
          )}
        </div>
        {(state === 'downloading' || state === 'paused') && (
          <div className="dl-progress">
            <div
              className="dl-progress-fill"
              style={{
                width: `${progress}%`,
                background: state === 'paused' ? 'var(--warning)' : 'var(--primary)',
              }}
            />
          </div>
        )}
      </div>
      {action}
    </div>
  );
};

Object.assign(window, {
  CoursePosterCard,
  CourseWideCard,
  CourseCompactRow,
  LessonRow,
  SectionHeader,
  PlayerChrome,
  Bookmark,
  BookmarkAdd,
  NoteEditor,
  ProgressBadge,
  ScanProgress,
  DownloadRow,
  COVER,
  initials,
});
