# Guide de Test Manuel - Lab Management

## Prérequis

1. **Base de données configurée**
   ```bash
   # Configurer DATABASE_URL dans .env
   # Exemple : postgresql://user:password@localhost:5432/terranova

   # Appliquer les migrations
   cd apps/web
   pnpm prisma migrate dev

   # Générer le client Prisma
   pnpm prisma generate

   # Charger les données de test
   pnpm db:seed
   ```

2. **Démarrer le serveur**
   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Ouvrir Chrome**
   ```
   http://localhost:3000
   ```

## Plan de Test par Page

### 🏠 1. Dashboard (`/lab`)

**Objectifs** : Vérifier l'affichage des données agrégées

- [ ] Le cycle actuel s'affiche avec nom et dates
- [ ] L'indicateur de phase (Building/Cooldown) est correct
- [ ] Les pitches actifs sont listés avec leurs scopes
- [ ] Le HillChart affiche les scopes avec positions correctes
- [ ] Le wallet Semos affiche le solde, floor, et ceiling
- [ ] Les événements à venir sont listés (max 3)
- [ ] Cliquer sur un événement affiche ses détails

**Données attendues (après seed)** :
- Cycle : "Cycle 1" (Building du 1er au 15 fév 2024)
- 2-3 pitches en "building"
- Wallet avec solde > 0
- Au moins 1 événement à venir

---

### 👥 2. Members Page (`/lab/members`)

**Objectifs** : Gestion de l'équipe

- [ ] La liste des membres s'affiche (devrait avoir 5 membres après seed)
- [ ] Les avatars s'affichent correctement
- [ ] Les rôles (designer, developer, etc.) sont visibles
- [ ] Les guildes apparaissent pour chaque membre
- [ ] Le solde Semos est affiché sur chaque carte

**Filtres** :
- [ ] Filtrer par statut (active/inactive)
- [ ] Filtrer par guilde
- [ ] Recherche par nom fonctionne

**Actions** :
- [ ] Cliquer "View Profile" sur un membre (devrait fonctionner si onViewMember est implémenté)
- [ ] Badge "Admin" visible pour les admins

---

### 📅 3. Calendar Page (`/lab/calendar`)

**Objectifs** : Visualisation des événements et cycles

**Vue Mois** :
- [ ] Le calendrier affiche le mois courant
- [ ] Les événements apparaissent aux bonnes dates
- [ ] Le banner du cycle actuel est visible en haut
- [ ] Cliquer sur "Previous" / "Next" change de mois

**Vue Liste** :
- [ ] Basculer en "List view"
- [ ] Les événements sont listés chronologiquement
- [ ] Les badges de type (kickoff, demo, etc.) s'affichent
- [ ] Les participants sont listés

**Événements attendus** :
- Au moins 2-3 événements après seed
- Types variés : kickoff, demo, review

---

### ⏱️ 4. Timesheets Page (`/lab/timesheets`)

**Objectifs** : Gestion des feuilles de temps

**Affichage** :
- [ ] La liste des timesheets s'affiche
- [ ] Les statistiques en haut : Total Hours, Total Km, Invoiced/Pending, Semos/Invoice
- [ ] Chaque ligne affiche : date, heures, description, catégorie, type de paiement

**Filtres** :
- [ ] Filtrer par période (This Week, This Month, Last Month, Custom)
- [ ] Filtrer par catégorie (design, formation, etc.)
- [ ] Filtrer par type de paiement (semos, invoice)
- [ ] Filtrer par statut facturé (invoiced, pending, all)

**Actions (requires authentication)** :
- [ ] Cliquer "New Timesheet" ouvre le formulaire
- [ ] Remplir : date, heures, description, catégorie, type paiement, km
- [ ] Soumettre crée un nouveau timesheet
- [ ] Le nouveau timesheet apparaît dans la liste
- [ ] Les stats se mettent à jour

**Admin uniquement** :
- [ ] Bouton "Mark as Invoiced" visible pour admin
- [ ] Cliquer marque le timesheet comme facturé

---

### 💰 5. Semos Page (`/lab/semos`)

**Objectifs** : Gestion de la monnaie complémentaire

**Dashboard** :
- [ ] Affiche le solde actuel du wallet
- [ ] Floor et Ceiling visibles
- [ ] Indicateur de santé (Low balance, Near ceiling)

**Transactions** :
- [ ] Liste des transactions récentes
- [ ] Type : payment, transfer, emission
- [ ] Montant avec direction (+ ou -)
- [ ] Description

**Tri et filtres** :
- [ ] Trier par date (plus récent en premier)
- [ ] Filtrer par type (payment, transfer, emission)

**Transfert de Semos** :
- [ ] Cliquer "Transfer Semos" ouvre le formulaire
- [ ] Sélectionner destinataire dans la liste
- [ ] Entrer montant et description
- [ ] Soumettre transfère les Semos
- [ ] Erreur si solde insuffisant
- [ ] Les deux wallets se mettent à jour
- [ ] Transaction apparaît dans la liste

---

### 🔧 6. Semos Admin Page (`/lab/semos/admin`)

**Accès** : Admin uniquement (redirect si non-admin)

**Émission de Semos** :
- [ ] Formulaire d'émission visible
- [ ] Sélectionner un wallet
- [ ] Choisir le montant et la raison (monthly, bonus, adjustment)
- [ ] Ajouter description
- [ ] Soumettre émet les Semos
- [ ] Le wallet se met à jour
- [ ] L'émission apparaît dans l'historique

**Gestion des Rates** :
- [ ] Liste des rates (hour_floor, hour_ceiling, km_rate, etc.)
- [ ] Montants actuels affichés
- [ ] Modifier un rate
- [ ] Sauvegarder met à jour le rate

**Historique des Émissions** :
- [ ] Liste de toutes les émissions
- [ ] Date, wallet, montant, raison, créateur

---

### 🎯 7. Shape Up Workboard (`/lab/shape-up`)

**Objectifs** : Gestion du processus Shape Up (Shaping, Betting, Building)

**Onglets** :
- [ ] 4 onglets visibles : Shaping, Betting, Building, Ideas

### **Onglet Shaping** :

**Affichage** :
- [ ] Liste des pitches par statut (Raw, Shaped)
- [ ] Chaque pitch affiche : titre, appétit (2/3/6 weeks), auteur
- [ ] Badge de statut coloré

**Filtres** :
- [ ] Filtrer par statut
- [ ] Filtrer par appétit

**Création de Pitch** :
- [ ] Cliquer "New Pitch" ouvre le formulaire
- [ ] Remplir : titre, problem, solution, appetite, rabbit holes, no-gos
- [ ] Soumettre crée le pitch avec statut "raw"
- [ ] Le pitch apparaît dans la liste Raw

**Actions sur Pitch** :
- [ ] Voir les détails d'un pitch
- [ ] Changer statut de "raw" à "shaped"
- [ ] Éditer un pitch
- [ ] Ajouter breadboard ou fat marker sketch (optionnel)

### **Onglet Betting** :

**Conditions** : Uniquement pendant la période de cooldown

**Affichage** :
- [ ] Tableau des pitches "shaped"
- [ ] Sélection du cycle cible
- [ ] Sélection des team members pour le bet

**Placer un Bet** :
- [ ] Sélectionner un pitch shaped
- [ ] Sélectionner le cycle (doit être en cooldown)
- [ ] Sélectionner 2-4 team members
- [ ] Soumettre crée le bet
- [ ] Le pitch passe en statut "betting"

**Validation** :
- [ ] Erreur si cycle pas en cooldown
- [ ] Erreur si équipe < 2 personnes

### **Onglet Building** :

**Affichage** :
- [ ] Liste des pitches avec statut "building"
- [ ] Pour chaque pitch : scopes avec Hill Chart

**Hill Chart** :
- [ ] Graphique en courbe avec deux phases : "Figuring Out" (0-50) et "Making It Happen" (51-100)
- [ ] Points colorés pour chaque scope
- [ ] Légende avec noms de scopes et progression des tâches

**Gestion des Scopes** :
- [ ] Créer un nouveau scope : nom, description
- [ ] Le scope apparaît à position 0 sur le hill chart

**Déplacement sur le Hill** :
- [ ] Cliquer-glisser un point pour changer position
- [ ] La position se met à jour (0-100)
- [ ] Un snapshot est créé automatiquement

**Gestion des Tâches** :
- [ ] Voir la liste des tâches pour un scope
- [ ] Ajouter une tâche (must-have ou nice-to-have)
- [ ] Cocher/décocher une tâche (toggle completed)
- [ ] Les "nice-to-have" sont en gris
- [ ] Le compteur de tâches complétées se met à jour

**Chowder List** :
- [ ] Voir la liste chowder (tâches en suspens)
- [ ] Ajouter un item au chowder
- [ ] Déplacer un item du chowder vers un scope (devient une tâche)

### **Onglet Ideas** :

**Affichage** :
- [ ] Listes d'idées affichées
- [ ] Chaque idée montre : titre, nombre de votes

**Actions** :
- [ ] Ajouter une nouvelle idée
- [ ] Voter pour une idée (incrémente le compteur)
- [ ] Les idées sont triées par nombre de votes (descendant)

---

## 🧪 Scénarios de Test Complets

### Scénario 1 : Créer et Suivre un Pitch jusqu'au Building

1. **Shaping** :
   - Aller sur `/lab/shape-up` (onglet Shaping)
   - Créer un nouveau pitch "Améliorer la navigation"
   - Problem: "Users get lost in the app"
   - Solution: "Add breadcrumb navigation"
   - Appetite: 3 weeks
   - Marquer comme "shaped"

2. **Betting** (pendant cooldown) :
   - Aller sur onglet Betting
   - Sélectionner le pitch "Améliorer la navigation"
   - Sélectionner le prochain cycle
   - Ajouter 2 team members
   - Placer le bet

3. **Building** :
   - Le pitch passe en "building" au début du cycle
   - Aller sur onglet Building
   - Créer 2 scopes : "Backend API", "Frontend UI"
   - Ajouter des tâches à chaque scope
   - Déplacer les scopes sur le hill chart (commencer à 0-25)
   - Au fur et à mesure, cocher les tâches complétées
   - Avancer les scopes vers 100

### Scénario 2 : Gestion des Timesheets et Semos

1. **Créer des Timesheets** :
   - Aller sur `/lab/timesheets`
   - Créer un timesheet : 8h, design, paiement en Semos
   - Créer un timesheet : 4h, formation, paiement en invoice

2. **Vérifier les Stats** :
   - Total Hours devrait afficher 12h
   - Semos / Invoice devrait afficher 1 / 1

3. **Transférer des Semos** :
   - Aller sur `/lab/semos`
   - Noter le solde actuel
   - Transférer 50 Semos à un autre membre
   - Vérifier que le solde a diminué de 50
   - Vérifier que la transaction apparaît

4. **Admin : Émettre des Semos** :
   - Aller sur `/lab/semos/admin` (admin uniquement)
   - Émettre 200 Semos vers un wallet (raison: monthly)
   - Vérifier que le wallet a augmenté de 200

### Scénario 3 : Gestion du Calendrier

1. **Créer un Événement** :
   - Aller sur `/lab/calendar`
   - (Si formulaire disponible) Créer un événement "Team Retrospective"
   - Type: review
   - Date: dans 2 jours
   - Ajouter 3 participants

2. **Vérifier l'Affichage** :
   - L'événement apparaît dans le calendrier
   - En vue liste, l'événement est visible
   - Les participants sont listés

---

## ⚠️ Points d'Attention

### Authentification
- Toutes les pages nécessitent une authentification
- Redirect vers `/api/auth/signin` si non connecté
- Tester avec un user admin ET un user non-admin

### Permissions
- `/lab/semos/admin` : Admin uniquement
- "Mark as Invoiced" sur timesheets : Admin uniquement
- Créer/éditer des pitches : Tous les membres
- Placer des bets : Membres avec permissions appropriées

### Données Seed
Après `pnpm db:seed`, vous devriez avoir :
- 5 membres (dont 1 admin)
- 3 guildes
- 2 cycles
- 3-5 pitches (différents statuts)
- 5-10 timesheets
- 10+ transactions Semos
- 3-5 événements

### États Vides
Tester les états vides en créant un nouveau lab ou en vidant les données :
- "No timesheets yet"
- "No transactions"
- "No pitches"
- "No events"

### Responsive
Tester sur différentes tailles d'écran :
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

### Performance
- Le HillChart devrait se charger rapidement
- Les listes devraient être paginées si > 50 éléments
- Les filtres devraient être instantanés

---

## 🐛 Bugs Communs à Chercher

1. **Erreurs de Date** :
   - Timezones incorrects
   - Dates affichées en format incorrect

2. **Calculs Semos** :
   - Solde négatif non bloqué
   - Transactions dupliquées
   - Balance incorrecte après transfert

3. **Hill Chart** :
   - Points qui disparaissent
   - Position qui ne se sauvegarde pas
   - Snapshots non créés

4. **Filtres** :
   - Filtres qui ne se combinent pas correctement
   - Recherche insensible à la casse
   - Filtres qui se réinitialisent au changement de page

5. **Formulaires** :
   - Validation côté client manquante
   - Messages d'erreur non clairs
   - Formulaires qui ne se réinitialisent pas après soumission

---

## ✅ Checklist Finale

Avant de considérer le test complet :

- [ ] Toutes les 7 pages se chargent sans erreur
- [ ] L'authentification fonctionne (login/logout)
- [ ] Les données seed s'affichent correctement
- [ ] Les formulaires créent/modifient les données
- [ ] Les filtres fonctionnent sur toutes les listes
- [ ] Le HillChart est interactif
- [ ] Les transferts Semos fonctionnent
- [ ] Les permissions admin sont respectées
- [ ] Aucune erreur dans la console Chrome
- [ ] Responsive sur mobile/tablet
- [ ] Les états vides s'affichent correctement

---

## 🚀 Commandes Rapides

```bash
# Démarrer fresh
pnpm db:reset              # Reset database
pnpm prisma migrate dev    # Apply migrations
pnpm db:seed              # Load test data
pnpm dev                  # Start server

# Vérifier les données
pnpm prisma studio        # Open Prisma Studio (http://localhost:5555)

# Tests automatisés
pnpm test                 # Run unit tests
pnpm test:coverage        # With coverage

# Build de production
pnpm build                # Test production build
```

Bon test ! 🎉
