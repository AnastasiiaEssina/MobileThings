<template>
  <GridLayout class="preview-shell" :class="shellClass">
    <Image
      v-if="item.imageUrl"
      :src="item.imageUrl"
      loadMode="async"
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
  background-color: #e4eaed;
  border-width: 1;
  border-color: #cbd2d7;
  border-radius: 14;
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

.shell-xs {
  width: 42;
  height: 42;
}

.image-xs {
  width: 36;
  height: 36;
}

.shell-sm {
  width: 56;
  height: 56;
}

.image-sm {
  width: 48;
  height: 48;
}

.shell-md {
  width: 60;
  height: 60;
}

.image-md {
  width: 52;
  height: 52;
}

.shell-lg {
  width: 132;
  height: 132;
}

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
