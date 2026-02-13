# Utiliser le certificat SSL Supabase (connexion sécurisée)

Pour éviter l’erreur « self-signed certificate in certificate chain » tout en **vérifiant le certificat** (recommandé en production), tu peux utiliser le certificat CA fourni par Supabase.

## 1. Télécharger le certificat

1. Va sur [app.supabase.com](https://app.supabase.com) et ouvre ton **projet**.
2. **Settings** (engrenage) → **Database** (ou **Project Settings** → **Database**).
3. Dans la section **SSL Configuration**, trouve **« CA Certificate »** ou **« Server root certificate »**.
4. Clique sur **Download** (le fichier s’appelle souvent `prod-ca-2021.crt` ou `prod-supabase.cer`).

## 2. Placer le fichier dans le backend

Crée un dossier `certs` dans le backend (il est ignoré par git) et y copie le fichier :

```text
backend/
  certs/
    prod-ca-2021.crt   ← ton certificat téléchargé
```

Sous Windows (PowerShell) :

```powershell
mkdir backend\certs
# Puis copie le fichier téléchargé vers backend\certs\prod-ca-2021.crt
```

## 3. Configurer la variable d’environnement

Dans ton **`.env`** du backend (ou sur ton hébergeur), ajoute :

```env
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@...pooler.supabase.com:6543/postgres?sslmode=require
SSL_ROOT_CERT=./certs/prod-ca-2021.crt
```

Ou avec un chemin absolu :

```env
SSL_ROOT_CERT=C:\AIBD\backend\certs\prod-ca-2021.crt
```

Redémarre le backend. La connexion utilisera alors **vérification du certificat** (`rejectUnauthorized: true`) avec le CA Supabase.

## 4. Si tu ne mets pas de certificat

Sans `SSL_ROOT_CERT`, le backend utilise `rejectUnauthorized: false` pour accepter la chaîne SSL (comportement par défaut actuel). Ça fonctionne, mais la vérification du serveur est désactivée.
