# Safari : notifications bloquées – alternatives

## Pourquoi Safari affiche « notifications bloquées » même quand c’est autorisé

Sur **Safari** (Mac et surtout **iPhone/iPad**) :

- Les réglages **Système** (Notifications autorisées) ne suffisent pas pour le **web**.
- Safari a des **bugs connus** : `Notification.requestPermission()` peut rester à « refusé » même après autorisation dans Réglages → Sites web → Notifications, ou la demande ne s’affiche jamais.
- Sur **iPhone**, les notifications push web ne marchent que pour les **PWA ajoutées à l’écran d’accueil** (iOS 16.4+), et **Firebase (FCM)** est souvent instable (tokens qui changent, notifications qui s’arrêtent).

Il n’existe **pas d’extension Chrome Web Store ou d’app magique** qui force Safari à débloquer les notifications. C’est une limite du navigateur/OS.

---

## Solutions qui fonctionnent

### 1. Utiliser **Chrome** (ou Firefox / Edge) sur **ordinateur**

- Sur **Mac** ou **PC** : ouvrir le **dashboard admin** dans **Chrome** (ou Firefox / Edge) au lieu de Safari.
- Demander le token FCM dans ce navigateur et accepter les notifications.
- Les push (et le son) fonctionnent bien sur Chrome/Firefox, sans extension.

Aucune extension n’est nécessaire : il suffit d’utiliser un autre navigateur pour l’admin.

### 2. Sur **iPhone** : pas de vraie équivalence « Web Store »

- Sur iOS, **tous les navigateurs** (Chrome, Safari, etc.) utilisent le moteur **WebKit** : les mêmes limites s’appliquent.
- Les extensions du **Chrome Web Store** ne s’installent pas sur Chrome iOS comme sur desktop et ne peuvent pas débloquer les notifs Safari.
- La seule option push web sur iPhone est d’**ajouter le site en PWA** (Partager → « Sur l’écran d’accueil ») puis d’autoriser les notifications dans la PWA – avec les limites FCM/Safari évoquées ci‑dessus.

---

## En résumé

| Contexte              | Recommandation |
|-----------------------|----------------|
| **Mac / PC**          | Utiliser **Chrome** (ou Firefox/Edge) pour le dashboard admin et les push. |
| **iPhone / Safari**   | Pas de solution fiable côté « app Web Store » ; utiliser la **notif dans l’app** (cloche, page Notifications). |
| **Tous appareils**    | Consulter les **notifications dans l’app** (icône cloche, page Notifications) : les nouvelles courses y apparaissent sans autorisation navigateur. |

Il n’existe pas d’alternative dans le Web Store ou chez Google qui « débloque » les notifications dans Safari : la solution est d’utiliser **Chrome sur ordinateur** pour les push, et de consulter la **cloche / page Notifications** dans l’app pour les alertes.
