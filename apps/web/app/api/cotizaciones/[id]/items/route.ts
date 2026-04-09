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

interface LineaCotizacionResponse {
  id: string;
  cotizacion_id: string;
  catalogo_id: string | null;
  nombre_personalizado: string;
  nombre_snapshot: string | null;
  precio_unitario_aplicado: number;
  descuento: number;
  subtotal_linea: number;
  incluye_iva: boolean;
  incluye_isr: boolean;
  cantidad: number;
  categoria: string;
  unidad: string;
  notas_item: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cotizacionId } = await params;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones/lineas] GET for cotizacion:', cotizacionId);

    const { data, error } = await supabase
      .from('lineas_cotizacion')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[API cotizaciones/lineas] GET error:', error);
      return NextResponse.json({
        error: 'Error al obtener líneas',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('[API cotizaciones/lineas] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cotizacionId } = await params;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones/lineas] POST for cotizacion:', cotizacionId);

    const {
      catalogo_id,
      nombre_personalizado,
      nombre_snapshot,
      precio_unitario_aplicado,
      descuento,
      cantidad,
      categoria,
      unidad,
      incluye_iva,
      incluye_isr,
      sort_order,
      notas_item,
    } = body;

    const { data, error } = await supabase
      .from('lineas_cotizacion')
      .insert({
        cotizacion_id: cotizacionId,
        catalogo_id: catalogo_id || null,
        nombre_personalizado: nombre_personalizado || 'Item sin nombre',
        nombre_snapshot: nombre_snapshot || nombre_personalizado || 'Item sin nombre',
        precio_unitario_aplicado: precio_unitario_aplicado || 0,
        descuento: descuento || 0,
        cantidad: cantidad || 1,
        categoria: categoria || '',
        unidad: unidad || 'pz',
        incluye_iva: incluye_iva !== false,
        incluye_isr: incluye_isr === true,
        sort_order: sort_order || 0,
        notas_item: notas_item || '',
      })
      .select()
      .single();

    if (error) {
      console.error('[API cotizaciones/lineas] POST error:', error);
      return NextResponse.json({
        error: 'Error al agregar línea',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ item: data, success: true });
  } catch (err) {
    console.error('[API cotizaciones/lineas] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cotizacionId } = await params;
  const authHeader = request.headers.get('Authorization');
  const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get('item');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID requerido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones/lineas] PATCH item:', itemId);

    const updateData: Record<string, unknown> = {};
    
    if (body.nombre_personalizado !== undefined) {
      updateData.nombre_personalizado = body.nombre_personalizado;
      updateData.nombre_snapshot = body.nombre_snapshot || body.nombre_personalizado;
    }
    if (body.precio_unitario_aplicado !== undefined) {
      updateData.precio_unitario_aplicado = body.precio_unitario_aplicado;
    }
    if (body.descuento !== undefined) {
      updateData.descuento = body.descuento;
    }
    if (body.cantidad !== undefined) {
      updateData.cantidad = body.cantidad;
    }
    if (body.incluye_iva !== undefined) {
      updateData.incluye_iva = body.incluye_iva;
    }
    if (body.incluye_isr !== undefined) {
      updateData.incluye_isr = body.incluye_isr;
    }
    if (body.sort_order !== undefined) {
      updateData.sort_order = body.sort_order;
    }
    if (body.notas_item !== undefined) {
      updateData.notas_item = body.notas_item;
    }

    const { data, error } = await supabase
      .from('lineas_cotizacion')
      .update(updateData)
      .eq('id', itemId)
      .eq('cotizacion_id', cotizacionId)
      .select()
      .single();

    if (error) {
      console.error('[API cotizaciones/lineas] PATCH error:', error);
      return NextResponse.json({
        error: 'Error al actualizar línea',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ item: data, success: true });
  } catch (err) {
    console.error('[API cotizaciones/lineas] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cotizacionId } = await params;
  const authHeader = request.headers.get('Authorization');
  const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get('item');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID requerido' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseClient(authHeader);

    console.log('[API cotizaciones/lineas] DELETE item:', itemId);

    const { error } = await supabase
      .from('lineas_cotizacion')
      .delete()
      .eq('id', itemId)
      .eq('cotizacion_id', cotizacionId);

    if (error) {
      console.error('[API cotizaciones/lineas] DELETE error:', error);
      return NextResponse.json({
        error: 'Error al eliminar línea',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API cotizaciones/lineas] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
