-- Exemple de tarifs pour éviter "Aucun tarif disponible pour ce genre de course"
-- À exécuter dans l'éditeur SQL (Supabase, pgAdmin, etc.)
-- Prix indicatifs en FCFA (à adapter selon votre grille).

-- 1) Tarifs par type de course (utilisés quand le client choisit aller simple / retour simple / aller retour)
INSERT INTO public.pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Aller retour', 'dakar_to_airport', 'aller_retour', 'standard'::public.pricing_type_enum, 25000, true, 'Aller retour Dakar ↔ Aéroport', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "tripType" = 'aller_retour' AND type = 'standard'::public.pricing_type_enum);

INSERT INTO public.pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Aller simple', 'dakar_to_airport', 'aller_simple', 'standard'::public.pricing_type_enum, 20000, true, 'Dakar → Aéroport', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "tripType" = 'aller_simple' AND type = 'standard'::public.pricing_type_enum);

INSERT INTO public.pricing (id, name, "rideType", "tripType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Retour simple', 'airport_to_dakar', 'retour_simple', 'standard'::public.pricing_type_enum, 20000, true, 'Aéroport → Dakar', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "tripType" = 'retour_simple' AND type = 'standard'::public.pricing_type_enum);

-- 2) Tarifs par type de trajet seul (utilisés quand pas de tripType : calcul selon heure = standard / nuit / heures de pointe)
INSERT INTO public.pricing (id, name, "rideType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Dakar → Aéroport Standard', 'dakar_to_airport', 'standard'::public.pricing_type_enum, 15000, true, 'Tarif standard', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'dakar_to_airport' AND type = 'standard'::public.pricing_type_enum AND "tripType" IS NULL);

INSERT INTO public.pricing (id, name, "rideType", type, price, "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Aéroport → Dakar Standard', 'airport_to_dakar', 'standard'::public.pricing_type_enum, 15000, true, 'Tarif standard', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'airport_to_dakar' AND type = 'standard'::public.pricing_type_enum AND "tripType" IS NULL);

-- Optionnel : nuit (22h–6h) et heures de pointe (7h–9h, 17h–19h)
INSERT INTO public.pricing (id, name, "rideType", type, price, "startTime", "endTime", "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Dakar → Aéroport Nuit', 'dakar_to_airport', 'night'::public.pricing_type_enum, 18000, '22:00', '06:00', true, 'Tarif nuit', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'dakar_to_airport' AND type = 'night'::public.pricing_type_enum);

INSERT INTO public.pricing (id, name, "rideType", type, price, "startTime", "endTime", "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Aéroport → Dakar Nuit', 'airport_to_dakar', 'night'::public.pricing_type_enum, 18000, '22:00', '06:00', true, 'Tarif nuit', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'airport_to_dakar' AND type = 'night'::public.pricing_type_enum);

INSERT INTO public.pricing (id, name, "rideType", type, price, "startTime", "endTime", "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Dakar → Aéroport Heures de pointe', 'dakar_to_airport', 'peak_hours'::public.pricing_type_enum, 17000, '07:00', '09:00', true, 'Heures de pointe', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'dakar_to_airport' AND type = 'peak_hours'::public.pricing_type_enum);

INSERT INTO public.pricing (id, name, "rideType", type, price, "startTime", "endTime", "isActive", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Aéroport → Dakar Heures de pointe', 'airport_to_dakar', 'peak_hours'::public.pricing_type_enum, 17000, '07:00', '09:00', true, 'Heures de pointe', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.pricing WHERE "rideType" = 'airport_to_dakar' AND type = 'peak_hours'::public.pricing_type_enum);

-- Vérification
-- SELECT name, "rideType", "tripType", type, price, "isActive" FROM public.pricing ORDER BY "rideType", "tripType", type;
