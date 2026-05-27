<template>
  <Page
    actionBarHidden="true"
    class="page"
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <GridLayout row="0" rows="auto, auto" class="header">
        <GridLayout row="0" columns="*, auto" class="top-bar">
          <GridLayout col="1" class="settings-wrap" @tap="openSettings">
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
            <Button
              text="Выбрать из галереи"
              class="avatar-action"
              :isEnabled="!isAvatarBusy"
              :backgroundColor="COLORS.profileButton"
              :color="COLORS.profileText"
              @tap="chooseAvatarFromGallery"
            />
            <Button
              text="Удалить аватарку"
              class="avatar-delete"
              :isEnabled="Boolean(authStore.avatarDataUrl) && !isAvatarBusy"
              :backgroundColor="COLORS.dangerButton"
              :color="COLORS.dangerText"
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

      <GridLayout
        v-if="isSettingsOpen"
        row="0"
        rowSpan="3"
        class="settings-modal-overlay"
      >
        <StackLayout class="settings-modal-backdrop" @tap="closeSettings" />
        <StackLayout class="settings-modal-card" :backgroundColor="COLORS.profileBackground">
          <GridLayout columns="*, auto" class="settings-modal-header">
            <Label
              col="0"
              text="Настройки"
              class="settings-modal-title"
              :color="COLORS.profileText"
            />
            <Button
              col="1"
              text="×"
              class="settings-close-button"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.profileText"
              @tap="closeSettings"
            />
          </GridLayout>

          <Label text="Тема приложения" class="settings-section-title" :color="COLORS.mutedText" />
          <GridLayout columns="*, *" class="theme-row">
            <Button
              col="0"
              text="Светлая"
              class="theme-button"
              :backgroundColor="themeStore.theme === 'light' ? COLORS.profileButton : COLORS.cardBackground"
              :color="COLORS.profileText"
              @tap="setTheme('light')"
            />
            <Button
              col="1"
              text="Темная"
              class="theme-button"
              :backgroundColor="themeStore.theme === 'dark' ? COLORS.profileButton : COLORS.cardBackground"
              :color="COLORS.profileText"
              @tap="setTheme('dark')"
            />
          </GridLayout>

          <Button
            text="Выйти из аккаунта"
            class="settings-logout-button"
            :backgroundColor="COLORS.navActiveBackground"
            :color="COLORS.profileText"
            @tap="logout"
          />
        </StackLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import { Application, ImageSource } from '@nativescript/core';
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
import { useThemeStore } from '../../../Shared/model/ThemeStore';
import { deleteAvatar, updateAvatar } from '../../../Shared/model/api/ProfileApi';
import Feed from '../../Feed/ui/Feed.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import selectOutfitToShare from '../../selectOutfitToShare/ui/selectOutfitToShare.vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const wardrobeStore = useWardrobeStore();
const { outfits: allOutfits } = storeToRefs(wardrobeStore);
const outfits = computed(() => allOutfits.value);
const avatarStatus = ref('');
const isAvatarSaving = ref(false);
const isAvatarPicking = ref(false);
const isSettingsOpen = ref(false);
const displayName = computed(() => authStore.name || authStore.email || 'Пользователь');
const profileCaption = computed(() =>
  authStore.isGuest ? 'Гостевой аккаунт' : authStore.email || 'Аккаунт Things'
);
const publishButtonText = computed(() =>
  authStore.isServerUser ? 'Опубликовать образ' : 'Войдите, чтобы публиковать'
);
const avatarImageSource = computed(() => dataUrlToImageSource(authStore.avatarDataUrl));
const isAvatarBusy = computed(() => isAvatarSaving.value || isAvatarPicking.value);
const selectedOutfitId = ref<string | null>(null);
const handleAndroidBack: AndroidBackHandler = (args) => {
  args.cancel = true;

  if (isSettingsOpen.value) {
    closeSettings();
    return;
  }

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

function openSettings() {
  isSettingsOpen.value = true;
}

function closeSettings() {
  isSettingsOpen.value = false;
}

function setTheme(theme: 'light' | 'dark') {
  themeStore.applyTheme(theme);
}

function getOutfitItems(outfit: Outfit) {
  return wardrobeStore.getOutfitItems(outfit);
}

function logout() {
  closeSettings();
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
    avatarStatus.value = 'Аватарка сохранена.';
  } catch (error) {
    avatarStatus.value = error instanceof Error ? error.message : String(error);
  } finally {
    isAvatarSaving.value = false;
  }
}

function imageSourceToAvatarDataUrl(image: ImageSource) {
  const resized = image.width > 256 || image.height > 256 ? image.resize(256) : image;
  const base64 = resized.toBase64String('jpeg', 82);
  if (!base64) {
    throw new Error('Не удалось подготовить аватарку.');
  }

  return `data:image/jpeg;base64,${base64}`;
}

function pickImageFromGallery(): Promise<ImageSource | null> {
  return new Promise((resolve, reject) => {
    const androidApp = Application.android;
    const activity = androidApp.foregroundActivity || androidApp.startActivity;

    if (!activity) {
      reject(new Error('Галерея сейчас недоступна.'));
      return;
    }

    const requestCode = 44710;
    const onResult = (args: any) => {
      if (args.requestCode !== requestCode) {
        return;
      }

      androidApp.off(androidApp.activityResultEvent, onResult);

      if (args.resultCode !== android.app.Activity.RESULT_OK || !args.intent) {
        resolve(null);
        return;
      }

      const uri = args.intent.getData();
      if (!uri) {
        reject(new Error('Не удалось открыть выбранное изображение.'));
        return;
      }

      let stream: java.io.InputStream | null = null;
      try {
        stream = activity.getContentResolver().openInputStream(uri);
        const image = ImageSource.fromDataSync(stream);
        if (!image) {
          reject(new Error('Выбранный файл не похож на изображение.'));
          return;
        }

        resolve(image);
      } catch (error) {
        reject(error);
      } finally {
        if (stream) {
          stream.close();
        }
      }
    };

    androidApp.on(androidApp.activityResultEvent, onResult);

    try {
      const intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
      intent.setType('image/*');
      intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
      intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);

      activity.startActivityForResult(
        android.content.Intent.createChooser(intent, 'Выберите аватарку'),
        requestCode
      );
    } catch (error) {
      androidApp.off(androidApp.activityResultEvent, onResult);
      reject(error);
    }
  });
}

async function chooseAvatarFromGallery() {
  if (!authStore.isServerUser || isAvatarBusy.value) {
    return;
  }

  isAvatarPicking.value = true;
  avatarStatus.value = '';

  try {
    const image = await pickImageFromGallery();
    if (!image) {
      avatarStatus.value = 'Выбор отменен.';
      return;
    }

    await persistAvatar(imageSourceToAvatarDataUrl(image));
  } catch (error) {
    avatarStatus.value = error instanceof Error ? error.message : String(error);
  } finally {
    isAvatarPicking.value = false;
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

.settings-modal-overlay {
  vertical-align: stretch;
}

.settings-modal-backdrop {
  background-color: rgba(0, 0, 0, 0.32);
}

.settings-modal-card {
  margin: 34 18;
  padding: 16;
  height: 300;
  border-width: 1;
  border-color: #b87373;
  border-radius: 16;
  vertical-align: middle;
}

.settings-modal-header {
  margin-bottom: 14;
  vertical-align: middle;
}

.settings-modal-title {
  font-size: 22;
  font-weight: 600;
}

.settings-close-button {
  width: 38;
  height: 38;
  border-radius: 19;
  font-size: 20;
  padding: 0;
  text-transform: none;
}

.settings-section-title {
  font-size: 13;
  margin-bottom: 8;
}

.theme-row {
  height: 44;
  margin-bottom: 14;
}

.theme-button {
  height: 40;
  border-radius: 20;
  font-size: 14;
  margin-right: 6;
  margin-left: 6;
  padding: 0;
  text-transform: none;
}

.settings-logout-button {
  height: 42;
  border-radius: 21;
  font-size: 15;
  padding: 0;
  text-transform: none;
}
</style>
