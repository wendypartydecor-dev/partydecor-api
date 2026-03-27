'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { WorkspaceState } from '@aurea/ui/src/workspace/workspace.types';

interface WorkspaceContextType extends WorkspaceState {
  setTenant: (id: string, name: string, accentColor: string) => void;
  selectEvent: (id: string | null) => void;
  toggleSidebar: () => void;
  closeDetail: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>({
    tenantId: null,
    tenantName: '',
    accentColor: 'oklch(78% 0.12 75)',
    selectedEventId: null,
    isSidebarCollapsed: false,
    isDetailOpen: false,
  });

  const setTenant = useCallback((id: string, name: string, accentColor: string) => {
    setState(prev => ({ ...prev, tenantId: id, tenantName: name, accentColor }));
  }, []);

  const selectEvent = useCallback((id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedEventId: id,
      isDetailOpen: id !== null,
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }));
  }, []);

  const closeDetail = useCallback(() => {
    setState(prev => ({ ...prev, selectedEventId: null, isDetailOpen: false }));
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      ...state,
      setTenant,
      selectEvent,
      toggleSidebar,
      closeDetail,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
}
