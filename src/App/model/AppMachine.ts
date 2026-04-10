import { createMachine, assign, fromPromise } from 'xstate';
import {loginMachine} from '../../Pages/login/model/LoginMachine';


export const AppMachine = createMachine({
  initial: 'login',

  states: {
    login: {
      invoke: {
        src: loginMachine,
        onDone: 'home'
      }
    },

    home: {
      on: {
        LOGOUT: 'login'
      }
    }
  }
});