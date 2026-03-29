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
      .from('eventos')
      .select(`
        id,
        nombre_evento,
        fecha_inicio,
        estado,
        monto_total,
        anticipo,
        saldo_pendiente,
        lugar,
        capacidad,
        id_tenant:tenant_id
      `)
      .eq('tenant_id', tenantId)
      .order('fecha_inicio', { ascending: true });

    if (error) {
      console.error('Supabase error:', JSON.stringify(error));
      return NextResponse.json({ 
        error: 'Error de base de datos',
        details: error.message,
        hint: error.hint
      }, { status: 500 });
    }

    const eventos = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nombre_evento: (row.nombre_evento || 'Sin nombre') as string,
      fecha_evento: (row.fecha_inicio || new Date().toISOString()) as string,
      estado: (row.estado || 'prospecto') as 'prospecto' | 'cotizado' | 'confirmado' | 'montaje' | 'finalizado',
      cliente: {
        id: '',
        nombre: '',
      },
      monto_total: Number(row.monto_total || 0),
      anticipo: Number(row.anticipo || 0),
      saldo_pendiente: Number(row.saldo_pendiente || 0),
      lugar: row.lugar as string | undefined,
      capacidad: row.capacidad as number | undefined,
      tags: [],
      id_tenant: (row.id_tenant || tenantId) as string,
    }));

    return NextResponse.json({ eventos });
  } catch (err) {
    console.error('Unhandled error:', err);
    return NextResponse.json({ 
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
