// cs-web-admin · screen content modules (Dashboard, Libraries, Library detail, Users, Permissions)

const { useState: useStateScreens } = React;

// ----------------- Mock data -----------------
const ADM_LIBRARIES = [
  {
    id: 'cs',
    name: 'Computer Science',
    path: '/srv/courses/computer-science',
    size: '482.4 GB',
    courses: 14,
    lastScan: '12 min ago',
    status: 'success',
  },
  {
    id: 'art',
    name: 'Art & Illustration',
    path: '/srv/courses/art',
    size: '218.1 GB',
    courses: 7,
    lastScan: '2 hours ago',
    status: 'success',
  },
  {
    id: 'db',
    name: 'Databases',
    path: '/srv/courses/databases',
    size: '156.7 GB',
    courses: 5,
    lastScan: 'Running now',
    status: 'running',
  },
  {
    id: 'math',
    name: 'Mathematics',
    path: '/mnt/storage-2/math',
    size: '89.4 GB',
    courses: 4,
    lastScan: 'Yesterday, 03:14',
    status: 'warning',
  },
  {
    id: 'prod',
    name: 'Audio & Production',
    path: '/srv/courses/production',
    size: '312.6 GB',
    courses: 6,
    lastScan: '4 days ago',
    status: 'failed',
  },
  {
    id: 'tools',
    name: 'Tooling & Workflow',
    path: '/srv/courses/tooling',
    size: '67.2 GB',
    courses: 9,
    lastScan: '6 hours ago',
    status: 'success',
  },
];

const ADM_RECENT_SCANS = [
  {
    id: 's1',
    library: 'Computer Science',
    status: 'success',
    started: 'Today, 14:02',
    duration: '2m 18s',
    files: 2104,
    added: 38,
    errors: 0,
  },
  {
    id: 's2',
    library: 'Databases',
    status: 'running',
    started: 'Today, 14:14',
    duration: '00:48',
    files: 1247,
    added: 12,
    errors: 0,
  },
  {
    id: 's3',
    library: 'Audio & Production',
    status: 'failed',
    started: 'Today, 09:31',
    duration: '0m 12s',
    files: 0,
    added: 0,
    errors: 1,
  },
  {
    id: 's4',
    library: 'Mathematics',
    status: 'warning',
    started: 'Yesterday, 03:14',
    duration: '4m 02s',
    files: 612,
    added: 4,
    errors: 7,
  },
  {
    id: 's5',
    library: 'Art & Illustration',
    status: 'success',
    started: 'Yesterday, 11:55',
    duration: '3m 41s',
    files: 1820,
    added: 22,
    errors: 0,
  },
  {
    id: 's6',
    library: 'Tooling & Workflow',
    status: 'cancelled',
    started: '2 days ago',
    duration: '1m 04s',
    files: 340,
    added: 0,
    errors: 0,
  },
];

const ADM_USERS = [
  {
    id: 'u1',
    name: 'Elena Lin',
    email: 'elena@courseshelf.local',
    initials: 'EL',
    avatarBg: '#3F8C84',
    role: 'admin',
    lastActive: '2 min ago',
    libraries: 6,
    minutes: 18420,
  },
  {
    id: 'u2',
    name: 'Marco Bucci',
    email: 'marco.bucci@studio.example',
    initials: 'MB',
    avatarBg: '#C8821C',
    role: 'user',
    lastActive: '14 min ago',
    libraries: 4,
    minutes: 6230,
  },
  {
    id: 'u3',
    name: 'Lukas Fittl',
    email: 'lukas@pganalyze.example',
    initials: 'LF',
    avatarBg: '#6B72B8',
    role: 'user',
    lastActive: '1 hour ago',
    libraries: 3,
    minutes: 4180,
  },
  {
    id: 'u4',
    name: 'Anna Mason',
    email: 'anna@watercolor.example',
    initials: 'AM',
    avatarBg: '#9ED2CC',
    role: 'guest',
    lastActive: 'Yesterday',
    libraries: 1,
    minutes: 940,
  },
  {
    id: 'u5',
    name: 'Drew Neil',
    email: 'drew@vimcasts.example',
    initials: 'DN',
    avatarBg: '#454952',
    role: 'user',
    lastActive: '3 days ago',
    libraries: 2,
    minutes: 2310,
  },
  {
    id: 'u6',
    name: 'Erik Eidt',
    email: 'erik@retired.example',
    initials: 'EE',
    avatarBg: '#5C5644',
    role: 'disabled',
    lastActive: 'Apr 18',
    libraries: 0,
    minutes: 0,
  },
  {
    id: 'u7',
    name: 'Mikhail Belkin',
    email: 'mikhail@osu.example',
    initials: 'MB',
    avatarBg: '#5BA89F',
    role: 'user',
    lastActive: '4 hours ago',
    libraries: 5,
    minutes: 7840,
  },
];

const ADM_PERM_OVERRIDES = {
  cs: [
    { id: 'c0', accent: 'teal', title: 'Distributed Systems Foundations', level: 'read' },
    { id: 'c4', accent: 'warm', title: 'Compilers from First Principles', level: 'none' },
  ],
  db: [
    {
      id: 'c3',
      accent: 'indigo',
      title: 'Modern PostgreSQL — Performance Deep Dive',
      level: 'read',
    },
  ],
};

// ============================================================================
// Dashboard content
// ============================================================================
const DashboardContent = ({ bp, state }) => {
  if (state === 'loading')
    return (
      <>
        <div className="dash-grid" data-bp={bp}>
          {[0, 1, 2, 3].map((i) => (
            <StatCard key={i} loading />
          ))}
        </div>
        <div className="adm-tbl-h">
          <h3>Recent scans</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 12, padding: '10px 0', alignItems: 'center' }}
            >
              <div className="skel" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <div className="skel" style={{ flex: 1, height: 12 }} />
              <div
                className="skel"
                style={{ width: 80, height: 18, borderRadius: 'var(--radius-pill)' }}
              />
            </div>
          ))}
        </div>
      </>
    );

  if (state === 'error')
    return (
      <div className="adm-error" role="alert">
        <Icon name="alert" size={22} />
        <h3>Couldn't reach the database</h3>
        <p>
          Dashboard metrics are sourced from the CourseShelf API. The service didn't respond within
          5 seconds. Last successful poll: 14:02 today.
        </p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
          <Icon name="refresh" size={12} />
          Retry
        </button>
      </div>
    );

  return (
    <>
      <div className="dash-grid" data-bp={bp}>
        <StatCard
          icon="library"
          label="Libraries"
          num="6"
          meta="1.32 TB total"
          delta="+2 this month"
          deltaDir="up"
        />
        <StatCard
          icon="users"
          label="Users"
          num="42"
          meta="38 active · 4 disabled"
          delta="+5"
          deltaDir="up"
        />
        <StatCard
          icon="refresh"
          label="Last scan"
          num="12 min"
          meta="Computer Science · 2,104 files"
        />
        <StatCard
          icon="alert"
          label="Errors · 24h"
          num="9"
          meta="across 3 libraries"
          isError
          delta="-12"
          deltaDir="down"
        />
      </div>

      <div className="adm-tbl-h">
        <h3>Recent scans</h3>
        <span className="more">View all 47 scans →</span>
      </div>
      <table className="adm-tbl" role="table">
        <thead>
          <tr>
            <th>Library</th>
            <th>Status</th>
            {bp !== 'xs' && <th>Started</th>}
            <th>Duration</th>
            {bp === 'lg' && (
              <>
                <th>Files</th>
                <th>Added</th>
                <th>Errors</th>
              </>
            )}
            {bp === 'md' && <th style={{ textAlign: 'right' }}>Files / +Added</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ADM_RECENT_SCANS.slice(0, bp === 'xs' ? 4 : 6).map((s) => (
            <tr key={s.id} tabIndex={0}>
              <td>
                <div style={{ fontWeight: 500, color: 'var(--text-loud)' }}>{s.library}</div>
                {bp === 'xs' && (
                  <div className="user-email" style={{ marginTop: 2 }}>
                    {s.started}
                  </div>
                )}
              </td>
              <td>
                <StatusPill status={s.status} />
              </td>
              {bp !== 'xs' && <td className="mute">{s.started}</td>}
              <td className="num-cell">{s.duration}</td>
              {bp === 'lg' && (
                <>
                  <td className="num-cell">{s.files.toLocaleString()}</td>
                  <td className="num-cell" style={{ color: 'var(--success)' }}>
                    +{s.added}
                  </td>
                  <td
                    className="num-cell"
                    style={{ color: s.errors > 0 ? 'var(--error)' : 'var(--text-muted)' }}
                  >
                    {s.errors}
                  </td>
                </>
              )}
              {bp === 'md' && (
                <td className="num-cell" style={{ textAlign: 'right' }}>
                  {s.files.toLocaleString()}{' '}
                  <span style={{ color: 'var(--success)' }}>+{s.added}</span>
                </td>
              )}
              <td>
                <Icon name="chevron-right" size={14} style={{ color: 'var(--text-muted)' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

// ============================================================================
// Libraries list
// ============================================================================
const LibrariesContent = ({ bp, state, onAdd }) => {
  if (state === 'empty')
    return (
      <div className="adm-empty">
        <div className="adm-empty-icon">
          <Icon name="library" size={22} />
        </div>
        <h3>No libraries yet</h3>
        <p>
          A library is a folder on disk. CourseShelf scans it for courses and exposes them to your
          users.
        </p>
        <div className="adm-empty-actions">
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <Icon name="plus" size={12} />
            Add library
          </button>
          <button className="btn btn-ghost btn-sm">Read the docs</button>
        </div>
      </div>
    );
  if (state === 'loading')
    return (
      <div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="lib-row" data-bp={bp}>
            <div className="skel" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <div className="skel" style={{ height: 12, width: '80%' }} />
            <div className="skel" style={{ height: 11, width: '90%' }} />
            {bp === 'lg' && <div className="skel" style={{ height: 11, width: 60 }} />}
            {bp !== 'xs' && (
              <div
                className="skel"
                style={{ height: 18, width: 90, borderRadius: 'var(--radius-pill)' }}
              />
            )}
            <div className="skel" style={{ height: 24, width: 60 }} />
          </div>
        ))}
      </div>
    );
  return (
    <div>
      {ADM_LIBRARIES.map((lib) => (
        <LibraryRow key={lib.id} library={lib} bp={bp} />
      ))}
    </div>
  );
};

// ============================================================================
// Library detail
// ============================================================================
const LibraryDetail = ({ bp, state }) => {
  const lib = ADM_LIBRARIES[0];
  return (
    <>
      <div className="adm-page-h">
        <div>
          <div
            className="t-caption"
            style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)' }}
          >
            <Icon name="folder" size={11} /> Libraries ·{' '}
            <span style={{ color: 'var(--text-loud)' }}>{lib.name}</span>
          </div>
          <h2 style={{ marginTop: 4 }}>{lib.name}</h2>
          <div
            className="lib-path"
            style={{ marginTop: 6, display: 'inline-flex' }}
            role="button"
            tabIndex={0}
          >
            <Icon name="copy" size={12} className="copy-icon" />
            <span className="lib-path-text">{lib.path}</span>
          </div>
        </div>
        <div className="adm-page-actions">
          <button className="btn btn-ghost btn-sm">
            <Icon name="edit" size={12} />
            Edit
          </button>
          {state === 'scanning' ? (
            <button className="btn btn-secondary btn-sm" disabled>
              <span
                className="pc-buffer-spinner"
                style={{
                  width: 12,
                  height: 12,
                  borderColor: 'var(--surface-3)',
                  borderTopColor: 'var(--primary)',
                }}
              />
              Scanning…
            </button>
          ) : (
            <button className="btn btn-primary btn-sm">
              <Icon name="refresh" size={12} />
              Scan now
            </button>
          )}
        </div>
      </div>

      <div className="adm-detail-grid" data-bp={bp}>
        <div>
          {state === 'scanning' && (
            <div style={{ marginBottom: 16 }}>
              <ScanProgress status="running" />
            </div>
          )}
          {state === 'error' && (
            <div className="banner banner-error" style={{ marginBottom: 16 }}>
              <Icon name="alert" size={16} />
              <div className="banner-body">
                <div className="banner-title">Last scan failed</div>
                Permission denied at{' '}
                <span className="t-mono">/srv/courses/computer-science/05-databases/.cache</span>.
                Check folder permissions and retry.
              </div>
            </div>
          )}

          <div className="adm-tbl-h">
            <h3>Scan history</h3>
          </div>
          <table className="adm-tbl">
            <thead>
              <tr>
                <th>Status</th>
                <th>Started</th>
                {bp !== 'xs' && <th>Duration</th>}
                {bp === 'lg' && (
                  <>
                    <th>Files</th>
                    <th>Added</th>
                    <th>Errors</th>
                  </>
                )}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ADM_RECENT_SCANS.filter((s) => s.library === lib.name || true)
                .slice(0, 5)
                .map((s) => (
                  <tr key={s.id} tabIndex={0}>
                    <td>
                      <StatusPill status={s.status} />
                    </td>
                    <td className="mute">{s.started}</td>
                    {bp !== 'xs' && <td className="num-cell">{s.duration}</td>}
                    {bp === 'lg' && (
                      <>
                        <td className="num-cell">{s.files.toLocaleString()}</td>
                        <td className="num-cell" style={{ color: 'var(--success)' }}>
                          +{s.added}
                        </td>
                        <td
                          className="num-cell"
                          style={{ color: s.errors > 0 ? 'var(--error)' : 'var(--text-muted)' }}
                        >
                          {s.errors}
                        </td>
                      </>
                    )}
                    <td>
                      <Icon name="chevron-right" size={14} style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {bp === 'lg' && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div className="t-caption">DETAILS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Total size</span>
                  <span className="t-mono">{lib.size}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Courses</span>
                  <span className="t-mono">{lib.courses}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Lessons</span>
                  <span className="t-mono">312</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Last scan</span>
                  <span style={{ fontSize: 13 }}>{lib.lastScan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption t-mute">Auto-scan</span>
                  <span style={{ fontSize: 13 }}>Daily, 03:00</span>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="t-caption">DANGER ZONE</div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: 10, color: 'var(--error)' }}
              >
                <Icon name="trash" size={12} />
                Remove library
              </button>
              <p className="t-caption t-mute" style={{ marginTop: 8 }}>
                This unlinks the folder from CourseShelf. Files on disk are not deleted.
              </p>
            </div>
          </aside>
        )}
      </div>
    </>
  );
};

// ============================================================================
// Users content
// ============================================================================
const UsersContent = ({ bp, state }) => {
  if (state === 'loading')
    return (
      <div className="user-list">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="user-row" data-bp={bp}>
            <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div className="skel" style={{ height: 12, width: '70%' }} />
            {bp === 'lg' && <div className="skel" style={{ height: 11, width: '60%' }} />}
            <div
              className="skel"
              style={{ height: 20, width: 60, borderRadius: 'var(--radius-pill)' }}
            />
            <div className="skel" style={{ height: 11, width: 80 }} />
            <div className="skel" style={{ height: 24, width: 48 }} />
          </div>
        ))}
      </div>
    );
  return (
    <div className="user-list">
      {bp !== 'xs' && (
        <div
          className="user-row"
          data-bp={bp}
          style={{
            padding: '10px 14px',
            background: 'var(--surface-2)',
            cursor: 'default',
            textTransform: 'uppercase',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          <span />
          <span>User</span>
          {bp === 'lg' && <span>Activity</span>}
          <span>Role</span>
          <span>Last active</span>
          <span />
        </div>
      )}
      {ADM_USERS.map((u) => (
        <UserRow key={u.id} user={u} bp={bp} onChangeRole={() => {}} />
      ))}
    </div>
  );
};

// ============================================================================
// Permissions content
// ============================================================================
const PermissionsContent = ({ bp, state, onAddGrant }) => {
  const [levels, setLevels] = useStateScreens({
    cs: 'read',
    art: 'none',
    db: 'read',
    math: 'read',
    prod: 'none',
    tools: 'read',
  });
  const target = ADM_USERS[1]; // Marco Bucci

  if (state === 'empty')
    return (
      <>
        <div className="perm-h">
          <div className="avatar avatar-lg" style={{ background: target.avatarBg }}>
            {target.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="perm-h-name">{target.name}</div>
            <div className="perm-h-email">{target.email}</div>
          </div>
          <RoleChip role={target.role} onChange={() => {}} />
        </div>
        <div className="adm-empty">
          <div className="adm-empty-icon">
            <Icon name="key" size={22} />
          </div>
          <h3>{target.name} has no library access</h3>
          <p>
            Grant access to a library to let this user see its courses on their shelf. Course-level
            overrides can fine-tune what they see.
          </p>
          <div className="adm-empty-actions">
            <button className="btn btn-primary btn-sm" onClick={onAddGrant}>
              <Icon name="plus" size={12} />
              Add grant
            </button>
          </div>
        </div>
      </>
    );

  return (
    <>
      <div className="perm-h">
        <div className="avatar avatar-lg" style={{ background: target.avatarBg }}>
          {target.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div className="perm-h-name">{target.name}</div>
          <div className="perm-h-email">
            {target.email} · last active {target.lastActive}
          </div>
        </div>
        <RoleChip role={target.role} onChange={() => {}} />
        <button className="btn btn-primary btn-sm" onClick={onAddGrant}>
          <Icon name="plus" size={12} />
          Add grant
        </button>
      </div>

      <div className="banner banner-info" style={{ marginBottom: 16 }}>
        <Icon name="info" size={14} />
        <div className="banner-body">
          Library grants set the baseline. Per-course overrides take precedence and are evaluated
          last.
        </div>
      </div>

      <div className="perm-tbl">
        {ADM_LIBRARIES.map((lib) => (
          <PermissionRow
            key={lib.id}
            library={lib}
            bp={bp}
            level={levels[lib.id]}
            overrides={ADM_PERM_OVERRIDES[lib.id]}
            onChangeLevel={(id, lvl) => setLevels({ ...levels, [id]: lvl })}
          />
        ))}
      </div>
    </>
  );
};

window.DashboardContent = DashboardContent;
window.LibrariesContent = LibrariesContent;
window.LibraryDetail = LibraryDetail;
window.UsersContent = UsersContent;
window.PermissionsContent = PermissionsContent;
window.ADM_LIBRARIES = ADM_LIBRARIES;
window.ADM_USERS = ADM_USERS;
