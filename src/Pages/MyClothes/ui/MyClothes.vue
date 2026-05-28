<template>
  <Page
    actionBarHidden="true"
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, auto, auto, *, auto">
      <StackLayout row="0" class="header">
        <Label text="Мои вещи" class="title" :color="COLORS.profileText" />
      </StackLayout>

      <GridLayout row="1" class="scrollbar-track">
        <StackLayout class="scrollbar-thumb" :backgroundColor="COLORS.cardBackground" />
      </GridLayout>

      <ScrollView row="2" orientation="horizontal" scrollBarIndicatorVisible="false">
        <StackLayout orientation="horizontal" class="categories-row">
          <Button
            v-for="category in categories"
            :key="category.value"
            :text="category.label"
            class="category-chip"
            :class="{ active: selectedCategory === category.value }"
            :backgroundColor="
              selectedCategory === category.value ? COLORS.profileText : COLORS.profileButton
            "
            :color="selectedCategory === category.value ? COLORS.background : COLORS.profileText"
            @tap="selectedCategory = category.value"
          />
        </StackLayout>
      </ScrollView>

      <ScrollView row="3">
        <WrapLayout class="items-grid">
          <GridLayout
            class="item-card add-card"
            :backgroundColor="COLORS.profileButton"
            @tap="showAddClothesModal = true"
          >
            <Label text="+" class="add-symbol" :color="COLORS.profileText" />
          </GridLayout>

          <GridLayout
            v-for="item in filteredItems"
            :key="item.id"
            class="item-card"
            :backgroundColor="COLORS.cardBackground"
            :borderColor="COLORS.profileText"
            @tap="openClothingDetails(item.id)"
          >
            <ClothingPreview :item="item" size="sm" />
          </GridLayout>
        </WrapLayout>
      </ScrollView>

      <GridLayout
        row="4"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout col="0" class="nav-item" @tap="openMyOutfits">
          <SVGView src="~/assets/home-alt.svg" stretch="aspectFit" class="nav-svg home-icon" />
        </GridLayout>

        <GridLayout
          col="1"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openMyClothes"
        >
          <SVGView src="~/assets/backpack.svg" stretch="aspectFit" class="nav-svg backpack-icon" />
        </GridLayout>

        <GridLayout col="2" class="nav-item" @tap="openFeed">
          <SVGView src="~/assets/thumb-up.svg" stretch="aspectFit" class="nav-svg thumbs-icon" />
        </GridLayout>

        <GridLayout col="3" class="nav-item" @tap="openProfile">
          <SVGView src="~/assets/user.svg" stretch="aspectFit" class="nav-svg profile-icon" />
        </GridLayout>
      </GridLayout>

      <AddClothesModal
        row="0"
        rowSpan="5"
        :visible="showAddClothesModal"
        @close="showAddClothesModal = false"
      />

      <ClothingInfoModal
        row="0"
        rowSpan="5"
        :visible="Boolean(selectedClothing)"
        :clothing="selectedClothing"
        :related-outfits="relatedOutfits"
        @close="closeClothingDetails"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import { storeToRefs } from 'pinia';
import {
  CLOTHING_CATEGORY_LABELS,
  type ClothingCategory,
} from '../../../Shared/model/Wardrobe';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import {
  createAndroidBackListener,
  type AndroidBackHandler,
} from '../../../Shared/model/AndroidBack';
import AddClothesModal from '../../../Shared/ui/AddClothesModal.vue';
import ClothingInfoModal from '../../../Shared/ui/ClothingInfoModal.vue';
import ClothingPreview from '../../../Shared/ui/ClothingPreview.vue';
import { COLORS } from '../../../Shared/ui/Colors';
import Feed from '../../Feed/ui/Feed.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

type Category = 'all' | ClothingCategory;

const selectedCategory = ref<Category>('all');
const showAddClothesModal = ref(false);
const selectedClothingId = ref<string | null>(null);
const wardrobeStore = useWardrobeStore();
const { myClothes, outfits } = storeToRefs(wardrobeStore);
const handleAndroidBack: AndroidBackHandler = (args) => {
  args.cancel = true;

  if (selectedClothingId.value) {
    closeClothingDetails();
    return;
  }

  if (showAddClothesModal.value) {
    showAddClothesModal.value = false;
  }
};
const backListener = createAndroidBackListener(handleAndroidBack);

const categories = [
  { value: 'all' as const, label: CLOTHING_CATEGORY_LABELS.all },
  { value: 'tops' as const, label: CLOTHING_CATEGORY_LABELS.tops },
  { value: 'pants' as const, label: CLOTHING_CATEGORY_LABELS.pants },
  { value: 'shoes' as const, label: CLOTHING_CATEGORY_LABELS.shoes },
  { value: 'accessories' as const, label: CLOTHING_CATEGORY_LABELS.accessories },
];

const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') {
    return myClothes.value;
  }

  return myClothes.value.filter((item) => item.category === selectedCategory.value);
});

const selectedClothing = computed(() => {
  if (!selectedClothingId.value) {
    return null;
  }

  return myClothes.value.find((item) => item.id === selectedClothingId.value) ?? null;
});

const relatedOutfits = computed(() => {
  if (!selectedClothing.value) {
    return [];
  }

  return outfits.value.filter((outfit) => outfit.items.includes(selectedClothing.value.id));
});

function openClothingDetails(clothingId: string) {
  selectedClothingId.value = clothingId;
}

function closeClothingDetails() {
  selectedClothingId.value = null;
}

function openMyOutfits() {
  $navigateTo(MyOutfits);
}

function openMyClothes() {
  return;
}

function openProfile() {
  $navigateTo(Profile);
}

function openFeed() {
  $navigateTo(Feed);
}
</script>

<style scoped>
.header {
  padding: 18 16 10 16;
}

.title {
  font-size: 24;
  text-align: center;
  margin-top: 18;
}

.scrollbar-track {
  margin: 10 16 14 16;
  height: 6;
  border-radius: 3;
  background-color: #d9d5cf;
}

.scrollbar-thumb {
  width: 14;
  height: 6;
  border-radius: 3;
  horizontal-align: left;
}

.categories-row {
  padding: 0 14 12 14;
}

.category-chip {
  height: 36;
  min-width: 62;
  margin-right: 10;
  border-radius: 18;
  font-size: 14;
  padding: 0 16;
  text-transform: none;
}

.category-chip.active {
  font-weight: 700;
}

.items-grid {
  padding: 6 14 10 14;
}

.item-card {
  width: 64;
  height: 64;
  margin: 8;
  border-width: 1;
  border-radius: 14;
}

.add-card {
  border-width: 0;
}

.add-symbol {
  font-size: 34;
  font-weight: 700;
  horizontal-align: center;
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
