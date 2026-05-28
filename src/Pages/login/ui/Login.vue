<template>
  <Page actionBarHidden="true" :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <GridLayout rows="*, auto">
      <ScrollView row="0">
        <StackLayout class="screen">
          <Label :text="titleText" class="title" :color="COLORS.profileText" />
          <Label
            :text="subtitleText"
            class="subtitle"
            :color="COLORS.mutedText"
          />

          <GridLayout columns="*, *" class="mode-switch" :backgroundColor="COLORS.cardBackground">
            <Button
              text="Вход"
              col="0"
              class="mode-button"
              :class="{ active: mode === 'login' }"
              :backgroundColor="mode === 'login' ? COLORS.profileText : COLORS.cardBackground"
              :color="mode === 'login' ? COLORS.background : COLORS.profileText"
              @tap="setMode('login')"
            />
            <Button
              text="Регистрация"
              col="1"
              class="mode-button"
              :class="{ active: mode === 'register' }"
              :backgroundColor="mode === 'register' ? COLORS.profileText : COLORS.cardBackground"
              :color="mode === 'register' ? COLORS.background : COLORS.profileText"
              @tap="setMode('register')"
            />
          </GridLayout>

          <StackLayout class="form">
            <TextField
              v-if="mode === 'register'"
              v-model="name"
              hint="Имя"
              class="input"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.darkText"
            />

            <TextField
              v-model="email"
              hint="Email"
              keyboardType="email"
              autocorrect="false"
              autocapitalizationType="none"
              class="input"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.darkText"
            />

            <TextField
              v-model="password"
              hint="Пароль"
              secure="true"
              class="input"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.darkText"
            />

            <Label
              v-if="visibleError"
              :text="visibleError"
              class="error-text"
              :color="COLORS.profileText"
            />

            <Button
              :text="buttonText"
              class="primary-button"
              :isEnabled="!isBusy"
              :backgroundColor="COLORS.profileButton"
              :color="COLORS.profileText"
              @tap="onConfirm"
            />
          </StackLayout>
        </StackLayout>
      </ScrollView>

      <StackLayout row="1" class="bottom-wrap">
        <Button
          :text="guestButtonText"
          class="secondary-button"
          :isEnabled="!isBusy"
          :backgroundColor="COLORS.navActiveBackground"
          :color="COLORS.profileText"
          @tap="onGuest"
        />
      </StackLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMachine } from '@xstate/vue';
import { loginMachine, type AuthMode } from '../model/LoginMachine';
import { COLORS } from '../../../Shared/ui/Colors';
import { useAuthStore } from '../../../Shared/model/AuthStore';

const mode = ref<AuthMode>('login');
const email = ref('');
const password = ref('');
const name = ref('');
const guestError = ref('');

const { snapshot, send } = useMachine(loginMachine);
const authStore = useAuthStore();

const isFormLoading = computed(() => snapshot.value.matches('loading'));
const isBusy = computed(() => isFormLoading.value);
const visibleError = computed(() => guestError.value || snapshot.value.context.error);
const titleText = computed(() => (mode.value === 'register' ? 'Новый аккаунт' : 'Вход'));
const subtitleText = computed(() =>
  mode.value === 'register'
    ? 'Создайте профиль, чтобы публиковать образы от своего имени'
    : 'Войдите в аккаунт или продолжите как гость'
);
const buttonText = computed(() => {
  if (isFormLoading.value) {
    return mode.value === 'register' ? 'Создаем...' : 'Входим...';
  }

  return mode.value === 'register' ? 'Зарегистрироваться' : 'Войти';
});
const guestButtonText = computed(() => 'Продолжить как гость');

watch(
  () => snapshot.value,
  (nextSnapshot) => {
    if (!nextSnapshot.matches('success') || !nextSnapshot.context.accessToken) {
      return;
    }

    authStore.setSession({
      accessToken: nextSnapshot.context.accessToken,
      refreshToken: nextSnapshot.context.refreshToken,
      email: nextSnapshot.context.email,
      name: nextSnapshot.context.sessionName,
      isGuest: false,
      avatarDataUrl: nextSnapshot.context.avatarDataUrl,
      expiresAt: nextSnapshot.context.expiresAt,
    });
  }
);

function setMode(nextMode: AuthMode) {
  mode.value = nextMode;
  guestError.value = '';
}

function onConfirm() {
  guestError.value = '';
  send({
    type: 'SUBMIT',
    mode: mode.value,
    email: email.value,
    password: password.value,
    name: name.value,
  });
}

function onGuest() {
  guestError.value = '';
  authStore.continueAsGuest();
}
</script>

<style scoped lang="scss">
.screen {
  padding-top: 46;
  padding-left: 18;
  padding-right: 18;
}

.title {
  margin-top: 16;
  margin-bottom: 10;
  text-align: center;
  font-size: 32;
  font-weight: 500;
}

.subtitle {
  text-align: center;
  font-size: 15;
  margin-bottom: 28;
}

.mode-switch {
  height: 50;
  border-radius: 18;
  margin-bottom: 22;
  padding: 4;
}

.mode-button {
  height: 42;
  border-radius: 15;
  font-size: 15;
  padding: 0;
  text-transform: none;
}

.form {
  width: 100%;
}

.input {
  height: 54;
  margin-bottom: 16;
  padding-left: 18;
  border-radius: 18;
  font-size: 16;
}

.error-text {
  margin-top: -2;
  margin-bottom: 12;
  font-size: 13;
  text-align: center;
}

.primary-button,
.secondary-button {
  height: 54;
  border-radius: 18;
  font-size: 17;
  text-transform: none;
}

.primary-button {
  margin-top: 4;
}

.bottom-wrap {
  padding-left: 18;
  padding-right: 18;
  padding-bottom: 18;
}
</style>
