import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowLeft, Plane } from 'lucide-react';
import { authService } from '../services/authService';
import NavigationBar from '../components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Empêcher le zoom automatique sur mobile
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        if (window.innerWidth <= 768) {
          const input = target as HTMLInputElement;
          if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
            input.style.fontSize = '16px';
          }
        }
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
          e.preventDefault();
          const form = target.closest('form');
          if (form) {
            const inputs = Array.from(form.querySelectorAll('input, select, textarea')) as HTMLElement[];
            const currentIndex = inputs.indexOf(target);
            if (currentIndex < inputs.length - 1) {
              const nextInput = inputs[currentIndex + 1];
              nextInput.focus();
              nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              form.requestSubmit();
            }
          }
        }
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"></div>
      </div>

      <NavigationBar />

      <main className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="text-center pb-4 px-4 sm:px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-full mb-3 sm:mb-4">
                <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                Connectez-vous à votre compte AIBD
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200"
                  >
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 font-semibold">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 font-semibold">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900 transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:shadow-md hover:border-gray-400"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={loading}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 text-base sm:text-lg font-semibold py-4 sm:py-6 shadow-xl"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.div>
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 sm:mt-6 text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  Retour à l'accueil
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default LoginPage;
