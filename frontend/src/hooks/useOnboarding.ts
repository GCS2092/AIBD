import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  ONBOARDING_KEYS,
  isOnboardingDone,
  setOnboardingDone,
  visitorHomeSteps,
  adminDashboardSteps,
  driverDashboardSteps,
} from '../config/onboarding';

export type OnboardingContext = 'visitor_home' | 'admin_dashboard' | 'driver_dashboard';

const CONTEXT_CONFIG: Record<
  OnboardingContext,
  { storageKey: string; steps: import('driver.js').DriveStep[] }
> = {
  visitor_home: { storageKey: ONBOARDING_KEYS.VISITOR_HOME, steps: visitorHomeSteps },
  admin_dashboard: { storageKey: ONBOARDING_KEYS.ADMIN_DASHBOARD, steps: adminDashboardSteps },
  driver_dashboard: { storageKey: ONBOARDING_KEYS.DRIVER_DASHBOARD, steps: driverDashboardSteps },
};

export interface UseOnboardingOptions {
  /** Contexte (page/role) pour lequel lancer l'onboarding */
  context: OnboardingContext;
  /** Si true, lance le tour même si déjà vu (ex: bouton "Voir l'aide") */
  forceRun?: boolean;
  /** Délai en ms avant de lancer automatiquement (pour laisser le DOM prêt). 0 = pas d'auto. */
  autoRunDelay?: number;
}

export function useOnboarding(options: UseOnboardingOptions) {
  const { context, forceRun = false, autoRunDelay = 800 } = options;
  const driverRef = useRef<Driver | null>(null);
  const config = CONTEXT_CONFIG[context];

  const startOnboarding = useCallback(() => {
    if (!config) return;
    if (driverRef.current?.isActive()) return;

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminer',
      steps: config.steps,
      onDestroyed: () => {
        setOnboardingDone(config.storageKey);
        driverRef.current = null;
      },
    });
    driverRef.current = driverObj;
    driverObj.drive();
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const alreadyDone = isOnboardingDone(config.storageKey);
    if (alreadyDone && !forceRun) return;

    const timer =
      autoRunDelay > 0
        ? window.setTimeout(() => {
            startOnboarding();
          }, autoRunDelay)
        : undefined;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [config?.storageKey, forceRun, autoRunDelay, startOnboarding]);

  return { startOnboarding };
}
