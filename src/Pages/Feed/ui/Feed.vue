<template>
  <Page :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <GridLayout row="0" columns="*, auto" class="header">
        <StackLayout col="0">
          <Label text="Лента" class="title" :color="COLORS.profileText" />
          <Label
            text="Образы авторов, на которых хочется подписаться"
            class="subtitle"
            :color="COLORS.mutedText"
          />
        </StackLayout>
        <Button
          col="1"
          text="↻"
          class="refresh-button"
          :backgroundColor="COLORS.profileButton"
          :color="COLORS.profileText"
          @tap="loadFeed"
        />
      </GridLayout>

      <ScrollView row="1">
        <StackLayout class="feed-list">
          <Label
            v-if="isLoading"
            text="Загружаем публикации..."
            class="state-text"
            :color="COLORS.mutedText"
          />
          <Label
            v-else-if="errorText"
            :text="errorText"
            class="state-text"
            :color="COLORS.profileText"
          />
          <Label
            v-else-if="!publications.length"
            text="Пока тихо. Опубликуйте первый образ из профиля."
            class="state-text"
            :color="COLORS.mutedText"
          />

          <StackLayout
            v-for="publication in publications"
            :key="publication.id"
            class="feed-card"
            :backgroundColor="COLORS.cardBackground"
          >
            <GridLayout columns="*, auto" class="card-header">
              <StackLayout col="0">
                <Label
                  :text="publication.author.name"
                  class="author-name"
                  :color="COLORS.profileText"
                />
                <Label
                  :text="publication.name"
                  class="outfit-name"
                  :color="COLORS.darkText"
                />
              </StackLayout>
              <Button
                v-if="!publication.is_own_author"
                col="1"
                :text="publication.is_following ? 'Вы подписаны' : 'Подписаться'"
                class="follow-button"
                :backgroundColor="
                  publication.is_following ? COLORS.navActiveBackground : COLORS.profileButton
                "
                :color="COLORS.profileText"
                @tap="toggleFollow(publication)"
              />
            </GridLayout>

            <OutfitPreview :items="getPreviewItems(publication)" variant="card" />

            <GridLayout columns="*, auto" class="card-footer">
              <Label
                col="0"
                :text="`${styleLabel(publication)} · ${seasonLabel(publication)}`"
                class="meta-text"
                :color="COLORS.mutedText"
              />
              <Label
                col="1"
                :text="`${publication.views} просмотров`"
                class="views-text"
                :color="COLORS.profileText"
              />
            </GridLayout>

            <Button
              :text="expandedId === publication.id ? 'Свернуть' : 'Смотреть'"
              class="view-button"
              :backgroundColor="COLORS.profileButton"
              :color="COLORS.profileText"
              @tap="openPublication(publication)"
            />

            <StackLayout v-if="expandedId === publication.id" class="items-wrap">
              <Label
                v-for="item in publication.items"
                :key="item.id"
                :text="item.name"
                class="item-line"
                :color="COLORS.darkText"
              />
            </StackLayout>
          </StackLayout>
        </StackLayout>
      </ScrollView>

      <GridLayout
        row="2"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout col="0" class="nav-item" @tap="openMyOutfits">
          <SVGView src="~/assets/home-alt.svg" stretch="aspectFit" class="nav-svg home-icon" />
        </GridLayout>

        <GridLayout col="1" class="nav-item" @tap="openMyClothes">
          <SVGView src="~/assets/backpack.svg" stretch="aspectFit" class="nav-svg backpack-icon" />
        </GridLayout>

        <GridLayout
          col="2"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
        >
          <SVGView src="~/assets/thumb-up.svg" stretch="aspectFit" class="nav-svg thumbs-icon" />
        </GridLayout>

        <GridLayout col="3" class="nav-item" @tap="openProfile">
          <SVGView src="~/assets/user.svg" stretch="aspectFit" class="nav-svg profile-icon" />
        </GridLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import type { Clothing } from '../../../Shared/model/Wardrobe';
import {
  OUTFIT_STYLE_LABELS,
  SEASON_LABELS,
} from '../../../Shared/model/Wardrobe';
import {
  countPublicationView,
  getFeed,
  setAuthorFollowed,
  type FeedPublication,
} from '../../../Shared/model/api/SocialApi';
import { useAuthStore } from '../../../Shared/model/AuthStore';
import { COLORS } from '../../../Shared/ui/Colors';
import OutfitPreview from '../../../Shared/ui/OutfitPreview.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

const authStore = useAuthStore();
const publications = ref<FeedPublication[]>([]);
const isLoading = ref(false);
const errorText = ref('');
const expandedId = ref<number | null>(null);

onMounted(loadFeed);

function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function loadFeed() {
  isLoading.value = true;
  errorText.value = '';

  try {
    publications.value = await getFeed(authStore.accessToken);
  } catch (error) {
    errorText.value = getErrorText(error);
  } finally {
    isLoading.value = false;
  }
}

function getPreviewItems(publication: FeedPublication): Clothing[] {
  return publication.items.map((item, index) => ({
    id: `publication-${publication.id}-${item.id}-${index}`,
    name: item.name,
    category: 'tops',
    season: publication.season,
    colorScheme: publication.color_scheme,
    imageUrl: item.image_url || undefined,
    emoji: item.emoji || undefined,
    fillColor: item.fill_color || undefined,
  }));
}

function styleLabel(publication: FeedPublication) {
  return OUTFIT_STYLE_LABELS[publication.style] ?? publication.style;
}

function seasonLabel(publication: FeedPublication) {
  return SEASON_LABELS[publication.season] ?? publication.season;
}

async function openPublication(publication: FeedPublication) {
  if (expandedId.value === publication.id) {
    expandedId.value = null;
    return;
  }

  expandedId.value = publication.id;

  try {
    const result = await countPublicationView(publication.id);
    publication.views = result.views;
  } catch (error) {
    errorText.value = getErrorText(error);
  }
}

async function toggleFollow(publication: FeedPublication) {
  errorText.value = '';

  try {
    const result = await setAuthorFollowed(
      authStore.accessToken,
      publication.author.id,
      publication.is_following
    );
    publication.is_following = result.following;
  } catch (error) {
    errorText.value = getErrorText(error);
  }
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
</script>

<style scoped>
.header {
  padding: 22 16 14 16;
  vertical-align: middle;
}

.title {
  font-size: 28;
  font-weight: 600;
}

.subtitle {
  font-size: 13;
  margin-top: 4;
}

.refresh-button {
  width: 46;
  height: 46;
  border-radius: 23;
  font-size: 24;
  padding: 0;
  text-transform: none;
}

.feed-list {
  padding: 0 14 14 14;
}

.state-text {
  padding: 20 10;
  font-size: 15;
  text-align: center;
}

.feed-card {
  border-width: 1;
  border-color: #b87373;
  border-radius: 16;
  margin-bottom: 14;
  padding: 14;
}

.card-header {
  margin-bottom: 12;
  vertical-align: middle;
}

.author-name {
  font-size: 16;
  font-weight: 600;
}

.outfit-name {
  font-size: 14;
  margin-top: 3;
}

.follow-button {
  width: 132;
  height: 36;
  border-radius: 18;
  font-size: 12;
  padding: 0;
  text-transform: none;
}

.card-footer {
  margin-top: 10;
  margin-bottom: 10;
}

.meta-text,
.views-text {
  font-size: 12;
}

.views-text {
  text-align: right;
}

.view-button {
  height: 38;
  border-radius: 19;
  font-size: 14;
  padding: 0;
  text-transform: none;
}

.items-wrap {
  margin-top: 10;
  border-top-width: 1;
  border-top-color: #dbc6c6;
  padding-top: 8;
}

.item-line {
  font-size: 13;
  margin-bottom: 4;
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
