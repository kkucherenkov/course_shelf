// cs-web-browse-search · Browse + Search screens
// New for cs-web-browse-search: FilterPanel, FilterSheet, SearchResultGroup, SearchOverlay,
// BrowseFrame — могут вынести в cs-components/ позже.
// New icon: sliders, arrow-left — adopted into shared/icons.jsx in cs-web-browse-search.

const { useState, useMemo } = React;

// ============================================================================
// Mock data — derived from shared COURSES, expanded with library + lesson counts
// ============================================================================
const LIBRARIES = [
  { id: 'cs', name: 'Computer Science', count: 14 },
  { id: 'art', name: 'Art', count: 7 },
  { id: 'db', name: 'Databases', count: 5 },
  { id: 'math', name: 'Mathematics', count: 4 },
  { id: 'prod', name: 'Production', count: 6 },
  { id: 'tools', name: 'Tooling', count: 9 },
];
const INSTRUCTORS = [
  { id: 'kleppmann', name: 'Martin Kleppmann', count: 2 },
  { id: 'bucci', name: 'Marco Bucci', count: 4 },
  { id: 'fittl', name: 'Lukas Fittl', count: 3 },
  { id: 'eidt', name: 'Erik Eidt', count: 1 },
  { id: 'belkin', name: 'Mikhail Belkin', count: 2 },
  { id: 'nelson', name: 'Marc Daniel Nelson', count: 1 },
  { id: 'neil', name: 'Drew Neil', count: 1 },
  { id: 'mason', name: 'Anna Mason', count: 5 },
];
const SEARCH_LESSON_RESULTS = [
  { id: 'L1', title: 'Leaderless replication & quorums', course: 'Distributed Systems Foundations', section: 'Section 03 · Replication', accent: 'teal',
    duration: 26*60+18, snippet: 'A <mark>quorum</mark> read with R+W>N guarantees you see the latest write — when the network cooperates.' },
  { id: 'L2', title: 'Single-leader replication', course: 'Distributed Systems Foundations', section: 'Section 03 · Replication', accent: 'teal',
    duration: 18*60+24, snippet: 'Sloppy <mark>quorums</mark> trade durability for availability during partitions.' },
  { id: 'L3', title: 'Read repair and anti-entropy', course: 'Distributed Systems Foundations', section: 'Section 04 · Consistency', accent: 'teal',
    duration: 22*60+45, snippet: 'When <mark>quorum</mark> reads detect a stale replica, the coordinator writes back the fresh value.' },
  { id: 'L4', title: 'Indexes and quorum reads in Postgres', course: 'Modern PostgreSQL — Performance Deep Dive', section: 'Section 06 · Replication', accent: 'indigo',
    duration: 19*60+10, snippet: 'Logical replication slots can power <mark>quorum</mark>-style read distribution across replicas.' },
];

// ============================================================================
// FilterPanel — collapsible facet groups; checkbox + radio + searchable
// ============================================================================
const FilterPanel = ({ values, onChange, instructorSearch = false }) => {
  const [open, setOpen] = useState({ status: true, library: true, duration: true, instructor: true });
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const setVal = (k, v) => onChange({ ...values, [k]: v });
  const toggleArr = (k, item) => {
    const arr = values[k] || [];
    setVal(k, arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };
  const [iSearch, setISearch] = useState('');
  const filteredInstructors = INSTRUCTORS.filter(i => !iSearch || i.name.toLowerCase().includes(iSearch.toLowerCase()));

  return (
    <div className="fp" role="group" aria-label="Filters">
      <div className="fp-section" data-open={open.status}>
        <div className="fp-section-h" onClick={() => toggle('status')} role="button" tabIndex={0} aria-expanded={open.status}>
          <h4>Status</h4><Icon name="chevron-down" size={14} className="chev"/>
        </div>
        <div className="fp-options">
          {[['not-started','Not started','152'],['in-progress','In progress','38'],['completed','Completed','61']].map(([k,l,c]) => (
            <label key={k} className="fp-opt">
              <input type="checkbox" checked={(values.status||[]).includes(k)} onChange={() => toggleArr('status', k)}/>
              <span className="fp-opt-label">{l}</span>
              <span className="fp-opt-count">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="fp-section" data-open={open.library}>
        <div className="fp-section-h" onClick={() => toggle('library')} role="button" tabIndex={0} aria-expanded={open.library}>
          <h4>Library</h4><Icon name="chevron-down" size={14} className="chev"/>
        </div>
        <div className="fp-options">
          {LIBRARIES.map(lib => (
            <label key={lib.id} className="fp-opt">
              <input type="checkbox" checked={(values.library||[]).includes(lib.id)} onChange={() => toggleArr('library', lib.id)}/>
              <span className="fp-opt-label">{lib.name}</span>
              <span className="fp-opt-count">{lib.count}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="fp-section" data-open={open.duration}>
        <div className="fp-section-h" onClick={() => toggle('duration')} role="button" tabIndex={0} aria-expanded={open.duration}>
          <h4>Duration</h4><Icon name="chevron-down" size={14} className="chev"/>
        </div>
        <div className="fp-options">
          {[['lt5','Under 5 hours','12'],['5to10','5–10 hours','21'],['10to20','10–20 hours','14'],['gt20','Over 20 hours','4']].map(([k,l,c]) => (
            <label key={k} className="fp-opt">
              <input type="checkbox" checked={(values.duration||[]).includes(k)} onChange={() => toggleArr('duration', k)}/>
              <span className="fp-opt-label">{l}</span>
              <span className="fp-opt-count">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="fp-section" data-open={open.instructor}>
        <div className="fp-section-h" onClick={() => toggle('instructor')} role="button" tabIndex={0} aria-expanded={open.instructor}>
          <h4>Instructor</h4><Icon name="chevron-down" size={14} className="chev"/>
        </div>
        {instructorSearch && (
          <div className="fp-search">
            <div className="input-with-icon">
              <Icon name="search" size={12}/>
              <input className="input" placeholder="Find instructor…" value={iSearch} onChange={e => setISearch(e.target.value)}/>
            </div>
          </div>
        )}
        <div className="fp-options">
          {filteredInstructors.slice(0, 8).map(i => (
            <label key={i.id} className="fp-opt">
              <input type="checkbox" checked={(values.instructor||[]).includes(i.id)} onChange={() => toggleArr('instructor', i.id)}/>
              <span className="fp-opt-label">{i.name}</span>
              <span className="fp-opt-count">{i.count}</span>
            </label>
          ))}
          {filteredInstructors.length > 8 && (
            <button className="btn btn-ghost btn-sm" style={{justifyContent:'flex-start', marginTop:4}}>Show all {filteredInstructors.length}</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FilterSheet — bottom sheet variant for xs
// ============================================================================
const FilterSheet = ({ values, onChange, onClose, onApply, onClear }) => (
  <div className="bs-sheet-backdrop" onClick={onClose}>
    <div className="bs-sheet" onClick={e => e.stopPropagation()}>
      <div className="bs-sheet-handle"/>
      <div className="bs-sheet-h">
        <h3>Filters</h3>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={16}/></button>
      </div>
      <div className="bs-sheet-body">
        <FilterPanel values={values} onChange={onChange}/>
      </div>
      <div className="bs-sheet-foot">
        <button className="btn btn-secondary" onClick={onClear}>Clear all</button>
        <button className="btn btn-primary" onClick={onApply}>Show 84 courses</button>
      </div>
    </div>
  </div>
);

// ============================================================================
// SearchResultItem + SearchResultGroup
// ============================================================================
const Highlight = ({ children }) => <span dangerouslySetInnerHTML={{__html: children}}/>;

const CourseSearchItem = ({ course, snippet }) => (
  <div className="sr-item" tabIndex={0} role="link">
    <div className="sr-thumb" style={{background: COVER[course.accent] || course.cover}}>
      <span className="sr-thumb-glyph">{initials(course.title)}</span>
    </div>
    <div className="sr-body">
      <div className="sr-title"><Highlight>{course.title.replace(/(quorum|postgres|color|distributed|systems)/i, m => `<mark>${m}</mark>`)}</Highlight></div>
      <div className="sr-context">
        <span>{course.instructor}</span>
        <span className="sep">·</span>
        <span>{course.library}</span>
        <span className="sep">·</span>
        <span className="t-mono">{fmtDuration(course.duration)}</span>
      </div>
      {snippet && <div className="sr-snippet"><Highlight>{snippet}</Highlight></div>}
    </div>
    <div className="sr-trail">{course.completed}/{course.lessons}<br/>lessons</div>
  </div>
);

const LessonSearchItem = ({ lesson }) => (
  <div className="sr-item" tabIndex={0} role="link">
    <div className="sr-thumb" style={{background: COVER[lesson.accent]}}>
      <span className="sr-thumb-glyph">{initials(lesson.course)}</span>
      <div className="sr-thumb-overlay"/>
      <Icon name="play" size={14} fill className="sr-thumb-play"/>
    </div>
    <div className="sr-body">
      <div className="sr-title"><Highlight>{lesson.title}</Highlight></div>
      <div className="sr-context">
        <Icon name="play" size={10}/>
        <span>{lesson.course}</span>
        <span className="sep">·</span>
        <span>{lesson.section}</span>
      </div>
      <div className="sr-snippet"><Highlight>{lesson.snippet}</Highlight></div>
    </div>
    <div className="sr-trail">{fmtTime(lesson.duration)}</div>
  </div>
);

const SearchResultGroup = ({ kind, count, children }) => (
  <div className="sr-group">
    <div className="sr-group-h">
      <h3>{kind}</h3><span className="count">{count}</span>
      {count > 4 && <span className="more">View all {count} →</span>}
    </div>
    <div className="sr-list">{children}</div>
  </div>
);

const SearchResultSkeleton = () => (
  <div className="sr-list">
    {[0,1,2].map(i => (
      <div key={i} className="sr-item" style={{cursor:'default'}}>
        <div className="skel" style={{width:64, height:48, borderRadius:'var(--radius-sm)'}}/>
        <div className="sr-body">
          <div className="skel" style={{height:14, width: i===0 ? '70%' : i===1 ? '55%' : '62%', marginBottom:6}}/>
          <div className="skel" style={{height:11, width:'40%'}}/>
        </div>
        <div className="skel" style={{height:11, width:36}}/>
      </div>
    ))}
  </div>
);

window.FilterPanel = FilterPanel;
window.FilterSheet = FilterSheet;
window.CourseSearchItem = CourseSearchItem;
window.LessonSearchItem = LessonSearchItem;
window.SearchResultGroup = SearchResultGroup;
window.SearchResultSkeleton = SearchResultSkeleton;
window.LIBRARIES = LIBRARIES;
window.INSTRUCTORS = INSTRUCTORS;
window.SEARCH_LESSON_RESULTS = SEARCH_LESSON_RESULTS;
