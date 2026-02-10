# Fonctionnalités style Yango – état et prérequis

Pour chaque fonctionnalité : **déjà possible avec l’existant** ou **à ajouter (lib/service)**.

---

## Déjà en place dans AIBD

| Élément | Détail |
|--------|--------|
| **Carte (Leaflet)** | `react-leaflet` + `leaflet` – MiniMapComponent, MapComponent |
| **Notifications push (FCM)** | Firebase configuré, `fcmService.ts` – manque l’endpoint backend pour enregistrer le token |
| **GPS** | `useGPS`, `gpsService` |
| **Temps réel** | WebSockets (socket.io) |
| **Auth** | Login chauffeur / admin, rôles |
| **Courses** | Création, statuts, acceptation/refus chauffeur, suivi basique |

---

## 1. Réservation / demande de course (côté client)

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Formulaire réservation (adresse, date, type) | Oui | Rien – déjà là (BookingPage) |
| Choix point de départ / arrivée sur une carte | Partiel | Géocodage (adresse → lat/lng) : API type OpenStreetMap Nominatim ou Google Maps Geocoding |
| Estimation du prix avant réservation | Oui | Rien – pricing déjà utilisé |
| Code d’accès après réservation | Oui | Rien – déjà là |
| Historique des courses client | Oui | Rien – HistoryPage |

---

## 2. Carte et géolocalisation

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Affichage carte avec prise / dépose | Oui | Rien – Leaflet déjà utilisé (MiniMapComponent, etc.) |
| Position en temps réel du chauffeur sur la carte | Partiel | Backend : stocker/mettre à jour la position (ex. WebSocket ou API). Frontend : écouter et déplacer un marqueur |
| Trajet (itinéraire) sur la carte | Non | API de directions (OSRM, Google Directions, Mapbox) + tracé d’une polyline |
| Géocodage (adresse → coordonnées) | Non | Service : Nominatim (gratuit), Google Geocoding ou Mapbox Geocoding |
| Carte plein écran pour le suivi | Oui | Uniquement mise en page / composant qui réutilise la carte actuelle |

---

## 3. Côté chauffeur

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Liste des courses disponibles | Oui | Rien – déjà là |
| Accepter / refuser une course | Oui | Rien – déjà là |
| Voir détail course (adresse, client, prix) | Oui | Rien – déjà là |
| Statut (disponible / en pause / en course) | Oui | Rien – DriverHeader / profil |
| Démarrer / terminer la course | Oui | Rien – déjà là |
| Envoi de la position GPS en temps réel | Partiel | Backend : endpoint ou WebSocket pour recevoir et stocker la position. Frontend : useGPS + envoi périodique |
| Navigation (ouvrir Waze/Google Maps) | Oui | Lien externe vers `google.com/maps` ou `waze.com` avec lat/lng – pas de lib supplémentaire |

---

## 4. Notifications

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Notifications in-app (liste dans l’app) | Oui | Rien – NotificationsPage existe |
| Notifications push (navigateur / PWA) | Partiel | Backend : endpoint pour enregistrer le token FCM (le TODO dans `fcmService`) et envoyer des messages via Firebase Admin SDK |
| Rappels (ex. la veille de la course) | Non | Tâche planifiée (cron) côté backend + envoi via FCM ou SMS |
| SMS (confirmation, code) | Non | Service SMS : Twilio, API opérateur (Orange, etc.) |

---

## 5. Paiement

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Affichage du prix (fixe ou calculé) | Oui | Rien – déjà là |
| Paiement in-app (carte, mobile money) | Non | Intégration API : Orange Money, Wave, Stripe, etc. + écran de paiement + sécurité (non stockage CB) |
| Facture / reçu après course | Partiel | Génération PDF (lib type `pdfkit` ou `jspdf`) + envoi par email ou téléchargement |

---

## 6. Expérience utilisateur (UX)

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Messages d’erreur clairs (sans rechargement) | Oui | Rien – déjà amélioré (bandeau chauffeur, etc.) |
| Suivi de course en temps réel (statuts) | Oui | Rien – WebSocket déjà utilisé |
| Multi-langue (FR, EN, wolof) | Oui | Rien – i18n déjà là |
| Design mobile-first / PWA | Oui | Rien – Vite PWA déjà configuré |
| Notation chauffeur après course | Non | Backend : modèle Note/Review + endpoint. Frontend : écran notation (étoiles + commentaire) |

---

## 7. Admin

| Fonctionnalité | Faisable avec l’existant ? | À ajouter / à faire |
|----------------|----------------------------|----------------------|
| Tableau de bord (stats, courses) | Oui | Rien – AdminDashboard existe |
| Gestion des chauffeurs | Oui | Rien – déjà là |
| Gestion des tarifs | Oui | Rien – pricing déjà là |
| Voir les courses sur une carte | Partiel | Réutiliser Leaflet + liste des courses avec coordonnées |

---

## Synthèse : quoi ajouter en priorité

1. **Sans nouvelle grosse dépendance**
   - Finaliser les notifications push : endpoint backend pour enregistrer le token FCM.
   - Position chauffeur en temps réel : endpoint ou WebSocket + envoi GPS depuis l’app chauffeur.
   - Lien “Ouvrir dans Waze/Google Maps” pour la navigation.

2. **Avec un service externe (gratuit ou peu coûteux)**
   - Géocodage : Nominatim (gratuit) pour transformer l’adresse en lat/lng à la réservation.
   - Itinéraire sur la carte : OSRM (gratuit) ou API Google/Mapbox pour dessiner le trajet.

3. **Plus tard**
   - Paiement in-app (Orange Money, Wave, etc.).
   - SMS (Twilio ou opérateur).
   - Notation chauffeur (modèle + écran).
   - Rappels automatiques (cron + FCM/SMS).

---

*Document généré pour le projet AIBD – à mettre à jour au fil des implémentations.*
