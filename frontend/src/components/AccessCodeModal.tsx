import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccessCodeModalProps {
  isOpen: boolean;
  accessCode: string;
  rideId: string;
  onClose: () => void;
}

function AccessCodeModal({ isOpen, accessCode, rideId, onClose }: AccessCodeModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Sauvegarder le code dans le localStorage
      localStorage.setItem(`accessCode_${rideId}`, accessCode);
    }
  }, [isOpen, accessCode, rideId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white border-gray-200 shadow-2xl">
            <CardHeader className="relative pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Réservation confirmée !</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    Votre code d'accès unique
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-gray-600" />
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Code d'accès
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 tracking-widest mb-4 font-mono">
                    {accessCode}
                  </p>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier le code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  Information importante
                </p>
                <div className="text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">
                    Ce code d'accès s'affichera en haut de votre écran (dans la barre de navigation) pendant toute la durée de votre course.
                  </p>
                  <p>
                    <strong>Vous en aurez besoin pour :</strong>
                  </p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li>Rechercher et consulter votre course sur la page d'accueil</li>
                    <li>Accéder à votre historique de courses</li>
                    <li>Suivre votre trajet en temps réel</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Sécurité
                </p>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Faites une capture d'écran de ce code</li>
                  <li>Enregistrez-le dans un endroit sûr</li>
                  <li>Ne le partagez avec personne</li>
                </ul>
                <p className="text-xs text-yellow-700 mt-2 font-semibold">
                  Sans ce code, vous ne pourrez pas accéder à vos informations de trajet.
                </p>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                size="lg"
              >
                J'ai compris, continuer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AccessCodeModal;

