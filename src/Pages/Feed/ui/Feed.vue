<template>
  <Page
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <GridLayout row="0" columns="*, auto, auto" class="header">
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
          text="Авторы"
          class="authors-button"
          :backgroundColor="COLORS.cardBackground"
          :color="COLORS.profileText"
          @tap="openAuthorsPopup"
        />
        <Button
          col="2"
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
            v-if="!authStore.isServerUser"
            text="Войдите в аккаунт, чтобы видеть ленту, подписываться на авторов и публиковать образы."
            class="state-text"
            textWrap="true"
            :color="COLORS.profileText"
          />
          <Label
            v-else-if="isLoading"
            text="Загружаем публикации..."
            class="state-text"
            textWrap="true"
            :color="COLORS.mutedText"
          />
          <Label
            v-else-if="errorText"
            :text="errorText"
            class="state-text"
            textWrap="true"
            :color="COLORS.profileText"
          />
          <Label
            v-else-if="!publications.length"
            text="Пока тихо. Опубликуйте первый образ из профиля."
            class="state-text"
            textWrap="true"
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

      <GridLayout
        v-if="isAuthorsPopupOpen"
        row="0"
        rowSpan="3"
        class="authors-modal-overlay"
      >
        <StackLayout class="authors-modal-backdrop" @tap="closeAuthorsPopup" />
        <StackLayout class="authors-modal-card" :backgroundColor="COLORS.profileBackground">
          <GridLayout columns="*, auto" class="authors-modal-header">
            <Label col="0" text="Авторы" class="authors-modal-title" :color="COLORS.profileText" />
            <Button
              col="1"
              text="×"
              class="authors-close-button"
              :backgroundColor="COLORS.cardBackground"
              :color="COLORS.profileText"
              @tap="closeAuthorsPopup"
            />
          </GridLayout>

          <TextField
            v-model="authorSearch"
            hint="Найти пользователя по имени"
            class="authors-search"
            :color="COLORS.profileText"
          />

          <Label
            v-if="authorsErrorText"
            :text="authorsErrorText"
            class="authors-state"
            textWrap="true"
            :color="COLORS.profileText"
          />
          <Label
            v-else-if="isAuthorsLoading"
            text="Загружаем авторов..."
            class="authors-state"
            :color="COLORS.mutedText"
          />
          <Label
            v-else-if="!filteredAuthors.length"
            text="Никого не нашли"
            class="authors-state"
            :color="COLORS.mutedText"
          />

          <ScrollView v-else class="authors-scroll">
            <StackLayout>
              <GridLayout
                v-for="author in filteredAuthors"
                :key="author.id"
                columns="*, auto"
                class="author-row"
              >
                <StackLayout col="0">
                  <Label :text="author.name" class="author-row-name" :color="COLORS.profileText" />
                  <Label
                    :text="postsCountLabel(author.post_count)"
                    class="author-row-count"
                    :color="COLORS.mutedText"
                  />
                </StackLayout>
                <Button
                  col="1"
                  :text="authorButtonText(author)"
                  class="author-follow-button"
                  :isEnabled="canFollowAuthor(author)"
                  :backgroundColor="author.is_following ? COLORS.navActiveBackground : COLORS.profileButton"
                  :color="COLORS.profileText"
                  @tap="followAuthorFromPopup(author)"
                />
              </GridLayout>
            </StackLayout>
          </ScrollView>
        </StackLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import type { Clothing } from '../../../Shared/model/Wardrobe';
import {
  OUTFIT_STYLE_LABELS,
  SEASON_LABELS,
} from '../../../Shared/model/Wardrobe';
import {
  countPublicationView,
  getAuthors,
  getFeed,
  setAuthorFollowed,
  type FeedAuthor,
  type FeedPublication,
} from '../../../Shared/model/api/SocialApi';
import { useAuthStore } from '../../../Shared/model/AuthStore';
import {
  createAndroidBackListener,
  type AndroidBackHandler,
} from '../../../Shared/model/AndroidBack';
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
const viewedPublicationIds = ref<Set<number>>(new Set());
const authors = ref<FeedAuthor[]>([]);
const authorSearch = ref('');
const isAuthorsLoading = ref(false);
const isAuthorsPopupOpen = ref(false);
const authorsErrorText = ref('');
const handleAndroidBack: AndroidBackHandler = (args) => {
  if (isAuthorsPopupOpen.value) {
    closeAuthorsPopup();
  }
  args.cancel = true;
};
const backListener = createAndroidBackListener(handleAndroidBack);

onMounted(loadFeed);

const filteredAuthors = computed(() => {
  const query = authorSearch.value.trim().toLowerCase();
  if (!query) {
    return authors.value;
  }

  return authors.value.filter((author) => author.name.toLowerCase().includes(query));
});

function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function loadFeed() {
  if (!authStore.isServerUser) {
    publications.value = [];
    isLoading.value = false;
    errorText.value = '';
    return;
  }

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

async function openAuthorsPopup() {
  if (!authStore.isServerUser) {
    errorText.value = 'Войдите в аккаунт, чтобы смотреть авторов.';
    return;
  }

  isAuthorsPopupOpen.value = true;
  authorSearch.value = '';
  await loadAuthors();
}

function closeAuthorsPopup() {
  isAuthorsPopupOpen.value = false;
}

async function loadAuthors() {
  isAuthorsLoading.value = true;
  authorsErrorText.value = '';

  try {
    authors.value = await getAuthors(authStore.accessToken);
  } catch (error) {
    authorsErrorText.value = getErrorText(error);
  } finally {
    isAuthorsLoading.value = false;
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
  errorText.value = '';

  if (viewedPublicationIds.value.has(publication.id)) {
    return;
  }

  if (publication.is_own_author) {
    markPublicationViewed(publication.id);
    return;
  }

  try {
    const result = await countPublicationView(publication.id, authStore.accessToken);
    publication.views = result.views;
    markPublicationViewed(publication.id);
  } catch (error) {
    errorText.value = getErrorText(error);
  }
}

function markPublicationViewed(publicationId: number) {
  const nextViewedIds = new Set(viewedPublicationIds.value);
  nextViewedIds.add(publicationId);
  viewedPublicationIds.value = nextViewedIds;
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
    updateAuthorFollowState(publication.author.id, result.following);

    if (!result.following) {
      publications.value = publications.value.filter(
        (item) => item.author.id !== publication.author.id
      );
    }
  } catch (error) {
    errorText.value = getErrorText(error);
  }
}

async function followAuthorFromPopup(author: FeedAuthor) {
  if (!canFollowAuthor(author)) {
    return;
  }

  authorsErrorText.value = '';

  try {
    const result = await setAuthorFollowed(authStore.accessToken, author.id, false);
    updateAuthorFollowState(author.id, result.following);
    await loadFeed();
  } catch (error) {
    authorsErrorText.value = getErrorText(error);
  }
}

function updateAuthorFollowState(authorId: number, isFollowing: boolean) {
  authors.value = authors.value.map((author) => (
    author.id === authorId ? { ...author, is_following: isFollowing } : author
  ));
  publications.value = publications.value.map((publication) => (
    publication.author.id === authorId
      ? { ...publication, is_following: isFollowing }
      : publication
  ));
}

function canFollowAuthor(author: FeedAuthor) {
  return !author.is_own_author && !author.is_following;
}

function authorButtonText(author: FeedAuthor) {
  if (author.is_own_author) {
    return 'Это вы';
  }

  return author.is_following ? 'Подписаны' : 'Подписаться';
}

function postsCountLabel(count: number) {
  return `${count} ${postWord(count)}`;
}

function postWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'постов';
  }

  if (last === 1) {
    return 'пост';
  }

  if (last >= 2 && last <= 4) {
    return 'поста';
  }

  return 'постов';
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

.authors-button {
  height: 42;
  min-width: 84;
  border-radius: 21;
  font-size: 13;
  margin-right: 8;
  padding: 0 14;
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

.authors-modal-overlay {
  vertical-align: stretch;
}

.authors-modal-backdrop {
  background-color: rgba(0, 0, 0, 0.32);
}

.authors-modal-card {
  margin: 28 16;
  padding: 16;
  border-width: 1;
  border-color: #b87373;
  border-radius: 16;
  vertical-align: middle;
}

.authors-modal-header {
  margin-bottom: 12;
  vertical-align: middle;
}

.authors-modal-title {
  font-size: 22;
  font-weight: 600;
}

.authors-close-button {
  width: 38;
  height: 38;
  border-radius: 19;
  font-size: 20;
  padding: 0;
  text-transform: none;
}

.authors-search {
  height: 44;
  border-width: 1;
  border-color: #d7b8b8;
  border-radius: 12;
  padding: 0 12;
  margin-bottom: 12;
  font-size: 14;
}

.authors-state {
  padding: 18 8;
  font-size: 14;
  text-align: center;
}

.authors-scroll {
  height: 360;
}

.author-row {
  padding: 10 0;
  border-bottom-width: 1;
  border-bottom-color: #dbc6c6;
  vertical-align: middle;
}

.author-row-name {
  font-size: 16;
  font-weight: 600;
}

.author-row-count {
  font-size: 12;
  margin-top: 3;
}

.author-follow-button {
  width: 118;
  height: 36;
  border-radius: 18;
  font-size: 12;
  padding: 0;
  text-transform: none;
}
</style>
