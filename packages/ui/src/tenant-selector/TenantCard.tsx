import { deriveAvatarColors, formatLastAccess } from './tenant-color.utils';
import { TenantAvatar } from './TenantAvatar';
import { TenantRoleBadge } from './TenantRoleBadge';
import type { TenantCardProps } from './tenant-selector.types';

const ChevronRight = () => (
  <svg
    width={14} height={14}
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, transition: 'transform 150ms, color 140ms' }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function TenantCard({
  tenant, isSelecting, isAnySelecting, onClick,
}: TenantCardProps) {
  const { accent } = deriveAvatarColors(tenant.accentColor);
  const isDisabled = isAnySelecting && !isSelecting;

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Entrar a ${tenant.nombre} como ${tenant.rolEmpresa}`}
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={e => { if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 12,
        border: tenant.isLastUsed
          ? '0.5px solid oklch(78% 0.12 75 / 0.35)'
          : '0.5px solid transparent',
        background: tenant.isLastUsed
          ? 'oklch(78% 0.12 75 / 0.04)'
          : 'transparent',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        position: 'relative',
        transition: 'background 140ms, border-color 140ms, opacity 200ms',
        outline: 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, top: 12, bottom: 12,
          width: 4,
          borderRadius: '0 2px 2px 0',
          background: accent,
        }}
      />

      <TenantAvatar tenant={tenant} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 6, flexWrap: 'wrap',
          fontSize: 13, fontWeight: 500,
          color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'var(--font-sans, system-ui)',
        }}>
          {tenant.nombre}
          {tenant.isLastUsed && (
            <span style={{
              fontSize: 9, fontWeight: 500,
              padding: '2px 6px', borderRadius: 99,
              background: 'oklch(78% 0.12 75 / 0.14)',
              color: 'oklch(50% 0.14 75)',
              letterSpacing: '.03em',
              flexShrink: 0,
            }}>
              Activo
            </span>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 6, marginTop: 3,
        }}>
          <TenantRoleBadge role={tenant.rolEmpresa} />
          <span style={{
            fontSize: 11,
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-sans, system-ui)',
          }}>
            {tenant.isLastUsed && tenant.meta.upcomingEventCount > 0
              ? `${tenant.meta.upcomingEventCount} eventos esta semana`
              : formatLastAccess(tenant.meta.lastAccessAt)
            }
          </span>
        </div>
      </div>

      <ChevronRight />
    </div>
  );
}
