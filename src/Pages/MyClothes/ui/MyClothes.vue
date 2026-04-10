<template>
  <Page :backgroundColor="COLORS.profileBackground">
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
            :backgroundColor="selectedCategory === category.value ? COLORS.profileText : COLORS.profileButton"
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
          >
            <Image
              v-if="item.imageUrl"
              :src="item.imageUrl"
              stretch="aspectFit"
              class="item-image"
            />
            <GridLayout
              v-else
              class="placeholder-card"
              :backgroundColor="item.fillColor || COLORS.cardBackground"
            >
              <Label :text="item.emoji || '👕'" class="placeholder-emoji" />
            </GridLayout>
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
          <SVGView
            src="~/assets/home-alt.svg"
            stretch="aspectFit"
            class="nav-svg home-icon"
          />
        </GridLayout>

        <GridLayout
          col="1"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openMyClothes"
        >
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

        <GridLayout col="3" class="nav-item" @tap="openProfile">
          <SVGView
            src="~/assets/user.svg"
            stretch="aspectFit"
            class="nav-svg profile-icon"
          />
        </GridLayout>
      </GridLayout>

      <AddClothesModal
        row="0"
        rowSpan="5"
        :visible="showAddClothesModal"
        @close="showAddClothesModal = false"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import type { ClothingCategory } from '../../../Shared/model/Wardrobe';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import AddClothesModal from '../../../Shared/ui/AddClothesModal.vue';
import { COLORS } from '../../../Shared/ui/Colors';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

type Category = 'all' | ClothingCategory;

const selectedCategory = ref<Category>('all');
const showAddClothesModal = ref(false);
const { myClothes } = useWardrobeStore();

const categories = [
  { value: 'all' as const, label: 'Все' },
  { value: 'tops' as const, label: 'Топы' },
  { value: 'pants' as const, label: 'Брюки' },
  { value: 'shoes' as const, label: 'Обувь' },
];

const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') {
    return myClothes.value;
  }

  return myClothes.value.filter((item) => item.category === selectedCategory.value);
});

function openMyOutfits() {
  $navigateTo(MyOutfits);
}

function openMyClothes() {
  return;
}

function openProfile() {
  $navigateTo(Profile);
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

.item-image {
  width: 56;
  height: 56;
  horizontal-align: center;
  vertical-align: middle;
}

.placeholder-card {
  width: 56;
  height: 56;
  border-radius: 12;
  horizontal-align: center;
  vertical-align: middle;
}

.placeholder-emoji {
  font-size: 30;
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
