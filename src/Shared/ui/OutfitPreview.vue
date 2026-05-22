<template>
  <GridLayout class="preview-shell" :class="shellClass" :backgroundColor="COLORS.cardBackground">
    <GridLayout v-if="items.length" class="preview-board" :class="boardClass" rows="*, auto">
      <GridLayout
        row="0"
        class="preview-piece featured-piece"
        :width="heroSize"
        :height="heroSize"
      >
        <Image
          v-if="items[0].imageUrl"
          :src="items[0].imageUrl"
          loadMode="async"
          stretch="aspectFit"
          :width="heroImageSize"
          :height="heroImageSize"
          class="preview-image"
        />
        <GridLayout
          v-else
          class="preview-placeholder"
          :backgroundColor="items[0].fillColor || COLORS.cardBackground"
          :width="heroImageSize"
          :height="heroImageSize"
        >
          <Label :text="items[0].emoji || '👕'" class="preview-emoji" :fontSize="heroEmojiSize" />
        </GridLayout>
      </GridLayout>

      <GridLayout
        v-if="supportItems.length"
        row="1"
        class="support-strip"
        :columns="supportColumns"
      >
        <GridLayout
          v-for="(item, index) in supportItems"
          :key="item.id"
          :col="index"
          class="preview-piece support-piece"
          :width="supportSize"
          :height="supportSize"
        >
          <Image
            v-if="item.imageUrl"
            :src="item.imageUrl"
            loadMode="async"
            stretch="aspectFit"
            :width="supportImageSize"
            :height="supportImageSize"
            class="preview-image"
          />
          <GridLayout
            v-else
            class="preview-placeholder"
            :backgroundColor="item.fillColor || COLORS.cardBackground"
            :width="supportImageSize"
            :height="supportImageSize"
          >
            <Label :text="item.emoji || '👕'" class="preview-emoji" :fontSize="supportEmojiSize" />
          </GridLayout>

          <Label
            v-if="hiddenItemCount && index === supportItems.length - 1"
            :text="`+${hiddenItemCount}`"
            class="hidden-count"
          />
        </GridLayout>
      </GridLayout>
    </GridLayout>

    <Label
      v-else
      text="Пустой образ"
      class="empty-label"
      :color="COLORS.mutedText"
    />
  </GridLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Clothing } from '../model/Wardrobe';
import { COLORS } from './Colors';

type PreviewVariant = 'tiny' | 'card' | 'large';

const VARIANT_CONFIG: Record<
  PreviewVariant,
  {
    width: number;
    height: number;
    padding: number;
    heroSize: number;
    supportSize: number;
  }
> = {
  tiny: {
    width: 136,
    height: 136,
    padding: 10,
    heroSize: 68,
    supportSize: 38,
  },
  card: {
    width: 188,
    height: 188,
    padding: 12,
    heroSize: 96,
    supportSize: 54,
  },
  large: {
    width: 316,
    height: 336,
    padding: 18,
    heroSize: 184,
    supportSize: 76,
  },
};

const props = withDefaults(
  defineProps<{
    items: Clothing[];
    variant?: PreviewVariant;
  }>(),
  {
    variant: 'card',
  }
);

const config = computed(() => VARIANT_CONFIG[props.variant]);
const shellClass = computed(() => `shell-${props.variant}`);
const boardClass = computed(() => `board-${props.variant}`);
const supportItems = computed(() => props.items.slice(1, 4));
const hiddenItemCount = computed(() => Math.max(props.items.length - 4, 0));
const supportColumns = computed(() => supportItems.value.map(() => '*').join(','));
const heroSize = computed(() => config.value.heroSize);
const supportSize = computed(() => config.value.supportSize);
const heroImageSize = computed(() => config.value.heroSize - (props.variant === 'large' ? 16 : 10));
const supportImageSize = computed(() => config.value.supportSize - (props.variant === 'tiny' ? 6 : 10));
const heroEmojiSize = computed(() => Math.max(Math.floor(heroImageSize.value * 0.48), 10));
const supportEmojiSize = computed(() => Math.max(Math.floor(supportImageSize.value * 0.48), 10));
</script>

<style scoped>
.preview-shell {
  border-width: 1;
  border-color: #d3d8dc;
  border-radius: 16;
}

.preview-board {
  horizontal-align: center;
  vertical-align: middle;
}

.preview-piece {
  background-color: #e4eaed;
  border-width: 1;
  border-color: #cbd2d7;
  border-radius: 14;
  horizontal-align: center;
  vertical-align: middle;
}

.featured-piece {
  margin-bottom: 8;
}

.support-strip {
  horizontal-align: center;
}

.support-piece {
  margin: 0 4;
  border-radius: 12;
}

.preview-image,
.preview-placeholder {
  horizontal-align: center;
  vertical-align: middle;
}

.preview-placeholder {
  border-radius: 12;
}

.preview-emoji {
  horizontal-align: center;
  vertical-align: middle;
}

.shell-tiny {
  width: 136;
  height: 136;
}

.board-tiny {
  padding: 10;
}

.shell-card {
  width: 188;
  height: 188;
}

.board-card {
  padding: 12;
}

.shell-large {
  width: 316;
  height: 336;
}

.board-large {
  padding: 18;
}

.hidden-count {
  min-width: 22;
  height: 22;
  border-radius: 11;
  background-color: #7e1a2b;
  color: #ffffff;
  font-size: 11;
  text-align: center;
  horizontal-align: right;
  vertical-align: bottom;
  margin: 0 3 3 0;
}

.empty-label {
  horizontal-align: center;
  vertical-align: middle;
  font-size: 15;
}
</style>
