export default {
  layouts: {
    default: {
      appName: 'Course Shelf',
      navHome: 'Home',
      navLogin: 'Login',
      navSignOut: 'Sign out',
    },
  },
  pages: {
    home: {
      title: 'Welcome to Course Shelf',
    },
    login: {
      title: 'Sign in',
      subtitle: 'Enter your email and password to continue.',
      emailLabel: 'Email',
      emailHint: 'Your registered email address.',
      passwordLabel: 'Password',
      passwordHint: 'At least 8 characters.',
      signInButton: 'Sign in',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up',
      legalFootnote: 'By continuing, you agree to our Terms and Privacy Policy.',
      errorEmailInvalid: 'Please enter a valid email address.',
      errorPasswordTooShort: 'Password must be at least 8 characters.',
      errorCredentials: 'Incorrect email or password. Please try again.',
      errorGeneric: 'Something went wrong. Please try again.',
    },
  },
} as const;
