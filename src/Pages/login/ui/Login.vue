<template>
  <Page :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <ScrollView>
      <GridLayout rows="auto, *, auto" columns="*">
        <StackLayout row="0" class="screen" verticalAlignment="top">
          <Label text="Вход" class="title" :color="COLORS.profileText" />
          <Label
            text="Введите email и пароль, чтобы продолжить"
            class="subtitle"
            :color="COLORS.mutedText"
          />

          <StackLayout class="form">
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
              v-if="errorText"
              :text="errorText"
              class="error-text"
              :color="COLORS.profileText"
            />

            <Button
              :text="buttonText"
              class="primary-button"
              :isEnabled="!snapshot.matches('loading')"
              :backgroundColor="COLORS.profileButton"
              :color="COLORS.profileText"
              @tap="onConfirm"
            />

            <Label
              text="Регистрация будет добавлена позже"
              class="login-text"
              :color="COLORS.mutedText"
            />
          </StackLayout>
        </StackLayout>

        <StackLayout row="2" class="bottom-wrap">
          <Button
            text="Продолжить как гость"
            class="secondary-button"
            :backgroundColor="COLORS.navActiveBackground"
            :color="COLORS.profileText"
            @tap="onSkip"
          />
        </StackLayout>
      </GridLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMachine } from '@xstate/vue';
import { loginMachine } from '../model/LoginMachine';
import { COLORS } from '../../../Shared/ui/Colors';
import { useAuthStore } from '../../../Shared/model/AuthStore';

const email = ref('');
const password = ref('');

const { snapshot, send } = useMachine(loginMachine);
const authStore = useAuthStore();

const errorText = computed(() => snapshot.value.context.error);
const buttonText = computed(() =>
  snapshot.value.matches('loading') ? 'Входим...' : 'Войти'
);

watch(
  () => snapshot.value,
  async (nextSnapshot) => {
    if (!nextSnapshot.matches('success') || !nextSnapshot.context.token) {
      return;
    }

    authStore.setSession({
      token: nextSnapshot.context.token,
      email: nextSnapshot.context.email,
    });
  }
);

function onConfirm() {
  send({
    type: 'SUBMIT',
    email: email.value,
    password: password.value,
  });
}

function onSkip() {
  authStore.continueAsGuest();
}
</script>

<style scoped lang="scss">
.screen {
  padding-top: 34;
  padding-left: 18;
  padding-right: 18;
}

.title {
  margin-top: 28;
  margin-bottom: 12;
  text-align: center;
  font-size: 32;
  font-weight: 500;
}

.subtitle {
  text-align: center;
  font-size: 15;
  margin-bottom: 56;
}

.form {
  width: 100%;
}

.input {
  height: 54;
  margin-bottom: 18;
  padding-left: 18;
  border-radius: 18;
  font-size: 16;
}

.error-text {
  margin-top: -4;
  margin-bottom: 12;
  font-size: 13;
}

.primary-button,
.secondary-button {
  height: 54;
  border-radius: 18;
  font-size: 18;
  text-transform: none;
}

.primary-button {
  margin-top: 6;
}

.login-text {
  margin-top: 18;
  text-align: center;
  font-size: 14;
}

.bottom-wrap {
  padding-left: 18;
  padding-right: 18;
  padding-bottom: 18;
}

.secondary-button {
  margin-top: 40;
}
</style>
