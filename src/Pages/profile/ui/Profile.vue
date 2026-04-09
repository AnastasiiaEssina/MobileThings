<template>
  <Page class="page">
    <GridLayout rows="auto, *, auto">
      <!-- Верх -->
      <GridLayout row="0" rows="auto, auto, auto" class="header">
        <GridLayout columns="*, auto" class="top-bar">
          <Label col="0" text="12:30" class="time" />
          <Label col="1" text="⚙" class="settings-icon" />
        </GridLayout>

        <StackLayout class="profile-block">
          <Image
            src="~/assets/bird.jpg"
            stretch="aspectFill"
            class="avatar"
          />
          <Label text="Каролина" class="username" />
          <Button text="Опубликовать образ" class="publish-btn" />
        </StackLayout>
      </GridLayout>

      <!-- Контент -->
      <ScrollView row="1">
        <StackLayout class="content">
          <GridLayout
            v-for="item in outfits"
            :key="item.id"
            rows="*"
            columns="*"
            class="outfit-card"
          >
            <AbsoluteLayout>
              <Image
                :src="item.dress"
                stretch="aspectFit"
                class="dress-image"
                left="120"
                top="20"
              />
              <Image
                :src="item.boot"
                stretch="aspectFit"
                class="boot-image"
                left="10"
                top="190"
              />
              <Label text="•••" class="menu-dots" left="220" top="10" />
              <GridLayout columns="auto, auto" class="views-block" left="190" top="300">
                <Label text="👁" class="eye-icon" col="0" />
                <Label :text="String(item.views)" class="views-text" col="1" />
              </GridLayout>
            </AbsoluteLayout>
          </GridLayout>

          <!-- Вторая пустая карточка, как на скрине -->
          <GridLayout rows="*" columns="*" class="outfit-card second-card">
            <Label text="" />
          </GridLayout>
        </StackLayout>
      </ScrollView>

      <!-- Нижняя навигация -->
      <GridLayout row="2" columns="*, *, *, *" class="bottom-nav">
        <StackLayout col="0" class="nav-item active">
          <Label text="⌂" class="nav-icon" />
        </StackLayout>

        <StackLayout col="1" class="nav-item">
          <Label text="🎒" class="nav-icon" />
        </StackLayout>

        <StackLayout col="2" class="nav-item">
          <Label text="🤚" class="nav-icon" />
        </StackLayout>

        <StackLayout col="3" class="nav-item">
          <Label text="◯" class="nav-icon profile-icon" />
        </StackLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
const outfits = [
  {
    id: 1,
    views: 124,
    dress:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b5de?q=80&w=700&auto=format&fit=crop",
    boot:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500&auto=format&fit=crop",
  },
];
</script>

<style scoped>
.page {
  background-color: #f5f0e4;
}

.header {
  padding-top: 12;
  padding-left: 10;
  padding-right: 10;
}

.top-bar {
  margin-bottom: 8;
  vertical-align: middle;
}

.time {
  font-size: 14;
  color: #222222;
}

.settings-icon {
  font-size: 20;
  color: #8b2d3b;
  text-align: right;
}

.profile-block {
  horizontal-align: center;
  text-align: center;
}

.avatar {
  width: 100;
  height: 100;
  border-radius: 50;
  margin-top: 4;
}

.username {
  margin-top: 10;
  font-size: 20;
  color: #8b2d3b;
  text-align: center;
}

.publish-btn {
  margin-top: 10;
  width: 270;
  height: 46;
  border-radius: 23;
  background-color: #a8b6b0;
  color: #8b2d3b;
  font-size: 16;
  padding: 0;
}

.content {
  padding: 14 16 16 16;
}

.outfit-card {
  height: 340;
  background-color: #e9e9e9;
  border-width: 1;
  border-color: #8b2d3b;
  border-radius: 16;
  margin-bottom: 18;
}

.second-card {
  height: 120;
}

.dress-image {
  width: 120;
  height: 240;
}

.boot-image {
  width: 95;
  height: 110;
}

.menu-dots {
  color: #8b2d3b;
  font-size: 18;
}

.views-block {
  vertical-align: middle;
}

.eye-icon {
  color: #8b2d3b;
  font-size: 14;
  margin-right: 4;
}

.views-text {
  color: #4f3a3a;
  font-size: 13;
  margin-left: 3;
}

.bottom-nav {
  padding: 8 10 12 10;
  background-color: #f5f0e4;
}

.nav-item {
  width: 54;
  height: 54;
  border-radius: 27;
  border-width: 1;
  border-color: #bfae8d;
  background-color: #f7f4ea;
  horizontal-align: center;
  vertical-align: middle;
}

.nav-item.active {
  border-color: #8b2d3b;
}

.nav-icon {
  text-align: center;
  vertical-align: middle;
  font-size: 24;
  color: #8b2d3b;
  margin-top: 10;
}

.profile-icon {
  font-size: 22;
}
</style>