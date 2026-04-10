// src/Pages/MyOutfits/model/Machine.ts
import { Outfit, OutfitFilterState, matchesOutfitFilters } from '../../../Shared/model/Wardrobe';
import { createMachine, assign } from 'xstate';

interface OutfitsContext {
  outfits: Outfit[];
  filteredOutfits: Outfit[];
  filters: OutfitFilterState;
  isLoading: boolean;
  error: string | null;
}

type OutfitsEvent =
  | { type: 'FETCH_OUTFITS' }
  | { type: 'FETCH_SUCCESS'; outfits: Outfit[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_FILTER'; payload: Partial<OutfitFilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'ADD_OUTFIT'; payload: Outfit }
  | { type: 'DELETE_OUTFIT'; payload: string };

export const outfitsMachine = createMachine({
  types: {} as {
    context: OutfitsContext;
    events: OutfitsEvent;
  },
  
  id: 'outfits',
  initial: 'idle',
  
  context: {
    outfits: [],
    filteredOutfits: [],
    filters: {
      style: 'all',
      season: 'all',
      colorScheme: 'all',
    },
    isLoading: false,
    error: null,
  },
  
  states: {
    idle: {
      on: {
        FETCH_OUTFITS: 'loading',
      },
    },
    loading: {
      entry: assign({
        isLoading: true,
        error: null,
      }),
      on: {
        FETCH_SUCCESS: {
          target: 'loaded',
          actions: assign(({ context, event }) => ({
            outfits: event.outfits,
            filteredOutfits: event.outfits,
            isLoading: false,
          })),
        },
        FETCH_ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error,
            isLoading: false,
          }),
        },
      },
    },
    loaded: {
      entry: assign({ isLoading: false }),
      on: {
        FETCH_OUTFITS: 'loading',
        FETCH_SUCCESS: {
          actions: assign(({ context, event }) => ({
            outfits: event.outfits,
            filteredOutfits: event.outfits.filter((outfit) =>
              matchesOutfitFilters(outfit, context.filters)
            ),
            isLoading: false,
          })),
        },
        
        SET_FILTER: {
          actions: assign(({ context, event }) => {
            const newFilters = { ...context.filters, ...event.payload };
            const newFiltered = context.outfits.filter((outfit) =>
              matchesOutfitFilters(outfit, newFilters)
            );

            return {
              filters: newFilters,
              filteredOutfits: newFiltered,
            };
          }),
        },
        
        RESET_FILTERS: {
          actions: assign({
            filters: {
              style: 'all',
              season: 'all',
              colorScheme: 'all',
            },
            filteredOutfits: ({ context }) => [...context.outfits],
          }),
        },
        
        ADD_OUTFIT: {
          actions: assign(({ context, event }) => {
            const newOutfits = [...context.outfits, event.payload];
            const isMatch = matchesOutfitFilters(event.payload, context.filters);

            return {
              outfits: newOutfits,
              filteredOutfits: isMatch ? [...context.filteredOutfits, event.payload] : context.filteredOutfits,
            };
          }),
        },
        
        DELETE_OUTFIT: {
          actions: assign({
            outfits: ({ context, event }) => context.outfits.filter((o) => o.id !== event.payload),
            filteredOutfits: ({ context, event }) => context.filteredOutfits.filter((o) => o.id !== event.payload),
          }),
        },
      },
    },
    error: {
      entry: assign({ isLoading: false }),
      on: {
        FETCH_OUTFITS: 'loading',
      },
    },
  },
});
