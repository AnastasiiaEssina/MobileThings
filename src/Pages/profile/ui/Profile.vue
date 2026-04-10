<template>
  <Page class="page" :backgroundColor="COLORS.profileBackground">
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
          <Image
            src="~/assets/bird.jpg"
            loadMode="async"
            stretch="aspectFill"
            class="avatar"
          />
          <Label text="Каролина" class="username" :color="COLORS.profileText" />
          <Button
            text="Опубликовать образ"
            class="publish-btn"
            :backgroundColor="COLORS.profileButton"
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

        <GridLayout col="2" class="nav-item">
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
import { storeToRefs } from 'pinia';
import type { Outfit } from '../../../Shared/model/Wardrobe';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import OutfitInfoModal from '../../../Shared/ui/OutfitInfoModal.vue';
import OutfitPreview from '../../../Shared/ui/OutfitPreview.vue';
import { COLORS } from '../../../Shared/ui/Colors';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import selectOutfitToShare from '../../selectOutfitToShare/ui/selectOutfitToShare.vue';

const wardrobeStore = useWardrobeStore();
const { outfits: allOutfits } = storeToRefs(wardrobeStore);
const outfits = computed(() => allOutfits.value.slice(0, 2));
const selectedOutfitId = ref<string | null>(null);
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

function openOutfitDetails(outfitId: string) {
  selectedOutfitId.value = outfitId;
}

function closeOutfitDetails() {
  selectedOutfitId.value = null;
}

function getOutfitItems(outfit: Outfit) {
  return wardrobeStore.getOutfitItems(outfit);
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
}

.username {
  margin-top: 12;
  font-size: 22;
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
</style>
