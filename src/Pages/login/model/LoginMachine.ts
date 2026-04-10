import { assign, createMachine, fromPromise } from 'xstate';
import { loginUser } from '../../../Shared/model/api/AuthApi';

type LoginContext = {
  email: string;
  password: string;
  error: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type LoginEvent =
  | { type: 'SUBMIT'; email: string; password: string }
  | { type: 'RETRY' };

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: string;
};

const initialContext: LoginContext = {
  email: '',
  password: '',
  error: '',
  accessToken: '',
  refreshToken: '',
  expiresAt: '',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить вход.';
}

function validateLoginInput({ email, password }: LoginInput) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    throw new Error('Введите корректный email.');
  }

  if (password.trim().length < 6) {
    throw new Error('Пароль должен быть не короче 6 символов.');
  }

  return {
    email: normalizedEmail,
    password,
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
              email: ({ event }) => event.email.trim(),
              password: ({ event }) => event.password,
              error: () => '',
              accessToken: () => '',
              refreshToken: () => '',
              expiresAt: () => '',
            }),
          },
        },
      },

      loading: {
        invoke: {
          src: 'submitForm',
          input: ({ context }) => ({
            email: context.email,
            password: context.password,
          }),
          onDone: {
            target: 'success',
            actions: assign({
              accessToken: ({ event }) => event.output.accessToken,
              refreshToken: ({ event }) => event.output.refreshToken,
              email: ({ event }) => event.output.email,
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
              email: ({ event }) => event.email.trim(),
              password: ({ event }) => event.password,
              error: () => '',
              accessToken: () => '',
              refreshToken: () => '',
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
        const credentials = validateLoginInput(input);
        return loginUser(credentials.email, credentials.password);
      }),
    },
  }
);
