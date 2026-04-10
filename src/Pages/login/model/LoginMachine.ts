import { createMachine, assign, fromPromise } from 'xstate';
import { loginUser } from '../../../Shared/model/api/AuthApi';

type Context = {
  email: string;
  password: string;
  error: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type Events =
  | { type: 'SUBMIT'; email: string; password: string }
  | { type: 'RETRY' };

type SubmitInput = {
  email: string;
  password: string;
};

type SubmitResult = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: string;
};

export const loginMachine = createMachine(
  {
    types: {} as {
      context: Context;
      events: Events;
    },
    id: 'login',
    initial: 'idle',

    context: {
      email: '',
      password: '',
      error: '',
      accessToken: '',
      refreshToken: '',
      expiresAt: '',
    },

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
              error: ({ event }) =>
                event.error instanceof Error ? event.error.message : 'Не удалось выполнить вход.',
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
      submitForm: fromPromise(async ({ input }: { input: SubmitInput }): Promise<SubmitResult> => {
        const email = input.email.trim().toLowerCase();
        const password = input.password;

        if (!email.includes('@') || !email.includes('.')) {
          throw new Error('Введите корректный email.');
        }

        if (password.trim().length < 6) {
          throw new Error('Пароль должен быть не короче 6 символов.');
        }

        return loginUser(email, password);
      }),
    },
  }
);
