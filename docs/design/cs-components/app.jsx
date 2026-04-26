// Domain components canvas — show every variant & state of every component
const { useState } = React;

const Sec = ({ n, title, sub, children }) => (
  <section className="dc-section">
    <div className="dc-section-h">
      <div className="dc-num">{String(n).padStart(2, '0')}</div>
      <div>
        <h2 className="t-heading" style={{margin:0}}>{title}</h2>
        {sub && <p className="t-mute" style={{margin:'4px 0 0', fontSize:13}}>{sub}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Stage = ({ label, children, style }) => (
  <div className="dc-stage" style={style}>
    <h4>{label}</h4>
    {children}
  </div>
);

const App = () => {
  const [mode, setMode] = useMode('dark');
  const [openSec, setOpenSec] = useState(true);

  return (
    <div className="dc-root" data-screen-label="cs-components">
      <header className="dc-header">
        <div>
          <div className="t-caption t-mono">CS-COMPONENTS · v0.1</div>
          <h1 className="t-display" style={{margin:'4px 0 0'}}>Domain components</h1>
          <p className="t-mute" style={{margin:'8px 0 0', maxWidth:'68ch'}}>Reusable across web and mobile. Every variant in every state — composed from <a href="../cs-foundations/index.html" style={{color:'var(--primary)'}}>foundation primitives</a>.</p>
        </div>
        <div className="seg">
          <button aria-selected={mode==='dark'} onClick={()=>setMode('dark')}><Icon name="moon" size={14}/> Dark</button>
          <button aria-selected={mode==='light'} onClick={()=>setMode('light')}><Icon name="sun" size={14}/> Light</button>
        </div>
      </header>

      <Sec n={1} title="CourseCard" sub="Three variants — poster (grids), wide (continue-watching rows), compact (dense lists). Eight states each.">
        <div className="dc-grid dc-grid-2">
          <Stage label="Poster · variants & states">
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
              <CoursePosterCard course={COURSES[0]} state="in-progress"/>
              <CoursePosterCard course={COURSES[1]} state="completed"/>
              <CoursePosterCard course={COURSES[3]} state="not-started"/>
              <CoursePosterCard course={COURSES[2]} state="locked"/>
              <CoursePosterCard course={COURSES[4]} state="in-progress"/>
              <CoursePosterCard course={COURSES[5]} state="completed"/>
              <CoursePosterCard course={COURSES[7]} state="not-started"/>
              <CoursePosterCard loading/>
            </div>
            <div className="t-caption t-mute" style={{marginTop:12}}>States, l→r: in-progress · completed · not-started · locked · in-progress · completed · not-started · loading</div>
          </Stage>
          <Stage label="Wide · for continue-watching rows">
            <div className="dc-stack">
              <CourseWideCard course={COURSES[0]} resumeAt={5*60+24}/>
              <CourseWideCard course={COURSES[2]} resumeAt={42*60+12}/>
              <CourseWideCard course={COURSES[4]} resumeAt={18*60+5}/>
            </div>
            <h4 style={{marginTop:24}}>Compact · dense lists</h4>
            <div className="dc-stack">
              <CourseCompactRow course={COURSES[0]}/>
              <CourseCompactRow course={COURSES[2]}/>
              <CourseCompactRow course={COURSES[4]}/>
              <CourseCompactRow course={COURSES[6]}/>
            </div>
          </Stage>
        </div>
      </Sec>

      <Sec n={2} title="LessonRow + SectionHeader" sub="Single horizontal row inside the course detail page. Shows lesson position, title, duration, status, materials icon, mobile download state.">
        <div className="dc-grid dc-grid-2">
          <Stage label="Web · all states">
            <div className="card" style={{padding:4}}>
              <SectionHeader idx={3} title="Replication" count={6} duration={3*3600+45*60} open={openSec} onToggle={()=>setOpenSec(o=>!o)}/>
              {openSec && <>
                <LessonRow num={1} title="Single-leader replication" duration={18*60+24} state="completed" materials/>
                <LessonRow num={2} title="Multi-leader replication" duration={22*60+10} state="completed"/>
                <LessonRow num={3} title="Leaderless replication & quorums" duration={26*60+18} state="in-progress" progress={47} current materials/>
                <LessonRow num={4} title="Conflict resolution strategies" duration={19*60+50} state="not-started"/>
                <LessonRow num={5} title="Read-your-writes consistency" duration={14*60+30} state="not-started" materials/>
                <LessonRow num={6} title="Causal consistency (admin-only)" duration={28*60} state="locked"/>
              </>}
            </div>
          </Stage>
          <Stage label="Mobile · with download state">
            <div className="card" style={{padding:4}}>
              <LessonRow num={1} title="Single-leader replication" duration={18*60+24} state="completed" mobile downloadState="downloaded"/>
              <LessonRow num={2} title="Multi-leader replication" duration={22*60+10} state="in-progress" progress={62} mobile downloadState="downloaded"/>
              <LessonRow num={3} title="Leaderless replication & quorums" duration={26*60+18} state="not-started" mobile downloadState="downloading"/>
              <LessonRow num={4} title="Conflict resolution strategies" duration={19*60+50} state="not-started" mobile downloadState="available"/>
              <LessonRow num={5} title="Read-your-writes consistency" duration={14*60+30} state="not-started" mobile downloadState="failed"/>
            </div>
            <h4 style={{marginTop:24}}>Loading skeleton</h4>
            <div className="card" style={{padding:4}}>
              {[0,1,2,3].map(i => <LessonRow key={i} loading/>)}
            </div>
          </Stage>
        </div>
      </Sec>

      <Sec n={3} title="PlayerChrome" sub="Hover-revealed overlay (toggle via the corner button to see minimal mode); mobile landscape with edge gestures; states: playing, buffering, error, end-of-lesson, locked.">
        <div className="dc-grid dc-grid-2">
          <Stage label="Web — desktop · playing / overlay & minimal">
            <PlayerChrome context="desktop" state="playing"/>
            <div className="t-caption t-mute" style={{marginTop:8}}>Click "show minimal" in the corner to see the 3-second-idle state.</div>
          </Stage>
          <Stage label="Web — desktop · buffering">
            <PlayerChrome context="desktop" state="buffering"/>
          </Stage>
          <Stage label="Mobile · landscape full-screen">
            <PlayerChrome context="mobile-landscape" state="playing"/>
          </Stage>
          <Stage label="End of lesson · auto-advance">
            <PlayerChrome context="desktop" state="end"/>
          </Stage>
          <Stage label="Error">
            <PlayerChrome context="desktop" state="error"/>
          </Stage>
          <Stage label="No permission">
            <PlayerChrome context="desktop" state="locked"/>
          </Stage>
        </div>
      </Sec>

      <Sec n={4} title="Bookmark & Note" sub="Bookmark: timestamp + label, edit/delete on hover, inline add form (no modal). Note: per-lesson markdown editor with auto-save indicator.">
        <div className="dc-grid dc-grid-2">
          <Stage label="Bookmarks">
            <div className="card" style={{padding:8}}>
              <Bookmark time={2*60+14} label="Definition of N, R, W"/>
              <Bookmark time={5*60+47} label="Worked example: N=5, R=W=3"/>
              <Bookmark time={11*60+22} label=""/>
              <Bookmark time={14*60+8} label="Read repair vs anti-entropy"/>
            </div>
            <h4 style={{marginTop:16}}>Adding a bookmark · inline form</h4>
            <BookmarkAdd time={16*60+42}/>
          </Stage>
          <Stage label="Note · per-lesson markdown editor">
            <NoteEditor/>
          </Stage>
        </div>
      </Sec>

      <Sec n={5} title="ProgressBadge" sub="Three variants (ring, pill, bar) × four states (not-started, in-progress, completed, locked).">
        <Stage label="All combinations">
          <table className="fs-state-table" style={{width:'100%'}}>
            <thead>
              <tr><th></th><th>not-started</th><th>in-progress (4/12 · 33%)</th><th>completed</th><th>locked</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="t-body-strong">Ring</td>
                <td><ProgressBadge variant="ring" state="not-started" accent="teal"/></td>
                <td><ProgressBadge variant="ring" state="in-progress" completed={4} total={12} accent="teal"/></td>
                <td><ProgressBadge variant="ring" state="completed" accent="amber"/></td>
                <td><ProgressBadge variant="ring" state="locked"/></td>
              </tr>
              <tr>
                <td className="t-body-strong">Pill</td>
                <td><ProgressBadge variant="pill" state="not-started"/></td>
                <td><ProgressBadge variant="pill" state="in-progress" completed={4} total={12}/></td>
                <td><ProgressBadge variant="pill" state="completed"/></td>
                <td><ProgressBadge variant="pill" state="locked"/></td>
              </tr>
              <tr>
                <td className="t-body-strong">Bar</td>
                <td style={{width:160}}><ProgressBadge variant="bar" state="not-started"/></td>
                <td style={{width:160}}><ProgressBadge variant="bar" state="in-progress" completed={4} total={12}/></td>
                <td style={{width:160}}><ProgressBadge variant="bar" state="completed"/></td>
                <td style={{width:160}}><ProgressBadge variant="bar" state="locked"/></td>
              </tr>
            </tbody>
          </table>
        </Stage>
      </Sec>

      <Sec n={6} title="ScanProgressIndicator" sub="Used on the admin Library detail page while a scan is running. Live counters; current path truncated; cancel & view-errors affordances.">
        <div className="dc-grid dc-grid-2">
          <Stage label="Running"><ScanProgress status="running"/></Stage>
          <Stage label="Succeeded"><ScanProgress status="success"/></Stage>
        </div>
      </Sec>

      <Sec n={7} title="DownloadRow" sub="Mobile downloads manager. Per-lesson row: title, course, size, state, progress, action.">
        <Stage label="Every state">
          <div className="card" style={{padding:0, maxWidth:480}}>
            <DownloadRow lesson="Quorum reads & writes" course="Distributed Systems" size="186 MB" state="downloading" progress={62} accent="teal"/>
            <DownloadRow lesson="Conflict resolution" course="Distributed Systems" size="172 MB" state="paused" progress={28} accent="teal"/>
            <DownloadRow lesson="Causal consistency" course="Distributed Systems" size="220 MB" state="queued" accent="teal"/>
            <DownloadRow lesson="Vector spaces & bases" course="Linear Algebra for ML" size="98 MB" state="ready" accent="teal"/>
            <DownloadRow lesson="Eigen­vectors deep dive" course="Linear Algebra for ML" size="142 MB" state="failed" accent="teal"/>
          </div>
        </Stage>
      </Sec>

      <footer className="t-caption t-mute" style={{paddingTop:32, borderTop:'1px solid var(--border)', marginTop:32}}>
        CourseShelf · cs-components · 7 components · adapt across web and mobile
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
