import { deriveAvatarColors } from './tenant-color.utils';

interface TenantAvatarProps {
  tenant: { iniciales: string; logoUrl: string | null; accentColor: string; nombre: string };
  size?: 40 | 48;
}

export function TenantAvatar({ tenant, size = 40 }: TenantAvatarProps) {
  const { bg, text } = deriveAvatarColors(tenant.accentColor);
  const radius = size === 40 ? 9 : 11;

  if (tenant.logoUrl) {
    return (
      <div
        style={{
          width: size, height: size,
          borderRadius: radius,
          overflow: 'hidden',
          border: '0.5px solid rgba(0,0,0,0.06)',
          flexShrink: 0,
        }}
      >
        <img
          src={tenant.logoUrl}
          alt={tenant.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: radius,
        background: bg,
        color: text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size === 40 ? 14 : 18,
        fontWeight: 500,
        flexShrink: 0,
        border: '0.5px solid rgba(0,0,0,0.06)',
        fontFamily: 'var(--font-sans, system-ui)',
      }}
    >
      {tenant.iniciales}
    </div>
  );
}
