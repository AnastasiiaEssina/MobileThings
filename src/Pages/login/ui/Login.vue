<template>
  <Page :backgroundColor="COLORS.background">
    <ActionBar visibility="collapse" />

    <ScrollView>
      <GridLayout rows="auto, *, auto" columns="*">
        <StackLayout row="0" class="screen" verticalAlignment="top">
          <Label text="Регистрация" class="title" />

          <StackLayout class="form">
            <TextField
              v-model="email"
              hint="Email"
              keyboardType="email"
              :backgroundColor="COLORS.accent"
              class="input"
            />

            <TextField
              v-model="password"
              hint="Пароль"
              secure="true"
              :backgroundColor="COLORS.accent"
              class="input"
            />

            <Button
              text="Подтвердить"
              class="primary-button"
              :isEnabled="!snapshot.matches('loading')"
              @tap="onConfirm"
              />
              
            <GridLayout columns="auto, auto" class="login-row">
              <Label text="Уже есть профиль???" class="login-text" col="0" />
              <Label text="Зайти" class="login-link" col="1" @tap="onLogin" />
            </GridLayout>
          </StackLayout>
        </StackLayout>

        <StackLayout row="2" class="bottom-wrap">
          <Button
            text="Продолжить без регистрации"
            class="secondary-button"
            @tap="onSkip"
          />
        </StackLayout>
      </GridLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import { useMachine } from '@xstate/vue';
import { loginMachine } from '../model/LoginMachine';
import {COLORS} from "../../../Shared/ui/Colors"

const email = ref('');
const password = ref('');

const { snapshot, send } = useMachine(loginMachine);

function onConfirm() {
  send({
    type: 'SUBMIT',
    email: email.value,
    password: password.value
  });
}
function onSkip() {
  console.log("Skip")
  send({
    type: 'SKIP'
  });
}
function onLogin(){
  console.log("Login")
}

</script>

<style scoped lang="scss">
.screen {
  padding-top: 24;
  padding-left: 18;
  padding-right: 18;
}

.title {
  margin-top: 18;
  margin-bottom: 72;
  text-align: center;
  font-size: 30;
  color: #111111;
  font-weight: 500;
}

.form {
  width: 100%;
}

.input {
  height: 54;
  margin-bottom: 22;
  padding-left: 18;
  border-radius: 18;
  color: #111111;
  font-size: 16;
}

.primary-button,
.secondary-button {
  height: 54;
  border-radius: 18;
  font-size: 18;
  text-transform: none;
  color: #111111;
  background-color: #52e6f2;
  margin-top: 8;
  margin-bottom: 18;
}

.login-row {
  margin-top: 2;
  horizontal-align: center;
}

.login-text {
  font-size: 15;
  color: #444444;
}

.login-link {
  font-size: 15;
  color: #2f2fff;
  text-decoration: underline;
  margin-left: 4;
}

.bottom-wrap {
  padding-left: 18;
  padding-right: 18;
  padding-bottom: 18;
}

.secondary-button {
  margin-top: 40;
  margin-bottom: 0;
}
</style>