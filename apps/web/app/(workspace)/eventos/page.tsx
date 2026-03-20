'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';

function EventosContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams?.get('tenant');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (tenantId) {
      setIsReady(true);
    }
  }, [tenantId]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-aurea-gold animate-spin" />
          <p className="text-neutral-500">Cargando workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="h-[3px] bg-aurea-gold" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-gold/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-aurea-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Eventos
              </h1>
              <p className="text-sm text-neutral-500">
                Workspace de la empresa
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Aurea Workspace
          </h2>
          <p className="text-neutral-500 mb-6">
            El EventoSpace y Smart Quote Engine están listos.
            <br />
            Conecta con tu API para cargar datos.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-aurea-gold/10 text-aurea-gold rounded-xl text-sm font-medium">
            Tenant: {tenantId}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Cargando eventos...</p></div>}>
      <EventosContent />
    </Suspense>
  );
}
