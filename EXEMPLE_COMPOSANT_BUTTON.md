# 🎨 Exemple : Composant Button (shadcn/ui)

## 📝 Code du Composant Button

**Fichier à créer : `frontend/src/components/ui/button.tsx`**

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-600",
        ghost: "hover:bg-gray-100",
        link: "text-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## 🔧 Configuration TypeScript

Assurez-vous que votre `tsconfig.json` a le path alias `@` configuré :

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Et dans `vite.config.ts`, ajoutez :

```typescript
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

## 📖 Utilisation

### Exemple 1 : Bouton Simple

**Avant :**
```tsx
<button className="btn btn-primary">Cliquer</button>
```

**Après :**
```tsx
import { Button } from "@/components/ui/button"

<Button>Cliquer</Button>
```

### Exemple 2 : Bouton avec Variantes

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">Grand bouton</Button>
<Button variant="outline" size="sm">Petit bouton</Button>
<Button variant="destructive">Supprimer</Button>
<Button variant="ghost">Action secondaire</Button>
```

### Exemple 3 : Bouton avec Icône

```tsx
import { Button } from "@/components/ui/button"
import { Car, Plus } from "lucide-react"

<Button>
  <Car className="mr-2 h-4 w-4" />
  Nouvelle course
</Button>

<Button variant="outline" size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

### Exemple 4 : Dans LoginPage

**Avant :**
```tsx
<button type="submit" className="btn-login" disabled={loading}>
  {loading ? 'Connexion...' : 'Se connecter'}
</button>
```

**Après :**
```tsx
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

<Button 
  type="submit" 
  disabled={loading}
  className="w-full"
>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Connexion...
    </>
  ) : (
    'Se connecter'
  )}
</Button>
```

## 🎨 Personnalisation des Couleurs

Les couleurs utilisent votre palette définie dans `tailwind.config.js` :
- `primary-500` = #667eea (votre couleur principale)
- `secondary-500` = #764ba2 (votre couleur secondaire)

Vous pouvez les ajuster dans le fichier de configuration Tailwind.

## ✅ Test

Après avoir créé le composant, testez-le dans une page :

```tsx
import { Button } from "@/components/ui/button"

function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <Button>Bouton par défaut</Button>
      <Button variant="outline">Bouton outline</Button>
      <Button variant="destructive">Supprimer</Button>
    </div>
  )
}
```

Si ça fonctionne, vous pouvez commencer à migrer vos pages !

