import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  QuoteItem,
  Quote,
  QuoteCanvasState,
  QuoteCanvasAction,
  ItemDiscountType,
  DragState,
} from './quote.types';
import { calculateItemTotals, createQuoteItemFromCatalog } from './quote.types';
import { computeQuoteTotals } from './useQuoteTotals';

const STORAGE_KEY_PREFIX = 'aurea_quote_draft_';
const DEBOUNCE_MS = 1000;

interface QuoteCanvasStore extends QuoteCanvasState {
  eventoId: string | null;
  version: number;
  
  dispatch: (action: QuoteCanvasAction) => void;
  addItem: (item: QuoteItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updatePrice: (itemId: string, unitPrice: number) => void;
  updateDiscount: (itemId: string, discountType: ItemDiscountType, discountValue: number) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  setFocusMode: (active: boolean) => void;
  setPreviewMode: (mode: 'canvas' | 'pdf') => void;
  setNotes: (notes: string) => void;
  setActiveItem: (itemId: string | null) => void;
  markDirty: () => void;
  markSaving: (isSaving: boolean) => void;
  markSaved: (quoteId: string, version: number) => void;
  loadQuote: (quote: Quote) => void;
  setDragState: (state: DragState | null) => void;
  removeNewFlag: (itemId: string) => void;
  initFromCatalog: (catalogItem: { id: string; nombre: string; categoria: string; precio: number; unidad?: string; stock?: number; permite_cambio: boolean }, quantity?: number) => void;
  clearCanvas: () => void;
  getTotals: () => ReturnType<typeof computeQuoteTotals>;
  saveToStorage: () => void;
  loadFromStorage: (eventoId: string) => boolean;
  saveToSupabase: () => Promise<void>;
}

export const useQuoteCanvas = create<QuoteCanvasStore>()(
  subscribeWithSelector((set, get) => ({
    quoteId: null,
    eventoId: null,
    version: 0,
    items: [],
    isDirty: false,
    isSaving: false,
    focusMode: false,
    activeItemId: null,
    dragState: null,
    previewMode: 'canvas',

    dispatch: (action: QuoteCanvasAction) => {
      const state = get();
      
      switch (action.type) {
        case 'ADD_ITEM': {
          const newItem = {
            ...action.item,
            sortOrder: state.items.length,
          };
          set({
            items: [...state.items, newItem],
            isDirty: true,
          });
          get().saveToStorage();
          scheduleAutosave(get);
          break;
        }
        
        case 'REMOVE_ITEM': {
          const newItems = state.items
            .filter(item => item.id !== action.itemId)
            .map((item, index) => ({ ...item, sortOrder: index }));
          set({ items: newItems, isDirty: true });
          get().saveToStorage();
          scheduleAutosave(get);
          break;
        }
        
        case 'UPDATE_QUANTITY': {
          const items = state.items.map(item => {
            if (item.id === action.itemId) {
              const updated = { ...item, quantity: Math.max(1, action.quantity) };
              let stockStatus = item.stockStatus;
              if (item.stockQuantityAvailable > 0) {
                stockStatus = action.quantity > item.stockQuantityAvailable ? 'low' : 'available';
              }
              return { ...updated, stockStatus, ...calculateItemTotals(updated) };
            }
            return item;
          });
          set({ items, isDirty: true });
          get().saveToStorage();
          scheduleAutosave(get);
          break;
        }
        
        case 'UPDATE_PRICE': {
          const items = state.items.map(item => {
            if (item.id === action.itemId) {
              const updated = { ...item, unitPrice: Math.max(0, action.unitPrice) };
              return { ...updated, ...calculateItemTotals(updated) };
            }
            return item;
          });
          set({ items, isDirty: true });
          get().saveToStorage();
          scheduleAutosave(get);
          break;
        }
        
        case 'UPDATE_DISCOUNT': {
          const items = state.items.map(item => {
            if (item.id === action.itemId) {
              const updated = {
                ...item,
                discountType: action.discountType,
                discountValue: action.discountValue,
              };
              return { ...updated, ...calculateItemTotals(updated) };
            }
            return item;
          });
          set({ items, isDirty: true });
          get().saveToStorage();
          scheduleAutosave(get);
          break;
        }
        
        case 'REORDER': {
          const items = [...state.items];
          const [removed] = items.splice(action.fromIndex, 1);
          items.splice(action.toIndex, 0, removed);
          const reordered = items.map((item, index) => ({ ...item, sortOrder: index }));
          set({ items: reordered, isDirty: true });
          get().saveToStorage();
          break;
        }
        
        case 'SET_FOCUS_MODE':
          set({ focusMode: action.active });
          break;
        
        case 'SET_PREVIEW_MODE':
          set({ previewMode: action.mode });
          break;
        
        case 'SET_NOTES':
          set({ isDirty: true });
          get().saveToStorage();
          break;
        
        case 'SET_ACTIVE_ITEM':
          set({ activeItemId: action.itemId });
          break;
        
        case 'MARK_DIRTY':
          set({ isDirty: true });
          break;
        
        case 'MARK_SAVING':
          set({ isSaving: action.isSaving });
          break;
        
        case 'MARK_SAVED':
          set({
            quoteId: action.quoteId,
            version: action.version,
            isDirty: false,
            isSaving: false,
          });
          break;
        
        case 'LOAD_QUOTE':
          set({
            quoteId: action.quote.id,
            eventoId: action.quote.eventoId,
            version: action.quote.version,
            items: action.quote.items,
            isDirty: false,
            isSaving: false,
          });
          break;
        
        case 'SET_DRAG_STATE':
          set({ dragState: action.state });
          break;
        
        case 'REMOVE_NEW_FLAG': {
          const items = state.items.map(item =>
            item.id === action.itemId ? { ...item, isNew: false } : item
          );
          set({ items });
          break;
        }
      }
    },

    addItem: (item: QuoteItem) => {
      get().dispatch({ type: 'ADD_ITEM', item });
    },

    removeItem: (itemId: string) => {
      get().dispatch({ type: 'REMOVE_ITEM', itemId });
    },

    updateQuantity: (itemId: string, quantity: number) => {
      get().dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity });
    },

    updatePrice: (itemId: string, unitPrice: number) => {
      get().dispatch({ type: 'UPDATE_PRICE', itemId, unitPrice });
    },

    updateDiscount: (itemId: string, discountType: ItemDiscountType, discountValue: number) => {
      get().dispatch({ type: 'UPDATE_DISCOUNT', itemId, discountType, discountValue });
    },

    reorderItems: (fromIndex: number, toIndex: number) => {
      get().dispatch({ type: 'REORDER', fromIndex, toIndex });
    },

    setFocusMode: (active: boolean) => {
      get().dispatch({ type: 'SET_FOCUS_MODE', active });
    },

    setPreviewMode: (mode: 'canvas' | 'pdf') => {
      get().dispatch({ type: 'SET_PREVIEW_MODE', mode });
    },

    setNotes: (notes: string) => {
      get().dispatch({ type: 'SET_NOTES', notes });
    },

    setActiveItem: (itemId: string | null) => {
      get().dispatch({ type: 'SET_ACTIVE_ITEM', itemId });
    },

    markDirty: () => {
      get().dispatch({ type: 'MARK_DIRTY' });
    },

    markSaving: (isSaving: boolean) => {
      get().dispatch({ type: 'MARK_SAVING', isSaving });
    },

    markSaved: (quoteId: string, version: number) => {
      get().dispatch({ type: 'MARK_SAVED', quoteId, version });
    },

    loadQuote: (quote: Quote) => {
      get().dispatch({ type: 'LOAD_QUOTE', quote });
    },

    setDragState: (state: DragState | null) => {
      get().dispatch({ type: 'SET_DRAG_STATE', state });
    },

    removeNewFlag: (itemId: string) => {
      get().dispatch({ type: 'REMOVE_NEW_FLAG', itemId });
    },

    initFromCatalog: (catalogItem, quantity = 1) => {
      const item = createQuoteItemFromCatalog(catalogItem, quantity);
      get().addItem(item);
      setTimeout(() => {
        get().removeNewFlag(item.id);
      }, 300);
    },

    clearCanvas: () => {
      const { eventoId } = get();
      set({
        quoteId: null,
        items: [],
        isDirty: false,
        isSaving: false,
        focusMode: false,
        activeItemId: null,
        dragState: null,
        previewMode: 'canvas',
      });
      if (eventoId) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${eventoId}`);
      }
    },

    getTotals: () => {
      return computeQuoteTotals(get().items);
    },

    saveToStorage: () => {
      const { eventoId, items, quoteId, version } = get();
      if (!eventoId) return;
      
      const data = {
        quoteId,
        eventoId,
        version,
        items,
        savedAt: new Date().toISOString(),
      };
      
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${eventoId}`, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },

    loadFromStorage: (eventoId: string) => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${eventoId}`);
        if (stored) {
          const data = JSON.parse(stored);
          set({
            quoteId: data.quoteId,
            eventoId: data.eventoId,
            version: data.version,
            items: data.items,
            isDirty: false,
          });
          return true;
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
      }
      return false;
    },

    saveToSupabase: async () => {
      const state = get();
      if (!state.eventoId || state.isSaving) return;
      
      get().markSaving(true);
      
      try {
        const supabase = (window as unknown as { supabase: SupabaseClient }).supabase;
        const totals = computeQuoteTotals(state.items);
        
        if (state.quoteId) {
          const { error } = await supabase
            .from('cotizaciones')
            .update({
              subtotal: totals.subtotal,
              discount_total: totals.discountTotal,
              total: totals.total,
              notes: '',
            })
            .eq('id', state.quoteId);
          
          if (error) throw error;
          
          await supabase
            .from('quote_items')
            .delete()
            .eq('cotizacion_id', state.quoteId);
          
          if (state.items.length > 0) {
            const itemsToInsert = state.items.map((item, index) => ({
              cotizacion_id: state.quoteId,
              catalog_item_id: item.catalogItemId,
              name: item.name,
              name_original: item.nameOriginal,
              category: item.category,
              description: item.description || '',
              unit: item.unit,
              unit_price: item.unitPrice,
              discount_type: item.discountType,
              discount_value: item.discountValue,
              quantity: item.quantity,
              stock_status: item.stockStatus,
              stock_quantity_available: item.stockQuantityAvailable,
              sort_order: index,
              notes: item.notes || '',
            }));
            
            const { error: itemsError } = await supabase
              .from('quote_items')
              .insert(itemsToInsert);
            
            if (itemsError) throw itemsError;
          }
          
          get().markSaved(state.quoteId, state.version);
        } else {
          const { data: newQuote, error: quoteError } = await supabase
            .from('cotizaciones')
            .insert({
              evento_id: state.eventoId,
              status: 'draft',
              subtotal: totals.subtotal,
              discount_total: totals.discountTotal,
              total: totals.total,
            })
            .select()
            .single();
          
          if (quoteError) throw quoteError;
          
          if (state.items.length > 0) {
            const itemsToInsert = state.items.map((item, index) => ({
              cotizacion_id: newQuote.id,
              catalog_item_id: item.catalogItemId,
              name: item.name,
              name_original: item.nameOriginal,
              category: item.category,
              description: item.description || '',
              unit: item.unit,
              unit_price: item.unitPrice,
              discount_type: item.discountType,
              discount_value: item.discountValue,
              quantity: item.quantity,
              stock_status: item.stockStatus,
              stock_quantity_available: item.stockQuantityAvailable,
              sort_order: index,
              notes: item.notes || '',
            }));
            
            await supabase.from('quote_items').insert(itemsToInsert);
          }
          
          get().markSaved(newQuote.id, newQuote.version);
        }
      } catch (error) {
        console.error('Failed to save to Supabase:', error);
        get().markSaving(false);
        throw error;
      }
    },
  }))
);

let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(get: () => QuoteCanvasStore) {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  
  autosaveTimeout = setTimeout(() => {
    get().saveToSupabase();
    autosaveTimeout = null;
  }, DEBOUNCE_MS);
}

interface SupabaseClient {
  from: (table: string) => {
    insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> }; };
    update: (data: Record<string, unknown>) => { eq: (field: string, value: string) => Promise<{ error: Error | null }> };
    delete: () => { eq: (field: string, value: string) => Promise<{ error: Error | null }> };
  };
}
