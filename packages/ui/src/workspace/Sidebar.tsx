'use client';

import { useWorkspace } from '@aurea/web/providers/WorkspaceProvider';
import { Building2, Calendar, Users, Package, FileText, ChevronLeft, ChevronRight, Sparkles, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'eventos', label: 'Eventos', icon: Calendar },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
];

interface SidebarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export function Sidebar({ activeRoute = 'eventos', onNavigate }: SidebarProps) {
  const { tenantName, accentColor, isSidebarCollapsed, toggleSidebar } = useWorkspace();

  return (
    <aside
      className="h-screen flex flex-col border-r border-white/[0.06] transition-all duration-350"
      style={{
        width: isSidebarCollapsed ? '72px' : '280px',
        background: 'oklch(0.11 0 0)',
      }}
    >
      <div className="p-4 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: accentColor }}
            >
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">AUREA</span>
              <span className="text-xs text-white/60 truncate max-w-[160px]">{tenantName}</span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors ml-auto"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white/60" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? 'oklch(78% 0.12 75 / 0.15)' : 'transparent',
                  color: isActive ? 'oklch(78% 0.12 75)' : 'oklch(0.75 0 0)',
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {!isSidebarCollapsed && (
          <div className="mt-8 pt-4 border-t border-white/06">
            <div className="px-3 text-xs text-white/40 uppercase tracking-wider mb-2">
              Plugins
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/06">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'oklch(0.55 0 0)' }}
        >
          <Settings className="w-5 h-5" />
          {!isSidebarCollapsed && (
            <span className="text-sm">Configuración</span>
          )}
        </button>
      </div>
    </aside>
  );
}
