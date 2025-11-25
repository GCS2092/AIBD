import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Tentative de connexion avec:', email);
      console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const response = await authService.login({ email, password });
      console.log('Connexion réussie:', response);
      
      // Rediriger selon le rôle
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'driver') {
        navigate('/driver/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur de connexion.';
      
      if (err.message && err.message.includes('Network Error')) {
        errorMessage = 'Erreur réseau. Vérifiez que le backend est démarré et que vous êtes sur le même réseau WiFi.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Link to="/" className="btn-back-home">
          ← Retour à l'accueil
        </Link>
        <div className="login-header">
          <h1>AIBD</h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>Pas de compte ? <a href="/register">Créer un compte</a></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

