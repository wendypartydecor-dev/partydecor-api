import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@aurea/core/supabase/client';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

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
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + TOKEN_EXPIRY_SECONDS;

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

    const expiresAt = new Date(exp * 1000).toUTCString();

    const response = NextResponse.json({
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

    response.cookies.set('aurea_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(exp * 1000),
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
