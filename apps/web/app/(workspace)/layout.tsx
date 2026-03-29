'use client';

import { Sidebar, WorkspaceProvider, SmartQuoteSidebar } from '@aurea/ui';
import { QuoteProvider } from '@aurea/ui';
import { useWorkspace } from '@aurea/ui';

function WorkspaceLayoutContent({ children }: { children: React.ReactNode }) {
  const { isDetailOpen, selectedEventId, closeDetail } = useWorkspace();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'oklch(0.11 0 0)' }}>
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {isDetailOpen && selectedEventId && (
        <QuoteProvider>
          <SmartQuoteSidebar
            cotizacionId={null}
            eventoId={selectedEventId}
            onClose={closeDetail}
          />
        </QuoteProvider>
      )}
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </WorkspaceProvider>
  );
}
