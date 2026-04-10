<template>
  <GridLayout class="preview-shell" :class="shellClass" :backgroundColor="COLORS.cardBackground">
    <GridLayout
      v-if="items.length"
      class="preview-grid"
      :class="gridClass"
      :columns="columnsTemplate"
      :rows="rowsTemplate"
    >
      <GridLayout
        v-for="(item, index) in items"
        :key="item.id"
        :row="getRow(index)"
        :col="getColumn(index)"
        class="preview-piece"
        :margin="gap / 2"
        :width="cellSize"
        :height="cellSize"
      >
        <Image
          v-if="item.imageUrl"
          :src="item.imageUrl"
          loadMode="async"
          stretch="aspectFit"
          :width="innerCellSize"
          :height="innerCellSize"
          class="preview-image"
        />
        <GridLayout
          v-else
          class="preview-placeholder"
          :backgroundColor="item.fillColor || COLORS.cardBackground"
          :width="innerCellSize"
          :height="innerCellSize"
        >
          <Label :text="item.emoji || '👕'" class="preview-emoji" :fontSize="emojiFontSize" />
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
  { width: number; height: number; paddingX: number; paddingY: number; gap: number }
> = {
  tiny: {
    width: 136,
    height: 136,
    paddingX: 10,
    paddingY: 10,
    gap: 4,
  },
  card: {
    width: 188,
    height: 188,
    paddingX: 12,
    paddingY: 12,
    gap: 6,
  },
  large: {
    width: 316,
    height: 336,
    paddingX: 18,
    paddingY: 18,
    gap: 8,
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
const gridClass = computed(() => `grid-${props.variant}`);
const itemCount = computed(() => props.items.length);
const columns = computed(() => {
  if (itemCount.value <= 1) {
    return 1;
  }

  return Math.ceil(Math.sqrt(itemCount.value));
});
const rows = computed(() => {
  if (itemCount.value === 0) {
    return 0;
  }

  return Math.ceil(itemCount.value / columns.value);
});
const columnsTemplate = computed(() => Array.from({ length: columns.value }, () => 'auto').join(','));
const rowsTemplate = computed(() => Array.from({ length: rows.value }, () => 'auto').join(','));
const gap = computed(() => config.value.gap);
const cellSize = computed(() => {
  if (itemCount.value === 0) {
    return 0;
  }

  const availableWidth =
    config.value.width - config.value.paddingX * 2 - Math.max(columns.value - 1, 0) * gap.value;
  const availableHeight =
    config.value.height - config.value.paddingY * 2 - Math.max(rows.value - 1, 0) * gap.value;
  const nextSize = Math.floor(
    Math.min(availableWidth / columns.value, availableHeight / rows.value)
  );

  return Math.max(nextSize, 14);
});
const innerCellSize = computed(() => {
  const inset = props.variant === 'large' ? 10 : 8;
  return Math.max(cellSize.value - inset, 10);
});
const emojiFontSize = computed(() => Math.max(Math.floor(innerCellSize.value * 0.48), 10));

function getRow(index: number) {
  return Math.floor(index / columns.value);
}

function getColumn(index: number) {
  return index % columns.value;
}
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

.grid-tiny {
  padding: 10;
}

.shell-card {
  width: 188;
  height: 188;
}

.grid-card {
  padding: 12;
}

.shell-large {
  width: 316;
  height: 336;
}

.grid-large {
  padding: 18;
}

.empty-label {
  horizontal-align: center;
  vertical-align: middle;
  font-size: 15;
}
</style>
