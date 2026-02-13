import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import './TestConnexionPage.css';

type HealthResult = {
  status?: string;
  timestamp?: string;
  uptime?: number;
  error?: string;
};

type DatabaseResult = {
  success?: boolean;
  database?: string;
  tables?: Record<string, { status: string; count?: number; error?: string }>;
  message?: string;
  error?: string;
};

export default function TestConnexionPage() {
  const [apiUrl] = useState(API_URL);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [db, setDb] = useState<DatabaseResult | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setHealth({
            error: err.message || 'Impossible de joindre le backend (CORS, réseau ou URL incorrecte).',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setHealthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/test/database`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setDb(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDb({
            success: false,
            error: err.message || 'Impossible d’appeler le backend.',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setDbLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const healthOk = health && !health.error && health.status === 'ok';
  const dbOk = db && db.success && db.database === 'connected';

  return (
    <div className="test-connexion-page">
      <div className="test-connexion-card">
        <h1>Test de connexion Supabase ↔ Backend ↔ Vercel</h1>
        <p className="test-connexion-desc">
          Cette page vérifie que le frontend (Vercel) atteint le backend et que le backend est connecté à Supabase.
        </p>

        <section className="test-section">
          <h2>1. URL de l’API (frontend → backend)</h2>
          <p className="test-url">
            <strong>{apiUrl || '(aucune)'}</strong>
          </p>
          {!apiUrl && (
            <p className="test-warning">
              Définir <code>VITE_API_URL</code> sur Vercel (Settings → Environment Variables).
            </p>
          )}
          {apiUrl && apiUrl === window.location.origin && (
            <p className="test-warning">
              L’API pointe vers ce site. Si le backend est ailleurs, définir <code>VITE_API_URL</code> sur Vercel.
            </p>
          )}
        </section>

        <section className="test-section">
          <h2>2. Backend (health)</h2>
          {healthLoading ? (
            <p className="test-loading">Chargement…</p>
          ) : healthOk ? (
            <div className="test-ok">
              <span className="test-badge ok">OK</span>
              <p>Backend joignable. Uptime: {health.uptime != null ? `${Math.round(health.uptime)}s` : '—'}</p>
            </div>
          ) : (
            <div className="test-err">
              <span className="test-badge err">Erreur</span>
              <p>{health?.error || 'Réponse inattendue'}</p>
            </div>
          )}
        </section>

        <section className="test-section">
          <h2>3. Base Supabase (backend → Supabase)</h2>
          {dbLoading ? (
            <p className="test-loading">Chargement…</p>
          ) : dbOk ? (
            <div className="test-ok">
              <span className="test-badge ok">OK</span>
              <p>{db.message}</p>
              {db.tables && (
                <ul className="test-tables">
                  {Object.entries(db.tables).map(([name, info]) => (
                    <li key={name}>
                      <strong>{name}</strong>: {info.status} {info.count != null ? `(n=${info.count})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="test-err">
              <span className="test-badge err">Erreur</span>
              <p>{db?.error || db?.message || 'Connexion base impossible'}</p>
            </div>
          )}
        </section>

        <section className="test-summary">
          <h2>Résumé</h2>
          <p>
            {healthOk && dbOk ? (
              <span className="test-badge ok">Tout est correctement configuré.</span>
            ) : (
              <span className="test-badge err">
                Un ou plusieurs maillons sont en erreur. Vérifier VITE_API_URL, backend et DATABASE_URL.
              </span>
            )}
          </p>
        </section>

        <Link to="/" className="test-back">
          ← Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
