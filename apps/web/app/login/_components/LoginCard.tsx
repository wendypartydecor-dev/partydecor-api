'use client';

import { useState } from 'react';

interface LoginCardProps {
  onPinComplete: (email: string, pin: string) => void;
  error?: string | null;
}

export function LoginCard({ onPinComplete, error }: LoginCardProps) {
  const [pin, setPin] = useState('');

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (key !== '' && pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        onPinComplete('admin@aurea.com', newPin);
        setPin('');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div
        style={{
          background: 'var(--color-background-primary, oklch(0.13 0 0))',
          border: '0.5px solid var(--color-border-tertiary, oklch(0.28 0 0))',
          borderRadius: 20,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 340,
        }}
      >
        <div
          style={{
            padding: '32px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, oklch(0.85 0.2 95), oklch(0.78 0.18 95))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>A</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'oklch(0.95 0 0)',
                fontFamily: 'var(--font-sans, system-ui)',
              }}
            >
              Aurea
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'oklch(0.65 0 0)',
                marginTop: 4,
                fontFamily: 'var(--font-sans, system-ui)',
              }}
            >
              Ingresa tu PIN de acceso
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: pin.length > i ? 'oklch(0.85 0.2 95)' : 'oklch(0.25 0 0)',
                  transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 150ms ease',
                }}
              />
            ))}
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'oklch(0.35 0.15 25 / 0.3)',
                border: '0.5px solid oklch(0.35 0.15 25)',
                borderRadius: 10,
                color: 'oklch(0.85 0.1 25)',
                fontSize: 13,
                textAlign: 'center',
                fontFamily: 'var(--font-sans, system-ui)',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              width: '100%',
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, idx) => (
              <button
                key={idx}
                onClick={() => handleKey(String(key))}
                style={{
                  height: 52,
                  borderRadius: 12,
                  border: 'none',
                  fontSize: 18,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 100ms',
                  background:
                    key === ''
                      ? 'transparent'
                      : key === 'del'
                      ? 'oklch(0.18 0 0)'
                      : 'oklch(0.18 0 0)',
                  color:
                    key === ''
                      ? 'transparent'
                      : key === 'del'
                      ? 'oklch(0.65 0 0)'
                      : 'oklch(0.95 0 0)',
                  fontFamily: 'var(--font-sans, system-ui)',
                }}
                onMouseDown={(e) => {
                  if (key !== '') {
                    (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
                  }
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                {key === 'del' ? '⌫' : key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
