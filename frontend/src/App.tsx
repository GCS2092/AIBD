import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { websocketService } from './services/websocketService';
import { authService } from './services/authService';
import { fcmService } from './services/fcmService';
import './i18n/config';
import './App.css';

// Pages
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Rafraîchir quand l'utilisateur revient sur l'onglet
      retry: 1,
      staleTime: 10000, // Considérer les données comme "fraîches" pendant 10 secondes
    },
  },
});

function App() {
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

