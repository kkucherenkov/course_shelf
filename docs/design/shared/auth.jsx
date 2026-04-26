// Shared auth-form pieces — used by web split-screen and mobile single-pane variants
const { useState } = React;

const AuthBrand = () => (
  <div className="auth-brand">
    <div className="auth-brand-mark">CS</div>
    <div className="auth-brand-name">CourseShelf</div>
  </div>
);

const AuthMarketing = ({ variant = 'general' }) => {
  const facts = {
    'sign-in': [
      ['library', 'Your shelf, anywhere', 'Continue from any browser, phone, or living-room TV — progress syncs over your own server.'],
      ['cloud-down', 'Watch offline', 'Pin courses to your phone before a flight; finish them on the train.'],
      ['lock', 'Your data stays here', 'Self-hosted by design. No telemetry, no third-party sign-ins by default.'],
    ],
    'sign-up': [
      ['folder', 'Bring your own folder', 'Point CourseShelf at a directory of MP4s and PDFs — it organises the rest.'],
      ['users', 'Invite your team', 'One library, many seats. Permissions per library, not per course.'],
      ['check', 'Free for self-hosters', 'No license tiers, no seat fees. Pay if you use the hosted version.'],
    ],
    'forgot': [
      ['lock', 'Recovery, not lockout', 'A reset link is emailed to the address on file. Links expire after 60 minutes.'],
      ['users', 'Or ask an admin', 'On a team server, your admin can issue a reset from the Users console.'],
    ],
    'general': [
      ['library', 'A self-hosted home for your courses', 'Built for the folder of MP4s and PDFs you already own.'],
    ],
  }[variant] || [];
  const titles = {
    'sign-in': 'Pick up exactly where you left off — quorum reads, lesson 12, 11:42.',
    'sign-up': 'Start with the courses you already have. Add the rest later.',
    'forgot': 'Reset is a single email away. We never store your password in plaintext.',
    'general': 'A self-hosted home for technical courses.',
  };
  return (
    <div className="auth-side">
      <div style={{position:'relative', display:'flex', flexDirection:'column', gap:24}}>
        <div className="t-caption t-mono">COURSESHELF · v0.1</div>
        <div className="auth-side-title">{titles[variant]}</div>
      </div>
      <div className="auth-fact-list">
        {facts.map(([icon, t, b]) => (
          <div key={t} className="auth-fact">
            <div className="auth-fact-icon"><Icon name={icon} size={14}/></div>
            <div className="auth-fact-body"><strong>{t}</strong><p>{b}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PasswordField = ({ label = 'Password', value, onChange, withMeter = false, autoComplete = 'current-password', hint }) => {
  const [show, setShow] = useState(false);
  const score = !value ? 0 : value.length < 8 ? 1 : value.length < 12 ? 2 : (/[^a-z0-9]/i.test(value) || value.length > 16) ? 3 : 2;
  const label3 = ['Empty', 'Weak', 'Okay', 'Strong'][score];
  return (
    <div className="auth-field">
      <label>{label}</label>
      <div className="input-with-icon" style={{position:'relative'}}>
        <Icon name="lock" size={14}/>
        <input className="input" type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} placeholder="••••••••••"/>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setShow(s => !s)} style={{position:'absolute', right:4, top:4}} aria-label={show ? 'Hide password' : 'Show password'}>
          <Icon name={show ? 'eye-off' : 'eye'} size={14}/>
        </button>
      </div>
      {withMeter && (<>
        <div className="pw-meter">
          {[1,2,3].map(i => <div key={i} className="pw-meter-seg" data-on={score >= i ? score : 0}/>)}
        </div>
        <div className="pw-meter-label">{label3} · 12+ chars w/ a symbol = strong</div>
      </>)}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
};

const SsoBlock = () => (
  <div className="auth-sso">
    <button className="btn btn-secondary"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.91h5.27c-.23 1.45-.94 2.68-2.01 3.5v2.9h3.25c1.9-1.75 3-4.32 3-7.39 0-.71-.06-1.4-.18-2.06-.05-.29-.11-.58-.16-.86z"/><path d="M12.18 21c2.7 0 4.97-.9 6.62-2.43l-3.25-2.5c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.75-5.59-4.1H3.27v2.58A9 9 0 0012.18 21z"/><path d="M6.59 12.93a5.4 5.4 0 010-3.46V6.89H3.27a9 9 0 000 8.62l3.32-2.58z"/><path d="M12.18 5.4c1.46 0 2.78.5 3.81 1.49l2.85-2.85A9 9 0 0012.18 1a9 9 0 00-8.91 5.89l3.32 2.58c.79-2.35 2.99-4.07 5.59-4.07z"/></svg>Continue with Google</button>
    <button className="btn btn-secondary"><Icon name="github" size={14}/>Continue with GitHub</button>
    <button className="btn btn-secondary"><Icon name="key" size={14}/>Single sign-on</button>
  </div>
);

// Sign-in form (controlled, with realistic error state via prop)
const SignInForm = ({ error = null }) => {
  const [email, setEmail] = useState('elena.lin@coursehelf.local');
  const [pw, setPw] = useState('');
  return (
    <form className="auth-form-wrap" onSubmit={e => e.preventDefault()}>
      <div className="auth-eyebrow">SIGN IN</div>
      <h1 className="auth-h1">Welcome back.</h1>
      <p className="auth-sub">Sign in to continue with the courses on your shelf.</p>

      <div className="auth-field">
        <label>Email</label>
        <div className="input-with-icon"><Icon name="at" size={14}/><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
      </div>

      <PasswordField value={pw} onChange={setPw}/>

      {error && <div className="banner banner-error" style={{marginBottom:16}}><Icon name="alert" size={14}/><span>{error}</span></div>}

      <div className="auth-row">
        <label className="auth-checkbox"><input type="checkbox" defaultChecked/> Keep me signed in</label>
        <a className="link">Forgot password?</a>
      </div>

      <button className="btn btn-primary auth-submit" type="submit">Sign in<Icon name="arrow-right" size={14}/></button>

      <div className="auth-divider">or</div>
      <SsoBlock/>

      <div className="auth-foot">New to CourseShelf? <a>Create an account</a></div>
    </form>
  );
};

const SignUpForm = ({ step = 1 }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('CourseShelf-2026!');
  return (
    <form className="auth-form-wrap" onSubmit={e=>e.preventDefault()}>
      <div className="auth-stepper">
        <div className="auth-step" data-state={step >= 1 ? (step === 1 ? 'current':'done') : ''}><div className="auth-step-num">{step > 1 ? <Icon name="check" size={10}/> : '1'}</div>Account</div>
        <div className="auth-step-line"/>
        <div className="auth-step" data-state={step === 2 ? 'current' : step > 2 ? 'done' : ''}><div className="auth-step-num">{step > 2 ? <Icon name="check" size={10}/> : '2'}</div>Verify</div>
        <div className="auth-step-line"/>
        <div className="auth-step" data-state={step === 3 ? 'current' : ''}><div className="auth-step-num">3</div>Library</div>
      </div>

      {step === 1 && <>
        <h1 className="auth-h1">Create your account.</h1>
        <p className="auth-sub">Free for self-hosters. No credit card.</p>
        <div className="auth-field">
          <label>Full name</label>
          <div className="input-with-icon"><Icon name="user" size={14}/><input className="input" placeholder="Elena Lin" value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></div>
        </div>
        <div className="auth-field">
          <label>Work email</label>
          <div className="input-with-icon"><Icon name="at" size={14}/><input className="input" type="email" placeholder="you@team.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
        </div>
        <PasswordField value={pw} onChange={setPw} withMeter autoComplete="new-password"/>

        <label className="auth-checkbox" style={{marginTop:16, fontSize:12, color:'var(--text-muted)'}}>
          <input type="checkbox" defaultChecked/>
          <span>I agree to the <a className="link">Terms</a> and <a className="link">Privacy</a>.</span>
        </label>
        <button className="btn btn-primary auth-submit" style={{marginTop:20}}>Continue<Icon name="arrow-right" size={14}/></button>
      </>}

      {step === 2 && <>
        <h1 className="auth-h1">Check your email.</h1>
        <p className="auth-sub">We sent a 6-digit code to <strong style={{color:'var(--text-loud)'}}>elena.lin@team.com</strong>. It expires in 10 minutes.</p>
        <div className="code-input">
          {['4','9','2','7'].map((d,i) => <input key={i} defaultValue={d} maxLength={1} inputMode="numeric"/>)}
          <input maxLength={1} inputMode="numeric" autoFocus/>
          <input maxLength={1} inputMode="numeric"/>
        </div>
        <div className="t-caption t-mute" style={{textAlign:'center'}}>Didn't get it? <a className="link">Resend in 0:24</a></div>
        <button className="btn btn-primary auth-submit" style={{marginTop:20}}>Verify & continue<Icon name="arrow-right" size={14}/></button>
        <div className="auth-foot">Wrong address? <a>Edit email</a></div>
      </>}

      {step === 3 && <>
        <h1 className="auth-h1">Point at your courses.</h1>
        <p className="auth-sub">Tell CourseShelf where your videos live. You can add more libraries later.</p>
        <div className="auth-field">
          <label>Library name</label>
          <div className="input-with-icon"><Icon name="library" size={14}/><input className="input" defaultValue="Computer Science"/></div>
        </div>
        <div className="auth-field">
          <label>Path on this server</label>
          <div className="input-with-icon"><Icon name="folder" size={14}/><input className="input" defaultValue="/srv/courses/cs" style={{fontFamily:'var(--font-mono)'}}/></div>
          <div className="hint">Looks scannable · 2,104 files detected</div>
        </div>
        <div className="auth-field">
          <label>Cover-art strategy</label>
          <select className="input" style={{height:40}}>
            <option>Auto-generate from initials</option>
            <option>Use first frame of intro</option>
            <option>Skip for now</option>
          </select>
        </div>
        <button className="btn btn-primary auth-submit" style={{marginTop:8}}>Scan & finish<Icon name="arrow-right" size={14}/></button>
        <div className="auth-foot"><a>Skip — I'll do this later</a></div>
      </>}

      {step === 1 && <>
        <div className="auth-divider">or</div>
        <SsoBlock/>
        <div className="auth-foot">Already have an account? <a>Sign in</a></div>
      </>}
    </form>
  );
};

const ForgotForm = ({ step = 1 }) => {
  return (
    <form className="auth-form-wrap" onSubmit={e=>e.preventDefault()}>
      {step === 1 && <>
        <div className="auth-eyebrow">PASSWORD RESET</div>
        <h1 className="auth-h1">Forgot your password?</h1>
        <p className="auth-sub">Enter the email on your account and we'll send a reset link. Links expire after 60 minutes.</p>
        <div className="auth-field">
          <label>Email</label>
          <div className="input-with-icon"><Icon name="at" size={14}/><input className="input" type="email" defaultValue="elena.lin@team.com" autoComplete="email"/></div>
        </div>
        <button className="btn btn-primary auth-submit">Send reset link<Icon name="arrow-right" size={14}/></button>
        <div className="auth-foot">Remembered it? <a>Back to sign in</a></div>
      </>}
      {step === 2 && <>
        <div style={{width:48, height:48, borderRadius:'50%', background:'var(--success-soft)', color:'var(--success)', display:'grid', placeItems:'center', marginBottom:16}}>
          <Icon name="check" size={22}/>
        </div>
        <h1 className="auth-h1">Check your email.</h1>
        <p className="auth-sub">If <strong style={{color:'var(--text-loud)'}}>elena.lin@team.com</strong> matches an account, a reset link is on the way. Didn't get it? Check spam, or wait 60s and request again.</p>
        <button className="btn btn-secondary auth-submit" style={{marginTop:8}}>Open mail app</button>
        <div className="auth-foot"><a>← Back to sign in</a></div>
      </>}
      {step === 3 && <>
        <div className="auth-eyebrow">SET A NEW PASSWORD</div>
        <h1 className="auth-h1">Welcome back, Elena.</h1>
        <p className="auth-sub">Pick something you'll remember — but not too easy.</p>
        <PasswordField label="New password" value="StrongerThis-Time!" onChange={()=>{}} withMeter autoComplete="new-password"/>
        <PasswordField label="Confirm new password" value="StrongerThis-Time!" onChange={()=>{}} autoComplete="new-password"/>
        <button className="btn btn-primary auth-submit" style={{marginTop:8}}>Update password & sign in<Icon name="arrow-right" size={14}/></button>
      </>}
    </form>
  );
};

Object.assign(window, { AuthBrand, AuthMarketing, PasswordField, SignInForm, SignUpForm, ForgotForm, SsoBlock });
