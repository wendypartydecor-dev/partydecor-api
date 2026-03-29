import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenant');
  const authHeader = request.headers.get('Authorization');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID requerido' }, { status: 400 });
  }

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data, error } = await supabase
      .from('v_eventos_completo')
      .select('*')
      .eq('id_tenant', tenantId)
      .order('fecha_evento', { ascending: true });

    if (error) {
      console.error('Supabase error fetching eventos:', error.message, error.details);
      return NextResponse.json({ 
        error: 'Error al cargar eventos',
        details: error.message 
      }, { status: 500 });
    }

    const eventos = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nombre_evento: (row.nombre_evento || row.nombre) as string,
      fecha_evento: row.fecha_evento as string,
      estado: (row.estado || 'prospecto') as 'prospecto' | 'cotizado' | 'confirmado' | 'montaje' | 'finalizado',
      cliente: {
        id: (row.cliente_id || row.id_cli) as string || '',
        nombre: (row.cliente_nombre || '') as string,
        telefono: (row.cliente_telefono || row.telefono) as string | undefined,
      },
      monto_total: Number(row.monto_total || row.total_cotizaciones || 0),
      anticipo: Number(row.anticipo || 0),
      saldo_pendiente: Number(row.saldo_pendiente || 0),
      lugar: row.lugar as string | undefined,
      capacidad: row.capacidad as number | undefined,
      tags: (row.tags as string[]) || [],
      id_tenant: row.id_tenant as string,
    }));

    return NextResponse.json({ eventos });
  } catch (err) {
    console.error('Unhandled error in API eventos:', err);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
