import type { DriveStep } from 'driver.js';

const STORAGE_KEY_PREFIX = 'aibd_onboarding_done_';

export const ONBOARDING_KEYS = {
  VISITOR_HOME: `${STORAGE_KEY_PREFIX}visitor_home`,
  ADMIN_DASHBOARD: `${STORAGE_KEY_PREFIX}admin_dashboard`,
  DRIVER_DASHBOARD: `${STORAGE_KEY_PREFIX}driver_dashboard`,
} as const;

export function isOnboardingDone(key: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(key) === 'true';
}

export function setOnboardingDone(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, 'true');
}

export function resetOnboarding(key?: string): void {
  if (typeof window === 'undefined') return;
  if (key) {
    localStorage.removeItem(key);
  } else {
    Object.values(ONBOARDING_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

/** Étapes pour le visiteur (accueil) — non connecté ou client */
export const visitorHomeSteps: DriveStep[] = [
  {
    element: '[data-onboarding="welcome"]',
    popover: {
      title: 'Bienvenue sur AIBD',
      description: 'Transport professionnel vers l\'aéroport de Dakar. Ce guide vous montre les principales actions.',
      side: 'bottom',
      align: 'center',
      showButtons: ['next'],
    },
  },
  {
    element: '[data-onboarding="home-reserver"]',
    popover: {
      title: 'Réserver une course',
      description: 'Cliquez ici pour réserver un trajet vers ou depuis l\'aéroport. Remplissez le formulaire avec vos informations.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="home-edit-ride"]',
    popover: {
      title: 'Modifier une réservation',
      description: 'Avec votre code d\'accès reçu par SMS ou email, vous pouvez modifier ou consulter une réservation existante.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="home-historique"]',
    popover: {
      title: 'Historique des courses',
      description: 'Consultez l\'historique de vos courses (téléphone + code d\'accès requis).',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="home-login"]',
    popover: {
      title: 'Connexion admin / chauffeur',
      description: 'Administrateurs et chauffeurs se connectent ici pour accéder à leur tableau de bord.',
      side: 'bottom',
      align: 'end',
      showButtons: ['previous', 'close'],
      doneBtnText: 'Terminer',
    },
  },
];

/** Étapes pour l'admin — dashboard */
export const adminDashboardSteps: DriveStep[] = [
  {
    element: '[data-onboarding="admin-welcome"]',
    popover: {
      title: 'Tableau de bord Admin',
      description: 'Vous gérez ici les courses, chauffeurs, tarifs et véhicules. Voici les sections principales.',
      side: 'bottom',
      align: 'center',
      showButtons: ['next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-stats"]',
    popover: {
      title: 'Vue d\'ensemble',
      description: 'Statistiques globales : nombre de courses, chauffeurs actifs, revenus et indicateurs clés.',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-rides"]',
    popover: {
      title: 'Gestion des courses',
      description: 'Liste de toutes les courses. Filtrez par statut (en attente, terminées, annulées) et assignez des chauffeurs.',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-drivers"]',
    popover: {
      title: 'Chauffeurs',
      description: 'Liste des chauffeurs, vérification des permis et gestion des profils.',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-pricing"]',
    popover: {
      title: 'Tarifs',
      description: 'Gérez les tarifs par type de trajet (jour, nuit, heures de pointe).',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-vehicles"]',
    popover: {
      title: 'Véhicules',
      description: 'Véhicules enregistrés par les chauffeurs.',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="admin-nav-users"]',
    popover: {
      title: 'Utilisateurs',
      description: 'Création et gestion des comptes utilisateurs.',
      side: 'right',
      align: 'start',
      showButtons: ['previous', 'close'],
      doneBtnText: 'Terminer',
    },
  },
];

/** Étapes pour le chauffeur — dashboard */
export const driverDashboardSteps: DriveStep[] = [
  {
    element: '[data-onboarding="driver-welcome"]',
    popover: {
      title: 'Tableau de bord Chauffeur',
      description: 'Ici vous voyez vos courses proposées, en cours et l\'historique. Guide rapide des sections.',
      side: 'bottom',
      align: 'center',
      showButtons: ['next'],
    },
  },
  {
    element: '[data-onboarding="driver-nav-overview"]',
    popover: {
      title: 'Statuts',
      description: 'Vue d\'ensemble : passez disponible pour recevoir des courses et voyez le résumé de votre activité.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="driver-nav-available"]',
    popover: {
      title: 'Courses disponibles',
      description: 'Courses qui vous sont proposées. Acceptez ou refusez dans le délai indiqué.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="driver-nav-active"]',
    popover: {
      title: 'En cours',
      description: 'Courses en cours : démarrez la course, signalez la prise en charge et la fin de course.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'next'],
    },
  },
  {
    element: '[data-onboarding="driver-nav-history"]',
    popover: {
      title: 'Historique',
      description: 'Historique de vos courses passées.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'close'],
      doneBtnText: 'Terminer',
    },
  },
];
