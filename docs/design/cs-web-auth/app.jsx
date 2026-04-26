const { useState } = React;

const Frame = ({ url, children }) => (
  <div className="auth-frame">
    <div className="auth-frame-h">
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
      <div className="url">{url}</div>
      <div style={{ width: 30 }} />
    </div>
    {children}
  </div>
);

const Split = ({ variant, form }) => (
  <div className="auth-page" style={{ minHeight: 720 }}>
    <div className="auth-pane">
      <AuthBrand />
      {form}
      <div className="auth-meta-foot">
        <span>© 2026 CourseShelf</span>
        <span>
          <a>Status</a> · <a>Docs</a> · <a>Self-host guide</a>
        </span>
      </div>
    </div>
    <AuthMarketing variant={variant} />
  </div>
);

const App = () => {
  useMode('dark');
  const [tab, setTab] = useState('sign-in');
  return (
    <div className="auth-stage" data-screen-label="cs-web-auth">
      <div style={{ marginBottom: 24 }}>
        <div className="t-caption t-mono">CS-WEB-AUTH</div>
        <h1 className="t-display" style={{ margin: '4px 0 0' }}>
          Auth flows · web
        </h1>
        <p className="t-mute" style={{ margin: '8px 0 0', maxWidth: '68ch' }}>
          Split-screen — form on the left, calm marketing pane on the right that reinforces the
          self-hosted promise. Same shell across sign-in, sign-up steps, and recovery.
        </p>
      </div>
      <div className="auth-tabs">
        {[
          ['sign-in', 'Sign in'],
          ['sign-in-error', 'Sign in · error'],
          ['sign-up-1', 'Sign up · 1 Account'],
          ['sign-up-2', 'Sign up · 2 Verify'],
          ['sign-up-3', 'Sign up · 3 Library'],
          ['forgot-1', 'Forgot · request'],
          ['forgot-2', 'Forgot · sent'],
          ['forgot-3', 'Forgot · new password'],
        ].map(([k, l]) => (
          <button key={k} aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>
      <Frame url={`courseshelf.local/${tab.replace(/-\d$/, '').replace('-error', '')}`}>
        {tab === 'sign-in' && <Split variant="sign-in" form={<SignInForm />} />}
        {tab === 'sign-in-error' && (
          <Split
            variant="sign-in"
            form={
              <SignInForm error="That email and password don't match. Try again, or reset your password." />
            }
          />
        )}
        {tab === 'sign-up-1' && <Split variant="sign-up" form={<SignUpForm step={1} />} />}
        {tab === 'sign-up-2' && <Split variant="sign-up" form={<SignUpForm step={2} />} />}
        {tab === 'sign-up-3' && <Split variant="sign-up" form={<SignUpForm step={3} />} />}
        {tab === 'forgot-1' && <Split variant="forgot" form={<ForgotForm step={1} />} />}
        {tab === 'forgot-2' && <Split variant="forgot" form={<ForgotForm step={2} />} />}
        {tab === 'forgot-3' && <Split variant="forgot" form={<ForgotForm step={3} />} />}
      </Frame>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
