import type { Config } from 'tailwindcss';

export const aureaTheme: Config['theme'] = {
  extend: {
    colors: {
      aurea: {
        gold: {
          DEFAULT: 'oklch(45% 0.14 75)',
          dark: 'oklch(78% 0.12 75)',
          hover: 'oklch(82% 0.14 75)',
          muted: 'oklch(78% 0.12 75 / 0.15)',
        },
        financial: {
          pending: {
            surface: 'oklch(95% 0.06 75)',
            border: 'oklch(72% 0.14 72)',
            text: 'oklch(42% 0.14 72)',
            ambient: 'oklch(72% 0.14 72)',
          },
          paid: {
            surface: 'oklch(94% 0.05 180)',
            border: 'oklch(62% 0.12 180)',
            text: 'oklch(38% 0.12 180)',
            ambient: 'oklch(62% 0.12 180)',
          },
          overdue: {
            surface: 'oklch(94% 0.06 30)',
            border: 'oklch(62% 0.18 30)',
            text: 'oklch(38% 0.18 30)',
            ambient: 'oklch(62% 0.18 30)',
          },
        },
        logistics: {
          urgent: {
            surface: 'oklch(93% 0.07 25)',
            border: 'oklch(60% 0.20 25)',
            text: 'oklch(36% 0.20 25)',
            pulse: 'oklch(60% 0.20 25)',
            ambient: 'oklch(60% 0.20 25)',
          },
          upcoming: {
            surface: 'oklch(95% 0.04 280)',
            border: 'oklch(68% 0.10 280)',
            text: 'oklch(40% 0.10 280)',
            ambient: 'oklch(68% 0.10 280)',
          },
          confirmed: {
            surface: 'oklch(93% 0.06 175)',
            border: 'oklch(55% 0.15 175)',
            text: 'oklch(32% 0.15 175)',
          },
          past: {
            surface: 'oklch(94% 0.01 260)',
            border: 'oklch(70% 0.02 260)',
            text: 'oklch(50% 0.02 260)',
          },
        },
        system: {
          danger: {
            dark: 'oklch(62% 0.20 25)',
            light: 'oklch(42% 0.22 25)',
          },
          info: {
            dark: 'oklch(68% 0.15 255)',
            light: 'oklch(45% 0.18 255)',
          },
        },
      },
    },
    borderRadius: {
      card: '12px',
      panel: '16px',
      badge: '99px',
    },
    spacing: {
      'panel-gap': '20px',
      'panel-padding': '24px',
      'card-padding': '16px',
      'tab-height': '40px',
    },
    transitionDuration: {
      fast: '120ms',
      base: '200ms',
      slow: '350ms',
    },
    transitionTimingFunction: {
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    animation: {
      'ambient-pulse': 'ambientPulse 2s ease-in-out infinite',
    },
    keyframes: {
      ambientPulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.6' },
      },
    },
  },
};

export const aureaCSSVariables = `
:root {
  --aurea-gold: oklch(45% 0.14 75);
  --aurea-gold-dark: oklch(78% 0.12 75);
  --aurea-gold-hover: oklch(82% 0.14 75);
  
  --aurea-financial-pending-surface: oklch(95% 0.06 75);
  --aurea-financial-pending-border: oklch(72% 0.14 72);
  --aurea-financial-pending-text: oklch(42% 0.14 72);
  
  --aurea-financial-paid-surface: oklch(94% 0.05 180);
  --aurea-financial-paid-border: oklch(62% 0.12 180);
  --aurea-financial-paid-text: oklch(38% 0.12 180);
  
  --aurea-financial-overdue-surface: oklch(94% 0.06 30);
  --aurea-financial-overdue-border: oklch(62% 0.18 30);
  --aurea-financial-overdue-text: oklch(38% 0.18 30);
  
  --aurea-logistics-urgent-surface: oklch(93% 0.07 25);
  --aurea-logistics-urgent-border: oklch(60% 0.20 25);
  --aurea-logistics-urgent-text: oklch(36% 0.20 25);
  
  --aurea-logistics-upcoming-surface: oklch(95% 0.04 280);
  --aurea-logistics-upcoming-border: oklch(68% 0.10 280);
  --aurea-logistics-upcoming-text: oklch(40% 0.10 280);
  
  --aurea-logistics-confirmed-surface: oklch(93% 0.06 175);
  --aurea-logistics-confirmed-border: oklch(55% 0.15 175);
  --aurea-logistics-confirmed-text: oklch(32% 0.15 175);
  
  --aurea-logistics-past-surface: oklch(94% 0.01 260);
  --aurea-logistics-past-border: oklch(70% 0.02 260);
  --aurea-logistics-past-text: oklch(50% 0.02 260);
  
  --radius-card: 12px;
  --radius-panel: 16px;
  --radius-badge: 99px;
}
`;
