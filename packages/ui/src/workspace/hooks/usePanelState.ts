'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export interface PanelVisibilityState {
  left: boolean;
  right: boolean;
}

export interface UsePanelStateOptions {
  eventoId: string;
  initialLeft?: boolean;
  initialRight?: boolean;
}

const STORAGE_KEY_PREFIX = 'aurea_panel_state_';

export function usePanelState({ eventoId, initialLeft = true, initialRight = true }: UsePanelStateOptions) {
  const storageKey = `${STORAGE_KEY_PREFIX}${eventoId}`;
  
  const [visibility, setVisibility] = useState<PanelVisibilityState>({
    left: initialLeft,
    right: initialRight,
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setVisibility(parsed);
      }
    } catch {
      console.warn('Failed to load panel state from localStorage');
    }
    setIsInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibility));
    } catch {
      console.warn('Failed to save panel state to localStorage');
    }
  }, [storageKey, visibility, isInitialized]);

  const toggleLeft = useCallback(() => {
    setVisibility(v => ({ ...v, left: !v.left }));
  }, []);

  const toggleRight = useCallback(() => {
    setVisibility(v => ({ ...v, right: !v.right }));
  }, []);

  const openLeft = useCallback(() => {
    setVisibility(v => ({ ...v, left: true }));
  }, []);

  const closeLeft = useCallback(() => {
    setVisibility(v => ({ ...v, left: false }));
  }, []);

  const openRight = useCallback(() => {
    setVisibility(v => ({ ...v, right: true }));
  }, []);

  const closeRight = useCallback(() => {
    setVisibility(v => ({ ...v, right: false }));
  }, []);

  return {
    visibility,
    isInitialized,
    toggleLeft,
    toggleRight,
    openLeft,
    closeLeft,
    openRight,
    closeRight,
  };
}

export function useCanvasState(initialTab = 'items', initialMode: 'view' | 'edit' | 'pdf-preview' | 'focus' = 'view') {
  const searchParams = useSearchParams();
  
  const tabFromUrl = searchParams?.get('tab');
  const modeFromUrl = searchParams?.get('mode') as CanvasState['mode'] | null;
  
  const [canvasState, setCanvasState] = useState({
    mode: modeFromUrl || initialMode,
    activeTab: tabFromUrl || initialTab,
    isDirty: false,
    focusedItemId: null as string | null,
    scrollPosition: 0,
  });

  const setMode = useCallback((mode: CanvasState['mode']) => {
    setCanvasState(s => ({ ...s, mode }));
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setCanvasState(s => ({ ...s, activeTab: tab }));
  }, []);

  const markDirty = useCallback(() => {
    setCanvasState(s => ({ ...s, isDirty: true }));
  }, []);

  const markClean = useCallback(() => {
    setCanvasState(s => ({ ...s, isDirty: false }));
  }, []);

  const setFocusedItem = useCallback((id: string | null) => {
    setCanvasState(s => ({ ...s, focusedItemId: id }));
  }, []);

  const updateScrollPosition = useCallback((position: number) => {
    setCanvasState(s => ({ ...s, scrollPosition: position }));
  }, []);

  return {
    canvasState,
    setMode,
    setActiveTab,
    markDirty,
    markClean,
    setFocusedItem,
    updateScrollPosition,
  };
}

interface CanvasState {
  mode: 'view' | 'edit' | 'pdf-preview' | 'focus';
  activeTab: string;
  isDirty: boolean;
  focusedItemId: string | null;
  scrollPosition: number;
}
