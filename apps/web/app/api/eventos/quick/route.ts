import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@aurea/core/supabase/client';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nombreCliente, telefonoCliente, nombreEvento, fechaEvento, tenantId } = body;

    if (!nombreCliente || !nombreEvento || !fechaEvento || !tenantId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('crear_evento_rapido', {
      p_nombre_cliente: nombreCliente,
      p_telefono_cliente: telefonoCliente || '',
      p_nombre_evento: nombreEvento,
      p_fecha_inicio: fechaEvento,
      p_tenant_id: tenantId,
      p_monto_total: 0,
    });

    if (error) {
      console.error('Error creating quick event:', error);
      return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error in quick event API:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
