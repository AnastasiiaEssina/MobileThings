<template>
  <Page
    class="page"
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <GridLayout rows="auto, *, auto">
      <GridLayout row="0" rows="auto, auto" class="header">
        <GridLayout row="0" columns="*, auto" class="top-bar">
          <GridLayout col="1" class="settings-wrap">
            <SVGView
              src="~/assets/settings.svg"
              stretch="aspectFit"
              class="settings-icon"
            />
          </GridLayout>
        </GridLayout>

        <StackLayout row="1" class="profile-block">
          <GridLayout v-if="!authStore.isGuest" class="avatar">
            <Image
              v-if="avatarImageSource"
              :src="avatarImageSource"
              loadMode="async"
              stretch="aspectFill"
              class="avatar-image"
            />
            <Label
              v-else
              text="Нет аватарки"
              class="avatar-empty"
              :color="COLORS.mutedText"
            />
          </GridLayout>
          <Label :text="displayName" class="username" :color="COLORS.profileText" />
          <Label :text="profileCaption" class="profile-caption" :color="COLORS.mutedText" />
          <StackLayout v-if="authStore.isServerUser" class="avatar-editor">
            <TextView
              v-model="avatarDraft"
              hint="data:image/jpeg;base64,..."
              class="avatar-input"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.darkText"
            />
            <GridLayout columns="*, *" class="avatar-actions">
              <Button
                col="0"
                text="Сохранить свою"
                class="avatar-action"
                :isEnabled="!isAvatarSaving"
                :backgroundColor="COLORS.profileButton"
                :color="COLORS.profileText"
                @tap="saveCustomAvatar"
              />
              <Button
                col="1"
                text="Птица"
                class="avatar-action"
                :isEnabled="!isAvatarSaving"
                :backgroundColor="COLORS.profileButton"
                :color="COLORS.profileText"
                @tap="saveBirdAvatar"
              />
            </GridLayout>
            <Button
              text="Удалить аватарку"
              class="avatar-delete"
              :isEnabled="Boolean(authStore.avatarDataUrl) && !isAvatarSaving"
              :backgroundColor="COLORS.navActiveBackground"
              :color="COLORS.profileText"
              @tap="removeAvatar"
            />
            <Label
              v-if="avatarStatus"
              :text="avatarStatus"
              class="avatar-status"
              :color="COLORS.mutedText"
            />
          </StackLayout>
          <Label
            v-else
            text="Гость работает локально: без серверной аватарки и ленты."
            class="guest-note"
            :color="COLORS.mutedText"
          />
          <Button
            :text="publishButtonText"
            class="publish-btn"
            :isEnabled="authStore.isServerUser"
            :backgroundColor="authStore.isServerUser ? COLORS.profileButton : COLORS.navActiveBackground"
            :color="COLORS.profileText"
            @tap="openSelectOutfitToShare"
          />
          <Button
            text="Выйти"
            class="logout-btn"
            :backgroundColor="COLORS.navActiveBackground"
            :color="COLORS.profileText"
            @tap="logout"
          />
        </StackLayout>
      </GridLayout>

      <ScrollView row="1">
        <StackLayout class="content">
          <GridLayout
            v-for="item in outfits"
            :key="item.id"
            rows="*"
            columns="*"
            class="outfit-card"
            :backgroundColor="COLORS.cardBackground"
            @tap="openOutfitDetails(item.id)"
          >
            <OutfitPreview :items="getOutfitItems(item)" variant="large" />

            <GridLayout class="menu-button">
              <SVGView
                src="~/assets/ellypsis.svg"
                stretch="aspectFit"
                class="menu-dots"
              />
            </GridLayout>

            <GridLayout columns="auto, auto" class="views-block">
              <SVGView
                src="~/assets/eye.svg"
                stretch="aspectFit"
                class="eye-icon"
                col="0"
              />
              <Label
                :text="String(item.views)"
                class="views-text"
                col="1"
                :color="COLORS.mutedText"
              />
            </GridLayout>
          </GridLayout>
        </StackLayout>
      </ScrollView>

      <GridLayout
        row="2"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout col="0" class="nav-item" @tap="openMyOutfits">
          <SVGView
            src="~/assets/home-alt.svg"
            stretch="aspectFit"
            class="nav-svg home-icon"
          />
        </GridLayout>

        <GridLayout col="1" class="nav-item" @tap="openMyClothes">
          <SVGView
            src="~/assets/backpack.svg"
            stretch="aspectFit"
            class="nav-svg backpack-icon"
          />
        </GridLayout>

        <GridLayout col="2" class="nav-item" @tap="openFeed">
          <SVGView
            src="~/assets/thumb-up.svg"
            stretch="aspectFit"
            class="nav-svg thumbs-icon"
          />
        </GridLayout>

        <GridLayout
          col="3"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openProfile"
        >
          <SVGView
            src="~/assets/user.svg"
            stretch="aspectFit"
            class="nav-svg profile-icon"
          />
        </GridLayout>
      </GridLayout>

      <OutfitInfoModal
        row="0"
        rowSpan="3"
        :visible="Boolean(selectedOutfit)"
        :outfit="selectedOutfit"
        :outfit-items="selectedOutfitItems"
        @close="closeOutfitDetails"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import { ImageSource } from '@nativescript/core';
import { storeToRefs } from 'pinia';
import type { Outfit } from '../../../Shared/model/Wardrobe';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import {
  createAndroidBackListener,
  type AndroidBackHandler,
} from '../../../Shared/model/AndroidBack';
import OutfitInfoModal from '../../../Shared/ui/OutfitInfoModal.vue';
import OutfitPreview from '../../../Shared/ui/OutfitPreview.vue';
import { COLORS } from '../../../Shared/ui/Colors';
import { useAuthStore } from '../../../Shared/model/AuthStore';
import { deleteAvatar, updateAvatar } from '../../../Shared/model/api/ProfileApi';
import Feed from '../../Feed/ui/Feed.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import selectOutfitToShare from '../../selectOutfitToShare/ui/selectOutfitToShare.vue';

const authStore = useAuthStore();
const wardrobeStore = useWardrobeStore();
const { outfits: allOutfits } = storeToRefs(wardrobeStore);
const outfits = computed(() => allOutfits.value);
const avatarDraft = ref('');
const avatarStatus = ref('');
const isAvatarSaving = ref(false);
const displayName = computed(() => authStore.name || authStore.email || 'Пользователь');
const profileCaption = computed(() =>
  authStore.isGuest ? 'Гостевой аккаунт' : authStore.email || 'Аккаунт Things'
);
const publishButtonText = computed(() =>
  authStore.isServerUser ? 'Опубликовать образ' : 'Войдите, чтобы публиковать'
);
const avatarImageSource = computed(() => dataUrlToImageSource(authStore.avatarDataUrl));
const selectedOutfitId = ref<string | null>(null);
const handleAndroidBack: AndroidBackHandler = (args) => {
  args.cancel = true;

  if (selectedOutfitId.value) {
    closeOutfitDetails();
  }
};
const backListener = createAndroidBackListener(handleAndroidBack);
const selectedOutfit = computed<Outfit | null>(() => {
  if (!selectedOutfitId.value) {
    return null;
  }

  return allOutfits.value.find((item) => item.id === selectedOutfitId.value) ?? null;
});
const selectedOutfitItems = computed(() => {
  if (!selectedOutfit.value) {
    return [];
  }

  return wardrobeStore.getOutfitItems(selectedOutfit.value);
});

function openSelectOutfitToShare() {
  if (!authStore.isServerUser) {
    avatarStatus.value = 'Войдите в аккаунт, чтобы публиковать образы.';
    return;
  }

  $navigateTo(selectOutfitToShare);
}

function openMyOutfits() {
  $navigateTo(MyOutfits);
}

function openMyClothes() {
  $navigateTo(MyClothes);
}

function openProfile() {
  return;
}

function openFeed() {
  $navigateTo(Feed);
}

function openOutfitDetails(outfitId: string) {
  selectedOutfitId.value = outfitId;
}

function closeOutfitDetails() {
  selectedOutfitId.value = null;
}

function getOutfitItems(outfit: Outfit) {
  return wardrobeStore.getOutfitItems(outfit);
}

function logout() {
  authStore.logout();
}

function dataUrlToImageSource(dataUrl?: string | null) {
  if (!dataUrl || authStore.isGuest) {
    return null;
  }

  const base64 = dataUrl.includes(',') ? dataUrl.split(',', 2)[1] : dataUrl;
  try {
    return ImageSource.fromBase64Sync(base64);
  } catch {
    return null;
  }
}

function normalizeAvatarInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  return `data:image/jpeg;base64,${trimmed}`;
}

async function persistAvatar(dataUrl: string) {
  const token = authStore.accessToken;
  if (!token || isAvatarSaving.value) {
    return;
  }

  isAvatarSaving.value = true;
  avatarStatus.value = '';

  try {
    const profile = await updateAvatar(token, dataUrl);
    authStore.updateStoredProfile(profile);
    avatarDraft.value = '';
    avatarStatus.value = 'Аватарка сохранена.';
  } catch (error) {
    avatarStatus.value = error instanceof Error ? error.message : String(error);
  } finally {
    isAvatarSaving.value = false;
  }
}

async function saveCustomAvatar() {
  const dataUrl = normalizeAvatarInput(avatarDraft.value);
  if (!dataUrl) {
    avatarStatus.value = 'Вставьте base64 аватарки.';
    return;
  }

  await persistAvatar(dataUrl);
}

async function saveBirdAvatar() {
  try {
    const bird = ImageSource.fromFileOrResourceSync('~/assets/bird.jpg');
    const image = bird.resize(256);
    const base64 = image.toBase64String('jpeg', 80);
    await persistAvatar(`data:image/jpeg;base64,${base64}`);
  } catch {
    avatarStatus.value = 'Не удалось подготовить аватарку-птицу.';
  }
}

async function removeAvatar() {
  const token = authStore.accessToken;
  if (!token || isAvatarSaving.value) {
    return;
  }

  isAvatarSaving.value = true;
  avatarStatus.value = '';

  try {
    const profile = await deleteAvatar(token);
    authStore.updateStoredProfile(profile);
    avatarStatus.value = 'Аватарка удалена.';
  } catch (error) {
    avatarStatus.value = error instanceof Error ? error.message : String(error);
  } finally {
    isAvatarSaving.value = false;
  }
}
</script>

<style scoped>
.header {
  padding: 12 10 0 10;
}

.top-bar {
  margin-bottom: 8;
  vertical-align: middle;
}

.settings-wrap {
  width: 34;
  height: 34;
  horizontal-align: right;
  vertical-align: middle;
}

.settings-icon {
  width: 30;
  height: 30;
  horizontal-align: right;
  vertical-align: middle;
}

.profile-block {
  horizontal-align: center;
  text-align: center;
}

.avatar {
  width: 118;
  height: 118;
  border-radius: 59;
  margin-top: 4;
  background-color: #f5ead8;
  horizontal-align: center;
  vertical-align: middle;
}

.avatar-image {
  width: 118;
  height: 118;
  border-radius: 59;
}

.avatar-empty {
  font-size: 13;
  text-align: center;
  vertical-align: middle;
}

.username {
  margin-top: 12;
  font-size: 22;
  text-align: center;
}

.profile-caption {
  margin-top: 4;
  font-size: 13;
  text-align: center;
}

.avatar-editor {
  width: 336;
  margin-top: 10;
}

.avatar-input {
  height: 70;
  border-radius: 14;
  padding: 8 12;
  font-size: 12;
}

.avatar-actions {
  margin-top: 8;
}

.avatar-action {
  height: 34;
  border-radius: 17;
  font-size: 12;
  padding: 0;
}

.avatar-delete {
  margin-top: 8;
  height: 34;
  border-radius: 17;
  font-size: 12;
  padding: 0;
}

.avatar-status,
.guest-note {
  margin-top: 6;
  font-size: 12;
  text-align: center;
}

.publish-btn {
  margin-top: 12;
  width: 336;
  height: 42;
  border-radius: 21;
  font-size: 16;
  padding: 0;
}

.logout-btn {
  margin-top: 8;
  width: 188;
  height: 36;
  border-radius: 18;
  font-size: 14;
  padding: 0;
}

.content {
  padding: 16 16 12 16;
}

.outfit-card {
  width: 316;
  height: 336;
  margin-bottom: 18;
  border-width: 1;
  border-color: #7d1b29;
  border-radius: 18;
}

.menu-button {
  width: 26;
  height: 26;
  horizontal-align: right;
  vertical-align: top;
  margin-top: 10;
  margin-right: 10;
}

.menu-dots {
  width: 24;
  height: 24;
}

.views-block {
  width: 62;
  height: 24;
  horizontal-align: right;
  vertical-align: bottom;
  margin-right: 12;
  margin-bottom: 12;
}

.eye-icon {
  width: 18;
  height: 18;
  vertical-align: middle;
  margin-top: 3;
}

.views-text {
  font-size: 13;
  margin-left: 6;
  vertical-align: middle;
}

.bottom-nav {
  padding: 8 14 14 14;
}

.nav-item {
  width: 64;
  height: 64;
  horizontal-align: center;
  vertical-align: middle;
}

.nav-item.active {
  width: 56;
  height: 56;
  border-radius: 28;
}

.nav-svg {
  horizontal-align: center;
  vertical-align: middle;
}

.home-icon {
  width: 42;
  height: 40;
}

.backpack-icon {
  width: 34;
  height: 40;
}

.thumbs-icon {
  width: 36;
  height: 36;
}

.profile-icon {
  width: 38;
  height: 38;
}
</style>
