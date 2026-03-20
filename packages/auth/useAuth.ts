import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tenant {
  empresa_id: string;
  empresa_nombre: string;
  empresa_nombre_corto: string;
  empresa_logo: string;
  rol: string;
}

interface AuthState {
  userId: string | null;
  userName: string | null;
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  companies: Tenant[];
  pendingRedirect: string | null;
  
  setUser: (userId: string, userName: string) => void;
  setCompanies: (companies: Tenant[]) => void;
  selectTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
  setPendingRedirect: (path: string | null) => void;
  signOut: () => void;
  isReady: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      userName: null,
      currentTenant: null,
      isAuthenticated: false,
      isLoading: true,
      companies: [],
      pendingRedirect: null,

      setUser: (userId, userName) => {
        set({ userId, userName, isAuthenticated: true, isLoading: false });
      },

      setCompanies: (companies) => {
        set({ companies });
        
        if (companies.length === 1) {
          const [onlyTenant] = companies;
          set({ currentTenant: onlyTenant });
        } else if (companies.length > 1) {
          const stored = get().currentTenant;
          if (stored) {
            const stillValid = companies.some(c => c.empresa_id === stored.empresa_id);
            if (!stillValid) {
              set({ currentTenant: null });
            }
          }
        }
      },

      selectTenant: (tenant) => {
        set({ currentTenant: tenant, pendingRedirect: '/eventos' });
      },

      clearTenant: () => {
        set({ currentTenant: null, pendingRedirect: null });
      },

      setPendingRedirect: (path) => {
        set({ pendingRedirect: path });
      },

      signOut: () => {
        set({
          userId: null,
          userName: null,
          currentTenant: null,
          isAuthenticated: false,
          companies: [],
          pendingRedirect: null,
        });
      },

      isReady: () => {
        const state = get();
        return state.isAuthenticated && state.currentTenant !== null;
      },
    }),
    {
      name: 'aurea-auth',
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        currentTenant: state.currentTenant,
        isAuthenticated: state.isAuthenticated,
        companies: state.companies,
      }),
    }
  )
);

interface AuthContextValue {
  supabase: SupabaseClient;
  redirectToDashboard: () => void;
  redirectToCompanySelector: () => void;
}

interface SupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: { id: string } | null }; error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
    getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }>;
    onAuthStateChange: (callback: (event: string, session: { user: { id: string } } | null) => void) => { data: { unsubscribe: () => void } };
  };
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => Promise<{ data: unknown[]; error: Error | null }>;
    };
  };
  rpc: (functionName: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
}

export async function handleAuthCallback(
  supabase: SupabaseClient,
  authContext: AuthContextValue
): Promise<{ requiresCompanySelection: boolean; companies: Tenant[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    return { requiresCompanySelection: false, companies: [] };
  }
  
  const userId = session.user.id;
  const userName = session.user.email || 'Usuario';
  
  useAuthStore.getState().setUser(userId, userName);
  
  const { data: companiesData, error } = await supabase.rpc('get_user_tenants', { user_id: userId });
  
  if (error || !companiesData) {
    console.error('Error fetching companies:', error);
    return { requiresCompanySelection: false, companies: [] };
  }
  
  const companies = companiesData as Tenant[];
  useAuthStore.getState().setCompanies(companies);
  
  if (companies.length === 1) {
    useAuthStore.getState().selectTenant(companies[0]);
    return { requiresCompanySelection: false, companies };
  }
  
  if (companies.length > 1) {
    return { requiresCompanySelection: true, companies };
  }
  
  return { requiresCompanySelection: false, companies: [] };
}

export function useAuthGuard(requireTenant: boolean = true) {
  const { isAuthenticated, currentTenant, isLoading, pendingRedirect } = useAuthStore();
  
  return {
    isAuthenticated,
    hasTenant: currentTenant !== null,
    isLoading,
    pendingRedirect,
    canAccessWorkspace: !requireTenant || (isAuthenticated && currentTenant !== null),
  };
}
