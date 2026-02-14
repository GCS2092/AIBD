import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OnboardingStep } from '../config/onboardingSteps';
import './OnboardingOverlay.css';

const PADDING = 8;

export interface OnboardingOverlayProps {
  steps: OnboardingStep[];
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function OnboardingOverlay({
  steps,
  currentIndex,
  onNext,
  onSkip,
}: OnboardingOverlayProps) {
  const step = steps[currentIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(
      new DOMRect(
        rect.left - PADDING,
        rect.top - PADDING,
        rect.width + PADDING * 2,
        rect.height + PADDING * 2
      )
    );
  }, [step?.target]);

  useEffect(() => {
    updateRect();
    const ro = new ResizeObserver(updateRect);
    const el = step?.target ? document.querySelector(step.target) : null;
    if (el) ro.observe(el);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [step?.target, updateRect]);

  if (!step) return null;

  const isLast = currentIndex === steps.length - 1;

  return (
    <div ref={overlayRef} className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Guide de visite">
      {/* Spotlight: 4 bands around target (or full overlay if no target) */}
      {targetRect ? (
        <>
          <div
            className="onboarding-backdrop"
            style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
          />
          <div
            className="onboarding-backdrop"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div
            className="onboarding-backdrop"
            style={{
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />
          <div
            className="onboarding-backdrop"
            style={{
              top: targetRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </>
      ) : (
        <div className="onboarding-backdrop onboarding-backdrop-full" />
      )}

      {/* Tooltip card */}
      <div
        className={`onboarding-tooltip ${targetRect ? 'onboarding-tooltip-positioned' : 'onboarding-tooltip-centered'}`}
        style={
          targetRect
            ? {
                top: targetRect.bottom + 12,
                left: Math.max(12, Math.min(targetRect.left, window.innerWidth - 320)),
              }
            : undefined
        }
      >
        <h3 className="onboarding-tooltip-title">{step.title}</h3>
        <p className="onboarding-tooltip-body">{step.body}</p>
        <div className="onboarding-tooltip-actions">
          <button type="button" className="onboarding-btn onboarding-btn-skip" onClick={onSkip}>
            Passer la démo
          </button>
          <button type="button" className="onboarding-btn onboarding-btn-next" onClick={onNext}>
            {isLast ? 'Terminer' : 'Suivant'}
          </button>
        </div>
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === currentIndex ? 'active' : ''}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  );
}
