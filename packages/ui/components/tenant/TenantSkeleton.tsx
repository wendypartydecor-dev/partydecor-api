'use client';

interface TenantSkeletonProps {
  count?: number;
}

export function TenantSkeleton({ count = 3 }: TenantSkeletonProps) {
  return (
    <div className="space-y-[12px]">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-[16px] bg-white dark:bg-neutral-900 rounded-[12px] border border-neutral-200 dark:border-neutral-800"
        >
          <div className="w-[48px] h-[48px] rounded-[10px] bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse opacity-45" />
            <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse opacity-45" />
          </div>
          
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse opacity-45" />
        </div>
      ))}
    </div>
  );
}
