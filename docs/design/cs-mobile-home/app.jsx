const { useState } = React;
const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  return (
    <div data-screen-label="cs-mobile-home" style={{padding:'24px'}}>
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        <h1 className="t-display" style={{marginBottom:4}}>Mobile</h1>
        <p className="t-mute" style={{margin:0, marginBottom:24, maxWidth:'68ch'}}>Three reference screens. Tab bar at the bottom. Compact density on lists.</p>
        <div className="mobile-stage">
          <Phone activeTab="home" label="HOME">
            <div className="mobile-large-title"><h1>Home</h1></div>
            <div style={{padding:'0 16px'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                <div className="avatar avatar-sm">EL</div>
                <div className="t-caption t-mute" style={{flex:1}}>Welcome back, Elena</div>
              </div>
            </div>
            <div className="mobile-section-h"><h3>Continue watching</h3><span className="t-caption t-mute">More</span></div>
            <div className="mobile-h-scroll">
              <div style={{minWidth:240}}><CourseWideCard course={COURSES[0]} resumeAt={5*60+24}/></div>
              <div style={{minWidth:240}}><CourseWideCard course={COURSES[2]} resumeAt={42*60+12}/></div>
              <div style={{minWidth:240}}><CourseWideCard course={COURSES[4]} resumeAt={18*60+5}/></div>
            </div>
            <div className="mobile-section-h"><h3>Recently added</h3><span className="t-caption t-mute">More</span></div>
            <div className="mobile-h-scroll">
              <div style={{minWidth:128}}><CoursePosterCard course={COURSES[3]} state="not-started"/></div>
              <div style={{minWidth:128}}><CoursePosterCard course={COURSES[7]} state="not-started"/></div>
              <div style={{minWidth:128}}><CoursePosterCard course={COURSES[5]} state="completed"/></div>
              <div style={{minWidth:128}}><CoursePosterCard course={COURSES[6]} state="in-progress"/></div>
            </div>
            <div style={{padding:'16px', display:'flex', gap:8}}>
              <button className="btn btn-secondary" style={{flex:1}}><Icon name="cloud-down" size={14}/>Downloads</button>
              <button className="btn btn-secondary" style={{flex:1}}><Icon name="library" size={14}/>Library</button>
            </div>
          </Phone>

          <Phone activeTab="browse" label="BROWSE">
            <div className="mobile-large-title"><h1>Browse</h1></div>
            <div style={{padding:'0 16px 12px', display:'flex', gap:8, alignItems:'center'}}>
              <div className="input-with-icon" style={{flex:1}}>
                <Icon name="search" size={14}/>
                <input className="input" style={{height:34}} placeholder="Search…"/>
              </div>
              <button className="btn btn-secondary btn-icon"><Icon name="filter" size={14}/></button>
            </div>
            <div style={{padding:'0 16px 8px', display:'flex', gap:6, flexWrap:'wrap'}}>
              <span className="chip chip-primary chip-removable">In progress<span className="chip-x"><Icon name="x" size={10}/></span></span>
              <span className="chip">Computer Science</span>
            </div>
            <div style={{padding:'0 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <CoursePosterCard course={COURSES[0]} state="in-progress"/>
              <CoursePosterCard course={COURSES[2]} state="in-progress"/>
              <CoursePosterCard course={COURSES[4]} state="in-progress"/>
              <CoursePosterCard course={COURSES[6]} state="in-progress"/>
            </div>
          </Phone>

          <Phone activeTab="downloads" label="DOWNLOADS">
            <div className="mobile-large-title"><h1>Downloads</h1></div>
            <div style={{padding:'0 16px 12px'}}>
              <div className="card" style={{padding:12}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                  <span className="t-caption t-mute">STORAGE USED</span>
                  <span className="t-caption t-mono">3.2 / 12.4 GB</span>
                </div>
                <div className="progress-linear"><div className="progress-linear-fill" style={{width:'26%'}}/></div>
              </div>
            </div>
            <div className="mobile-section-h"><h3>In progress · 3</h3></div>
            <div>
              <DownloadRow lesson="Quorum reads & writes" course="Distributed Systems" size="186 MB" state="downloading" progress={62} accent="teal"/>
              <DownloadRow lesson="Conflict resolution" course="Distributed Systems" size="172 MB" state="paused" progress={28} accent="teal"/>
              <DownloadRow lesson="Causal consistency" course="Distributed Systems" size="220 MB" state="queued" accent="teal"/>
            </div>
            <div className="mobile-section-h"><h3>Downloaded · 2</h3></div>
            <div>
              <DownloadRow lesson="Vector spaces & bases" course="Linear Algebra for ML" size="98 MB" state="ready" accent="teal"/>
              <DownloadRow lesson="Single-leader replication" course="Distributed Systems" size="124 MB" state="ready" accent="teal"/>
            </div>
            <div className="mobile-section-h"><h3 style={{color:'var(--error)'}}>Failed · 1</h3></div>
            <div>
              <DownloadRow lesson="Eigenvectors deep dive" course="Linear Algebra for ML" size="142 MB" state="failed" accent="teal"/>
            </div>
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
