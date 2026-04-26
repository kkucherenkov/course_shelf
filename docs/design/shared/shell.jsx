// Shared web shell + mobile phone frame, used by all screens
const { useState } = React;

const Shell = ({ active, children, title, actions }) => {
  const nav = [
    ['home', 'Home', 'home'], ['browse', 'Browse', 'library'], ['search', 'Search', 'search'],
  ];
  const admin = [['dashboard', 'Dashboard', 'grid'], ['libraries', 'Libraries', 'folder'], ['users', 'Users', 'users']];
  return (
    <div className="shell">
      <aside className="shell-side">
        <div className="shell-brand">
          <div className="shell-brand-mark">CS</div>
          <div className="shell-brand-name">CourseShelf</div>
        </div>
        {nav.map(([k, l, ic]) => (
          <div key={k} className="nav-item" aria-current={active===k ? 'page' : undefined}>
            <Icon name={ic} size={18}/>{l}
          </div>
        ))}
        <div className="nav-section">Admin</div>
        {admin.map(([k, l, ic]) => (
          <div key={k} className="nav-item" aria-current={active===k ? 'page' : undefined}>
            <Icon name={ic} size={18}/>{l}
          </div>
        ))}
        <div style={{flex:1}}/>
        <div className="nav-item">
          <div className="avatar avatar-sm">EL</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, color:'var(--text-loud)'}}>Elena Lin</div>
            <div style={{fontSize:11, color:'var(--text-muted)'}}>User</div>
          </div>
          <Icon name="settings" size={16}/>
        </div>
      </aside>
      <div className="shell-main">
        <header className="shell-topbar">
          <div style={{flex:1, maxWidth:420}}>
            <div className="input-with-icon">
              <Icon name="search" size={16}/>
              <input className="input" placeholder="Search courses, lessons…"/>
            </div>
          </div>
          <span style={{flex:1}}/>
          {actions}
          <button className="btn btn-ghost btn-icon" title="Theme"><Icon name="moon" size={16}/></button>
        </header>
        <div className="shell-content">{children}</div>
      </div>
    </div>
  );
};

// Phone frame
const Phone = ({ children, activeTab = 'home', landscape = false, label, noTabbar = false }) => {
  const tabs = [
    ['home', 'Home', 'home'], ['browse', 'Browse', 'library'], ['downloads', 'Downloads', 'cloud-down'],
    ['search', 'Search', 'search'], ['settings', 'Settings', 'settings']
  ];
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
      {label && <div className="t-caption t-mono t-mute">{label}</div>}
      <div className={`phone ${landscape ? 'landscape':''}`}>
        <div className="phone-status">
          <span>9:41</span>
          <span className="dots"><span className="dot"/><span className="dot"/><span className="dot"/></span>
        </div>
        <div className="phone-screen">{children}</div>
        {!landscape && !noTabbar && (
          <div className="phone-tabbar">
            {tabs.map(([k, l, ic]) => (
              <div key={k} className="tab-btn" aria-current={activeTab===k ? 'page' : undefined}>
                <Icon name={ic} size={18}/>{l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { Shell, Phone });
