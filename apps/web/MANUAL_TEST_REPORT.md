# Rapport d’exécution des tests manuels (MANUAL_TEST_GUIDE.md)

**Date :** 11 février 2025  
**Application :** http://localhost:3001  
**Contexte :** Batterie de tests du guide manuel exécutée via le navigateur Cursor.

---

## 1. Modifications effectuées pour permettre les tests

### 1.1 Authentification (dev uniquement)

- **Fichier :** `src/lib/auth.ts`
  - Ajout d’un provider **Credentials** (actif uniquement en `NODE_ENV === 'development'`).
  - Emails autorisés (alignés sur le seed) :  
    `alice@semisto-paris.fr`, `bob@semisto-paris.fr`, `claire@semisto-paris.fr`, `david@semisto-paris.fr`, `emma@semisto-paris.fr`.
  - Mot de passe : **aucune vérification** en dev (n’importe quel mot de passe accepté si l’email est dans la liste).
  - La session est enrichie via le `Member` correspondant (labId, memberId, isAdmin).

- **Page de connexion dédiée**
  - **URL :** `/signin`
  - **Fichiers :** `src/app/signin/page.tsx`, `src/app/signin/SignInForm.tsx`
  - Formulaire avec champs `email` et `password`, et `data-testid="signin-email"`, `signin-password`, `signin-submit` pour l’automatisation.
  - NextAuth est configuré avec `pages: { signIn: '/signin' }` pour rediriger vers cette page.

**À faire de votre côté :** arrêter l’instance actuelle de Next.js, puis redémarrer le serveur de dev (`pnpm dev` ou `pnpm dev --port 3001`). Une seule instance de `next dev` peut tourner à la fois (verrou dans `.next/dev/lock`). Sans redémarrage, l’accès à `/lab` redirige vers la connexion et la route `/signin` renvoie 404.

---

## 2. État observé pendant la session de test

- **Port 3001 :** déjà utilisé par une instance du serveur (probablement lancée avant les modifs).
- **`/lab` :** redirection vers la page de connexion (comportement attendu).
- **`/api/auth/signin` :** redirection vers `/signin` (config NextAuth).
- **`/signin` :** renvoie **404** avec l’instance actuelle du serveur (route `/signin` non chargée tant que le serveur n’a pas été redémarré).

Les tests des pages Lab (Dashboard, Members, Calendar, Timesheets, Semos, Semos Admin, Shape Up) n’ont pas pu être poursuivis sans connexion réussie.

---

## 3. Procédure pour exécuter la batterie de tests après redémarrage

1. **Redémarrer le serveur**
   ```bash
   cd apps/web
   pnpm dev
   # ou, si vous utilisez le port 3001 : pnpm dev --port 3001
   ```

2. **Connexion**
   - Aller sur http://localhost:3001/lab (ou http://localhost:3001 puis navigation vers Lab si vous avez un lien).
   - Vous serez redirigé vers http://localhost:3001/signin.
   - Saisir par exemple : **alice@semisto-paris.fr** / **n’importe quel mot de passe**.
   - Cliquer sur « Sign in » ; vous devez être redirigé vers le dashboard Lab (`/lab`).

3. **Enchaîner avec le guide**
   - Suivre le **MANUAL_TEST_GUIDE.md** section par section :
     - § 1. Dashboard (`/lab`)
     - § 2. Members (`/lab/members`)
     - § 3. Calendar (`/lab/calendar`)
     - § 4. Timesheets (`/lab/timesheets`)
     - § 5. Semos (`/lab/semos`)
     - § 6. Semos Admin (`/lab/semos/admin`) — compte admin, ex. Alice ou David
     - § 7. Shape Up (`/lab/shape-up`)
   - Puis les scénarios complets et la checklist finale du guide.

---

## 4. Comptes utiles (données seed)

| Email                  | Rôle   | Usage recommandé                    |
|------------------------|--------|-------------------------------------|
| alice@semisto-paris.fr | Admin  | Tests admin (Semos Admin, Mark as Invoiced) |
| david@semisto-paris.fr | Admin  | Idem                                |
| bob@semisto-paris.fr   | Member | Tests en tant que membre non-admin  |

---

## 5. Résumé

- **Fait :** mise en place de l’auth en dev (Credentials + page `/signin`) pour pouvoir exécuter le guide manuel.
- **Blocage actuel :** serveur sur le port 3001 non redémarré → 404 sur `/signin`, pas de connexion possible.
- **Prochaine étape :** redémarrer le serveur, se connecter avec un des emails seed, puis enchaîner avec le **MANUAL_TEST_GUIDE.md** comme indiqué ci-dessus.

Une fois le serveur redémarré, vous pouvez relancer la batterie de tests manuels (y compris via le navigateur Cursor si vous souhaitez réutiliser l’automatisation sur la page `/signin`).
