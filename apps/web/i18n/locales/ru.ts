export default {
  layouts: {
    default: {
      appName: 'Course Shelf',
      navHome: 'Главная',
      navSignIn: 'Войти',
      navSignOut: 'Выйти',
    },
  },
  pages: {
    home: {
      title: 'Добро пожаловать в Course Shelf',
    },
    signIn: {
      title: 'Войти',
      subtitle: 'Введите email и пароль для входа.',
      emailLabel: 'Email',
      emailHint: 'Ваш зарегистрированный email.',
      passwordLabel: 'Пароль',
      passwordHint: 'Не менее 8 символов.',
      signInButton: 'Войти',
      noAccount: 'Нет аккаунта?',
      signUpLink: 'Зарегистрироваться',
      legalFootnote: 'Продолжая, вы соглашаетесь с условиями и политикой конфиденциальности.',
      errorEmailInvalid: 'Введите корректный email.',
      errorPasswordTooShort: 'Пароль должен содержать не менее 8 символов.',
      errorCredentials: 'Неверный email или пароль. Попробуйте ещё раз.',
      errorGeneric: 'Что-то пошло не так. Попробуйте ещё раз.',
    },
    setup: {
      title: 'Создать администратора',
      subtitle:
        'Пользователей пока нет. Учётная запись, которую вы создадите здесь, станет первым администратором.',
      emailLabel: 'Email',
      emailHint: 'Используется для входа.',
      passwordLabel: 'Пароль',
      passwordHint: 'Не менее 8 символов.',
      displayNameLabel: 'Отображаемое имя',
      displayNameHint: "Необязательно — по умолчанию используется часть email до {'@'}.",
      submitButton: 'Создать администратора',
      legalFootnote: 'Продолжая, вы соглашаетесь с условиями и политикой конфиденциальности.',
      errorGeneric: 'Не удалось создать администратора. Попробуйте ещё раз.',
    },
  },
} as const;
