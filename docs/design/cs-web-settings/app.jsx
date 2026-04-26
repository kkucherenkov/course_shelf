// cs-web-settings · stage assembly
const { useState } = React;

const FrameSide = ({ active, bp }) => {
  if (bp === 'xs') return null;
  const items = [
    ['home','Home','home'],
    ['browse','Browse','library'],
    ['search','Search','search'],
    ['settings','Settings','settings'],
  ];
  return (
    <aside className="set-side">
      <div className="set-brand">
        <div className="set-brand-mark">CS</div>
        <div className="set-brand-name">CourseShelf</div>
      </div>
      {items.map(([k, l, ic]) => (
        <div key={k} className="nav-item" aria-current={active===k ? 'page' : undefined}>
          <Icon name={ic} size={16}/><span className="label">{l}</span>
        </div>
      ))}
    </aside>
  );
};

const SetFrame = ({ bp, theme, state }) => {
  const widthMap = { xs: 360, md: 1024, lg: 1440 };
  const w = widthMap[bp];
  return (
    <div className="set-frame" data-mode={theme} style={{width: w}}>
      <div className="set-frame-h">
        <span className="dot"/><span className="dot"/><span className="dot"/>
        <span className="url">courseshelf.local/settings</span>
        <span style={{width:30}}/>
      </div>
      <div className="set-frame-body">
        <div className="set-shell" data-bp={bp}>
          <FrameSide active="settings" bp={bp}/>
          <div className="set-main">
            <header className="set-topbar">
              {bp === 'xs' && <button className="btn btn-ghost btn-icon btn-sm" aria-label="Back"><Icon name="chevron-left" size={16}/></button>}
              <div className="crumbs">
                {bp === 'xs' ? <span className="active">Settings</span> : <>
                  <span>Account</span>
                  <span className="sep"><Icon name="chevron-right" size={12}/></span>
                  <span className="active">Settings</span>
                </>}
              </div>
              {bp !== 'xs' && <div className="avatar avatar-sm" style={{background:'#3F8C84'}}>EL</div>}
            </header>
            <div className="set-content">
              <SettingsContent bp={bp} state={state}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BpRow = ({ bps, state }) => (
  <div className="set-bp-row">
    {bps.map(bp => (
      ['dark','light'].map(theme => (
        <div key={`${bp}-${theme}`} className="set-bp">
          <div className="set-bp-label">
            <span className="pill">{bp === 'xs' ? 'xs · 360' : bp === 'md' ? 'md · 1024' : 'lg · 1440'}</span>
            <span className="pill">{theme}</span>
          </div>
          <SetFrame bp={bp} theme={theme} state={state}/>
        </div>
      ))
    ))}
  </div>
);

const App = () => {
  useMode('dark');
  return (
    <div className="set-stage" data-screen-label="01 cs-web-settings">
      <div className="set-stage-h">
        <div>
          <div className="t-caption t-mono">CS-WEB-SETTINGS</div>
          <h1 className="t-display" style={{margin:'4px 0 0'}}>Settings · web</h1>
        </div>
        <p className="t-mute" style={{margin:0, maxWidth:'70ch', flex:'1 1 320px', minWidth:280}}>
          Single column, max 720px wide on desktop. Four sections: Profile · Appearance · Playback · Account.
          Inline saves with the self-evident sync indicator (a small inline status next to each row label,
          plus a 2px accent on the row's left edge that flashes green on save).
        </p>
      </div>

      <section>
        <div className="set-cluster-h">State: default · all rows idle, normal account profile</div>
        <BpRow bps={['xs','md','lg']} state="default"/>
      </section>

      <section>
        <div className="set-cluster-h">State: saving · "Display name" mid-save · spinner + info accent</div>
        <BpRow bps={['lg']} state="saving"/>
      </section>

      <section>
        <div className="set-cluster-h">State: saved · "Theme" just persisted · success check + green flash</div>
        <BpRow bps={['md']} state="saved"/>
      </section>

      <section>
        <div className="set-cluster-h">State: error · banner + per-row error on "Autoplay" toggle</div>
        <BpRow bps={['lg']} state="error"/>
      </section>

      <section>
        <div className="set-cluster-h">State: loading · skeleton sections</div>
        <BpRow bps={['md']} state="loading"/>
      </section>

      <section>
        <div className="set-cluster-h">State: empty · new account, no avatar uploaded yet</div>
        <BpRow bps={['xs','md']} state="empty"/>
      </section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
