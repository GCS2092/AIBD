import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Car, History } from 'lucide-react';
import '../pages/DriverDashboard.css';

interface DriverBottomNavProps {
  selectedTab?: 'overview' | 'available' | 'active' | 'history';
  onTabChange?: (tab: 'overview' | 'available' | 'active' | 'history') => void;
}

export default function DriverBottomNav({ selectedTab, onTabChange }: DriverBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/driver/dashboard';

  const handleTabClick = (tab: 'overview' | 'available' | 'active' | 'history') => {
    if (isDashboard && onTabChange) {
      // Si on est sur le dashboard, changer l'onglet
      onTabChange(tab);
    } else {
      // Sinon, naviguer vers le dashboard avec l'onglet
      navigate('/driver/dashboard', { state: { tab } });
    }
  };

  // Déterminer l'onglet actif
  const getActiveTab = (): 'overview' | 'available' | 'active' | 'history' => {
    if (isDashboard && selectedTab) {
      return selectedTab;
    }
    // Si on est sur une autre page, déterminer l'onglet basé sur la route
    if (location.pathname.includes('/driver/track')) {
      return 'active';
    }
    if (location.pathname === '/driver/notifications') {
      return 'overview'; // Par défaut
    }
    return 'overview';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => handleTabClick('overview')}
      >
        <LayoutDashboard className="nav-icon" />
        <span className="nav-label">Statuts</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'available' ? 'active' : ''}`}
        onClick={() => handleTabClick('available')}
      >
        <List className="nav-icon" />
        <span className="nav-label">Disponibles</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'active' ? 'active' : ''}`}
        onClick={() => handleTabClick('active')}
      >
        <Car className="nav-icon" />
        <span className="nav-label">En cours</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => handleTabClick('history')}
      >
        <History className="nav-icon" />
        <span className="nav-label">Historique</span>
      </button>
    </nav>
  );
}

