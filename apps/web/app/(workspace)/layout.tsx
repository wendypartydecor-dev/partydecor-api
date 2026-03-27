'use client';

import { Sidebar, WorkspaceProvider } from '@aurea/ui';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'oklch(0.11 0 0)' }}>
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
