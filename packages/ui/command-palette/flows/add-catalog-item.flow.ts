import type { IntentFlow, CommandItem, PluginContext } from '../../../../packages/plugin-sdk/types/plugin.types';

interface CatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  unidad?: string;
  stock?: number;
  permite_cambio: boolean;
}

function extractQuantity(query: string): number | null {
  const match = query.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function extractItemName(query: string): string | null {
  const stopWords = ['añadir', 'agregar', 'buscar', 'al', 'presupuesto', 'para', 'de', 'item', 'un', 'una'];
  const cleaned = query
    .toLowerCase()
    .split(' ')
    .filter(w => !stopWords.includes(w) && !/^\d+$/.test(w))
    .join(' ')
    .trim();
  return cleaned || null;
}

export const addCatalogItemFlow: IntentFlow = {
  id: 'add_catalog_item',
  triggers: ['añadir', 'agregar', 'buscar', 'item', 'silla', 'mesa', 'flor', 'mantel', 'candelabro', 'arco', 'pista'],
  label: 'Añadir ítem al presupuesto',
  icon: 'Plus',
  shortcut: '⌘⇧A',

  resolve: (query: string, ctx: PluginContext) => {
    const itemNameMatch = extractItemName(query);
    const qtyMatch = extractQuantity(query);

    return {
      skipToStep: 0,
      prefilled: {
        searchQuery: itemNameMatch ?? '',
        quantity: qtyMatch ?? 1,
      },
    };
  },

  steps: [
    {
      id: 'search-item',
      type: 'catalog-search',
      placeholder: 'Buscar en catálogo: silla, mesa, arco…',
      async search(query: string, ctx: PluginContext): Promise<CatalogItem[]> {
        try {
          const supabase = (window as unknown as { supabase: SupabaseClient }).supabase;
          const { data, error } = await supabase
            .from('catalogo_precios')
            .select('id, nombre, categoria, precio, unidad, permite_cambio')
            .eq('activo', true)
            .or(`nombre.ilike.%${query}%,categoria.ilike.%${query}%`)
            .limit(10);

          if (error) throw error;

          const items: CatalogItem[] = (data || []).map(item => ({
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            precio: parseFloat(item.precio) || 0,
            unidad: item.unidad,
            stock: undefined,
            permite_cambio: item.permite_cambio,
          }));

          return items;
        } catch {
          return [];
        }
      },
    },
    {
      id: 'configure-item',
      type: 'item-configurator',
      fields: [
        {
          id: 'quantity',
          label: 'Cantidad',
          type: 'number',
          min: 1,
          defaultValue: 1,
          autoFocus: true,
        },
        {
          id: 'unitPrice',
          label: 'Precio unitario',
          type: 'currency',
          defaultValue: 0,
          editable: true,
        },
      ],
      livePreview: (fields: Record<string, number>) => {
        const subtotal = (fields.quantity || 0) * (fields.unitPrice || 0);
        return `Subtotal: $${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      },
      onConfirm: async (state: Record<string, { value: unknown }>, ctx: PluginContext) => {
        const selectedItem = state['search-item']?.value as CatalogItem | undefined;
        if (!selectedItem) return;

        const quantity = (state['configure-item']?.fields?.quantity as number) || 1;
        const unitPrice = (state['configure-item']?.fields?.unitPrice as number) || selectedItem.precio;

        const { createQuoteItemFromCatalog } = await import('../../../../packages/core/cotizaciones/quote.types');
        const item = createQuoteItemFromCatalog(
          {
            id: selectedItem.id,
            nombre: selectedItem.nombre,
            categoria: selectedItem.categoria,
            precio: unitPrice,
            unidad: selectedItem.unidad,
            stock: selectedItem.stock,
            permite_cambio: selectedItem.permite_cambio,
          },
          quantity
        );

        const { useQuoteCanvas } = await import('../../../../packages/core/cotizaciones/useQuoteCanvas');
        useQuoteCanvas.getState().addItem(item);

        const toast = (window as unknown as { aureaToast?: (msg: string, type: string) => void }).aureaToast;
        if (toast) {
          toast(`${selectedItem.nombre} añadido al presupuesto`, 'success');
        }
      },
    },
  ],
};

interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      or: (filter: string) => {
        eq: (column: string, value: unknown) => Promise<{ data: unknown[]; error: Error | null }>;
        limit: (n: number) => Promise<{ data: unknown[]; error: Error | null }>;
      };
    };
  };
}
