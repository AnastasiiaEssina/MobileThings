<template>
  <GridLayout class="preview-shell" :class="shellClass" :backgroundColor="COLORS.cardBackground">
    <WrapLayout class="preview-grid" :class="gridClass">
      <StackLayout
        v-for="item in visibleItems"
        :key="item.id"
        class="preview-piece"
        :class="pieceClass"
      >
        <ClothingPreview :item="item" :size="pieceSize" />
      </StackLayout>
    </WrapLayout>

    <Label
      v-if="!visibleItems.length"
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
import ClothingPreview from './ClothingPreview.vue';

const props = withDefaults(
  defineProps<{
    items: Clothing[];
    variant?: 'tiny' | 'card' | 'large';
  }>(),
  {
    variant: 'card',
  }
);

const visibleItems = computed(() => props.items.slice(0, 4));
const shellClass = computed(() => `shell-${props.variant}`);
const gridClass = computed(() => `grid-${props.variant}`);
const pieceClass = computed(() => `piece-${props.variant}`);
const pieceSize = computed(() => {
  if (props.variant === 'tiny') {
    return 'xs';
  }

  if (props.variant === 'large') {
    return 'lg';
  }

  return 'md';
});
</script>

<style scoped>
.preview-shell {
  border-radius: 16;
}

.preview-grid {
  horizontal-align: center;
  vertical-align: middle;
}

.preview-piece {
  horizontal-align: center;
  vertical-align: middle;
}

.shell-tiny {
  width: 114;
  height: 114;
}

.grid-tiny {
  padding: 10 8;
}

.piece-tiny {
  width: 48;
  height: 48;
  margin: 2;
}

.shell-card {
  width: 150;
  height: 168;
}

.grid-card {
  padding: 18 10 10 10;
}

.piece-card {
  width: 64;
  height: 64;
  margin: 3;
}

.shell-large {
  width: 316;
  height: 336;
}

.grid-large {
  padding: 20 20 16 20;
}

.piece-large {
  width: 138;
  height: 138;
  margin: 4;
}

.empty-label {
  horizontal-align: center;
  vertical-align: middle;
  font-size: 15;
}
</style>
