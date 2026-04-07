<script>
import {useMachine} from '@xstate/vue';
import { AppMachine } from './AppMachine.ts';
import Login from '../../Pages/login/ui/Login.vue';
import Details from '../../Pages/login/ui/Details.vue';

export default {
  name: 'AppView',
  components: {
    Login,
    Details
  },
  setup() {
    const { snapshot, send } = useMachine(AppMachine);
    return { snapshot, send };
  }
};
</script>

<template>
  <Login v-if="snapshot.matches('login')" />
  <Details v-else-if="snapshot.matches('home')" />
</template>