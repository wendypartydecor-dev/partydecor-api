'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAureaTokenFromCookies } from '@aurea/core/supabase/aurea-client';
import type { EventoResumen } from '@aurea/ui/src/workspace/workspace.types';

interface UseEventosOptions {
  tenantId: string;
  enabled?: boolean;
}

interface UseEventosResult {
  eventos: EventoResumen[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEventos({ tenantId, enabled = true }: UseEventosOptions): UseEventosResult {
  const [eventos, setEventos] = useState<EventoResumen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = useCallback(async () => {
    const token = getAureaTokenFromCookies();
    if (!token || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/eventos?tenant=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }

      const data = await response.json();
      setEventos(data.eventos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, enabled]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  return {
    eventos,
    isLoading,
    error,
    refetch: fetchEventos,
  };
}
