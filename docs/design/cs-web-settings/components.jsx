// cs-web-settings · Settings screen
// New for cs-web-settings: SyncIndicator, SettingRow, SettingSection, ThemePicker, DensityPicker, SpeedPicker, ThresholdSlider
// — могут вынести в cs-components/ позже.

const { useState, useEffect, useRef } = React;

// ============================================================================
// SyncIndicator — the "self-evident sync" signal
// State machine: idle → saving → saved → idle (after 1.6s) | error (manual reset)
// ============================================================================
const SyncIndicator = ({ state }) => {
  const labels = { idle: '', saving: 'Saving…', saved: 'Saved', error: 'Couldn\'t save' };
  return (
    <span className="sync-ind" data-state={state} role="status" aria-live="polite" aria-atomic="true">
      {state === 'saving' && <><span className="spin"/>Saving…</>}
      {state === 'saved'  && <><Icon name="check" size={11} className="check"/>Saved</>}
      {state === 'error'  && <><Icon name="alert" size={11} className="check"/>Couldn't save</>}
    </span>
  );
};

// ============================================================================
// SettingSection
// ============================================================================
const SettingSection = ({ icon, title, children, className = '' }) => (
  <div className={`set-section ${className}`}>
    <div className="set-section-h">
      <div className="icon-wrap"><Icon name={icon} size={14}/></div>
      <h3>{title}</h3>
    </div>
    <div className="set-section-body">{children}</div>
  </div>
);

// ============================================================================
// SettingRow — auto-tracks sync via prop
// ============================================================================
const SettingRow = ({ label, help, control, syncState = 'idle', danger, bp, vertical }) => (
  <div className={`set-row ${vertical ? 'set-row-vertical' : ''}`} data-row-sync={syncState} data-bp={bp} data-danger={danger || undefined}>
    <div className="set-row-meta">
      <div className="set-row-label">
        {label}
        {syncState !== 'idle' && <SyncIndicator state={syncState}/>}
      </div>
      {help && <div className="set-row-help">{help}</div>}
    </div>
    <div className="set-row-control">{control}</div>
  </div>
);

// ============================================================================
// ThemePicker
// ============================================================================
const ThemePicker = ({ value, onChange }) => (
  <div className="theme-picker" role="radiogroup" aria-label="Theme">
    {[['dark','Dark'],['light','Light'],['system','System']].map(([v, l]) => (
      <div key={v} className="theme-card" data-theme={v} role="radio" aria-checked={value === v} tabIndex={0} onClick={() => onChange(v)} aria-label={l}>
        <div className="preview"><div className="pl"/><div className="pl pl-sm"/><div className="pl"/><div className="pl pl-sm"/></div>
        <span className="label">{l}</span>
      </div>
    ))}
  </div>
);

// ============================================================================
// DensityPicker
// ============================================================================
const DensityPicker = ({ value, onChange }) => (
  <div className="density-picker" role="group" aria-label="Density">
    {[['comfortable','Comfortable'],['cozy','Cozy'],['compact','Compact']].map(([v, l]) => (
      <button key={v} aria-selected={value === v} onClick={() => onChange(v)}>{l}</button>
    ))}
  </div>
);

// ============================================================================
// SpeedPicker
// ============================================================================
const SpeedPicker = ({ value, onChange }) => (
  <div className="speed-picker" role="group" aria-label="Default speed">
    {[0.75, 1, 1.25, 1.5, 1.75, 2].map(v => (
      <button key={v} aria-selected={value === v} onClick={() => onChange(v)}>{v === 1 ? '1×' : `${v}×`}</button>
    ))}
  </div>
);

// ============================================================================
// ThresholdSlider
// ============================================================================
const ThresholdSlider = ({ value, onChange }) => (
  <div className="threshold-slider">
    <div style={{display:'flex', alignItems:'center', gap:12}}>
      <input type="range" min="70" max="100" step="1" value={value} onChange={e => onChange(+e.target.value)} aria-label="Completion threshold"/>
      <span className="value">{value}%</span>
    </div>
    <div className="ticks"><span>70%</span><span>85%</span><span>100%</span></div>
  </div>
);

// ============================================================================
// Mock async-save hook with stateful sync indicator
// ============================================================================
const useSyncedField = (initial, opts = {}) => {
  const [value, setValue] = useState(initial);
  const [syncState, setSyncState] = useState(opts.initialSync || 'idle');
  const timerRef = useRef(null);
  const update = (v) => {
    setValue(v);
    if (opts.frozen) return; // for static stage rendering — never run timers
    setSyncState('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSyncState('saved');
      timerRef.current = setTimeout(() => setSyncState('idle'), 1600);
    }, 600);
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return [value, update, syncState];
};

// ============================================================================
// Page content
// ============================================================================
const SettingsContent = ({ bp, state }) => {
  // Frozen rows let us render specific sync states for the cluster screenshots
  // without timers running.
  const frozenSync = (key) => {
    if (state === 'saving' && key === 'name') return 'saving';
    if (state === 'saved' && key === 'theme') return 'saved';
    if (state === 'error' && key === 'autoplay') return 'error';
    return 'idle';
  };

  const [name, setName] = useStateLite('Elena Lin');
  const [theme, setTheme] = useStateLite('dark');
  const [density, setDensity] = useStateLite('cozy');
  const [speed, setSpeed] = useStateLite(1.25);
  const [autoplay, setAutoplay] = useStateLite(true);
  const [resume, setResume] = useStateLite(true);
  const [threshold, setThreshold] = useStateLite(90);

  if (state === 'loading') {
    return (
      <div className="set-col">
        <div className="set-page-h"><div><div className="skel" style={{height:24, width:120}}/><div className="skel" style={{height:14, width:240, marginTop:8}}/></div></div>
        {[0,1,2,3].map(s => (
          <div className="set-section" key={s}>
            <div className="set-section-h"><div className="skel" style={{width:26, height:26, borderRadius:6}}/><div className="skel" style={{width:120, height:12}}/></div>
            {[0,1,2].map(r => (
              <div className="set-row loading" key={r}>
                <div>
                  <div className="skel" style={{height:13, width:160, marginBottom:6}}/>
                  <div className="skel" style={{height:11, width:'80%'}}/>
                </div>
                <div className="skel" style={{height:32, width:120}}/>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="set-col">
      <div className="set-page-h">
        <div>
          <h2>Settings</h2>
          <div className="sub">Changes save automatically.</div>
        </div>
      </div>

      {state === 'error' && (
        <div className="set-error-banner" role="alert">
          <Icon name="alert" size={16}/>
          <div className="body">
            <strong>Couldn't reach the server.</strong> Your changes are kept locally — we'll retry as soon as the connection is back.
          </div>
          <button className="btn btn-ghost btn-sm">Retry now</button>
        </div>
      )}

      {/* PROFILE ============================================== */}
      <SettingSection icon="user" title="Profile">
        <SettingRow
          bp={bp}
          label="Avatar"
          help="Shown next to your name in the topbar and on shared playlists. JPEG or PNG, up to 2 MB."
          control={
            <div className="set-avatar-block">
              <div className={`set-avatar ${state === 'empty' ? 'is-placeholder' : ''}`}>
                {state === 'empty' ? <Icon name="user" size={22}/> : 'EL'}
              </div>
              <div className="set-avatar-actions" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                <button className="btn btn-secondary btn-sm">{state === 'empty' ? 'Upload image' : 'Change image'}</button>
                {state !== 'empty' && <button className="btn btn-ghost btn-sm" style={{color:'var(--text-muted)'}}>Remove</button>}
              </div>
            </div>
          }
        />
        <SettingRow
          bp={bp}
          label="Display name"
          help="Visible to other people on this server."
          syncState={frozenSync('name')}
          control={<input className="input set-input" defaultValue={name} placeholder="Your name"/>}
        />
        <SettingRow
          bp={bp}
          label="Email"
          help="Used for sign-in and password resets."
          control={
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <span className="t-mono" style={{fontSize:13, color:'var(--text)'}}>elena@courseshelf.local</span>
              <button className="btn btn-ghost btn-sm">Change</button>
            </div>
          }
        />
        <SettingRow
          bp={bp}
          label="Password"
          help="Last changed 14 days ago."
          control={<button className="btn btn-secondary btn-sm"><Icon name="key" size={12}/>Change password</button>}
        />
      </SettingSection>

      {/* APPEARANCE =========================================== */}
      <SettingSection icon="sun" title="Appearance">
        <SettingRow
          bp={bp}
          vertical={bp === 'xs'}
          label="Theme"
          help="System uses your OS setting and switches with it."
          syncState={frozenSync('theme')}
          control={<ThemePicker value={theme} onChange={() => {}}/>}
        />
        <SettingRow
          bp={bp}
          label="Density"
          help="How tightly course cards and lesson rows pack together."
          control={<DensityPicker value={density} onChange={() => {}}/>}
        />
      </SettingSection>

      {/* PLAYBACK ============================================= */}
      <SettingSection icon="play" title="Playback">
        <SettingRow
          bp={bp}
          vertical={bp === 'xs'}
          label="Default speed"
          help="Applied when starting a new lesson. Per-lesson overrides are remembered."
          control={<SpeedPicker value={speed} onChange={() => {}}/>}
        />
        <SettingRow
          bp={bp}
          label="Autoplay next lesson"
          help="Play the next lesson automatically when one finishes."
          syncState={frozenSync('autoplay')}
          control={
            <div className="switch" role="switch" aria-checked={autoplay} tabIndex={0} aria-label="Autoplay next lesson">
              <span className="switch-track"><span className="switch-thumb"/></span>
            </div>
          }
        />
        <SettingRow
          bp={bp}
          label="Resume where I left off"
          help="Open the last position when reopening a lesson."
          control={
            <div className="switch" role="switch" aria-checked={resume} tabIndex={0} aria-label="Resume where I left off">
              <span className="switch-track"><span className="switch-thumb"/></span>
            </div>
          }
        />
        <SettingRow
          bp={bp}
          vertical={bp === 'xs'}
          label="Mark as complete at"
          help="Threshold of watch time before a lesson counts as completed."
          control={<ThresholdSlider value={threshold} onChange={() => {}}/>}
        />
      </SettingSection>

      {/* ACCOUNT ============================================== */}
      <div className="set-account">
        <SettingSection icon="logout" title="Account">
          <SettingRow
            bp={bp}
            label="Sign out"
            help="Sign out from this browser only."
            control={<button className="btn btn-secondary btn-sm">Sign out</button>}
          />
          <SettingRow
            bp={bp}
            label="Sign out from all devices"
            help="Invalidates every session token. You'll need to sign in again everywhere."
            control={<button className="btn btn-secondary btn-sm">Sign out everywhere</button>}
          />
          <SettingRow
            bp={bp}
            danger
            label="Delete account"
            help="Removes your profile, watch progress, bookmarks, and notes. Course files on disk are not affected. This can't be undone."
            control={<button className="btn btn-destructive btn-sm">Delete account</button>}
          />
        </SettingSection>
      </div>

      <div className="t-caption t-mute" style={{textAlign:'center', marginTop:24}}>
        CourseShelf 2.4.1 · build 2026-04-22.r4
      </div>
    </div>
  );
};

// useState alias to keep this file self-contained for state declarations above
const useStateLite = (v) => useState(v);

window.SyncIndicator = SyncIndicator;
window.SettingsContent = SettingsContent;
