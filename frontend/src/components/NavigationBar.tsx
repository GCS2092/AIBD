import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './NavigationBar.css';

function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  
  // Récupérer le rôle de l'utilisateur depuis le token
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

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">
            🚗 AIBD
          </Link>
        </div>

        <div className="nav-links">
          {/* Navigation pour tous les utilisateurs */}
          {!isAuthenticated && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Accueil
              </Link>
              <Link 
                to="/book" 
                className={`nav-link ${isActive('/book') ? 'active' : ''}`}
              >
                Réserver
              </Link>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Connexion
              </Link>
            </>
          )}

          {/* Navigation pour les clients (non authentifiés ou clients) */}
          {isClient && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') && !isActive('/history') ? 'active' : ''}`}
              >
                Accueil
              </Link>
              <Link 
                to="/book" 
                className={`nav-link ${isActive('/book') ? 'active' : ''}`}
              >
                Réserver
              </Link>
              <Link 
                to="/history" 
                className={`nav-link ${isActive('/history') ? 'active' : ''}`}
              >
                Historique
              </Link>
            </>
          )}

          {/* Navigation pour les admins */}
          {isAdmin && (
            <>
              <Link 
                to="/admin/dashboard" 
                className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  navigate('/admin/dashboard');
                  setTimeout(() => {
                    const event = new CustomEvent('switchTab', { detail: 'drivers' });
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className={`nav-link ${location.pathname.includes('/admin/drivers') ? 'active' : ''}`}
              >
                Chauffeurs
              </button>
              <button
                onClick={() => {
                  navigate('/admin/dashboard');
                  setTimeout(() => {
                    const event = new CustomEvent('switchTab', { detail: 'rides' });
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className={`nav-link ${location.pathname.includes('/admin/rides') ? 'active' : ''}`}
              >
                Courses
              </button>
              <button
                onClick={() => {
                  navigate('/admin/dashboard');
                  setTimeout(() => {
                    const event = new CustomEvent('switchTab', { detail: 'pricing' });
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className={`nav-link ${location.pathname.includes('/admin/pricing') ? 'active' : ''}`}
              >
                Tarifs
              </button>
              <button
                onClick={() => {
                  navigate('/admin/dashboard');
                  setTimeout(() => {
                    const event = new CustomEvent('switchTab', { detail: 'vehicles' });
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className={`nav-link ${location.pathname.includes('/admin/vehicles') ? 'active' : ''}`}
              >
                Véhicules
              </button>
              <Link 
                to="/admin/notifications" 
                className={`nav-link ${isActive('/admin/notifications') ? 'active' : ''}`}
              >
                Notifications
              </Link>
            </>
          )}

          {/* Navigation pour les chauffeurs */}
          {isDriver && (
            <>
              <Link 
                to="/driver/dashboard" 
                className={`nav-link ${isActive('/driver/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/driver/profile/edit" 
                className={`nav-link ${isActive('/driver/profile/edit') ? 'active' : ''}`}
              >
                Mon Profil
              </Link>
              <Link 
                to="/driver/vehicle/register" 
                className={`nav-link ${isActive('/driver/vehicle/register') ? 'active' : ''}`}
              >
                Mon Véhicule
              </Link>
              <Link 
                to="/driver/notifications" 
                className={`nav-link ${isActive('/driver/notifications') ? 'active' : ''}`}
              >
                Notifications
              </Link>
            </>
          )}

          {/* Bouton de déconnexion si authentifié */}
          {isAuthenticated && (
            <button 
              className="nav-link nav-logout"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;

