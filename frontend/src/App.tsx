import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { websocketService } from './services/websocketService';
import { authService } from './services/authService';
import { fcmService } from './services/fcmService';
import './i18n/config';
import './App.css';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import TrackingPage from './pages/TrackingPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import NotificationsPage from './pages/NotificationsPage';
import RideDetailPage from './pages/RideDetailPage';
import EditRideByCodePage from './pages/EditRideByCodePage';
import DriverTrackingPage from './pages/DriverTrackingPage';
import EditDriverPage from './pages/EditDriverPage';
import EditDriverProfilePage from './pages/EditDriverProfilePage';
import RegisterVehiclePage from './pages/RegisterVehiclePage';
import TestConnexionPage from './pages/TestConnexionPage';

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
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/edit-ride" element={<EditRideByCodePage />} />
          <Route path="/track/:rideId" element={<TrackingPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/rides/:id" element={<RideDetailPage />} />
          <Route path="/admin/drivers/:id/edit" element={<EditDriverPage />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/track/:rideId" element={<DriverTrackingPage />} />
          <Route path="/driver/profile/edit" element={<EditDriverProfilePage />} />
          <Route path="/driver/vehicle/register" element={<RegisterVehiclePage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/driver/notifications" element={<NotificationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/test-connexion" element={<TestConnexionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;