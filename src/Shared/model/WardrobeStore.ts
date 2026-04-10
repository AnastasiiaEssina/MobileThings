import { ref } from 'vue';
import type { Clothing } from './Wardrobe';
import { CLOTHES, STANDARD_CLOTHES } from './WardrobeData';

const myClothes = ref<Clothing[]>([...CLOTHES]);

export function useWardrobeStore() {
  function addClothingToMyWardrobe(clothingId: string) {
    if (myClothes.value.some((item) => item.id === clothingId)) {
      return;
    }

    const clothing = STANDARD_CLOTHES.find((item) => item.id === clothingId);

    if (!clothing) {
      return;
    }

    myClothes.value = [...myClothes.value, clothing];
  }

  return {
    myClothes,
    standardClothes: STANDARD_CLOTHES,
    addClothingToMyWardrobe,
  };
}
