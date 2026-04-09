'use client';

import { useState, useCallback } from 'react';
import { useQuote } from './QuoteProvider';
import { calculateLineaTotal, formatCurrency, type QuoteItem } from './quote.types';
import { Trash2, GripVertical, Minus, Plus } from 'lucide-react';

interface QuoteItemRowProps {
  item: QuoteItem;
  index: number;
  currency: 'MXN' | 'USD';
}

export function QuoteItemRow({ item, index, currency }: QuoteItemRowProps) {
  const { updateItem, removeItem, toggleIva, toggleIsr } = useQuote();
  const { precioUnitarioEfectivo, lineaTotalOriginal, lineaTotalEfectiva, descuentoMonto } = calculateLineaTotal(item);
  
  const [isEditingNombre, setIsEditingNombre] = useState(false);
  const [isEditingPrecio, setIsEditingPrecio] = useState(false);
  const [editNombre, setEditNombre] = useState(item.nombre);
  const [editPrecio, setEditPrecio] = useState(String(item.precio_unitario));

  const handleNombreBlur = useCallback(() => {
    setIsEditingNombre(false);
    if (editNombre.trim() && editNombre !== item.nombre) {
      updateItem(item.id, { nombre: editNombre.trim() });
    }
  }, [editNombre, item.id, item.nombre, updateItem]);

  const handlePrecioBlur = useCallback(() => {
    setIsEditingPrecio(false);
    const newPrecio = parseFloat(editPrecio);
    if (!isNaN(newPrecio) && newPrecio >= 0 && newPrecio !== item.precio_unitario) {
      updateItem(item.id, { precio_unitario: newPrecio });
    } else {
      setEditPrecio(String(item.precio_unitario));
    }
  }, [editPrecio, item.id, item.precio_unitario, updateItem]);

  const handleCantidadChange = useCallback((delta: number) => {
    const newCantidad = Math.max(1, item.cantidad + delta);
    updateItem(item.id, { cantidad: newCantidad });
  }, [item.id, item.cantidad, updateItem]);

  const handleDescuentoChange = useCallback((delta: number) => {
    const newDescuento = Math.max(0, Math.min(100, item.descuento_pct + delta));
    updateItem(item.id, { descuento_pct: newDescuento });
  }, [item.id, item.descuento_pct, updateItem]);

  return (
    <div
      className="group flex flex-col gap-2 p-3 rounded-xl transition-all duration-200"
      style={{
        background: 'oklch(0.15 0 0)',
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" style={{ color: 'oklch(0.45 0 0)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isEditingNombre ? (
              <input
                type="text"
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                onBlur={handleNombreBlur}
                onKeyDown={e => e.key === 'Enter' && handleNombreBlur()}
                autoFocus
                className="px-1 py-0.5 rounded text-sm outline-none max-w-[180px]"
                style={{
                  background: 'oklch(0.20 0 0)',
                  color: 'oklch(0.95 0 0)',
                  border: '1px solid oklch(78% 0.12 75)',
                }}
              />
            ) : (
              <span 
                className="text-sm font-medium cursor-pointer hover:text-[oklch(78%_0.12_75)] transition-colors truncate"
                style={{ color: 'oklch(0.95 0 0)' }}
                onClick={() => setIsEditingNombre(true)}
              >
                {item.nombre}
              </span>
            )}
            
            {item.categoria_tag && (
              <span 
                className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                style={{ 
                  background: 'oklch(0.20 0 0)',
                  color: 'oklch(0.55 0 0)',
                }}
              >
                {item.categoria_tag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ color: 'oklch(0.50 0 0)' }}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDescuentoChange(-5)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span>{item.descuento_pct}% dto</span>
              <button
                onClick={() => handleDescuentoChange(5)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <span>Cant:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCantidadChange(-1)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center">{item.cantidad}</span>
              <button
                onClick={() => handleCantidadChange(1)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          {isEditingPrecio ? (
            <input
              type="number"
              value={editPrecio}
              onChange={e => setEditPrecio(e.target.value)}
              onBlur={handlePrecioBlur}
              onKeyDown={e => e.key === 'Enter' && handlePrecioBlur()}
              autoFocus
              className="w-20 px-2 py-1 rounded text-right text-sm outline-none"
              style={{
                background: 'oklch(0.20 0 0)',
                color: 'oklch(0.95 0 0)',
                border: '1px solid oklch(78% 0.12 75)',
              }}
            />
          ) : (
            <span 
              className="text-sm font-medium cursor-pointer hover:text-[oklch(78%_0.12_75)] transition-colors"
              style={{ color: 'oklch(0.95 0 0)' }}
              onClick={() => {
                setEditPrecio(String(item.precio_unitario));
                setIsEditingPrecio(true);
              }}
            >
              {formatCurrency(precioUnitarioEfectivo, currency)} c/u
            </span>
          )}
          
          <div className="text-xs" style={{ color: 'oklch(0.50 0 0)' }}>
            {formatCurrency(lineaTotalEfectiva, currency)}
          </div>
          
          {descuentoMonto > 0 && (
            <div className="text-xs line-through" style={{ color: 'oklch(0.40 0 0)' }}>
              {formatCurrency(lineaTotalOriginal, currency)}
            </div>
          )}
        </div>

        <button
          onClick={() => removeItem(item.id)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
          style={{ color: 'oklch(0.55 0.18 30)' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 ml-7">
        <span className="text-[10px]" style={{ color: 'oklch(0.45 0 0)' }}>Impuestos:</span>
        
        <button
          onClick={() => toggleIva(item.id)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all"
          style={{
            background: item.incluye_iva ? 'oklch(78% 0.12 75 / 0.2)' : 'oklch(0.18 0 0)',
            color: item.incluye_iva ? 'oklch(78% 0.12 75)' : 'oklch(0.45 0 0)',
          }}
        >
          <span>IVA</span>
          <span className="text-[9px] opacity-70">16%</span>
        </button>

        <button
          onClick={() => toggleIsr(item.id)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all"
          style={{
            background: item.incluye_isr ? 'oklch(78% 0.12 75 / 0.2)' : 'oklch(0.18 0 0)',
            color: item.incluye_isr ? 'oklch(78% 0.12 75)' : 'oklch(0.45 0 0)',
          }}
        >
          <span>ISR</span>
          <span className="text-[9px] opacity-70">1.25%</span>
        </button>
      </div>
    </div>
  );
}
