<script>
import {useMachine} from '@xstate/vue';
import Profile from '../../Pages/profile/ui/Profile.vue';

export default {
  name: 'AppView',
  components: {
    Profile
  }
}
</script>

<template>
  <Frame>
    <Profile />
  </Frame>
</template>