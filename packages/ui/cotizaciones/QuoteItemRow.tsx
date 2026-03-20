'use client';

import { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Minus, Plus, AlertCircle, Package } from 'lucide-react';
import type { QuoteItem, ItemStockStatus } from '../../../../packages/core/cotizaciones/quote.types';
import { formatCurrency } from '../../../../packages/core/cotizaciones/useQuoteTotals';

interface QuoteItemRowProps {
  item: QuoteItem;
  isActive: boolean;
  onSelect: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const stockStatusConfig: Record<ItemStockStatus, {
  surface: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  label: string;
  icon: typeof AlertCircle;
}> = {
  available: {
    surface: 'bg-white dark:bg-neutral-900',
    border: 'border-neutral-200 dark:border-neutral-800',
    badgeBg: 'bg-transparent',
    badgeText: 'text-transparent',
    label: '',
    icon: Package,
  },
  low: {
    surface: 'bg-aurea-logistics-upcoming-surface',
    border: 'border-aurea-logistics-upcoming-border',
    badgeBg: 'bg-aurea-logistics-upcoming-border',
    badgeText: 'text-aurea-logistics-upcoming-text',
    label: 'Poco stock',
    icon: AlertCircle,
  },
  out_of_stock: {
    surface: 'bg-aurea-logistics-urgent-surface/50',
    border: 'border-aurea-logistics-urgent-border/60',
    badgeBg: 'bg-aurea-logistics-urgent-border',
    badgeText: 'text-white',
    label: 'Sin stock',
    icon: AlertCircle,
  },
  on_demand: {
    surface: 'bg-aurea-financial-paid-surface/40',
    border: 'border-aurea-logistics-confirmed-border/60',
    badgeBg: 'bg-aurea-logistics-confirmed-border',
    badgeText: 'text-white',
    label: 'Bajo pedido',
    icon: Package,
  },
};

export function QuoteItemRow({
  item,
  isActive,
  onSelect,
  onQuantityChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: QuoteItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const config = stockStatusConfig[item.stockStatus];
  const StatusIcon = config.icon;
  
  const hasDiscount = item.discountType !== 'none' && item.discountValue > 0;
  const isOutOfStock = item.stockStatus === 'out_of_stock';
  const showMuted = isOutOfStock;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (item.isNew) {
      const timer = setTimeout(() => {
        setIsEditing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [item.isNew]);

  const handleNameSubmit = () => {
    setIsEditing(false);
  };

  const handleQuantityIncrement = () => {
    onQuantityChange(item.quantity + 1);
  };

  const handleQuantityDecrement = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.quantity - 1);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 transition-all duration-200
        ${config.surface} ${config.border} border-r border-t border-b
        ${isActive ? 'ring-2 ring-aurea-gold ring-offset-2' : ''}
        ${item.isNew ? 'animate-item-enter' : ''}
        ${isOutOfStock ? 'opacity-60' : ''}
        hover:shadow-md cursor-pointer
      `}
      style={{ borderLeftWidth: '3px' }}
    >
      <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-neutral-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setEditValue(item.name);
                  setIsEditing(false);
                }
              }}
              className="flex-1 px-2 py-1 text-sm font-medium bg-white dark:bg-neutral-800 border border-aurea-gold rounded focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              className={`text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate ${
                showMuted ? 'line-through' : ''
              }`}
            >
              {item.name}
            </span>
          )}
          
          {item.nameOriginal && item.name !== item.nameOriginal && (
            <span className="text-xs text-neutral-400 truncate">
              ({item.nameOriginal})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {item.category}
          </span>
          
          {config.label && (
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-badge
              ${config.badgeBg} ${config.badgeText}
            `}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityDecrement();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <span className="w-8 text-center text-sm font-medium tabular-nums">
            {item.quantity}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityIncrement();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          
          <span className="text-xs text-neutral-500 ml-1">{item.unit}</span>
        </div>

        <div className="w-24 text-right">
          <div className="flex flex-col items-end">
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(item.lineTotalOriginal)}
              </span>
            )}
            <span className={`text-sm font-semibold tabular-nums ${
              hasDiscount ? 'text-aurea-logistics-confirmed-text' : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {formatCurrency(item.lineTotal)}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
