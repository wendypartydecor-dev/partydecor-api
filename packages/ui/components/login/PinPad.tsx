'use client';

import { useState, useCallback } from 'react';
import type { PinState } from '../../../../packages/auth/types/auth.types';

interface PinPadProps {
  state: PinState;
  onComplete: (pin: string) => void;
  onReset: () => void;
}

const PIN_LENGTH = 4;

export function PinPad({ state, onComplete, onReset }: PinPadProps) {
  const [value, setValue] = useState('');
  
  const handleKeyPress = useCallback((digit: string) => {
    if (state.status === 'validating') return;
    
    if (state.status === 'error') {
      setValue(digit);
      return;
    }
    
    const newValue = value + digit;
    setValue(newValue);
    
    if (newValue.length === PIN_LENGTH) {
      onComplete(newValue);
    }
  }, [value, state.status, onComplete]);

  const handleBackspace = useCallback(() => {
    setValue(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setValue('');
    onReset();
  }, [onReset]);

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => {
    const isFilled = i < value.length;
    const showError = state.status === 'error';
    
    return (
      <div
        key={i}
        className={`
          w-3 h-3 rounded-full transition-all duration-120
          ${isFilled
            ? showError
              ? 'bg-[oklch(62%_0.18_30)] scale-110'
              : 'bg-[oklch(78%_0.12_75)] scale-110'
            : showError
              ? 'bg-[oklch(62%_0.18_30)_/0.4]'
              : 'bg-neutral-200 dark:bg-neutral-700'
          }
        `}
      />
    );
  });

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '←'],
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-[10px]">
        {dots}
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-[oklch(45%_0.18_25)]">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-3 gap-[8px] w-full max-w-[200px]">
        {keys.flat().map((key) => {
          const isAction = key === 'C' || key === '←';
          const isBackspace = key === '←';
          const isClear = key === 'C';
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (isBackspace) handleBackspace();
                else if (isClear) handleClear();
                else handleKeyPress(key);
              }}
              disabled={state.status === 'validating'}
              className={`
                h-[52px] rounded-[12px] text-lg font-medium transition-all
                ${isAction
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 active:scale-95'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isBackspace ? (
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              ) : key}
            </button>
          );
        })}
      </div>

      {state.status === 'validating' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-neutral-950/60 backdrop-blur-sm rounded-[20px]">
          <div className="w-8 h-8 border-2 border-[oklch(78%_0.12_75)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
