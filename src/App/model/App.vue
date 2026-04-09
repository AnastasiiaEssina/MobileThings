<script>
import {useMachine} from '@xstate/vue';
import Login from '../../Pages/login/ui/Login.vue';
import Details from '../../Pages/login/ui/Details.vue';
import MyOutfits from '../../Pages/MyOutfits/ui/MyOutfits.vue';

export default {
  name: 'AppView',
  components: {
    Login
  }
}
</script>

<template>
  <Frame>
    <Login />
  </Frame>
</template>