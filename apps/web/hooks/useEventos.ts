'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAureaTokenFromCookies } from '@aurea/core/supabase/aurea-client';
import type { EventoResumen } from '@aurea/ui';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchEventos = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    const token = getAureaTokenFromCookies();
    if (!token || !tenantId || !enabled) {
      setIsLoading(false);
      setEventos([]);
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    console.log('[useEventos] Fetching with tenant:', tenantId);
    console.log('[useEventos] Token exists:', !!token);
    console.log('[useEventos] Token prefix:', token ? token.substring(0, 20) + '...' : 'null');

    try {
      const response = await fetch(`/api/eventos?tenant=${encodeURIComponent(tenantId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconhecido' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setEventos(data.eventos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconhecido';
      console.error('useEventos error:', message);
      setError(message);
      setEventos([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [tenantId, enabled]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchEventos, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchEventos]);

  return {
    eventos,
    isLoading,
    error,
    refetch: fetchEventos,
  };
}
