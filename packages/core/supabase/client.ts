import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          pin_hash: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          pin_hash: string;
          activo?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          pin_hash?: string;
          activo?: boolean;
        };
      };
      empresas: {
        Row: {
          id: string;
          nombre: string;
          nombre_corto: string;
          logo_login_url: string | null;
          color_primario: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          nombre_corto: string;
          logo_login_url?: string | null;
          color_primario?: string | null;
          activo?: boolean;
        };
        Update: {
          id?: string;
          nombre?: string;
          nombre_corto?: string;
          logo_login_url?: string | null;
          color_primario?: string | null;
          activo?: boolean;
        };
      };
      usuario_empresa: {
        Row: {
          id: string;
          id_usuario: string;
          id_empresa: string;
          rol: 'admin' | 'empleado' | 'solo_lectura';
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          id_usuario: string;
          id_empresa: string;
          rol?: 'admin' | 'empleado' | 'solo_lectura';
          activo?: boolean;
        };
        Update: {
          id?: string;
          id_usuario?: string;
          id_empresa?: string;
          rol?: 'admin' | 'empleado' | 'solo_lectura';
          activo?: boolean;
        };
      };
    };
    Views: {
      v_usuarios_empresas: {
        Row: {
          usuario_id: string;
          empresa_id: string;
          empresa_nombre: string;
          empresa_nombre_corto: string;
          empresa_logo: string | null;
          empresa_color: string | null;
          rol: 'admin' | 'empleado' | 'solo_lectura';
          relacion_activa: boolean;
        };
      };
    };
    Functions: {
      authenticate_with_pin: {
        Args: {
          user_email: string;
          user_pin: string;
        };
        Returns: {
          user_id: string;
          empresa_id: string;
          rol: string;
        }[];
      };
    };
  };
};

export type TenantFromDb = Database['public']['Views']['v_usuarios_empresas']['Row'];
