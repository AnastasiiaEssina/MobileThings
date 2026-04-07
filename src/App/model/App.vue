<script>
import {useMachine} from '@xstate/vue';
import { AppMachine } from './AppMachine.ts';
import Login from '../../Pages/login/ui/Login.vue';
import Details from '../../Pages/login/ui/Details.vue';
import MyOutfits from '../../Pages/MyOutfits/ui/MyOutfits.vue';

export default {
  name: 'AppView',
  components: {
    Login,
    Details,
    MyOutfits
  },
  setup() {
    const { snapshot, send } = useMachine(AppMachine);
    return { snapshot, send };
  }
};
</script>

<template>
  <MyOutfits v-if="snapshot.matches('login')" />
  <MyOutfits v-else-if="snapshot.matches('home')" />
</template>