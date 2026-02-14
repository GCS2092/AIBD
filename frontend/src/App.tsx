import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react'; // ← Ajout de useRef
import OneSignal from 'react-onesignal';
import { websocketService } from './services/websocketService';
import { authService } from './services/authService';
import { fcmService } from './services/fcmService';
import './i18n/config';
import './App.css';

// Pages (tous vos imports de pages)
import HomePage from './pages/HomePage';
// ... autres pages

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 10000,
    },
  },
});

const ONESIGNAL_APP_ID = "9a923f92-cdeb-47d7-85f8-f65dd0768166";

function App() {
  // WebSocket et FCM
  useEffect(() => {
    if (authService.isAuthenticated()) {
      websocketService.connect();
      if (fcmService.isSupported()) {
        fcmService.initialize();
      }
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // 🔔 OneSignal: Initialisation unique
  const oneSignalInitialized = useRef(false);

  useEffect(() => {
    if (!ONESIGNAL_APP_ID || typeof window === 'undefined') {
      console.warn('⚠️ OneSignal App ID manquant');
      return;
    }

    if (oneSignalInitialized.current) {
      console.log('⏭️ OneSignal déjà initialisé');
      return;
    }

    const initOneSignal = async () => {
      try {
        console.log('🚀 Initialisation de OneSignal...');
        
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });

        oneSignalInitialized.current = true;
        console.log('✅ OneSignal initialisé avec succès');

        // Demander la permission explicitement
        const permission = await OneSignal.Notifications.requestPermission();
        console.log('📱 Permission notifications:', permission);

        // Identifier l'utilisateur si connecté
        const userId = authService.getUserId();
        if (userId) {
          await OneSignal.login(userId);
          console.log(`✅ Utilisateur identifié: ${userId}`);
        }

      } catch (err) {
        console.error('❌ Erreur OneSignal:', err);
      }
    };

    initOneSignal();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Toutes vos routes */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;