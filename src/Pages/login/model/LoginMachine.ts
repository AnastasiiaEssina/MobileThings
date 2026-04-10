import { createMachine, assign, fromPromise } from 'xstate';

type Context = {
  email: string;
  password: string;
  error: string;
  token: string;
};

type Events =
  | { type: 'SUBMIT'; email: string; password: string }
  | { type: 'RETRY' };

type SubmitInput = {
  email: string;
  password: string;
};

type SubmitResult = {
  token: string;
  email: string;
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
      token: '',
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
              token: () => '',
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
              token: ({ event }) => event.output.token,
              email: ({ event }) => event.output.email,
              error: () => '',
            }),
          },
          onError: {
            target: 'error',
            actions: assign({
              error: ({ event }) =>
                event.error instanceof Error ? event.error.message : 'Не удалось выполнить вход.',
              token: () => '',
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
              token: () => '',
            }),
          },
        },
      },
    },
  },
  {
    actors: {
      submitForm: fromPromise(async ({ input }: { input: SubmitInput }): Promise<SubmitResult> => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const email = input.email.trim().toLowerCase();
        const password = input.password;

        if (!email.includes('@') || !email.includes('.')) {
          throw new Error('Введите корректный email.');
        }

        if (password.trim().length < 6) {
          throw new Error('Пароль должен быть не короче 6 символов.');
        }

        return {
          token: `token-${Date.now()}-${email.replace(/[^a-z0-9]/g, '-')}`,
          email,
        };
      }),
    },
  }
);
