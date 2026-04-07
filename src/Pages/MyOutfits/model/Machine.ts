// src/Pages/MyOutfits/model/Machine.ts
import { Outfit, FilterState } from '~/Shared/model/FilterTypes';
import { createMachine, assign } from 'xstate';

interface OutfitsContext {
  outfits: Outfit[];
  filteredOutfits: Outfit[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
}

type OutfitsEvent =
  | { type: 'FETCH_OUTFITS' }
  | { type: 'FETCH_SUCCESS'; outfits: Outfit[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
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
        
        SET_FILTER: {
          actions: assign(({ context, event }) => {
            const newFilters = { ...context.filters, ...event.payload };
            const newFiltered = context.outfits.filter((outfit) => {
              const matchStyle = newFilters.style === 'all' || outfit.style === newFilters.style;
              const matchSeason = newFilters.season === 'all' || outfit.season === newFilters.season;
              const matchColor = newFilters.colorScheme === 'all' || outfit.colorScheme === newFilters.colorScheme;
              return matchStyle && matchSeason && matchColor;
            });

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
            const isMatch = 
              (context.filters.style === 'all' || event.payload.style === context.filters.style) &&
              (context.filters.season === 'all' || event.payload.season === context.filters.season) &&
              (context.filters.colorScheme === 'all' || event.payload.colorScheme === context.filters.colorScheme);

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