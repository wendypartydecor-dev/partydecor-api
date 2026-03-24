export function deriveAvatarColors(accentColor: string): {
  bg: string;
  text: string;
  accent: string;
} {
  const match = accentColor.match(
    /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/
  );

  if (!match) {
    return {
      bg: 'oklch(92% 0.04 260)',
      text: 'oklch(35% 0.08 260)',
      accent: 'oklch(55% 0.08 260)',
    };
  }

  const [, , C, H] = match;
  const chroma = parseFloat(C);
  const hue = parseFloat(H);

  return {
    bg: `oklch(93% ${(chroma * 0.35).toFixed(3)} ${hue})`,
    text: `oklch(35% ${chroma} ${hue})`,
    accent: accentColor,
  };
}

export function formatLastAccess(isoDate: string | null): string {
  if (!isoDate) return 'Sin acceso previo';
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Hace 1 semana';
  if (weeks < 5) return `Hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

export function generateInitials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}
