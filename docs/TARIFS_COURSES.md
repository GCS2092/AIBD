# Message « Aucun tarif disponible pour ce genre de course »

## Pourquoi ce message s’affiche

Ce message apparaît **quand vous réservez une course** et qu’**aucun tarif n’existe en base de données** pour le type de trajet choisi (Dakar → Aéroport, Aéroport → Dakar, ou type « aller simple » / « retour simple »).

Le backend (`ride.service.ts`) cherche un enregistrement actif dans la table **`pricing`** qui correspond à :
- au **type de trajet** (`rideType` : `dakar_to_airport` ou `airport_to_dakar`)  
- et éventuellement au **type de course** (`tripType` : aller simple, retour simple, etc.)  
- avec **`isActive = true`**.

Si aucun tarif ne correspond, il renvoie :
- *« Aucun tarif disponible pour ce type de course »* (quand un `tripType` est envoyé), ou  
- *« Aucun tarif disponible pour ce trajet »* (quand on utilise `rideType` + heure pour standard / nuit / heures de pointe).

Donc **oui** : si vous n’avez **pas créé de tarifs en base**, ce message est normal.

## Que faire

1. **Créer des tarifs**  
   - Depuis l’interface : **Admin** → **Tarifs** → **Créer un tarif** (ou équivalent).  
   - Ou en base : exécuter le script **`backend/database/insert_tarifs_exemple.sql`** dans l’éditeur SQL pour insérer des tarifs d’exemple (aller simple 20 000 FCFA, retour simple 20 000 FCFA, aller retour 25 000 FCFA, plus standard / nuit / heures de pointe). Sinon, insérer des lignes dans **`pricing`** avec les bons `rideType`, `tripType`, `type` et **`isActive = true`**.

2. **Vérifier les types utilisés**  
   - Les types de trajet côté app/API sont en général :  
     - `dakar_to_airport`  
     - `airport_to_dakar`  
   - Et éventuellement des `tripType` comme `aller_simple`, `retour_simple`, etc., selon votre schéma.

3. **Vérifier qu’au moins un tarif est actif**  
   - Un tarif avec **`isActive = false`** n’est pas pris en compte pour le calcul du prix.

En résumé : **« Aucun tarif disponible pour ce genre de course »** signifie qu’il manque (ou qu’il n’y a pas encore) de tarifs créés et actifs en base pour ce type de course.
