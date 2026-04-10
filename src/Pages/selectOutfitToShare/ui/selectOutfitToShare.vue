<template>
  <Page :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <StackLayout row="0" class="header">
        <Label text="12:30" class="time" :color="COLORS.darkText" />
        <Label
          text="Выберите образ для публикации"
          class="title"
          :color="COLORS.profileText"
        />

        <GridLayout columns="*, *, *" class="filters-labels">
          <Label
            text="Стиль:"
            col="0"
            class="filter-label"
            :color="COLORS.profileText"
          />
          <Label
            text="Сезон:"
            col="1"
            class="filter-label"
            :color="COLORS.profileText"
          />
          <Label
            text="Гамма:"
            col="2"
            class="filter-label"
            :color="COLORS.profileText"
          />
        </GridLayout>

        <GridLayout columns="*, *, *" class="filters-row">
          <Button
            col="0"
            text="Любой ▼"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
          />
          <Button
            col="1"
            text="Любой ▼"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
          />
          <Button
            col="2"
            text="Любой ▼"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
          />
        </GridLayout>
      </StackLayout>

      <ScrollView row="1">
        <WrapLayout class="outfits-grid">
          <GridLayout
            v-for="item in outfits"
            :key="item.id"
            rows="*"
            columns="*"
            class="outfit-card"
            :class="{ selected: selectedOutfitId === item.id }"
            :backgroundColor="COLORS.cardBackground"
            :borderColor="COLORS.profileText"
            @tap="selectOutfit(item.id)"
          >
            <Image
              :src="item.image"
              stretch="aspectFill"
              class="outfit-image"
            />
          </GridLayout>
        </WrapLayout>
      </ScrollView>

      <GridLayout
        row="2"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout col="0" class="nav-item">
          <SVGView
            src="~/assets/home-alt.svg"
            stretch="aspectFit"
            class="nav-svg home-icon"
          />
        </GridLayout>

        <GridLayout col="1" class="nav-item">
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
        >
          <SVGView
            src="~/assets/user.svg"
            stretch="aspectFit"
            class="nav-svg profile-icon"
          />
        </GridLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { COLORS } from '../../../Shared/ui/Colors';

const selectedOutfitId = ref(2);

const outfits = [
  { id: 1, image: '~/assets/outfit_1.png' },
  { id: 2, image: '~/assets/outfit 2.png' },
  { id: 3, image: '~/assets/outfit_1.png' },
  { id: 4, image: '~/assets/outfit 2.png' },
];

function selectOutfit(id: number) {
  selectedOutfitId.value = id;
}
</script>

<style scoped>
.header {
  padding: 12 16 0 16;
}

.time {
  font-size: 14;
  margin-bottom: 44;
}

.title {
  font-size: 20;
  text-align: center;
  margin-bottom: 44;
}

.filters-labels {
  margin-bottom: 10;
}

.filter-label {
  font-size: 13;
  font-weight: 600;
}

.filters-row {
  column-gap: 10;
}

.filter-button {
  height: 40;
  border-radius: 20;
  font-size: 14;
  padding: 0;
  text-transform: none;
}

.outfits-grid {
  padding: 12 10 10 12;
}

.outfit-card {
  width: 114;
  height: 114;
  margin: 6;
  border-width: 1;
  border-radius: 14;
}

.outfit-card.selected {
  border-width: 3;
}

.outfit-image {
  width: 114;
  height: 114;
  border-radius: 14;
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
