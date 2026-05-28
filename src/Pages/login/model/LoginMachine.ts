import { assign, createMachine, fromPromise } from 'xstate';
import { loginUser, registerUser } from '../../../Shared/model/api/AuthApi';

export type AuthMode = 'login' | 'register';

type LoginContext = {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  error: string;
  accessToken: string;
  refreshToken: string;
  sessionName: string;
  isGuest: boolean;
  avatarDataUrl: string | null;
  expiresAt: string;
};

type LoginEvent =
  | { type: 'SUBMIT'; mode: AuthMode; email: string; password: string; name: string }
  | { type: 'RETRY' };

type LoginInput = {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
};

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  avatarDataUrl: string | null;
  expiresAt: string;
};

const initialContext: LoginContext = {
  mode: 'login',
  email: '',
  password: '',
  name: '',
  error: '',
  accessToken: '',
  refreshToken: '',
  sessionName: '',
  isGuest: false,
  avatarDataUrl: null,
  expiresAt: '',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить запрос.';
}

function validateInput({ mode, email, password, name }: LoginInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    throw new Error('Введите корректный email.');
  }

  if (password.trim().length < 6) {
    throw new Error('Пароль должен быть не короче 6 символов.');
  }

  if (mode === 'register' && normalizedName.length < 2) {
    throw new Error('Введите имя для аккаунта.');
  }

  return {
    mode,
    email: normalizedEmail,
    password,
    name: normalizedName,
  };
}

export const loginMachine = createMachine(
  {
    types: {} as {
      context: LoginContext;
      events: LoginEvent;
    },
    id: 'login',
    initial: 'idle',
    context: initialContext,

    states: {
      idle: {
        on: {
          SUBMIT: {
            target: 'loading',
            actions: assign({
              mode: ({ event }) => event.mode,
              email: ({ event }) => event.email.trim(),
              password: ({ event }) => event.password,
              name: ({ event }) => event.name.trim(),
              error: () => '',
              accessToken: () => '',
              refreshToken: () => '',
              sessionName: () => '',
              isGuest: () => false,
              avatarDataUrl: () => null,
              expiresAt: () => '',
            }),
          },
        },
      },

      loading: {
        invoke: {
          src: 'submitForm',
          input: ({ context }) => ({
            mode: context.mode,
            email: context.email,
            password: context.password,
            name: context.name,
          }),
          onDone: {
            target: 'success',
            actions: assign({
              accessToken: ({ event }) => event.output.accessToken,
              refreshToken: ({ event }) => event.output.refreshToken,
              email: ({ event }) => event.output.email,
              sessionName: ({ event }) => event.output.name,
              isGuest: () => false,
              avatarDataUrl: ({ event }) => event.output.avatarDataUrl,
              expiresAt: ({ event }) => event.output.expiresAt,
              error: () => '',
            }),
          },
          onError: {
            target: 'error',
            actions: assign({
              error: ({ event }) => getErrorMessage(event.error),
              accessToken: () => '',
              refreshToken: () => '',
              sessionName: () => '',
              isGuest: () => false,
              avatarDataUrl: () => null,
              expiresAt: () => '',
            }),
          },
        },
      },

      success: {
        type: 'final',
      },

      error: {
        on: {
          RETRY: {
            target: 'idle',
            actions: assign({
              error: () => '',
            }),
          },
          SUBMIT: {
            target: 'loading',
            actions: assign({
              mode: ({ event }) => event.mode,
              email: ({ event }) => event.email.trim(),
              password: ({ event }) => event.password,
              name: ({ event }) => event.name.trim(),
              error: () => '',
              accessToken: () => '',
              refreshToken: () => '',
              sessionName: () => '',
              isGuest: () => false,
              avatarDataUrl: () => null,
              expiresAt: () => '',
            }),
          },
        },
      },
    },
  },
  {
    actors: {
      submitForm: fromPromise(async ({ input }: { input: LoginInput }): Promise<LoginResult> => {
        const credentials = validateInput(input);

        if (credentials.mode === 'register') {
          return registerUser(credentials.email, credentials.password, credentials.name);
        }

        return loginUser(credentials.email, credentials.password);
      }),
    },
  }
);
