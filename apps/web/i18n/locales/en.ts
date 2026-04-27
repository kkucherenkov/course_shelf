export default {
  layouts: {
    default: {
      appName: 'Course Shelf',
      navHome: 'Home',
      navSignIn: 'Sign in',
      navSignOut: 'Sign out',
    },
  },
  pages: {
    home: {
      title: 'Welcome to Course Shelf',
    },
    signIn: {
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
    setup: {
      title: 'Create administrator',
      subtitle: 'No users exist yet. The account you create here will be the first administrator.',
      emailLabel: 'Email',
      emailHint: 'Used for sign-in.',
      passwordLabel: 'Password',
      passwordHint: 'At least 8 characters.',
      displayNameLabel: 'Display name',
      displayNameHint: "Optional — defaults to the part of the email before {'@'}.",
      submitButton: 'Create administrator',
      legalFootnote: 'By continuing, you agree to our Terms and Privacy Policy.',
      errorGeneric: 'Could not create the administrator. Please try again.',
    },
  },
} as const;
