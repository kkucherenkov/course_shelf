// cs-web-admin · domain components
// New for cs-web-admin: StatCard, ScanRow, LibraryRow, UserRow, RoleChip, PermissionRow, AddGrantSheet
// — могут вынести в cs-components/ позже.

const { useState } = React;

// ============================================================================
// StatCard — for dashboard headline numbers
// ============================================================================
const StatCard = ({ icon, label, num, meta, delta, deltaDir, isError, loading }) => {
  if (loading) return (
    <div className="stat-card">
      <div className="stat-card-h"><div className="skel" style={{width:24,height:24,borderRadius:6}}/><div className="skel" style={{width:80,height:10}}/></div>
      <div className="skel" style={{width:120,height:24,marginTop:4}}/>
      <div className="skel" style={{width:90,height:10,marginTop:6}}/>
    </div>
  );
  return (
    <div className={`stat-card ${isError ? 'is-error' : ''}`}>
      <div className="stat-card-h">
        <div className="icon-wrap"><Icon name={icon} size={14}/></div>
        <span>{label}</span>
      </div>
      <div className="num">{num}</div>
      <div className="meta">
        {delta && <span className={deltaDir === 'down' ? 'delta-down' : 'delta-up'}>
          <Icon name={deltaDir === 'down' ? 'chevron-down' : 'chevron-up'} size={11}/>{delta}
        </span>}
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
};

// ============================================================================
// StatusPill
// ============================================================================
const StatusPill = ({ status, label }) => {
  const labels = { running: 'Running', success: 'Success', warning: 'With warnings', failed: 'Failed', cancelled: 'Cancelled', queued: 'Queued' };
  return <span className="status-pill" data-status={status}><span className="dot"/>{label || labels[status]}</span>;
};

// ============================================================================
// LibraryRow — bp-aware row card with copy-on-click path
// ============================================================================
const LibraryRow = ({ library, bp, onClick }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="lib-row" data-bp={bp} tabIndex={0} role="button" onClick={onClick}>
      <div className="lib-icon"><Icon name="folder" size={14}/></div>
      <div style={{minWidth:0}}>
        <div className="lib-name">{library.name}</div>
        {bp === 'xs' && <div className="lib-name-sub"><span>{library.courses} courses</span><span>·</span><span>{library.size}</span></div>}
        {bp !== 'xs' && <div className="lib-name-sub"><span>{library.size}</span><span>·</span><span>last scan {library.lastScan}</span></div>}
      </div>
      {bp !== 'xs' && (
        <div className="lib-path" data-copied={copied} onClick={copy} title={library.path} role="button" tabIndex={0} aria-label={`Copy path ${library.path}`}>
          <Icon name={copied ? 'check' : 'copy'} size={12} className="copy-icon"/>
          <span className="lib-path-text">{library.path}</span>
        </div>
      )}
      {bp === 'lg' && <div className="lib-meta-meta"><span className="num">{library.courses}</span> courses</div>}
      {bp !== 'xs' && <StatusPill status={library.status}/>}
      <div className="lib-row-actions" onClick={e => e.stopPropagation()}>
        {bp === 'xs' ? <button className="btn btn-ghost btn-icon btn-sm" aria-label="More"><Icon name="more-h" size={14}/></button>
                     : <>
                       <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={12}/>Scan</button>
                       <button className="btn btn-ghost btn-icon btn-sm" aria-label="More"><Icon name="more-h" size={14}/></button>
                     </>}
      </div>
    </div>
  );
};

// ============================================================================
// RoleChip — admin can change role inline
// ============================================================================
const RoleChip = ({ role, onChange, readOnly }) => {
  const labels = { admin: 'Admin', user: 'User', guest: 'Guest', disabled: 'Disabled' };
  return (
    <span className="role-chip" data-role={role} role={onChange ? 'button' : undefined} tabIndex={onChange ? 0 : undefined} aria-label={`Role: ${labels[role]}${onChange ? ', click to change' : ''}`}>
      {role === 'admin' && <Icon name="shield" size={11}/>}
      {labels[role]}
      {!readOnly && onChange && <Icon name="chevron-down" size={11}/>}
    </span>
  );
};

// ============================================================================
// UserRow
// ============================================================================
const UserRow = ({ user, bp, onChangeRole, onClick }) => {
  if (bp === 'xs') return (
    <div className="user-card-xs" tabIndex={0} role="button" onClick={onClick}>
      <div className="avatar avatar-md" style={{background: user.avatarBg || 'var(--surface-3)'}}>{user.initials}</div>
      <div style={{minWidth:0}}>
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
        <div className="meta-row">
          <RoleChip role={user.role} onChange={onChangeRole}/>
          <span>{user.lastActive}</span>
        </div>
      </div>
      <button className="btn btn-ghost btn-icon btn-sm" aria-label="More" onClick={e => e.stopPropagation()}><Icon name="more-h" size={14}/></button>
    </div>
  );
  return (
    <div className="user-row" data-bp={bp} tabIndex={0} role="button" onClick={onClick}>
      <div className="avatar avatar-md" style={{background: user.avatarBg || 'var(--surface-3)'}}>{user.initials}</div>
      <div style={{minWidth:0}}>
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
      </div>
      {bp === 'lg' && <div className="user-email">{user.libraries} libraries · {user.minutes} min watched</div>}
      <div onClick={e => e.stopPropagation()}><RoleChip role={user.role} onChange={onChangeRole}/></div>
      <div className="user-last">{user.lastActive}</div>
      <div className="lib-row-actions" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-icon btn-sm" aria-label="Edit"><Icon name="edit" size={14}/></button>
        <button className="btn btn-ghost btn-icon btn-sm" aria-label="More"><Icon name="more-h" size={14}/></button>
      </div>
    </div>
  );
};

// ============================================================================
// PermissionRow — library access + nested course overrides
// ============================================================================
const PermissionRow = ({ library, level, overrides, bp, onChangeLevel }) => {
  const [open, setOpen] = useState(library.id === 'cs');
  const hasOv = overrides && overrides.length > 0;
  return (
    <>
      <div className={`perm-row ${hasOv ? 'has-overrides' : ''}`} data-bp={bp}>
        <div style={{display:'flex', gap:12, alignItems:'center', minWidth:0}}>
          <div className="lib-icon"><Icon name="folder" size={14}/></div>
          <div style={{minWidth:0}}>
            <div className="perm-row-name">
              {library.name}
              {hasOv && <span className="chip chip-info" style={{fontSize:11, padding:'1px 6px'}}>{overrides.length} override{overrides.length>1?'s':''}</span>}
            </div>
            <div className="perm-row-meta">{library.courses} courses · {library.size}</div>
          </div>
        </div>
        <div className="level-toggle" role="group" aria-label={`Access level for ${library.name}`}>
          <button data-level="read" aria-selected={level === 'read'} onClick={() => onChangeLevel(library.id, 'read')}>Read</button>
          <button data-level="none" aria-selected={level === 'none'} onClick={() => onChangeLevel(library.id, 'none')}>None</button>
        </div>
        {bp !== 'xs' && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => hasOv && setOpen(!open)} aria-label={hasOv ? 'Toggle overrides' : 'No overrides'} disabled={!hasOv}>
            <Icon name="chevron-down" size={14} style={{transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform var(--d-fast)', opacity: hasOv ? 1 : 0.3}}/>
          </button>
        )}
      </div>
      {hasOv && open && bp !== 'xs' && (
        <div className="perm-overrides">
          <div className="perm-override-h">
            <Icon name="corner-down-right" size={11}/> Per-course overrides
          </div>
          {overrides.map(o => (
            <div key={o.id} className="perm-override-row" data-bp={bp}>
              <div style={{display:'flex', gap:10, alignItems:'center', minWidth:0}}>
                <div style={{width:24, height:18, borderRadius:3, background: COVER[o.accent] || 'var(--surface-3)', flexShrink:0}}/>
                <div className="title">{o.title}</div>
              </div>
              <div className="level-toggle">
                <button data-level="read" aria-selected={o.level === 'read'}>Read</button>
                <button data-level="none" aria-selected={o.level === 'none'}>None</button>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Remove override"><Icon name="x" size={14}/></button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{marginTop:8}}><Icon name="plus" size={12}/>Add course override</button>
        </div>
      )}
    </>
  );
};

// ============================================================================
// AddGrantSheet
// ============================================================================
const AddGrantSheet = ({ bp, onClose }) => {
  const [scope, setScope] = useState('library');
  const [level, setLevel] = useState('read');
  return (
    <div className="adm-sheet-backdrop" data-bp={bp} onClick={onClose}>
      <div className="adm-sheet" onClick={e => e.stopPropagation()}>
        <div className="adm-sheet-h">
          <h3>Add grant</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={16}/></button>
        </div>
        <div className="adm-sheet-body">
          <div>
            <div className="field-label" style={{marginBottom:6}}>Scope</div>
            <div className="level-toggle" style={{width:'100%'}}>
              <button data-level={scope==='library'?'read':'none'} aria-selected={scope==='library'} onClick={() => setScope('library')} style={{flex:1}}>Library</button>
              <button data-level={scope==='course'?'read':'none'} aria-selected={scope==='course'} onClick={() => setScope('course')} style={{flex:1}}>Course override</button>
            </div>
          </div>
          {scope === 'library' && (
            <div>
              <div className="field-label" style={{marginBottom:6}}>Library</div>
              <div className="input-with-icon">
                <Icon name="search" size={14}/>
                <input className="input" placeholder="Search libraries…" defaultValue="Computer Science"/>
              </div>
              <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:2}}>
                {[{id:'cs',n:'Computer Science',c:14},{id:'art',n:'Art',c:7},{id:'db',n:'Databases',c:5}].map(l => (
                  <label key={l.id} className="fp-opt" style={{padding:'8px 10px', borderRadius:'var(--radius-sm)'}}>
                    <input type="radio" name="lib" defaultChecked={l.id==='cs'}/>
                    <span style={{flex:1, fontSize:13}}>{l.n}</span>
                    <span className="t-mono t-mute" style={{fontSize:11}}>{l.c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {scope === 'course' && (
            <div>
              <div className="field-label" style={{marginBottom:6}}>Course</div>
              <div className="input-with-icon">
                <Icon name="search" size={14}/>
                <input className="input" placeholder="Find a course…"/>
              </div>
              <p className="t-caption t-mute" style={{marginTop:8}}>Course overrides take precedence over library-level grants for this user.</p>
            </div>
          )}
          <div>
            <div className="field-label" style={{marginBottom:6}}>Access level</div>
            <div className="level-toggle" style={{width:'100%'}}>
              <button data-level="read" aria-selected={level==='read'} onClick={() => setLevel('read')} style={{flex:1}}>Read</button>
              <button data-level="none" aria-selected={level==='none'} onClick={() => setLevel('none')} style={{flex:1}}>None (deny)</button>
            </div>
          </div>
          <div className="banner banner-info" style={{padding:12, fontSize:12, lineHeight:'18px'}}>
            <Icon name="info" size={14}/>
            <div className="banner-body">Marco Bucci will gain Read access to <b>Computer Science</b> immediately. They'll see 14 new courses on their shelf.</div>
          </div>
        </div>
        <div className="adm-sheet-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save grant</button>
        </div>
      </div>
    </div>
  );
};

window.StatCard = StatCard;
window.StatusPill = StatusPill;
window.LibraryRow = LibraryRow;
window.RoleChip = RoleChip;
window.UserRow = UserRow;
window.PermissionRow = PermissionRow;
window.AddGrantSheet = AddGrantSheet;
