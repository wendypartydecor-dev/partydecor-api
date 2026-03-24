import { TenantCard } from './TenantCard';
import { TenantSkeleton } from './TenantSkeleton';
import { TenantAvatar } from './TenantAvatar';
import type { TenantSelectorProps, TenantSummary } from './tenant-selector.types';

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 500,
      color: 'var(--color-text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '.07em',
      padding: '6px 12px 3px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      {label}
      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
    </div>
  );
}

function ConfirmingOverlay({ tenant }: { tenant: TenantSummary }) {
  return (
    <div style={{
      padding: '32px 24px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 14,
      animation: 'aurea-fade-in 200ms ease-out both',
    }}>
      <style>{`
        @keyframes aurea-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aurea-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <TenantAvatar tenant={tenant} size={48} />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 15, fontWeight: 500,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans, system-ui)',
          marginBottom: 4,
        }}>
          {tenant.nombre}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans, system-ui)',
        }}>
          Preparando tu espacio de trabajo…
        </div>
      </div>
      <div style={{
        width: 20, height: 20,
        border: '2px solid var(--color-border-tertiary)',
        borderTopColor: 'oklch(78% 0.12 75)',
        borderRadius: '50%',
        animation: 'aurea-spin 700ms linear infinite',
      }} />
    </div>
  );
}

export function TenantSelector({ state, onSelect, onLogout }: TenantSelectorProps) {
  const lastUsed = state.tenants.filter(t => t.isLastUsed);
  const others = state.tenants.filter(t => !t.isLastUsed);
  const selectingTenant = state.tenants.find(t => t.id === state.selectingId) ?? null;

  const skeletonCount = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('aurea_tenant_count') ?? '3', 10)
    : 3;

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 20,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 400,
      fontFamily: 'var(--font-sans, system-ui)',
    }}>

      <div style={{
        padding: '24px 24px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}>
        {state.status === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ height: 9, width: 110, borderRadius: 4,
              background: 'var(--color-background-secondary)',
              animation: 'aurea-pulse 1.6s ease-in-out infinite' }} />
            <div style={{ height: 16, width: '70%', borderRadius: 5,
              background: 'var(--color-background-secondary)',
              animation: 'aurea-pulse 1.6s ease-in-out infinite' }} />
            <div style={{ height: 11, width: '40%', borderRadius: 4,
              background: 'var(--color-background-secondary)',
              animation: 'aurea-pulse 1.6s ease-in-out infinite' }} />
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 10, fontWeight: 500,
              color: 'oklch(72% 0.12 75)',
              letterSpacing: '.07em', textTransform: 'uppercase',
              marginBottom: 5,
            }}>
              Bienvenido de vuelta
            </div>
            <div style={{
              fontSize: 18, fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              lineHeight: 1.25, marginBottom: 3,
            }}>
              ¿Con cuál empresa trabajas hoy?
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {state.status === 'ready'
                ? `Tienes acceso a ${state.tenants.length} empresa${state.tenants.length !== 1 ? 's' : ''}`
                : '\u00a0'}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '8px 10px' }}>
        {state.status === 'loading' && (
          <TenantSkeleton count={skeletonCount} />
        )}

        {state.status === 'error' && (
          <div style={{
            padding: '24px 12px', textAlign: 'center',
            fontSize: 13, color: 'var(--color-text-secondary)',
          }}>
            {state.error ?? 'Error al cargar empresas'}
          </div>
        )}

        {(state.status === 'ready' || state.status === 'selecting') &&
          !selectingTenant && (
          <>
            {lastUsed.length > 0 && (
              <>
                <SectionDivider label="Última sesión" />
                {lastUsed.map(t => (
                  <TenantCard
                    key={t.id}
                    tenant={t}
                    isSelecting={state.selectingId === t.id}
                    isAnySelecting={state.status === 'selecting'}
                    onClick={() => onSelect(t)}
                  />
                ))}
              </>
            )}
            {others.length > 0 && (
              <>
                <SectionDivider label={lastUsed.length > 0 ? 'Otras empresas' : 'Empresas'} />
                {others.map(t => (
                  <TenantCard
                    key={t.id}
                    tenant={t}
                    isSelecting={state.selectingId === t.id}
                    isAnySelecting={state.status === 'selecting'}
                    onClick={() => onSelect(t)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {state.status === 'selecting' && selectingTenant && (
          <ConfirmingOverlay tenant={selectingTenant} />
        )}
      </div>

      <div style={{
        padding: '10px 14px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {state.status === 'loading' || !state.user ? (
          <>
            <div style={{ width: 26, height: 26, borderRadius: '50%',
              background: 'var(--color-background-secondary)',
              animation: 'aurea-pulse 1.6s ease-in-out infinite' }} />
            <div style={{ height: 10, width: 80, borderRadius: 4,
              background: 'var(--color-background-secondary)',
              animation: 'aurea-pulse 1.6s ease-in-out infinite' }} />
          </>
        ) : (
          <>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 500,
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}>
              {state.user.avatarInitials}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1 }}>
              {state.user.displayName}
            </span>
            <button
              onClick={onLogout}
              style={{
                background: 'none', border: 'none',
                fontSize: 11, color: 'var(--color-text-tertiary)',
                cursor: 'pointer', fontFamily: 'inherit',
                padding: '3px 8px', borderRadius: 5,
                transition: 'all 140ms',
              }}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
