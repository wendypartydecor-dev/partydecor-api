import type { TenantSkeletonProps } from './tenant-selector.types';

function SkeletonBox({ w, h, r = 5 }: { w: string; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: r,
      background: 'var(--color-background-secondary)',
      animation: 'aurea-pulse 1.6s ease-in-out infinite',
    }} />
  );
}

export function TenantSkeleton({ count = 3 }: TenantSkeletonProps) {
  return (
    <>
      <style>{`
        @keyframes aurea-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center',
            gap: 12, padding: '10px 12px', marginBottom: 3,
          }}
        >
          <SkeletonBox w="40px" h={40} r={9} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <SkeletonBox w={`${55 + (i * 13) % 30}%`} h={12} />
            <SkeletonBox w={`${30 + (i * 9) % 25}%`} h={10} />
          </div>
          <SkeletonBox w="14px" h={14} r={3} />
        </div>
      ))}
    </>
  );
}
