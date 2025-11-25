# 🚀 Installation Rapide - Amélioration du Design

## 📦 Commande d'Installation Complète

Exécutez cette commande dans le dossier `frontend` :

```bash
cd frontend

# Installation en une seule commande
npm install framer-motion lucide-react react-hook-form @hookform/resolvers zod class-variance-authority clsx tailwind-merge @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip

# Installation des dépendances de développement
npm install -D tailwindcss postcss autoprefixer

# Initialisation de Tailwind CSS
npx tailwindcss init -p
```

## ⚙️ Configuration Rapide

### 1. Mettre à jour `tailwind.config.js`

Remplacez le contenu par :

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7ff',
          300: '#a4b8ff',
          400: '#818eff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4751b8',
          800: '#3d4496',
          900: '#383d7a',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#764ba2',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

### 2. Créer `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. Mettre à jour `src/index.css`

Ajoutez en haut du fichier :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
  }
}
```

**Gardez vos styles existants en dessous** pour la compatibilité.

## ✅ Vérification

Après installation, testez que l'application fonctionne toujours :

```bash
npm run dev
```

Si tout fonctionne, vous pouvez commencer la migration progressive selon le plan dans `PLAN_AMELIORATION_DESIGN.md`.

## 🎯 Prochaine Étape

Consultez `PLAN_AMELIORATION_DESIGN.md` pour le plan de migration détaillé.

