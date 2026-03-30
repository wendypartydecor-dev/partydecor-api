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

    console.log('[API eventos] Fetching for tenant:', tenantId);

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_empresa', tenantId)
      .limit(1);

    console.log('[API eventos] Raw response:', { dataCount: data?.length, error });

    if (error) {
      console.error('[API eventos] FULL ERROR:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Error de base de datos',
        supabase_error: {
          message: error.message,
          details: error.details || null,
          hint: error.hint || null,
          code: error.code || null,
        }
      }, { status: 500 });
    }

    console.log('[API eventos] Raw columns:', data && data.length > 0 ? Object.keys(data[0]) : 'no data');
    
    const eventos = (data || []).map((row: Record<string, unknown>) => {
      const fechaCampo = row.f_ev || row.fecha_evento || row.fecha || row.date || new Date().toISOString();
      const empresaCampo = row.id_empresa || row.tenant_id || row.empresa_id || tenantId;
      
      return {
        id: row.id as string || '',
        nombre_evento: (row.nombre_evento || row.nombre || row.name || 'Evento sin nombre') as string,
        fecha_evento: fechaCampo as string,
        estado: (row.estado || row.status || 'prospecto') as 'prospecto' | 'cotizado' | 'confirmado' | 'montaje' | 'finalizado',
        cliente: {
          id: (row.id_cliente || row.cliente_id || row.client_id || '') as string,
          nombre: (row.cliente_nombre || row.client_name || '') as string,
        },
        monto_total: Number(row.monto_total || row.total || row.monto || 0),
        anticipo: Number(row.anticipo || row.anticipo_pagado || 0),
        saldo_pendiente: Number(row.saldo || row.saldo_pendiente || row.balance || 0),
        lugar: row.lugar as string | undefined,
        capacidad: row.capacidad as number | undefined,
        tags: (row.tags || []) as string[],
        id_tenant: empresaCampo as string,
        _raw: Object.keys(row),
      };
    });

    console.log('[API eventos] Mapped eventos:', eventos.length);

    return NextResponse.json({ eventos });
  } catch (err) {
    console.error('[API eventos] Unhandled error:', err);
    return NextResponse.json({ 
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
