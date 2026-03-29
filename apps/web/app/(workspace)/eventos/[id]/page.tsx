'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@aurea/ui';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectEvent, setTenant } = useWorkspace();
  const eventId = params.id as string;

  useEffect(() => {
    if (eventId) {
      selectEvent(eventId);
      const tenant = new URLSearchParams(window.location.search).get('tenant');
      if (tenant) {
        setTenant(tenant, 'Empresa', 'oklch(78% 0.12 75)');
      }
    }
  }, [eventId, selectEvent, setTenant]);

  useEffect(() => {
    const tenant = new URLSearchParams(window.location.search).get('tenant') || '';
    router.replace(`/eventos?tenant=${tenant}`);
  }, [router]);

  return null;
}
