import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createSupabaseClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventoId = searchParams.get('evento');
  const tenantId = searchParams.get('tenant');

  const authHeader = request.headers.get('Authorization');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID requerido' }, { status: 400 });
  }

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones] GET for evento:', eventoId, 'tenant:', tenantId);

    let query = supabase
      .from('cotizaciones')
      .select('*')
      .eq('tenant_id', tenantId);

    if (eventoId) {
      query = query.eq('evento_id', eventoId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[API cotizaciones] GET error:', error);
      return NextResponse.json({
        error: 'Error al obtener cotizaciones',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ cotizaciones: data || [] });
  } catch (err) {
    console.error('[API cotizaciones] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { evento_id, tenant_id, items, iva_porcentaje, isr_porcentaje } = body;

    if (!evento_id || !tenant_id) {
      return NextResponse.json({
        error: 'evento_id y tenant_id son requeridos'
      }, { status: 400 });
    }

    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones] POST for evento:', evento_id, 'tenant:', tenant_id);
    console.log('[API cotizaciones] Items count:', items?.length || 0);
    console.log('[API cotizaciones] Tax percentages:', { iva: iva_porcentaje, isr: isr_porcentaje });

    const sanitizedItems = (items || []).map((item: Record<string, unknown>) => ({
      catalogo_id: item.catalogo_id ?? null,
      nombre_personalizado: item.nombre_personalizado ?? '',
      nombre_snapshot: item.nombre_snapshot ?? item.nombre_personalizado ?? '',
      precio_unitario_aplicado: item.precio_unitario_aplicado ?? 0,
      descuento: item.descuento ?? 0,
      cantidad: item.cantidad ?? 1,
      unidad: item.unidad ?? 'pz',
      incluye_iva: item.incluye_iva ?? true,
      incluye_isr: item.incluye_isr ?? false,
      sort_order: item.sort_order ?? 0,
      notas_item: item.notas_item ?? '',
    }));

    const { data, error } = await supabase.rpc('save_cotizacion_with_items', {
      p_evento_id: evento_id,
      p_tenant_id: tenant_id,
      p_items: sanitizedItems,
      p_iva_porcentaje: iva_porcentaje ?? 16,
      p_isr_porcentaje: isr_porcentaje ?? 1.25,
    });

    if (error) {
      console.error('[API cotizaciones] POST RPC error:', error);
      return NextResponse.json({
        error: 'Error al guardar cotización',
        details: error.message,
        hint: error.hint || null,
      }, { status: 500 });
    }

    const cotizacionId = data as string;
    console.log('[API cotizaciones] Saved with ID:', cotizacionId);

    const { data: savedCotizacion } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('id', cotizacionId)
      .single();

    const { data: savedItems } = await supabase
      .from('lineas_cotizacion')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      success: true,
      cotizacion: savedCotizacion,
      items: savedItems || [],
    });
  } catch (err) {
    console.error('[API cotizaciones] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
