import type { TenantRole } from './tenant-selector.types';

const ROLE_STYLES: Record<TenantRole, { bg: string; color: string; label: string }> = {
  admin: {
    bg: 'oklch(95% 0.04 280 / 0.8)',
    color: 'oklch(38% 0.10 280)',
    label: 'Admin',
  },
  empleado: {
    bg: 'var(--color-background-secondary)',
    color: 'var(--color-text-secondary)',
    label: 'Empleado',
  },
  solo_lectura: {
    bg: 'oklch(95% 0.06 75 / 0.6)',
    color: 'oklch(40% 0.14 72)',
    label: 'Solo lectura',
  },
};

export function TenantRoleBadge({ role }: { role: TenantRole }) {
  const s = ROLE_STYLES[role];
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 500,
        padding: '2px 7px',
        borderRadius: 99,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-sans, system-ui)',
        ...(role === 'empleado' && {
          border: '0.5px solid var(--color-border-tertiary)',
        }),
      }}
    >
      {s.label}
    </span>
  );
}
