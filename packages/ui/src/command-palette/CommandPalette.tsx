'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { X, Plus, Calendar, Search } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export function CommandPalette({ isOpen, onClose, children }: CommandPaletteProps) {
  const [quickEventData, setQuickEventData] = useState({
    nombreCliente: '',
    telefonoCliente: '',
    nombreEvento: '',
    fechaEvento: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateQuickEvent = useCallback(async () => {
    if (!quickEventData.nombreCliente || !quickEventData.nombreEvento || !quickEventData.fechaEvento) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = document.cookie.match(/aurea_token=([^;]+)/)?.[1];
      const tenantId = new URLSearchParams(window.location.search).get('tenant');

      const response = await fetch('/api/eventos/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...quickEventData,
          tenantId,
        }),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error('Error creating quick event:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [quickEventData, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 150ms ease-out' }}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'oklch(0.13 0 0)',
          border: '0.5px solid rgba(255,255,255,0.10)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/06">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'oklch(78% 0.12 75)' }}
            >
              <Plus className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-medium text-white">Nuevo Evento Rápido</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'oklch(0.65 0 0)' }}>
                Cliente
              </label>
              <input
                type="text"
                value={quickEventData.nombreCliente}
                onChange={(e) => setQuickEventData(p => ({ ...p, nombreCliente: e.target.value }))}
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'oklch(0.18 0 0)',
                  border: '0.5px solid rgba(255,255,255,0.10)',
                  color: 'oklch(0.95 0 0)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'oklch(0.65 0 0)' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={quickEventData.telefonoCliente}
                onChange={(e) => setQuickEventData(p => ({ ...p, telefonoCliente: e.target.value }))}
                placeholder="+52 1 ..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'oklch(0.18 0 0)',
                  border: '0.5px solid rgba(255,255,255,0.10)',
                  color: 'oklch(0.95 0 0)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'oklch(0.65 0 0)' }}>
              Nombre del Evento
            </label>
            <input
              type="text"
              value={quickEventData.nombreEvento}
              onChange={(e) => setQuickEventData(p => ({ ...p, nombreEvento: e.target.value }))}
              placeholder="XV Rosas, Boda García, Fiesta de fin de año..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'oklch(0.18 0 0)',
                border: '0.5px solid rgba(255,255,255,0.10)',
                color: 'oklch(0.95 0 0)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'oklch(0.65 0 0)' }}>
              Fecha del Evento
            </label>
            <input
              type="datetime-local"
              value={quickEventData.fechaEvento}
              onChange={(e) => setQuickEventData(p => ({ ...p, fechaEvento: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'oklch(0.18 0 0)',
                border: '0.5px solid rgba(255,255,255,0.10)',
                color: 'oklch(0.95 0 0)',
              }}
            />
          </div>

          <button
            onClick={handleCreateQuickEvent}
            disabled={isSubmitting || !quickEventData.nombreCliente || !quickEventData.nombreEvento || !quickEventData.fechaEvento}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'oklch(78% 0.12 75)',
              color: 'black',
            }}
          >
            {isSubmitting ? 'Creando...' : 'Crear Evento'}
          </button>
        </div>

        {children}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
