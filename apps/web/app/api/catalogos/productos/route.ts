import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get('tenant');
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20', 10);

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

    console.log('[API catalogos/productos] Searching:', query, 'for tenant:', tenantId);

    const { data, error } = await supabase
      .from('catalogo_precios')
      .select('id, nombre, descripcion, precio, categoria, unidad, id_empresa')
      .eq('id_empresa', tenantId)
      .ilike('nombre', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('[API catalogos/productos] Supabase error:', error);
      return NextResponse.json({
        error: 'Error al buscar productos',
        details: error.message,
      }, { status: 500 });
    }

    const productos = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nombre: row.nombre as string,
      descripcion: row.descripcion as string | null,
      precio_sugerido: Number(row.precio || 0),
      categoria: row.categoria as string || 'General',
      unidad: row.unidad as string || 'pz',
      icono: 'box',
    }));

    console.log('[API catalogos/productos] Found:', productos.length, 'productos');

    return NextResponse.json({ productos });
  } catch (err) {
    console.error('[API catalogos/productos] Unhandled error:', err);
    return NextResponse.json({
      error: 'Error interno',
      details: err instanceof Error ? err.message : 'Unknown'
    }, { status: 500 });
  }
}
