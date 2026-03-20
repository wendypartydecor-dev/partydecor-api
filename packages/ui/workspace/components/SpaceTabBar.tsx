'use client';

import type { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

interface SpaceTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SpaceTabBar({ tabs, activeTab, onTabChange }: SpaceTabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 h-[40px] bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => {
        const IconComponent = tab.icon
          ? (LucideIcons[tab.icon as keyof typeof LucideIcons] as ComponentType<{ className?: string }>)
          : null;

        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-1.5 px-3 h-[32px] text-sm font-medium rounded-lg transition-colors
              ${isActive
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50'
              }
            `}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={`
                  min-w-[18px] h-[18px] px-1 text-xs font-semibold rounded-full flex items-center justify-center
                  ${isActive
                    ? 'bg-aurea-gold text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }
                `}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-aurea-gold rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
