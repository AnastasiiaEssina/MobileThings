<template>
  <GridLayout class="preview-shell" :class="shellClass">
    <Image
      v-if="item.imageUrl"
      :src="item.imageUrl"
      stretch="aspectFit"
      class="preview-image"
      :class="imageClass"
    />
    <GridLayout
      v-else
      class="preview-placeholder"
      :class="imageClass"
      :backgroundColor="item.fillColor || COLORS.cardBackground"
    >
      <Label :text="item.emoji || '👕'" class="preview-emoji" :class="emojiClass" />
    </GridLayout>
  </GridLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Clothing } from '../model/Wardrobe';
import { COLORS } from './Colors';

const props = withDefaults(
  defineProps<{
    item: Clothing;
    size?: 'xs' | 'sm' | 'md' | 'lg';
  }>(),
  {
    size: 'sm',
  }
);

const shellClass = computed(() => `shell-${props.size}`);
const imageClass = computed(() => `image-${props.size}`);
const emojiClass = computed(() => `emoji-${props.size}`);
</script>

<style scoped>
.preview-shell {
  horizontal-align: center;
  vertical-align: middle;
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

.shell-xs,
.image-xs {
  width: 42;
  height: 42;
}

.shell-sm,
.image-sm {
  width: 56;
  height: 56;
}

.shell-md,
.image-md {
  width: 60;
  height: 60;
}

.shell-lg,
.image-lg {
  width: 124;
  height: 124;
}

.emoji-xs {
  font-size: 20;
}

.emoji-sm {
  font-size: 30;
}

.emoji-md {
  font-size: 32;
}

.emoji-lg {
  font-size: 58;
}
</style>
