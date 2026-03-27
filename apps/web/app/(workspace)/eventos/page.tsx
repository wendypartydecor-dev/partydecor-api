'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWorkspace, EventCard, EventCardSkeleton, CommandPalette } from '@aurea/ui';
import { useEventos } from '@aurea/web/hooks/useEventos';
import { Plus, Calendar, Search, Command } from 'lucide-react';

function EventosContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams?.get('tenant') || '';
  const { setTenant, selectEvent, selectedEventId } = useWorkspace();
  const { eventos, isLoading } = useEventos({ tenantId, enabled: !!tenantId });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantInitialized, setTenantInitialized] = useState(false);

  useEffect(() => {
    if (tenantId && !tenantInitialized) {
      setTenant(tenantId, 'Empresa', 'oklch(78% 0.12 75)');
      setTenantInitialized(true);
    }
  }, [tenantId, setTenant, tenantInitialized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredEventos = eventos.filter(evento =>
    evento.nombre_evento.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evento.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <header
        className="px-6 py-4 border-b border-white/[0.06]"
        style={{ background: 'oklch(0.11 0 0)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(78% 0.12 75 / 0.15)' }}
            >
              <Calendar className="w-5 h-5" style={{ color: 'oklch(78% 0.12 75)' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Eventos</h1>
              <p className="text-xs text-white/50">
                {isLoading ? 'Cargando...' : `${eventos.length} eventos`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: 'oklch(78% 0.12 75)',
              color: 'black',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Evento</span>
          </button>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{
            background: 'oklch(0.15 0 0)',
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          <div
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/40"
            style={{ background: 'oklch(0.18 0 0)' }}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredEventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'oklch(0.15 0 0)' }}
            >
              <Calendar className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'Sin resultados' : 'No hay eventos'}
            </h3>
            <p className="text-sm text-white/40 mb-6">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Crea tu primer evento para comenzar'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'oklch(78% 0.12 75)',
                  color: 'black',
                }}
              >
                <Plus className="w-4 h-4" />
                Crear Evento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEventos.map((evento) => (
              <EventCard
                key={evento.id}
                evento={evento}
                isSelected={selectedEventId === evento.id}
                onClick={() => selectEvent(evento.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default function EventosPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-screen flex items-center justify-center"
          style={{ background: 'oklch(0.11 0 0)' }}
        >
          <div className="space-y-3 w-80">
            {[1, 2, 3].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <EventosContent />
    </Suspense>
  );
}
