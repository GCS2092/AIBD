# Notifications push sur le téléphone (admin)

## Comportement

Quand **une nouvelle course est enregistrée**, le backend envoie une **notification push (FCM)** à tous les appareils des admins qui ont enregistré un token. Le téléphone peut **afficher la notification et sonner** même si l’admin n’est pas dans l’application (navigateur fermé ou en arrière-plan).

## Ce qu’il faut faire côté admin

1. **Autoriser les notifications dans le navigateur**  
   - Sur **ordinateur** : quand le site affiche « [Nom du site] souhaite afficher des notifications », cliquer sur **Autoriser**.  
   - Sur **téléphone** : ouvrir le dashboard admin dans le navigateur (Chrome recommandé sur Android), aller dans **Statuts** (onglet d’accueil), section **Notifications**, puis cliquer sur **« Obtenir Token FCM »**. Accepter quand le navigateur demande l’autorisation.

2. **Si vous avez déjà refusé**  
   - **Chrome (Android)** : Paramètres → Confidentialité et sécurité → Paramètres des sites → Notifications → trouver votre site → **Autoriser**.  
   - **Chrome (ordinateur)** : cliquer sur l’icône cadenaire/info à gauche de l’URL → Notifications → Autoriser.  
   - Puis recharger la page et cliquer à nouveau sur **« Obtenir Token FCM »** dans le dashboard.

3. **Une seule fois**  
   - Après avoir autorisé et obtenu le token, il est enregistré sur le serveur. Les prochaines nouvelles courses déclencheront une notification sur cet appareil (et le téléphone peut sonner si le navigateur/OS le permet).

## Technique (côté projet)

- À la création d’une course, le backend crée les notifications **in-app** (cloche + page Notifications) et envoie un **multicast FCM** à tous les tokens des admins (`internal-notifications.service` → `notifyAdminRideCreated` → `NotificationService.sendPushNotificationToMultiple`).
- La payload FCM demande le son par défaut (Android / APNs) pour que l’appareil puisse sonner ou vibrer.
- Le site doit être servi en **HTTPS** pour que les notifications push fonctionnent (obligation des navigateurs).

## Safari / « notifications bloquées »

Sur **Safari** (surtout iPhone), les notifications push web sont souvent bloquées ou instables. Il n’existe **pas d’extension ou d’app** qui débloque ça. Voir **`docs/SAFARI_NOTIFICATIONS_ALTERNATIVES.md`** pour les détails.

**Recommandation** : utiliser **Chrome** (ou Firefox/Edge) sur **ordinateur** pour le dashboard admin si vous voulez les push. Sur iPhone, les alertes restent visibles dans l’app (icône cloche + page Notifications).

## En résumé

Pour que le téléphone reçoive et sonne : autoriser les notifications dans le navigateur et enregistrer le token FCM. Sur Safari / iPhone c’est souvent bloqué → utiliser **Chrome sur ordinateur** pour les push, ou consulter la **cloche / page Notifications** dans l’app.
