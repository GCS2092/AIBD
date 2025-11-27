import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, History, LogIn, Clock, Calendar, Key } from 'lucide-react';
import { authService } from '../services/authService';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import './NavigationBar.css';

function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(null);
  
  const getUserRole = (): 'admin' | 'driver' | 'client' | null => {
    if (!isAuthenticated) return null;
    try {
      const token = authService.getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();
  const isAdmin = userRole === 'admin';
  const isDriver = userRole === 'driver';
  const isClient = !isAdmin && !isDriver;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Mise à jour de l'heure et de la date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      // Format de date plus lisible
      const day = now.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNumber = now.getDate();
      const month = now.toLocaleDateString('fr-FR', { month: 'short' });
      const date = `${day.charAt(0).toUpperCase() + day.slice(1)} ${dayNumber} ${month}`;
      
      setCurrentTime(time);
      setCurrentDate(date);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Afficher uniquement pour les clients ou non authentifiés sur la page d'accueil
  const showClientNav = (!isAuthenticated || isClient) && (location.pathname === '/' || location.pathname === '/book' || location.pathname === '/history');

  // Récupérer le code d'accès depuis localStorage et l'afficher immédiatement
  useEffect(() => {
    try {
      const storedCode = localStorage.getItem('activeAccessCode');
      if (storedCode) {
        setActiveAccessCode(storedCode);
      }
    } catch (error) {
      // localStorage peut être indisponible (mode privé, désactivé, etc.)
      // Ce n'est pas critique car la recherche fonctionne toujours avec téléphone + code
      console.warn('localStorage non disponible:', error);
    }
  }, []);

  // Écouter les changements dans localStorage pour mettre à jour immédiatement
  useEffect(() => {
    const handleStorageChange = () => {
      const storedCode = localStorage.getItem('activeAccessCode');
      if (storedCode) {
        setActiveAccessCode(storedCode);
      } else {
        setActiveAccessCode(null);
      }
    };

    // Écouter les changements de localStorage (depuis d'autres onglets)
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter aussi les événements personnalisés pour les changements dans le même onglet
    window.addEventListener('activeAccessCodeUpdated', handleStorageChange);
    
    // Vérifier aussi les changements dans le même onglet (via un interval)
    const interval = setInterval(() => {
      try {
        const storedCode = localStorage.getItem('activeAccessCode');
        if (storedCode && storedCode !== activeAccessCode) {
          setActiveAccessCode(storedCode);
        } else if (!storedCode && activeAccessCode) {
          setActiveAccessCode(null);
        }
      } catch (error) {
        // localStorage peut être indisponible
        // Ne pas bloquer l'application, juste ne pas afficher le code
        if (activeAccessCode) {
          setActiveAccessCode(null);
        }
      }
    }, 500); // Vérifier toutes les 500ms pour une réactivité plus rapide

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('activeAccessCodeUpdated', handleStorageChange);
      clearInterval(interval);
    };
  }, [activeAccessCode]);

  // Vérifier en arrière-plan s'il y a des courses actives pour retirer le code si nécessaire
  const storedPhone = localStorage.getItem('clientPhone');
  const storedAccessCode = localStorage.getItem('activeAccessCode');
  
  const { data: ridesData } = useQuery({
    queryKey: ['nav-active-rides', storedPhone, storedAccessCode],
    queryFn: async () => {
      if (!storedPhone || !storedAccessCode) return null;
      try {
        const result = await rideService.getMyRides(
          1,
          10,
          storedPhone,
          undefined,
          undefined,
          undefined,
          storedAccessCode
        );
        // Afficher le code si la course existe (même terminée, pour les courses récentes)
        // Garder le code affiché pour les courses des 30 derniers jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRides = result.data.filter((ride: any) => {
          const rideDate = new Date(ride.scheduledAt || ride.createdAt);
          return rideDate >= thirtyDaysAgo;
        });
        
        return recentRides.length > 0 ? storedAccessCode : null;
      } catch {
        return null;
      }
    },
    enabled: !!storedPhone && !!storedAccessCode && showClientNav,
    refetchInterval: 30000, // Vérifier toutes les 30 secondes
  });

  // Retirer le code seulement si vraiment aucune course récente (même terminée)
  useEffect(() => {
    if (ridesData === null && storedAccessCode) {
      // Vérifier une dernière fois avant de retirer (pour éviter de retirer trop tôt)
      const checkCode = localStorage.getItem('activeAccessCode');
      if (checkCode === storedAccessCode) {
        // Attendre un peu avant de retirer pour être sûr
        const timeout = setTimeout(() => {
          const finalCheck = localStorage.getItem('activeAccessCode');
          if (finalCheck === storedAccessCode) {
            setActiveAccessCode(null);
            localStorage.removeItem('activeAccessCode');
          }
        }, 10000); // Attendre 10 secondes avant de retirer
        return () => clearTimeout(timeout);
      }
    }
  }, [ridesData, storedAccessCode]);

  return (
    <>
      {/* Barre de navigation en haut avec heure/date et connexion */}
      <nav className="navigation-bar-top">
        <div className="nav-container-top">
          <div className="nav-datetime">
            <div className="nav-time">
              <Clock className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>
            <div className="nav-date">
              <Calendar className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>
            {/* Code d'accès si course active */}
            {activeAccessCode && showClientNav && (
              <>
                <div className="nav-separator"></div>
                <div className="nav-access-code">
                  <Key className="w-4 h-4" />
                  <span className="nav-code-label">Code:</span>
                  <span className="nav-code-value">{activeAccessCode}</span>
                </div>
              </>
            )}
          </div>

          {/* Bouton Connexion */}
          {!isAuthenticated && (
            <Link 
              to="/login" 
              className="nav-link-login"
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion</span>
            </Link>
          )}

          {/* Bouton de déconnexion si authentifié */}
          {isAuthenticated && (
            <button 
              className="nav-link-login"
              onClick={handleLogout}
            >
              <LogIn className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </nav>

      {/* Barre de navigation en bas (style WhatsApp) */}
      {showClientNav && (
        <nav className="navigation-bar-bottom">
          <div className="nav-container-bottom">
            <Link 
              to="/" 
              className={`nav-link-bottom ${isActive('/') && !isActive('/book') && !isActive('/history') ? 'active' : ''}`}
            >
              <Home className="w-5 h-5" />
              <span>Accueil</span>
            </Link>
            <Link 
              to="/book" 
              className={`nav-link-bottom ${isActive('/book') ? 'active' : ''}`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Réserver</span>
            </Link>
            <Link 
              to="/history" 
              className={`nav-link-bottom ${isActive('/history') ? 'active' : ''}`}
            >
              <History className="w-5 h-5" />
              <span>Historique</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

export default NavigationBar;
