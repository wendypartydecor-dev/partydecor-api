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

    console.log('[API cotizaciones items] GET for cotizacion:', cotizacionId);

    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[API cotizaciones items] GET error:', error);
      return NextResponse.json({
        error: 'Error al obtener items',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('[API cotizaciones items] Unhandled error:', err);
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

    console.log('[API cotizaciones items] POST for cotizacion:', cotizacionId);
    console.log('[API cotizaciones items] Item data:', JSON.stringify(body));

    const {
      catalog_item_id,
      name,
      nombre_snapshot,
      category,
      unit,
      unit_price,
      quantity,
      incluye_iva,
      incluye_isr,
      sort_order,
    } = body;

    const { data, error } = await supabase
      .from('quote_items')
      .insert({
        cotizacion_id: cotizacionId,
        catalog_item_id: catalog_item_id || null,
        name: name || 'Nuevo item',
        nombre_snapshot: nombre_snapshot || name || 'Nuevo item',
        category: category || '',
        unit: unit || 'pz',
        unit_price: unit_price || 0,
        quantity: quantity || 1,
        incluye_iva: incluye_iva !== false,
        incluye_isr: incluye_isr !== false,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[API cotizaciones items] POST error:', error);
      return NextResponse.json({
        error: 'Error al agregar item',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ item: data, success: true });
  } catch (err) {
    console.error('[API cotizaciones items] Unhandled error:', err);
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

    console.log('[API cotizaciones items] PATCH item:', itemId);

    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.nombre_snapshot = body.nombre_snapshot || body.name;
    }
    if (body.unit_price !== undefined) updateData.unit_price = body.unit_price;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.incluye_iva !== undefined) updateData.incluye_iva = body.incluye_iva;
    if (body.incluye_isr !== undefined) updateData.incluye_isr = body.incluye_isr;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('quote_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('cotizacion_id', cotizacionId)
      .select()
      .single();

    if (error) {
      console.error('[API cotizaciones items] PATCH error:', error);
      return NextResponse.json({
        error: 'Error al actualizar item',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ item: data, success: true });
  } catch (err) {
    console.error('[API cotizaciones items] Unhandled error:', err);
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

    console.log('[API cotizaciones items] DELETE item:', itemId);

    const { error } = await supabase
      .from('quote_items')
      .delete()
      .eq('id', itemId)
      .eq('cotizacion_id', cotizacionId);

    if (error) {
      console.error('[API cotizaciones items] DELETE error:', error);
      return NextResponse.json({
        error: 'Error al eliminar item',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API cotizaciones items] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
