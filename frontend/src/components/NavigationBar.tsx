import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { authService } from '../services/authService';
import './NavigationBar.css';

function NavigationBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  
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
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            🚗 AIBD
          </Link>
        </div>

        {/* Menu Hamburger */}
        <button
          className="hamburger-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Menu déroulant */}
        <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
          {/* Navigation pour tous les utilisateurs */}
          {!isAuthenticated && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Accueil
              </Link>
              <Link 
                to="/book" 
                className={`nav-link ${isActive('/book') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Réserver
              </Link>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Connexion
              </Link>
            </>
          )}

          {/* Navigation pour les clients */}
          {isClient && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') && !isActive('/history') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Accueil
              </Link>
              <Link 
                to="/book" 
                className={`nav-link ${isActive('/book') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Réserver
              </Link>
              <Link 
                to="/history" 
                className={`nav-link ${isActive('/history') ? 'active' : ''}`}
                onClick={closeMenu}
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
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  navigate('/admin/dashboard');
                  closeMenu();
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
                  closeMenu();
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
                  closeMenu();
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
                  closeMenu();
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
                onClick={closeMenu}
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
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <Link 
                to="/driver/profile/edit" 
                className={`nav-link ${isActive('/driver/profile/edit') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Mon Profil
              </Link>
              <Link 
                to="/driver/vehicle/register" 
                className={`nav-link ${isActive('/driver/vehicle/register') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Mon Véhicule
              </Link>
              <Link 
                to="/driver/notifications" 
                className={`nav-link ${isActive('/driver/notifications') ? 'active' : ''}`}
                onClick={closeMenu}
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
