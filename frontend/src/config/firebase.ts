// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuAJP4_AJ-BRERcyTCjEGmvt2qnCydt3s",
  authDomain: "aibd-a99d2.firebaseapp.com",
  projectId: "aibd-a99d2",
  storageBucket: "aibd-a99d2.firebasestorage.app",
  messagingSenderId: "75152343952",
  appId: "1:75152343952:web:51ed160ae2ab5cc989e915"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: Messaging | null = null;

// Vérifier si on est dans le navigateur et si le service est disponible
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging non disponible:', error);
  }
}

/**
 * Demander la permission et obtenir le token FCM
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging non disponible');
    return null;
  }

  try {
    // Demander la permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Obtenir le token FCM
      // Note: Vous devez créer un Service Worker et l'enregistrer
      // Le nom du service worker doit correspondre à celui enregistré
      const token = await getToken(messaging, {
        vapidKey: 'VOTRE_CLE_VAPID_ICI', // À remplacer par votre clé VAPID depuis Firebase Console
      });
      
      if (token) {
        console.log('✅ Token FCM obtenu:', token);
        return token;
      } else {
        console.warn('Aucun token disponible');
        return null;
      }
    } else {
      console.warn('Permission de notification refusée');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return null;
  }
}

/**
 * Écouter les messages en arrière-plan (quand l'app est ouverte)
 */
export function onMessageListener(): Promise<unknown> {
  if (!messaging) {
    return Promise.reject(new Error('Firebase Messaging non disponible'));
  }

  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      console.log('Message reçu:', payload);
      resolve(payload);
    });
  });
}

export { app, messaging };
export default app;

