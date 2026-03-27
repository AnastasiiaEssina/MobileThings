import { createMachine, assign, fromPromise } from 'xstate';


type Context = {
  email: string;
  password: string;
  error: string;
};

type Events =
  | { type: 'SUBMIT'; email: string; password: string }
  | { type: 'RETRY' };
  
type SubmitInput = {
  email: string;
};

export const loginMachine = createMachine({
  types: {} as {
    context: Context;
    events: Events;
  },
  id: 'login',
  initial: 'idle',
  
  context: {
    email: '',
    password: '',
    error: ''
  },

  states: {
    idle: {
      on: {
        SUBMIT: {
          target: 'loading',
          actions: assign({
            email: (_, e: any) => e.email,
            password: (_, e: any) => e.password
          })
        }
      }
    },

    loading: {
      invoke: {
        src: 'submitForm',
        input: ({ context }) => ({
          email: context.email
        }),
        onDone: {
          target: 'success'
        },
        onError: {
          target: 'error',
          actions: assign({
            error: (_, e: any) => e.error
          })
        }
      }
    },

    success: {
      type: 'final'
    },

    error: {
      on: {
        RETRY: {
          target: 'idle'
        }
      }
    }
  }
},
{
  actors: {
    submitForm: fromPromise(async ({ input }: { input: SubmitInput }) => {
  await new Promise((r) => setTimeout(r, 1500));

  if (input.email === 'test@test.com') {
    return true;
  }

  throw new Error('Неверный email');
})
  }
});