<template>
  <Page
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <ActionBar visibility="collapse" />

    <GridLayout rows="*, auto">
      <ScrollView row="0">
        <StackLayout class="content">
          <Label text="Создание образа" class="title" :color="COLORS.profileText" />

          <ScrollView orientation="horizontal" scrollBarIndicatorVisible="false">
            <StackLayout orientation="horizontal" class="selected-row">
              <GridLayout
                v-for="item in selectedClothes"
                :key="item.id"
                class="selected-card"
                :backgroundColor="COLORS.cardBackground"
                :borderColor="COLORS.profileText"
              >
                <Image
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  loadMode="async"
                  stretch="aspectFit"
                  class="selected-image"
                />
                <GridLayout
                  v-else
                  class="selected-placeholder"
                  :backgroundColor="item.fillColor || COLORS.cardBackground"
                >
                  <Label :text="item.emoji || '👕'" class="selected-emoji" />
                </GridLayout>
              </GridLayout>
            </StackLayout>
          </ScrollView>

          <Button
            text="Завершить создание"
            class="finish-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
            @tap="finishCreation"
          />

          <Label text="Ваши вещи" class="section-title" :color="COLORS.profileText" />

          <ScrollView orientation="horizontal" scrollBarIndicatorVisible="false">
            <StackLayout orientation="horizontal" class="wardrobe-columns">
              <StackLayout class="wardrobe-column">
                <GridLayout
                  class="clothing-card add-card"
                  :backgroundColor="COLORS.profileButton"
                  @tap="showAddClothesModal = true"
                >
                  <Label text="+" class="add-symbol" :color="COLORS.profileText" />
                </GridLayout>
                <GridLayout class="clothing-card empty-slot" />
              </StackLayout>

              <StackLayout
                v-for="column in wardrobeColumns"
                :key="column.id"
                class="wardrobe-column"
              >
                <GridLayout
                  v-for="item in column.items"
                  :key="item.id"
                  class="clothing-card"
                  :class="{ selected: isSelected(item.id) }"
                  :backgroundColor="COLORS.cardBackground"
                  :borderColor="COLORS.profileText"
                  @tap="toggleClothing(item.id)"
                >
                  <Image
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    loadMode="async"
                    stretch="aspectFit"
                    class="clothing-image"
                  />
                  <GridLayout
                    v-else
                    class="clothing-placeholder"
                    :backgroundColor="item.fillColor || COLORS.cardBackground"
                  >
                    <Label :text="item.emoji || '👕'" class="clothing-emoji" />
                  </GridLayout>
                </GridLayout>
              </StackLayout>
            </StackLayout>
          </ScrollView>

          <Label text="Из стандартных" class="subsection-title" :color="COLORS.profileText" />

          <WrapLayout class="standard-grid">
            <GridLayout
              v-for="item in standardClothes"
              :key="item.id"
              class="clothing-card standard-card"
              :class="{ selected: isSelected(item.id) }"
              :backgroundColor="COLORS.cardBackground"
              :borderColor="COLORS.profileText"
              @tap="toggleClothing(item.id)"
            >
              <Image
                v-if="item.imageUrl"
                :src="item.imageUrl"
                loadMode="async"
                stretch="aspectFit"
                class="clothing-image"
              />
              <GridLayout
                v-else
                class="clothing-placeholder"
                :backgroundColor="item.fillColor || COLORS.cardBackground"
              >
                <Label :text="item.emoji || '👕'" class="clothing-emoji" />
              </GridLayout>
            </GridLayout>
          </WrapLayout>
        </StackLayout>
      </ScrollView>

      <GridLayout
        row="1"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout
          col="0"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openMyOutfits"
        >
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
        rowSpan="2"
        :visible="showAddClothesModal"
        @close="showAddClothesModal = false"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateBack, $navigateTo } from 'nativescript-vue';
import { storeToRefs } from 'pinia';
import type { Clothing } from '../../../Shared/model/Wardrobe';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import {
  createAndroidBackListener,
  type AndroidBackHandler,
} from '../../../Shared/model/AndroidBack';
import AddClothesModal from '../../../Shared/ui/AddClothesModal.vue';
import { COLORS } from '../../../Shared/ui/Colors';
import Feed from '../../Feed/ui/Feed.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

const selectedClothingIds = ref<string[]>([]);
const showAddClothesModal = ref(false);
const handleAndroidBack: AndroidBackHandler = (args) => {
  if (!showAddClothesModal.value) {
    return;
  }

  args.cancel = true;
  showAddClothesModal.value = false;
};
const backListener = createAndroidBackListener(handleAndroidBack);
const wardrobeStore = useWardrobeStore();
const { myClothes, standardClothes } = storeToRefs(wardrobeStore);

const clothingById = computed(
  () =>
    new Map<string, Clothing>(
      [...myClothes.value, ...standardClothes.value].map((item) => [item.id, item])
    )
);

const selectedClothes = computed(() =>
  selectedClothingIds.value
    .map((id) => clothingById.value.get(id))
    .filter((item): item is Clothing => Boolean(item))
);

const wardrobeColumns = computed(() => {
  const columns: Array<{ id: string; items: Clothing[] }> = [];

  for (let index = 0; index < myClothes.value.length; index += 2) {
    columns.push({
      id: `column-${index}`,
      items: myClothes.value.slice(index, index + 2),
    });
  }

  return columns;
});

function isSelected(id: string) {
  return selectedClothingIds.value.includes(id);
}

function toggleClothing(id: string) {
  if (isSelected(id)) {
    selectedClothingIds.value = selectedClothingIds.value.filter((itemId) => itemId !== id);
    return;
  }

  selectedClothingIds.value = [...selectedClothingIds.value, id];
}

function finishCreation() {
  void wardrobeStore.createOutfitFromSelection(selectedClothingIds.value).finally(() => {
    $navigateBack();
  });
}

function openMyOutfits() {
  $navigateTo(MyOutfits);
}

function openMyClothes() {
  $navigateTo(MyClothes);
}

function openProfile() {
  $navigateTo(Profile);
}

function openFeed() {
  $navigateTo(Feed);
}
</script>

<style scoped>
.content {
  padding: 18 14 18 14;
}

.title {
  font-size: 24;
  text-align: center;
  margin-top: 18;
  margin-bottom: 18;
}

.selected-row {
  padding: 0 6 6 6;
}

.selected-card {
  width: 64;
  height: 64;
  margin: 0 6 0 6;
  border-width: 2;
  border-radius: 14;
}

.selected-image {
  width: 56;
  height: 56;
  horizontal-align: center;
  vertical-align: middle;
}

.selected-placeholder {
  width: 56;
  height: 56;
  border-radius: 12;
  horizontal-align: center;
  vertical-align: middle;
}

.selected-emoji {
  font-size: 30;
  horizontal-align: center;
  vertical-align: middle;
}

.finish-button {
  height: 42;
  border-radius: 21;
  font-size: 16;
  margin-top: 14;
  margin-bottom: 24;
  padding: 0;
  text-transform: none;
}

.section-title {
  font-size: 24;
  text-align: center;
  margin-bottom: 18;
}

.subsection-title {
  font-size: 16;
  margin-top: 10;
  margin-bottom: 12;
}

.wardrobe-columns {
  padding: 0 4 8 4;
}

.wardrobe-column {
  margin-right: 10;
}

.clothing-card {
  width: 64;
  height: 64;
  margin: 6;
  border-width: 1;
  border-radius: 14;
}

.clothing-card.selected {
  border-width: 3;
}

.empty-slot {
  opacity: 0;
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

.clothing-image {
  width: 56;
  height: 56;
  horizontal-align: center;
  vertical-align: middle;
}

.clothing-placeholder {
  width: 56;
  height: 56;
  border-radius: 12;
  horizontal-align: center;
  vertical-align: middle;
}

.clothing-emoji {
  font-size: 30;
  horizontal-align: center;
  vertical-align: middle;
}

.standard-grid {
  padding-bottom: 12;
}

.standard-card {
  margin: 6 8 6 0;
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
