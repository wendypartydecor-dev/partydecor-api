export const semanticTokens = {
  colors: {
    gold: {
      DEFAULT: 'oklch(0.75 0.15 85)',
      hover: 'oklch(0.7 0.18 85)',
    },
    surface: {
      primary: 'oklch(0.98 0.01 60)',
      secondary: 'oklch(0.95 0.01 60)',
    },
  },
  animation: {
    'spin-slow': 'spin 2s linear infinite',
    'shake': 'shake 0.3s ease-in-out',
    'flip': 'flip 0.6s ease-in-out',
  },
  keyframes: {
    shake: {
      '0%, 100%': { transform: 'translateX(0)' },
      '25%': { transform: 'translateX(-8px)' },
      '50%': { transform: 'translateX(8px)' },
      '75%': { transform: 'translateX(-8px)' },
    },
    flip: {
      '0%': { transform: 'rotateX(0)' },
      '50%': { transform: 'rotateX(90deg)' },
      '100%': { transform: 'rotateX(0)' },
    },
  },
};
