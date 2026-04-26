// cs-foundations: design system showcase
const { useState, useEffect, useRef, useMemo } = React;

const Section = ({ id, n, title, sub, children }) => (
  <section id={id} className="fs-section">
    <header className="fs-section-h">
      <div className="fs-section-num t-mono">{String(n).padStart(2, '0')}</div>
      <div>
        <h2 className="t-heading" style={{margin:0}}>{title}</h2>
        {sub && <p className="t-mute" style={{margin:'4px 0 0', fontSize:13}}>{sub}</p>}
      </div>
    </header>
    {children}
  </section>
);

// Show same content under both modes side-by-side
const ModePair = ({ children, label }) => (
  <div className="fs-pair">
    <div className="fs-pair-cell" data-mode="dark">
      <div className="fs-pair-tag t-caption t-mono">DARK</div>
      <div className="fs-pair-inner">{typeof children === 'function' ? children('dark') : children}</div>
    </div>
    <div className="fs-pair-cell" data-mode="light">
      <div className="fs-pair-tag t-caption t-mono">LIGHT</div>
      <div className="fs-pair-inner">{typeof children === 'function' ? children('light') : children}</div>
    </div>
  </div>
);

// ---------- 1. COLOR ----------
const SwatchRow = ({ items }) => (
  <div className="swatch-row">
    {items.map(s => (
      <div key={s.name} className="swatch">
        <div className="swatch-chip" style={{background: s.value, color: s.fg || '#fff'}}>
          <span className="t-mono" style={{fontSize:10, opacity:0.7}}>{s.token}</span>
        </div>
        <div className="swatch-meta">
          <div className="t-body-strong">{s.name}</div>
          <div className="t-caption t-mono">{s.value}</div>
        </div>
      </div>
    ))}
  </div>
);

const ColorSection = () => {
  const surfaceDark = [
    {name:'bg', token:'--bg', value:'#0E0F12'},
    {name:'surface', token:'--surface', value:'#15171B'},
    {name:'surface-2', token:'--surface-2', value:'#1A1C20'},
    {name:'surface-3', token:'--surface-3', value:'#22252B'},
    {name:'border', token:'--border', value:'#2D3037'},
    {name:'border-strong', token:'--border-strong', value:'#454952'},
  ];
  const surfaceLight = [
    {name:'bg', token:'--bg', value:'#FAFAF7', fg:'#15130C'},
    {name:'surface', token:'--surface', value:'#FFFFFF', fg:'#15130C'},
    {name:'surface-2', token:'--surface-2', value:'#F4F3EE', fg:'#15130C'},
    {name:'surface-3', token:'--surface-3', value:'#EAE8E1', fg:'#15130C'},
    {name:'border', token:'--border', value:'#D9D5C9', fg:'#15130C'},
    {name:'border-strong', token:'--border-strong', value:'#BBB4A2', fg:'#15130C'},
  ];
  const accent = (mode) => [
    {name:'amber 200', token:'amber.200', value:'#F3D38A', fg:'#15130C'},
    {name:'amber 400', token:'amber.400', value:'#E0A23B', fg:'#15130C'},
    {name:'amber 500', token:'amber.500', value:'#C8821C'},
    {name:'amber 600', token:'amber.600', value:'#9C6612'},
    {name:'teal 400', token:'teal.400', value:'#5BA89F'},
    {name:'teal 500', token:'teal.500', value:'#3F8C84'},
    {name:'indigo 400', token:'indigo.400', value:'#8189C7'},
    {name:'indigo 500', token:'indigo.500', value:'#6B72B8'},
  ];
  const semantic = [
    {name:'success', token:'success', value:'#5BA89F'},
    {name:'warning', token:'warning', value:'#E0A23B', fg:'#15130C'},
    {name:'error', token:'error', value:'#D26B5C'},
    {name:'info', token:'info', value:'#8189C7'},
  ];

  return (
    <Section id="color" n={1} title="Color" sub="A near-black surface stack with warm-paper light counterpart. Single confident accent: amber. Teal & indigo support secondary affordances. Each semantic color paired with shape/icon — never color alone.">
      <div className="fs-grid">
        <div>
          <div className="t-caption" style={{marginBottom:8}}>Surface · dark</div>
          <SwatchRow items={surfaceDark}/>
        </div>
        <div>
          <div className="t-caption" style={{marginBottom:8}}>Surface · light</div>
          <SwatchRow items={surfaceLight}/>
        </div>
      </div>
      <div className="fs-grid" style={{marginTop:24}}>
        <div>
          <div className="t-caption" style={{marginBottom:8}}>Accents</div>
          <SwatchRow items={accent()}/>
        </div>
        <div>
          <div className="t-caption" style={{marginBottom:8}}>Semantic</div>
          <SwatchRow items={semantic}/>
        </div>
      </div>
      <ModePair>{() => (
        <div style={{padding:16}}>
          <div className="t-mute t-caption" style={{marginBottom:8}}>Contrast samples</div>
          <p style={{margin:0, color:'var(--text-loud)'}}>Text loud on bg — 16.8:1</p>
          <p style={{margin:0, color:'var(--text)'}}>Text body on bg — 13.4:1</p>
          <p style={{margin:0, color:'var(--text-muted)'}}>Text muted on bg — 5.7:1</p>
          <p style={{margin:0, color:'var(--primary)'}}>Primary on bg — passes AA</p>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 2. TYPOGRAPHY ----------
const TypeSection = () => {
  const scale = [
    ['display-lg', 'Course Shelf', '48 / 54 · 600'],
    ['display', 'Continue watching', '32 / 38 · 600'],
    ['heading', 'Distributed Systems Foundations', '20 / 26 · 600'],
    ['title', 'Section 03 · Replication', '16 / 22 · 500'],
    ['body-strong', 'Lesson 12 — Quorum reads', '14 / 20 · 500'],
    ['body', 'A two-phase commit protocol coordinates atomic transactions across multiple participants.', '14 / 20 · 400'],
    ['caption', 'Updated 2 minutes ago', '12 / 16 · 400'],
  ];
  return (
    <Section id="type" n={2} title="Typography" sub="IBM Plex Sans for the UI; IBM Plex Mono for numerals, timestamps, paths. Tabular nums in any progress or table context.">
      <div className="fs-card">
        {scale.map(([cls, sample, meta]) => (
          <div key={cls} className="type-row">
            <div className="t-mono t-caption" style={{minWidth:120}}>{cls}</div>
            <div className={`t-${cls}`} style={{flex:1}}>{sample}</div>
            <div className="t-mono t-caption t-mute" style={{minWidth:110, textAlign:'right'}}>{meta}</div>
          </div>
        ))}
      </div>
      <div className="fs-grid" style={{marginTop:16}}>
        <div className="fs-card">
          <div className="t-caption" style={{marginBottom:8}}>Sample paragraph (body)</div>
          <p style={{margin:0, maxWidth:60+'ch', textWrap:'pretty'}}>
            CourseShelf is a self-hosted course management platform — for people who own video courses and actually want to finish them. Open it, see what's next, press resume. The interface stays out of your way.
          </p>
        </div>
        <div className="fs-card">
          <div className="t-caption" style={{marginBottom:8}}>Tabular numerals</div>
          <table className="fs-num-table"><tbody>
            <tr><td>Distributed Systems</td><td className="t-mono">14:20:00</td><td className="t-mono">  43%</td></tr>
            <tr><td>PostgreSQL Performance</td><td className="t-mono">11:45:00</td><td className="t-mono">  11%</td></tr>
            <tr><td>Compilers</td><td className="t-mono">22:10:00</td><td className="t-mono">   0%</td></tr>
            <tr><td>Linear Algebra for ML</td><td className="t-mono"> 8:30:00</td><td className="t-mono">  50%</td></tr>
          </tbody></table>
        </div>
      </div>
    </Section>
  );
};

// ---------- 3. SPACING ----------
const SpaceSection = () => {
  const steps = [
    ['1', 4], ['2', 8], ['3', 12], ['4', 16],
    ['5', 24], ['6', 32], ['7', 48], ['8', 64], ['9', 96]
  ];
  return (
    <Section id="space" n={3} title="Spacing" sub="4px base scale. Use 1–4 for component internals; 5–7 for component-to-component; 8–9 for section-to-section.">
      <div className="fs-card">
        {steps.map(([n, px]) => (
          <div key={n} className="space-row">
            <div className="t-mono t-caption" style={{width:60}}>space-{n}</div>
            <div className="space-bar" style={{width:px}}/>
            <div className="t-mono t-caption t-mute">{px}px</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

// ---------- 4. RADIUS ----------
const RadiusSection = () => (
  <Section id="radius" n={4} title="Radius" sub="Three radii: sm for inline elements, md for cards & rows, lg for modals & large surfaces. Pill for chips & switches.">
    <div className="fs-grid-4">
      {[['sm', 4, 'inputs · chips · skeletons'], ['md', 8, 'cards · buttons · rows'], ['lg', 16, 'modals · sheets · hero'], ['pill', 999, 'chips · switches · avatars']].map(([n, px, use]) => (
        <div key={n} className="fs-card" style={{textAlign:'center'}}>
          <div className="radius-demo" style={{borderRadius: px === 999 ? 999 : px}}/>
          <div className="t-body-strong" style={{marginTop:12}}>radius-{n}</div>
          <div className="t-caption t-mono t-mute">{px === 999 ? '∞' : px+'px'}</div>
          <div className="t-caption t-mute" style={{marginTop:4}}>{use}</div>
        </div>
      ))}
    </div>
  </Section>
);

// ---------- 5. BUTTONS ----------
const ButtonsSection = () => {
  const [loading, setLoading] = useState(false);
  return (
    <Section id="buttons" n={5} title="Buttons" sub="Primary, secondary, ghost, destructive — each in default, hover, active, focus, disabled, loading. Sentence case throughout.">
      <ModePair>{() => (
        <div style={{padding:16}}>
          <table className="fs-state-table">
            <thead>
              <tr><th></th><th>default</th><th>hover</th><th>active</th><th>focus</th><th>disabled</th><th>loading</th></tr>
            </thead>
            <tbody>
              {[
                ['Primary',     'btn-primary',    'Resume'],
                ['Secondary',   'btn-secondary',  'Mark complete'],
                ['Ghost',       'btn-ghost',      'Cancel'],
                ['Destructive', 'btn-destructive','Delete course'],
              ].map(([name, cls, label]) => (
                <tr key={name}>
                  <td className="t-body-strong">{name}</td>
                  <td><button className={`btn ${cls}`}>{label}</button></td>
                  <td><button className={`btn ${cls}`} data-force-hover>{label}</button></td>
                  <td><button className={`btn ${cls}`} data-force-active>{label}</button></td>
                  <td><button className={`btn ${cls}`} data-force-focus>{label}</button></td>
                  <td><button className={`btn ${cls}`} disabled>{label}</button></td>
                  <td><button className={`btn ${cls}`} data-loading="true">{label}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="t-caption" style={{marginTop:24, marginBottom:8}}>With icon · sizes · icon-only</div>
          <div className="fs-row">
            <button className="btn btn-primary"><Icon name="play" size={16}/>Resume</button>
            <button className="btn btn-secondary"><Icon name="download" size={16}/>Download course</button>
            <button className="btn btn-primary btn-sm"><Icon name="play" size={14}/>Resume</button>
            <button className="btn btn-primary btn-lg"><Icon name="play" size={18}/>Resume lesson 12</button>
            <button className="btn btn-secondary btn-icon"><Icon name="more"/></button>
            <button className="btn btn-ghost btn-icon"><Icon name="bookmark"/></button>
          </div>
          <div className="t-caption" style={{marginTop:24, marginBottom:8}}>Click any primary to test loading transition</div>
          <button className="btn btn-primary" data-loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>Save changes</button>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 6. INPUTS ----------
const InputsSection = () => {
  const [text, setText] = useState('Distributed Systems');
  const [search, setSearch] = useState('');
  const [num, setNum] = useState(1.25);
  const [sel, setSel] = useState('Recently watched');
  const [sw1, setSw1] = useState(true);
  const [sw2, setSw2] = useState(false);
  const [check1, setCheck1] = useState(true);
  const [radio, setRadio] = useState('comfortable');

  return (
    <Section id="inputs" n={6} title="Inputs" sub="Text, search, number, select, switch, checkbox, radio — empty / filled / focus / error / disabled.">
      <ModePair>{() => (
        <div style={{padding:16}}>
          <div className="fs-grid-3">
            <div className="field">
              <label className="field-label">Display name</label>
              <input className="input" value={text} onChange={e => setText(e.target.value)}/>
              <div className="field-help">Shown to other users in your household.</div>
            </div>
            <div className="field">
              <label className="field-label">Search</label>
              <div className="input-with-icon">
                <Icon name="search" size={16}/>
                <input className="input" placeholder="Search courses, lessons…" value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Default playback speed</label>
              <input className="input t-mono" type="number" step="0.25" value={num} onChange={e => setNum(parseFloat(e.target.value)||0)}/>
            </div>
            <div className="field">
              <label className="field-label">Empty</label>
              <input className="input" placeholder="email@example.com"/>
            </div>
            <div className="field">
              <label className="field-label">Error</label>
              <input className="input" aria-invalid="true" defaultValue="not-an-email"/>
              <div className="field-error-msg"><Icon name="alert" size={12}/>Enter a valid email address.</div>
            </div>
            <div className="field">
              <label className="field-label">Disabled</label>
              <input className="input" disabled defaultValue="locked@example.com"/>
            </div>
            <div className="field">
              <label className="field-label">Sort by</label>
              <div className="select"><select value={sel} onChange={e => setSel(e.target.value)}>
                <option>Recently watched</option><option>Newest</option><option>Alphabetical</option><option>Duration</option>
              </select></div>
            </div>
            <div className="field">
              <label className="field-label">Notes</label>
              <textarea className="input" placeholder="Per-lesson notes (Markdown supported)"></textarea>
            </div>
          </div>

          <div className="t-caption" style={{marginTop:24, marginBottom:12}}>Switches · checkboxes · radios</div>
          <div className="fs-row" style={{flexWrap:'wrap', gap:24}}>
            <div className="switch" role="switch" aria-checked={sw1} tabIndex={0} onClick={()=>setSw1(s=>!s)}>
              <div className="switch-track"><div className="switch-thumb"/></div>
              <span>Autoplay next lesson</span>
            </div>
            <div className="switch" role="switch" aria-checked={sw2} tabIndex={0} onClick={()=>setSw2(s=>!s)}>
              <div className="switch-track"><div className="switch-thumb"/></div>
              <span>Skip intros</span>
            </div>
            <label style={{display:'inline-flex',alignItems:'center',gap:8, cursor:'pointer'}}>
              <span className="check" role="checkbox" aria-checked={check1} tabIndex={0} onClick={(e)=>{e.preventDefault(); setCheck1(c=>!c);}}/>
              <span>Mark as completed when 95% watched</span>
            </label>
            <div style={{display:'inline-flex',gap:14}}>
              {['comfortable','compact'].map(v => (
                <label key={v} style={{display:'inline-flex',alignItems:'center',gap:6, cursor:'pointer'}}>
                  <span className="radio" role="radio" aria-checked={radio===v} tabIndex={0} onClick={()=>setRadio(v)}/>
                  <span style={{textTransform:'capitalize'}}>{v}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 7. CARDS ----------
const CardsSection = () => (
  <Section id="cards" n={7} title="Cards" sub="Base card, dashboard tile, hover state. Three radii: rows md, dashboard md, modals lg.">
    <ModePair>{() => (
      <div style={{padding:16}}>
        <div className="fs-grid-3">
          <div className="card">
            <div className="t-title">Base card</div>
            <p className="t-mute" style={{margin:'4px 0 0', fontSize:13}}>Used for content blocks and panels.</p>
          </div>
          <div className="card card-hover">
            <div className="t-title">Card with hover</div>
            <p className="t-mute" style={{margin:'4px 0 0', fontSize:13}}>Hover me — border darkens, surface lifts a step.</p>
          </div>
          <div className="card card-lg">
            <div className="t-title">Large card · radius-lg</div>
            <p className="t-mute" style={{margin:'4px 0 0', fontSize:13}}>For hero or modal-like surfaces.</p>
          </div>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:8}}>
            <div className="t-caption">LIBRARIES</div>
            <div className="t-display">14</div>
            <div className="t-caption t-mute">+2 since last week</div>
          </div>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:8}}>
            <div className="t-caption">TOTAL SIZE</div>
            <div className="t-display t-mono">2.4<span className="t-heading t-mute"> TB</span></div>
            <div className="progress-linear"><div className="progress-linear-fill" style={{width:'62%'}}/></div>
          </div>
          <div className="card" style={{display:'flex',flexDirection:'column',gap:8}}>
            <div className="t-caption">LAST SCAN</div>
            <div className="t-title">Computer Science</div>
            <div className="t-caption t-mute">42 added · 3 updated · <span className="dot success" style={{verticalAlign:'middle',marginRight:4}}/>4 minutes ago</div>
          </div>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

// ---------- 8. LIST ROWS ----------
const RowsSection = () => (
  <Section id="rows" n={8} title="List rows" sub="Leading icon or avatar, title + sub, trailing meta. Selected and hover states. Compact density on mobile lists.">
    <ModePair>{() => (
      <div style={{padding:16, display:'flex', gap:24}}>
        <div style={{flex:1}}>
          <div className="t-caption" style={{marginBottom:8}}>With leading icon</div>
          <div className="card" style={{padding:4}}>
            <div className="row"><div className="row-leading"><Icon name="check-circle"/></div><div className="row-body"><div className="row-title">Vector spaces & bases</div><div className="row-sub">Lesson 1 · 12 min</div></div><div className="row-trailing">12:04</div></div>
            <div className="row" aria-selected="true"><div className="row-leading"><Icon name="play" fill/></div><div className="row-body"><div className="row-title">Linear maps & matrices</div><div className="row-sub">Lesson 2 · 18 min · current</div></div><div className="row-trailing">04:21 / 18:00</div></div>
            <div className="row"><div className="row-leading"><Icon name="circle"/></div><div className="row-body"><div className="row-title">Eigenvalues & eigenvectors</div><div className="row-sub">Lesson 3 · 22 min</div></div><div className="row-trailing">22:00</div></div>
            <div className="row"><div className="row-leading"><Icon name="lock"/></div><div className="row-body"><div className="row-title">Singular value decomposition</div><div className="row-sub t-mute">Lesson 4 · admin-only</div></div><div className="row-trailing">25:00</div></div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div className="t-caption" style={{marginBottom:8}}>With leading avatar</div>
          <div className="card" style={{padding:4}}>
            <div className="row"><div className="row-leading"><div className="avatar">MK<span className="avatar-role avatar-role-admin">A</span></div></div><div className="row-body"><div className="row-title">Mira Khoury</div><div className="row-sub">Admin · last active 2 minutes ago</div></div><div className="row-trailing"><Icon name="more"/></div></div>
            <div className="row"><div className="row-leading"><div className="avatar">EL</div></div><div className="row-body"><div className="row-title">Elena Lin</div><div className="row-sub">User · last active 1 hour ago</div></div><div className="row-trailing"><Icon name="more"/></div></div>
            <div className="row"><div className="row-leading"><div className="avatar">JD<span className="avatar-role avatar-role-guest">G</span></div></div><div className="row-body"><div className="row-title">Jordan Diaz</div><div className="row-sub">Guest · 3 grants</div></div><div className="row-trailing"><Icon name="more"/></div></div>
          </div>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

// ---------- 9. TABS & SEGMENTED ----------
const TabsSection = () => {
  const [tab, setTab] = useState('sections');
  const [seg, setSeg] = useState('grid');
  return (
    <Section id="tabs" n={9} title="Tabs & segmented controls" sub="Tabs for primary navigation within a screen; segmented for view-mode toggles.">
      <ModePair>{() => (
        <div style={{padding:16, display:'flex', flexDirection:'column', gap:16}}>
          <div className="tabs">
            {[['sections','Sections'],['notes','Notes'],['bookmarks','Bookmarks'],['materials','Materials']].map(([k,l]) => (
              <button key={k} className="tab" aria-selected={tab===k} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="seg">
            {[['grid','Grid'],['list','List'],['compact','Compact']].map(([k,l]) => (
              <button key={k} aria-selected={seg===k} onClick={()=>setSeg(k)}>{l}</button>
            ))}
          </div>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 10. FEEDBACK ----------
const FeedbackSection = () => {
  const [toasts, setToasts] = useState([]);
  const fireToast = (kind, msg) => {
    const id = Math.random();
    setToasts(t => [...t, {id, kind, msg}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  };
  return (
    <Section id="feedback" n={10} title="Feedback" sub="Banners (info/success/warning/error), toasts, inline alerts. Sync indicators are inline, never modal.">
      <ModePair>{() => (
        <div style={{padding:16, display:'flex', flexDirection:'column', gap:12}}>
          <div className="banner banner-info">
            <Icon name="info" size={20}/>
            <div className="banner-body"><div className="banner-title">Self-registration is disabled</div>New users must be invited by an admin.</div>
          </div>
          <div className="banner banner-success">
            <Icon name="check-circle" size={20}/>
            <div className="banner-body"><div className="banner-title">Library scan complete</div>42 courses added · 3 updated · 0 errors.</div>
          </div>
          <div className="banner banner-warning">
            <Icon name="alert" size={20}/>
            <div className="banner-body"><div className="banner-title">Storage 88% full</div>Free up space or downloads will fail.</div>
          </div>
          <div className="banner banner-error">
            <Icon name="alert" size={20}/>
            <div className="banner-body"><div className="banner-title">Couldn't reach the server</div>Retrying in 5 seconds. <a href="#" style={{color:'inherit', textDecoration:'underline'}}>Retry now</a></div>
          </div>
          <div className="fs-row" style={{marginTop:8}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>fireToast('success','Bookmark saved at 04:21')}>Fire success toast</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>fireToast('info','Synced to all devices')}>Fire info toast</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>fireToast('error','Couldn\'t save note — retrying')}>Fire error toast</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <div className="t-caption">Inline sync indicator (the "self-evident sync" pattern)</div>
            <div className="fs-row" style={{gap:8, fontSize:13, color:'var(--text-muted)'}}>
              <Icon name="check" size={14}/> Saved · 2s ago
            </div>
          </div>
          <div className="toast-stack">
            {toasts.map(t => (
              <div key={t.id} className="toast">
                <span className={`toast-dot ${t.kind}`}/>
                <span style={{flex:1}}>{t.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 11. OVERLAYS ----------
const OverlaysSection = () => {
  const [open, setOpen] = useState(null); // 'dialog'|'sheet'|'palette'|null
  return (
    <Section id="overlays" n={11} title="Overlays" sub="Dialogs (sm/md), bottom sheet on mobile, command palette on desktop. Used sparingly — prefer inline.">
      <ModePair>{(mode) => (
        <div style={{padding:16}}>
          <div className="fs-row">
            <button className="btn btn-secondary" onClick={()=>setOpen(open==='dialog'?null:'dialog')}>Open dialog</button>
            <button className="btn btn-secondary" onClick={()=>setOpen(open==='sheet'?null:'sheet')}>Open bottom sheet</button>
            <button className="btn btn-secondary" onClick={()=>setOpen(open==='palette'?null:'palette')}>Command palette</button>
          </div>
          <div className="overlay-stage" data-mode={mode}>
            <div className="overlay-stage-bg"/>
            {open === 'dialog' && (
              <div className="overlay-dialog card-lg" style={{boxShadow:'var(--shadow-3)'}}>
                <div className="t-heading">Reset progress?</div>
                <p className="t-mute" style={{margin:'8px 0 16px', fontSize:13}}>This sets every lesson in <b style={{color:'var(--text)'}}>Distributed Systems Foundations</b> back to not-started. Notes and bookmarks are kept.</p>
                <div className="fs-row" style={{justifyContent:'flex-end'}}>
                  <button className="btn btn-ghost" onClick={()=>setOpen(null)}>Cancel</button>
                  <button className="btn btn-destructive" onClick={()=>setOpen(null)}>Reset progress</button>
                </div>
              </div>
            )}
            {open === 'sheet' && (
              <div className="overlay-sheet">
                <div className="overlay-sheet-handle"/>
                <div className="t-title" style={{marginBottom:12}}>Filters</div>
                <div className="t-caption" style={{marginBottom:8}}>STATUS</div>
                <div className="fs-row" style={{gap:6, flexWrap:'wrap'}}>
                  <span className="chip chip-primary">Not started</span>
                  <span className="chip">In progress</span>
                  <span className="chip">Completed</span>
                </div>
                <div className="t-caption" style={{margin:'16px 0 8px'}}>LIBRARY</div>
                <div className="fs-row" style={{gap:6, flexWrap:'wrap'}}>
                  <span className="chip">Computer Science</span>
                  <span className="chip">Mathematics</span>
                  <span className="chip">Art</span>
                  <span className="chip">Tooling</span>
                </div>
                <div className="fs-row" style={{marginTop:16, justifyContent:'space-between'}}>
                  <button className="btn btn-ghost btn-sm">Clear all</button>
                  <button className="btn btn-primary btn-sm" onClick={()=>setOpen(null)}>Apply · 1 active</button>
                </div>
              </div>
            )}
            {open === 'palette' && (
              <div className="overlay-palette">
                <div className="input-with-icon" style={{padding:12, borderBottom:'1px solid var(--border)'}}>
                  <Icon name="search" size={16} style={{left:24}}/>
                  <input className="input" style={{border:'none', background:'transparent', paddingLeft:32}} placeholder="Search courses, lessons, settings…" autoFocus/>
                </div>
                <div className="palette-group t-caption">COURSES</div>
                <div className="row"><div className="row-leading"><Icon name="library" size={16}/></div><div className="row-body"><div className="row-title">Distributed Systems Foundations</div></div><div className="row-trailing">↵</div></div>
                <div className="row"><div className="row-leading"><Icon name="library" size={16}/></div><div className="row-body"><div className="row-title">Modern PostgreSQL</div></div><div className="row-trailing"></div></div>
                <div className="palette-group t-caption">SETTINGS</div>
                <div className="row"><div className="row-leading"><Icon name="settings" size={16}/></div><div className="row-body"><div className="row-title">Switch theme</div></div><div className="row-trailing t-mono">⌘T</div></div>
              </div>
            )}
          </div>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- 12. PROGRESS ----------
const Circular = ({ pct, size = 32 }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="progress-circle" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="progress-circle-track" cx={size/2} cy={size/2} r={r}/>
      <circle className="progress-circle-fill" cx={size/2} cy={size/2} r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct/100)}/>
    </svg>
  );
};

const ProgressSection = () => (
  <Section id="progress" n={12} title="Progress" sub="Linear, circular, ringed avatar, scrubber. Always pair percentage with bar — color alone never carries the meaning.">
    <ModePair>{() => (
      <div style={{padding:16, display:'flex', flexDirection:'column', gap:24}}>
        <div>
          <div className="t-caption" style={{marginBottom:12}}>Linear</div>
          <div style={{display:'flex', flexDirection:'column', gap:10, maxWidth:400}}>
            <div className="progress-linear"><div className="progress-linear-fill" style={{width:'0%'}}/></div>
            <div className="progress-linear"><div className="progress-linear-fill" style={{width:'17%'}}/></div>
            <div className="progress-linear"><div className="progress-linear-fill" style={{width:'62%'}}/></div>
            <div className="progress-linear"><div className="progress-linear-fill" style={{width:'100%', background:'var(--success)'}}/></div>
          </div>
        </div>
        <div>
          <div className="t-caption" style={{marginBottom:12}}>Circular</div>
          <div className="fs-row" style={{gap:24, alignItems:'center'}}>
            {[0, 25, 50, 75, 100].map(p => (
              <div key={p} style={{textAlign:'center'}}>
                <Circular pct={p}/>
                <div className="t-caption t-mono t-mute" style={{marginTop:4}}>{p}%</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="t-caption" style={{marginBottom:12}}>Ringed avatar (course cover with progress)</div>
          <div className="fs-row" style={{gap:16}}>
            {[18, 47, 100].map(p => (
              <div key={p} className="ring-cover" style={{'--p': `${p}`}}>
                <div className="ring-cover-inner" style={{background:'#3F8C84'}}>
                  <span className="t-mono" style={{fontSize:11, color:'#fff'}}>{p}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="t-caption" style={{marginBottom:12}}>Scrubber with chapter & bookmark markers</div>
          <Scrubber/>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

const Scrubber = () => {
  const [pos, setPos] = useState(0.42);
  const buffered = 0.65;
  const ref = useRef();
  const onClick = (e) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (e.clientX - r.left)/r.width)));
  };
  return (
    <div className="scrubber" ref={ref} onClick={onClick}>
      <div className="scrubber-track"/>
      <div className="scrubber-buffered" style={{width: `${buffered*100}%`}}/>
      <div className="scrubber-played" style={{width: `${pos*100}%`}}/>
      <div className="scrubber-thumb" style={{left: `${pos*100}%`}}/>
      {[0.18, 0.42, 0.71].map(t => <div key={t} className="scrubber-chapter" style={{left: `${t*100}%`}}/>)}
      <div className="scrubber-bookmark" style={{left:'58%'}}><Icon name="bookmark" size={12} fill/></div>
    </div>
  );
};

// ---------- 13. EMPTY STATES ----------
const EmptySection = () => (
  <Section id="empty" n={13} title="Empty states" sub="Name the gap, propose an action. Always offer a way forward — never a dead end.">
    <ModePair>{() => (
      <div style={{padding:16}}>
        <div className="fs-grid">
          <div className="card empty">
            <div className="empty-glyph"><Icon name="library" size={32}/></div>
            <div className="t-title">No courses yet</div>
            <p className="t-mute" style={{margin:'4px 0 12px', fontSize:13}}>Add a library and CourseShelf will scan it.</p>
            <button className="btn btn-primary btn-sm">Add library</button>
          </div>
          <div className="card empty">
            <div className="empty-glyph"><Icon name="search" size={32}/></div>
            <div className="t-title">No results for "kafka stream"</div>
            <p className="t-mute" style={{margin:'4px 0 12px', fontSize:13}}>Try a broader term, or remove the duration filter.</p>
            <button className="btn btn-secondary btn-sm">Clear filters</button>
          </div>
          <div className="card empty">
            <div className="empty-glyph error-glyph"><Icon name="alert" size={32}/></div>
            <div className="t-title">Couldn't load lessons</div>
            <p className="t-mute" style={{margin:'4px 0 12px', fontSize:13}}>The server returned an error. Your progress is safe.</p>
            <button className="btn btn-secondary btn-sm"><Icon name="refresh" size={14}/>Try again</button>
          </div>
          <div className="card empty">
            <div className="empty-glyph"><Icon name="lock" size={32}/></div>
            <div className="t-title">No permission</div>
            <p className="t-mute" style={{margin:'4px 0 12px', fontSize:13}}>Ask an admin to grant you access to this library.</p>
            <button className="btn btn-secondary btn-sm">Contact admin</button>
          </div>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

// ---------- 14. SKELETONS ----------
const SkeletonSection = () => (
  <Section id="skeletons" n={14} title="Loading skeletons" sub="Subtle 1.4s pulse — never aggressive. Used for lists, cards, detail pages. Buttons spin instead.">
    <ModePair>{() => (
      <div style={{padding:16}}>
        <div className="fs-grid">
          <div>
            <div className="t-caption" style={{marginBottom:8}}>Course card</div>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              <div className="skel" style={{aspectRatio:'16/10', borderRadius:0}}/>
              <div style={{padding:12}}>
                <div className="skel" style={{height:14, width:'80%', marginBottom:8}}/>
                <div className="skel" style={{height:10, width:'50%', marginBottom:12}}/>
                <div className="skel" style={{height:4, width:'100%'}}/>
              </div>
            </div>
          </div>
          <div>
            <div className="t-caption" style={{marginBottom:8}}>Lesson row</div>
            <div className="card" style={{padding:8}}>
              {[0,1,2,3].map(i => (
                <div key={i} className="row" style={{cursor:'default'}}>
                  <div className="row-leading"><div className="skel" style={{width:20, height:20, borderRadius:'50%'}}/></div>
                  <div className="row-body" style={{display:'flex', flexDirection:'column', gap:6}}>
                    <div className="skel" style={{height:12, width:`${50+i*10}%`}}/>
                    <div className="skel" style={{height:10, width:'30%'}}/>
                  </div>
                  <div className="skel" style={{width:48, height:12}}/>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="t-caption" style={{marginBottom:8}}>Detail page</div>
            <div className="card" style={{padding:16, display:'flex', gap:16}}>
              <div className="skel" style={{width:120, height:80, flexShrink:0, borderRadius:8}}/>
              <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
                <div className="skel" style={{height:18, width:'70%'}}/>
                <div className="skel" style={{height:10, width:'40%'}}/>
                <div className="skel" style={{height:10, width:'90%', marginTop:8}}/>
                <div className="skel" style={{height:10, width:'85%'}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

// ---------- 15. AVATAR ----------
const AvatarSection = () => (
  <Section id="avatar" n={15} title="Avatar" sub="Sizes xs / sm / md / lg / xl. Role badge: ADMIN (amber) · GUEST (indigo). USER has no badge — it's the unmarked default.">
    <ModePair>{() => (
      <div style={{padding:16}}>
        <div className="fs-row" style={{gap:24, alignItems:'flex-end'}}>
          <div className="avatar avatar-xs">EL</div>
          <div className="avatar avatar-sm">EL</div>
          <div className="avatar">EL</div>
          <div className="avatar avatar-lg">EL</div>
          <div className="avatar avatar-xl">EL</div>
        </div>
        <div className="fs-row" style={{gap:24, alignItems:'flex-end', marginTop:24}}>
          <div className="avatar">MK<span className="avatar-role avatar-role-admin">A</span></div>
          <div className="avatar">EL</div>
          <div className="avatar">JD<span className="avatar-role avatar-role-guest">G</span></div>
          <div className="avatar avatar-lg">MK<span className="avatar-role avatar-role-admin">A</span></div>
          <div className="avatar avatar-lg">JD<span className="avatar-role avatar-role-guest">G</span></div>
        </div>
      </div>
    )}</ModePair>
  </Section>
);

// ---------- 16. CHIPS ----------
const ChipsSection = () => {
  const [chips, setChips] = useState(['In progress', 'Computer Science', '<10h']);
  return (
    <Section id="chips" n={16} title="Tag / chip" sub="Default, primary, semantic, removable. Used for filters, status, tags.">
      <ModePair>{() => (
        <div style={{padding:16, display:'flex', flexDirection:'column', gap:16}}>
          <div className="fs-row" style={{flexWrap:'wrap'}}>
            <span className="chip">Default</span>
            <span className="chip chip-primary">Primary</span>
            <span className="chip chip-success"><Icon name="check" size={10}/>Completed</span>
            <span className="chip chip-warning"><Icon name="alert" size={10}/>Outdated</span>
            <span className="chip chip-error"><Icon name="alert" size={10}/>Failed</span>
            <span className="chip chip-info"><Icon name="info" size={10}/>Beta</span>
          </div>
          <div>
            <div className="t-caption" style={{marginBottom:8}}>Active filters (removable)</div>
            <div className="fs-row" style={{flexWrap:'wrap'}}>
              {chips.map(c => (
                <span key={c} className="chip chip-primary chip-removable">
                  {c}<span className="chip-x" onClick={()=>setChips(cs => cs.filter(x => x !== c))}><Icon name="x" size={10}/></span>
                </span>
              ))}
              {chips.length === 0 && <span className="t-caption t-mute">No filters · click chips above to add (demo)</span>}
            </div>
          </div>
        </div>
      )}</ModePair>
    </Section>
  );
};

// ---------- APP ----------
const App = () => {
  const [mode, setMode] = useMode('dark');
  const [density, setDensity] = useDensity('comfortable');
  const sections = [
    ['color','Color'], ['type','Type'], ['space','Spacing'], ['radius','Radius'],
    ['buttons','Buttons'], ['inputs','Inputs'], ['cards','Cards'], ['rows','Rows'],
    ['tabs','Tabs'], ['feedback','Feedback'], ['overlays','Overlays'], ['progress','Progress'],
    ['empty','Empty'], ['skeletons','Skeletons'], ['avatar','Avatar'], ['chips','Chips']
  ];
  return (
    <div className="fs-root" data-screen-label="cs-foundations">
      <header className="fs-header">
        <div>
          <div className="t-caption t-mono">CS-FOUNDATIONS · v0.1</div>
          <h1 className="t-display" style={{margin:'4px 0 0'}}>Foundations</h1>
          <p className="t-mute" style={{margin:'8px 0 0', maxWidth:'68ch'}}>The CourseShelf design system. Every primitive in every state, dark and light side-by-side. All values flow from <span className="t-mono">tokens.json</span>.</p>
        </div>
        <div className="fs-toolbar">
          <div className="seg">
            <button aria-selected={mode==='dark'} onClick={()=>setMode('dark')}><Icon name="moon" size={14}/> Dark</button>
            <button aria-selected={mode==='light'} onClick={()=>setMode('light')}><Icon name="sun" size={14}/> Light</button>
          </div>
          <div className="seg">
            <button aria-selected={density==='comfortable'} onClick={()=>setDensity('comfortable')}>Comfortable</button>
            <button aria-selected={density==='compact'} onClick={()=>setDensity('compact')}>Compact</button>
          </div>
        </div>
      </header>
      <nav className="fs-toc">
        {sections.map(([id, label], i) => (
          <a key={id} href={`#${id}`}><span className="t-mono">{String(i+1).padStart(2,'0')}</span> {label}</a>
        ))}
      </nav>
      <main className="fs-main">
        <ColorSection/>
        <TypeSection/>
        <SpaceSection/>
        <RadiusSection/>
        <ButtonsSection/>
        <InputsSection/>
        <CardsSection/>
        <RowsSection/>
        <TabsSection/>
        <FeedbackSection/>
        <OverlaysSection/>
        <ProgressSection/>
        <EmptySection/>
        <SkeletonSection/>
        <AvatarSection/>
        <ChipsSection/>
      </main>
      <footer className="fs-footer t-caption t-mute">
        CourseShelf · cs-foundations · WCAG 2.1 AA · Reduce-motion respected · {sections.length} sections
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
