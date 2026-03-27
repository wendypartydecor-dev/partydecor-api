'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, WorkspaceProvider, useWorkspace } from '@aurea/ui';
import { Loader2 } from 'lucide-react';

function WorkspaceLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId, isDetailOpen, selectedEventId, setTenant, selectEvent } = useWorkspace();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tenant = searchParams.get('tenant');
    if (tenant && !tenantId) {
      setTenant(tenant, 'Empresa', 'oklch(78% 0.12 75)');
      setIsReady(true);
    } else if (tenantId) {
      setIsReady(true);
    }
  }, [searchParams, tenantId, setTenant]);

  if (!isReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'oklch(0.11 0 0)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(78% 0.12 75)' }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'oklch(0.11 0 0)' }}>
      <Sidebar />

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
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
