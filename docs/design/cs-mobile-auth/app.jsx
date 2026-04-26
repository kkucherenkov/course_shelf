const App = () => {
  useMode('dark');
  document.documentElement.setAttribute('data-density', 'compact');
  const PhoneScreen = ({ children, back = true }) => (
    <div className="mobile-auth">
      {back && (
        <a className="mobile-auth-back">
          <Icon name="chevron-left" size={14} />
          Back
        </a>
      )}
      <AuthBrand />
      {children}
    </div>
  );
  return (
    <div data-screen-label="cs-mobile-auth" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div className="t-caption t-mono">CS-MOBILE-AUTH</div>
        <h1 className="t-display" style={{ margin: '4px 0 0' }}>
          Auth flows · mobile
        </h1>
        <p className="t-mute" style={{ margin: '8px 0 24px', maxWidth: '68ch' }}>
          Single-pane forms, larger inputs (44px hit targets), large titles, sticky primary action.
        </p>
        <div className="mobile-stage">
          <Phone label="SIGN IN" noTabbar>
            <PhoneScreen back={false}>
              <SignInForm />
            </PhoneScreen>
          </Phone>
          <Phone label="SIGN UP · ACCOUNT" noTabbar>
            <PhoneScreen>
              <SignUpForm step={1} />
            </PhoneScreen>
          </Phone>
          <Phone label="SIGN UP · VERIFY" noTabbar>
            <PhoneScreen>
              <SignUpForm step={2} />
            </PhoneScreen>
          </Phone>
          <Phone label="SIGN UP · LIBRARY" noTabbar>
            <PhoneScreen>
              <SignUpForm step={3} />
            </PhoneScreen>
          </Phone>
          <Phone label="FORGOT" noTabbar>
            <PhoneScreen>
              <ForgotForm step={1} />
            </PhoneScreen>
          </Phone>
          <Phone label="FORGOT · SENT" noTabbar>
            <PhoneScreen>
              <ForgotForm step={2} />
            </PhoneScreen>
          </Phone>
          <Phone label="FORGOT · NEW PASSWORD" noTabbar>
            <PhoneScreen>
              <ForgotForm step={3} />
            </PhoneScreen>
          </Phone>
        </div>
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
