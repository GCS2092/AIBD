// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
// @ts-ignore
const isDev = import.meta.env.DEV;

// Détecter automatiquement l'URL de l'API
// Si on est sur mobile (IP locale), utiliser l'IP locale pour l'API aussi
function getApiUrl(): string {
  // Si une URL est définie dans les variables d'environnement, l'utiliser
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Détecter si on est en production (Vercel, etc.)
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') || hostname.includes('vercel.com') || !hostname.includes('localhost');
  
  // En production (Vercel) : VITE_API_URL est OBLIGATOIRE (URL du backend NestJS)
  if (isProduction) {
    if (envApiUrl) return envApiUrl;
    // Pas d'URL backend : les appels API échoueront (405). Définir VITE_API_URL sur Vercel.
    if (typeof window !== 'undefined') {
      console.warn('⚠️ VITE_API_URL non défini : l’API pointe vers cette page. Définir VITE_API_URL sur Vercel (URL du backend).');
    }
    return window.location.origin;
  }
  
  // Si l'hostname est une IP locale (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
    // Utiliser l'IP locale pour l'API aussi (port 3001)
    return `http://${hostname}:3001`;
  }
  
  // Sinon, utiliser localhost (PC) avec le port 3001
  return 'http://localhost:3001';
}

export const API_URL = getApiUrl();

console.log('🔗 API URL configurée:', API_URL);
console.log('📍 Hostname:', window.location.hostname);

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER_DRIVER: '/auth/register-driver',
  
  // Rides
  RIDES: '/rides',
  RIDE_BY_CODE: '/rides/by-code',
  RIDE_STATUS: (id: string) => `/rides/${id}/status`,
  CANCEL_RIDE: (id: string) => `/rides/${id}/cancel`,
  USER_RIDES: '/rides/my-rides',
  
  // Pricing
  PRICING: '/pricing',
  
  // GPS
  GPS_LOCATION: (id: string) => `/gps/rides/${id}/location`,
  GPS_ETA: (id: string) => `/gps/rides/${id}/eta`,
  
  // Ratings
  RATINGS: (id: string) => `/ratings/rides/${id}`,
  DRIVER_RATINGS: (id: string) => `/ratings/drivers/${id}`,
  
  // Refunds
  REFUND_STATUS: (id: string) => `/refunds/rides/${id}/status`,
  
  // Admin
  ADMIN_STATS: '/admin/dashboard/stats',
  ADMIN_DRIVERS: '/admin/drivers',
  ADMIN_DRIVER: (id: string) => `/admin/drivers/${id}`,
  ADMIN_RIDES: '/admin/rides',
  ADMIN_RIDE: (id: string) => `/admin/rides/${id}`,
  ADMIN_ASSIGN_RIDE: (rideId: string, driverId: string) => `/admin/rides/${rideId}/assign/${driverId}`,
  ADMIN_RIDE_ACCEPT: (id: string) => `/admin/rides/${id}/accept`,
  ADMIN_RIDE_START: (id: string) => `/admin/rides/${id}/start`,
  ADMIN_RIDE_COMPLETE: (id: string) => `/admin/rides/${id}/complete`,
  ADMIN_RIDE_CANCEL: (id: string) => `/admin/rides/${id}/cancel`,
  ADMIN_CLEAR_COMPLETED_RIDES: '/admin/rides/clear-completed',
  ADMIN_USERS: '/admin/users',
  
  // Driver
  DRIVER_PROFILE: '/driver/profile',
  DRIVER_STATUS: '/driver/status',
  DRIVER_RIDES: '/driver/rides',
  DRIVER_ACCEPT_RIDE: (id: string) => `/driver/rides/${id}/accept`,
  DRIVER_REFUSE_RIDE: (id: string) => `/driver/rides/${id}/refuse`,
  DRIVER_START_RIDE: (id: string) => `/driver/rides/${id}/start`,
  DRIVER_COMPLETE_RIDE: (id: string) => `/driver/rides/${id}/complete`,
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread/count',
  NOTIFICATIONS_REGISTER_FCM: '/notifications/fcm/register',
} as const;

