'use client';

import { useEffect, useRef, useState } from 'react';
import { SpinnerAurea } from './SpinnerAurea';
import { StepIndicator } from './StepIndicator';
import type { AuthTransitionProps } from './auth-transition.types';
import { TRANSITION_MESSAGES } from './auth-transition.types';

export function AuthTransition({
  phase,
  userDisplayName,
  userAvatarInitials,
  messageDurationMs = 1400,
  onReadyToMount,
}: AuthTransitionProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnReady = useRef(false);

  const messages = phase === 'verifying'
    ? TRANSITION_MESSAGES.verifying
    : TRANSITION_MESSAGES.loading_tenants;

  useEffect(() => {
    if (phase === 'ready') {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        if (onReadyToMount && !hasCalledOnReady.current) {
          hasCalledOnReady.current = true;
          onReadyToMount();
        }
      }, 280);
      return () => clearTimeout(timeout);
    }

    if (phase === 'verifying' || phase === 'loading_tenants') {
      setMessageIndex(0);
      intervalRef.current = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, messageDurationMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [phase, messageDurationMs, messages.length, onReadyToMount]);

  if (phase === 'error') {
    return null;
  }

  const currentMessage = messages[messageIndex] || messages[0];
  const stepMap: Record<string, 0 | 1 | 2> = {
    verifying: 1,
    loading_tenants: 2,
    ready: 2,
    error: 1,
  };
  const currentStep = stepMap[phase] ?? 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
        gap: 20,
        animation: isExiting ? 'aurea-fade-out 280ms ease forwards' : 'none',
      }}
    >
      <style>{`
        @keyframes aurea-fade-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
      `}</style>

      <SpinnerAurea size={64} showPulse={true} />

      <StepIndicator total={3} current={currentStep} />

      <div
        style={{
          textAlign: 'center',
          minHeight: 48,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: 'oklch(0.95 0 0)',
            fontFamily: 'var(--font-sans, system-ui)',
          }}
        >
          {currentMessage.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'oklch(0.65 0 0)',
            fontFamily: 'var(--font-sans, system-ui)',
          }}
        >
          {currentMessage.sub}
        </div>
      </div>

      {userDisplayName && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 8,
            borderTop: '0.5px solid oklch(0.28 0 0)',
            width: '100%',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'oklch(0.2 0 0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 500,
              color: 'oklch(0.65 0 0)',
            }}
          >
            {userAvatarInitials || 'U'}
          </div>
          <span
            style={{
              fontSize: 12,
              color: 'oklch(0.45 0 0)',
              fontFamily: 'var(--font-sans, system-ui)',
            }}
          >
            {userDisplayName}
          </span>
        </div>
      )}
    </div>
  );
}
