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
      console.error('Error fetching eventos:', error);
      return NextResponse.json({ error: 'Error al cargar eventos' }, { status: 500 });
    }

    return NextResponse.json({ eventos: data || [] });
  } catch (err) {
    console.error('Error en API eventos:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
