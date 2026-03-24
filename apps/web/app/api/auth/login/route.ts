import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@aurea/core/supabase/client';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const TOKEN_EXPIRY = '24h';

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email y PIN son requeridos' },
        { status: 400 }
      );
    }

    const { data, error: rpcError } = await supabase.rpc('authenticate_with_pin', {
      user_email: email.toLowerCase(),
      user_pin: pin,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json(
        { error: 'Error al autenticar' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const userData = data[0] as { user_id: string; empresa_id: string; rol: string };

    if (!JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      );
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (24 * 60 * 60);

    const token = jwt.sign(
      {
        sub: userData.user_id,
        role: 'authenticated',
        iat,
        exp,
        email: email.toLowerCase(),
      },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    return NextResponse.json({
      token,
      user: {
        id: userData.user_id,
        email: email.toLowerCase(),
      },
      tenant: {
        id: userData.empresa_id,
        rol: userData.rol,
      },
      expiresAt: exp,
    });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
