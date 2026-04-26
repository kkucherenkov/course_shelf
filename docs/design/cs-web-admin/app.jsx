// cs-web-admin · stage assembly — admin dashboard, libraries, library detail, users, permissions
// Renders each screen at three reference widths × dark+light, with state clusters.

const { useState } = React;

const FrameSide = ({ active, bp }) => {
  if (bp === 'xs') return null;
  const main = [
    ['home', 'Home', 'home'],
    ['browse', 'Browse', 'library'],
    ['search', 'Search', 'search'],
  ];
  const admin = [
    ['dashboard', 'Dashboard', 'grid'],
    ['libraries', 'Libraries', 'folder'],
    ['users', 'Users', 'users'],
    ['permissions', 'Permissions', 'key'],
  ];
  return (
    <aside className="adm-side">
      <div className="adm-brand">
        <div className="adm-brand-mark">CS</div>
        <div className="adm-brand-name">CourseShelf</div>
      </div>
      {main.map(([k, l, ic]) => (
        <div key={k} className="nav-item" aria-current={active === k ? 'page' : undefined}>
          <Icon name={ic} size={16} />
          <span className="label">{l}</span>
        </div>
      ))}
      <div className="nav-section">Admin</div>
      {admin.map(([k, l, ic]) => (
        <div key={k} className="nav-item" aria-current={active === k ? 'page' : undefined}>
          <Icon name={ic} size={16} />
          <span className="label">{l}</span>
        </div>
      ))}
    </aside>
  );
};

const Crumbs = ({ items }) => (
  <div className="crumbs">
    {items.map((it, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <span className="sep">
            <Icon name="chevron-right" size={12} />
          </span>
        )}
        <span className={i === items.length - 1 ? 'active' : ''}>{it}</span>
      </React.Fragment>
    ))}
  </div>
);

const PAGE_META = {
  dashboard: {
    title: 'Dashboard',
    sub: 'Overview of every library, scan, and user.',
    crumbs: ['Admin', 'Dashboard'],
    url: '/admin',
  },
  libraries: {
    title: 'Libraries',
    sub: '6 libraries · 1.32 TB total.',
    crumbs: ['Admin', 'Libraries'],
    url: '/admin/libraries',
  },
  'library-detail': {
    title: 'Computer Science',
    sub: '14 courses · scanned 12 minutes ago.',
    crumbs: ['Admin', 'Libraries', 'Computer Science'],
    url: '/admin/libraries/cs',
  },
  users: {
    title: 'Users',
    sub: '42 users · 38 active.',
    crumbs: ['Admin', 'Users'],
    url: '/admin/users',
  },
  permissions: {
    title: 'Permissions · Marco Bucci',
    sub: 'Library and per-course access for this user.',
    crumbs: ['Admin', 'Users', 'Marco Bucci', 'Permissions'],
    url: '/admin/users/marco/permissions',
  },
};

// ============================================================================
// Frame
// ============================================================================
const AdmFrame = ({ bp, theme, screen, state }) => {
  const widthMap = { xs: 360, md: 1024, lg: 1440 };
  const w = widthMap[bp];
  const meta = PAGE_META[screen];
  const [sheet, setSheet] = useState(false);

  const navKey = screen === 'library-detail' ? 'libraries' : screen;

  const primaryAction = (() => {
    if (screen === 'libraries')
      return (
        <button className="btn btn-primary btn-sm" onClick={() => setSheet(true)}>
          <Icon name="plus" size={12} />
          Add library
        </button>
      );
    if (screen === 'users')
      return (
        <button className="btn btn-primary btn-sm">
          <Icon name="plus" size={12} />
          Add user
        </button>
      );
    return null;
  })();

  return (
    <div className="adm-frame" data-mode={theme} style={{ width: w }}>
      <div className="adm-frame-h">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="url">courseshelf.local{meta.url}</span>
        <span style={{ width: 30 }} />
      </div>
      <div className="adm-frame-body">
        <div className="adm-shell" data-bp={bp}>
          <FrameSide active={navKey} bp={bp} />
          <div className="adm-main">
            <header className="adm-topbar">
              {bp === 'xs' && (
                <button className="btn btn-ghost btn-icon btn-sm" aria-label="Menu">
                  <Icon name="menu" size={16} />
                </button>
              )}
              <Crumbs items={bp === 'xs' ? meta.crumbs.slice(-2) : meta.crumbs} />
              {bp !== 'xs' && (
                <div className="avatar avatar-sm" style={{ background: '#3F8C84' }}>
                  EL
                </div>
              )}
            </header>
            <div className="adm-content">
              {screen !== 'library-detail' && screen !== 'permissions' && (
                <div className="adm-page-h">
                  <div>
                    <h2>{meta.title}</h2>
                    <div className="sub">{meta.sub}</div>
                  </div>
                  {bp !== 'xs' && primaryAction && (
                    <div className="adm-page-actions">{primaryAction}</div>
                  )}
                </div>
              )}

              {screen === 'dashboard' && <DashboardContent bp={bp} state={state} />}
              {screen === 'libraries' && (
                <LibrariesContent bp={bp} state={state} onAdd={() => setSheet(true)} />
              )}
              {screen === 'library-detail' && <LibraryDetail bp={bp} state={state} />}
              {screen === 'users' && <UsersContent bp={bp} state={state} />}
              {screen === 'permissions' && (
                <PermissionsContent bp={bp} state={state} onAddGrant={() => setSheet(true)} />
              )}
            </div>
            {bp === 'xs' && primaryAction && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                {primaryAction}
              </div>
            )}
          </div>
        </div>

        {sheet && screen === 'permissions' && (
          <AddGrantSheet bp={bp} onClose={() => setSheet(false)} />
        )}
        {sheet && screen === 'libraries' && (
          <AddLibrarySheet bp={bp} onClose={() => setSheet(false)} />
        )}
      </div>
    </div>
  );
};

// Add library sheet (small, inline here since it's screen-specific)
// New for cs-web-admin: AddLibrarySheet — могут вынести в cs-components/ позже.
const AddLibrarySheet = ({ bp, onClose }) => (
  <div className="adm-sheet-backdrop" data-bp={bp} onClick={onClose}>
    <div className="adm-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="adm-sheet-h">
        <h3>Add library</h3>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="adm-sheet-body">
        <div>
          <div className="field-label" style={{ marginBottom: 6 }}>
            Name
          </div>
          <input
            className="input"
            placeholder="e.g. Computer Science"
            defaultValue="Computer Science"
          />
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 6 }}>
            Root path on disk
          </div>
          <div className="input-with-icon">
            <Icon name="folder" size={14} />
            <input
              className="input"
              placeholder="/srv/courses/…"
              defaultValue="/srv/courses/computer-science"
            />
          </div>
          <div
            className="field-help"
            style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <Icon name="check" size={12} style={{ color: 'var(--success)' }} /> Path readable · 14
            candidate course folders found
          </div>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 6 }}>
            Auto-scan
          </div>
          <div className="level-toggle" style={{ width: '100%' }}>
            <button data-level="read" aria-selected="true" style={{ flex: 1 }}>
              Daily 03:00
            </button>
            <button data-level="none" style={{ flex: 1 }}>
              Manual only
            </button>
          </div>
        </div>
        <label className="fp-opt" style={{ padding: 8 }}>
          <input type="checkbox" defaultChecked />
          <span style={{ flex: 1, fontSize: 13 }}>Run initial scan after saving</span>
        </label>
      </div>
      <div className="adm-sheet-foot">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary">Save library</button>
      </div>
    </div>
  </div>
);

// ============================================================================
// Stage assembly
// ============================================================================
const BpRow = ({ bps, screen, state }) => (
  <div className="adm-bp-row">
    {bps.map((bp) =>
      ['dark', 'light'].map((theme) => (
        <div key={`${bp}-${theme}`} className="adm-bp">
          <div className="adm-bp-label">
            <span className="pill">
              {bp === 'xs' ? 'xs · 360' : bp === 'md' ? 'md · 1024' : 'lg · 1440'}
            </span>
            <span className="pill">{theme}</span>
          </div>
          <AdmFrame bp={bp} theme={theme} screen={screen} state={state} />
        </div>
      )),
    )}
  </div>
);

const App = () => {
  useMode('dark');
  return (
    <div className="adm-stage" data-screen-label="01 cs-web-admin">
      <div className="adm-stage-h">
        <div>
          <div className="t-caption t-mono">CS-WEB-ADMIN</div>
          <h1 className="t-display" style={{ margin: '4px 0 0' }}>
            Admin · web
          </h1>
        </div>
        <p
          className="t-mute"
          style={{ margin: 0, maxWidth: '70ch', flex: '1 1 320px', minWidth: 280 }}
        >
          Dashboard · Libraries (list + detail) · Users · Permissions. Three reference widths (
          <span className="t-mono">xs · 360</span>, <span className="t-mono">md · 1024</span>,{' '}
          <span className="t-mono">lg · 1440</span>), dark + light side by side. Tables collapse to
          row lists at xs; primary actions stay visible.
        </p>
      </div>

      {/* DASHBOARD ============================================== */}
      <section>
        <div className="adm-cluster-h">Dashboard · default · 4 stat cards + recent scans</div>
        <BpRow bps={['xs', 'md', 'lg']} screen="dashboard" state="default" />
      </section>
      <section>
        <div className="adm-cluster-h">Dashboard · loading · skeleton stats + skeleton rows</div>
        <BpRow bps={['lg']} screen="dashboard" state="loading" />
      </section>
      <section>
        <div className="adm-cluster-h">Dashboard · error · API unreachable</div>
        <BpRow bps={['md']} screen="dashboard" state="error" />
      </section>

      {/* LIBRARIES =============================================== */}
      <section>
        <div className="adm-cluster-h">
          Libraries · default · 6 libraries · mixed scan states (running, warning, failed)
        </div>
        <BpRow bps={['xs', 'md', 'lg']} screen="libraries" state="default" />
      </section>
      <section>
        <div className="adm-cluster-h">Libraries · empty · first-run experience with CTA</div>
        <BpRow bps={['md']} screen="libraries" state="empty" />
      </section>
      <section>
        <div className="adm-cluster-h">Libraries · loading · skeleton rows</div>
        <BpRow bps={['lg']} screen="libraries" state="loading" />
      </section>

      {/* LIBRARY DETAIL ========================================== */}
      <section>
        <div className="adm-cluster-h">Library detail · default · scan history</div>
        <BpRow bps={['md', 'lg']} screen="library-detail" state="default" />
      </section>
      <section>
        <div className="adm-cluster-h">Library detail · scanning · live ScanProgress</div>
        <BpRow bps={['lg']} screen="library-detail" state="scanning" />
      </section>
      <section>
        <div className="adm-cluster-h">Library detail · error · last scan failed banner</div>
        <BpRow bps={['md']} screen="library-detail" state="error" />
      </section>

      {/* USERS =================================================== */}
      <section>
        <div className="adm-cluster-h">
          Users · default · 7 users with inline role chips · disabled state visible
        </div>
        <BpRow bps={['xs', 'md', 'lg']} screen="users" state="default" />
      </section>
      <section>
        <div className="adm-cluster-h">Users · loading · skeleton rows</div>
        <BpRow bps={['lg']} screen="users" state="loading" />
      </section>

      {/* PERMISSIONS ============================================= */}
      <section>
        <div className="adm-cluster-h">
          Permissions · default · 6 libraries × Read/None toggle · 2 with course overrides
        </div>
        <BpRow bps={['md', 'lg']} screen="permissions" state="default" />
      </section>
      <section>
        <div className="adm-cluster-h">Permissions · empty · user has no grants yet</div>
        <BpRow bps={['lg']} screen="permissions" state="empty" />
      </section>
      <section>
        <div className="adm-cluster-h">
          Permissions · xs · stacked rows, no inline overrides accordion
        </div>
        <BpRow bps={['xs']} screen="permissions" state="default" />
      </section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
