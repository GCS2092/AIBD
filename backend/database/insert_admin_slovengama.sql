-- Création de l'admin slovengama@gmail.com / password
-- À exécuter dans l'éditeur SQL (Supabase, pgAdmin, etc.)

-- Activer pgcrypto pour bcrypt et sha256 (déjà disponible sur Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Éviter les doublons : ne rien faire si l'admin existe déjà
INSERT INTO public.users (
  id,
  "firstName",
  "lastName",
  email,
  email_hash,
  phone,
  phone_hash,
  password,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'Admin',
  'Slovengama',
  'slovengama@gmail.com',
  encode(digest(lower(trim('slovengama@gmail.com')), 'sha256'), 'hex'),
  '+221000000000',
  encode(digest(lower(trim('+221000000000')), 'sha256'), 'hex'),
  crypt('password', gen_salt('bf')),
  'admin'::public.users_role_enum,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users
  WHERE email_hash = encode(digest(lower(trim('slovengama@gmail.com')), 'sha256'), 'hex')
);

-- Vérification (optionnel) : décommenter pour afficher l'utilisateur créé
-- SELECT id, "firstName", "lastName", email, role, "isActive" FROM public.users WHERE email = 'slovengama@gmail.com';
