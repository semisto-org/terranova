# Checklist de Validation - Intégration Modales Academy

## 🎯 Tests de validation manuelle

Après avoir démarré le serveur avec `bin/dev`, effectuer les tests suivants dans le navigateur:

### 1. TrainingFormModal (Formations)

#### Test 1.1: Créer une formation ✅
- [ ] Aller sur `/academy`
- [ ] Cliquer sur "Nouvelle formation"
- [ ] Vérifier que la modale TrainingFormModal s'ouvre
- [ ] Remplir les champs:
  - Type de formation (dropdown)
  - Titre
  - Prix
  - Nombre max de participants
  - Hébergement requis (checkbox)
  - Description
  - Note coordinateur
- [ ] Cliquer sur "Créer la formation"
- [ ] Vérifier que la modale se ferme
- [ ] Vérifier que la formation apparaît dans le Kanban
- [ ] Vérifier qu'aucune erreur console

#### Test 1.2: Modifier une formation ✅
- [ ] Sélectionner une formation existante
- [ ] Cliquer sur "Modifier"
- [ ] Vérifier que la modale s'ouvre en mode édition
- [ ] Vérifier que les champs sont pré-remplis
- [ ] Modifier le titre
- [ ] Modifier le prix
- [ ] Cliquer sur "Enregistrer les modifications"
- [ ] Vérifier que la modale se ferme
- [ ] Vérifier que les modifications sont appliquées
- [ ] Vérifier qu'aucune erreur console

### 2. SessionFormModal (Sessions)

#### Test 2.1: Créer une session ✅
- [ ] Ouvrir une formation
- [ ] Aller sur l'onglet "sessions"
- [ ] Cliquer sur "Ajouter session"
- [ ] Vérifier que la modale SessionFormModal s'ouvre
- [ ] Remplir les champs:
  - Date début
  - Date fin
  - Lieux (multi-select)
  - Formateurs (multi-select)
  - Assistants (multi-select)
  - Description
- [ ] Cliquer sur "Créer la session"
- [ ] Vérifier que la session apparaît dans la liste
- [ ] Vérifier qu'aucune erreur console

#### Test 2.2: Modifier une session ✅
- [ ] Cliquer sur "Modifier" sur une session
- [ ] Vérifier que les champs sont pré-remplis
- [ ] Modifier les dates
- [ ] Ajouter/retirer des lieux
- [ ] Cliquer sur "Enregistrer les modifications"
- [ ] Vérifier que la session est mise à jour
- [ ] Vérifier qu'aucune erreur console

### 3. RegistrationFormModal (Inscriptions)

#### Test 3.1: Créer une inscription ✅
- [ ] Aller sur l'onglet "registrations"
- [ ] Cliquer sur "Ajouter participant"
- [ ] Vérifier que la modale RegistrationFormModal s'ouvre
- [ ] Remplir les champs:
  - Nom du participant
  - Email
  - Montant payé
  - Statut paiement (dropdown)
  - Note interne
- [ ] Vérifier que le prix de la formation s'affiche
- [ ] Cliquer sur "Créer l'inscription"
- [ ] Vérifier que l'inscription apparaît
- [ ] Vérifier qu'aucune erreur console

#### Test 3.2: Modifier une inscription ✅
- [ ] Cliquer sur "Modifier" sur une inscription
- [ ] Vérifier que les champs sont pré-remplis
- [ ] Modifier le nom et l'email
- [ ] Cliquer sur "Enregistrer les modifications"
- [ ] Vérifier que l'inscription est mise à jour
- [ ] Vérifier qu'aucune erreur console

### 4. PaymentStatusModal (Paiements)

#### Test 4.1: Mettre à jour le statut de paiement ✅
- [ ] Sur une inscription, cliquer sur "Paiement"
- [ ] Vérifier que la modale PaymentStatusModal s'ouvre
- [ ] Vérifier que les infos du participant s'affichent
- [ ] Vérifier que le prix de la formation s'affiche
- [ ] Sélectionner un statut (pending/partial/paid)
- [ ] Saisir un montant payé
- [ ] Vérifier la validation (montant ≤ prix formation)
- [ ] Cliquer sur "Enregistrer le paiement"
- [ ] Vérifier que le statut est mis à jour
- [ ] Vérifier qu'aucune erreur console

### 5. DocumentFormModal (Documents)

#### Test 5.1: Ajouter un document ✅
- [ ] Aller sur l'onglet "documents"
- [ ] Cliquer sur "Ajouter document"
- [ ] Vérifier que la modale DocumentFormModal s'ouvre
- [ ] Remplir les champs:
  - Nom du document
  - Type (pdf/link/image/video)
  - URL
- [ ] Vérifier la validation de l'URL (http/https)
- [ ] Cliquer sur "Ajouter le document"
- [ ] Vérifier que le document apparaît
- [ ] Vérifier qu'aucune erreur console

### 6. ChecklistItemModal (Checklist)

#### Test 6.1: Ajouter un item checklist ✅
- [ ] Aller sur l'onglet "checklist"
- [ ] Cliquer sur "Ajouter item"
- [ ] Vérifier que la modale ChecklistItemModal s'ouvre
- [ ] Saisir le texte de l'item
- [ ] Vérifier que le champ est requis
- [ ] Cliquer sur "Ajouter l'item"
- [ ] Vérifier que l'item apparaît dans la checklist
- [ ] Vérifier qu'aucune erreur console

### 7. ExpenseFormModal (Dépenses)

#### Test 7.1: Créer une dépense ✅
- [ ] Aller sur l'onglet "finances"
- [ ] Cliquer sur "Ajouter dépense"
- [ ] Vérifier que la modale ExpenseFormModal s'ouvre
- [ ] Remplir les champs:
  - Catégorie (dropdown)
  - Description
  - Montant
  - Date
- [ ] Vérifier la validation du montant (> 0)
- [ ] Cliquer sur "Créer la dépense"
- [ ] Vérifier que la dépense apparaît
- [ ] Vérifier que le total se met à jour
- [ ] Vérifier qu'aucune erreur console

#### Test 7.2: Modifier une dépense ✅
- [ ] Cliquer sur "Modifier" sur une dépense
- [ ] Vérifier que les champs sont pré-remplis
- [ ] Modifier la description et le montant
- [ ] Cliquer sur "Enregistrer les modifications"
- [ ] Vérifier que la dépense est mise à jour
- [ ] Vérifier que le total se recalcule
- [ ] Vérifier qu'aucune erreur console

### 8. IdeaNoteFormModal (Bloc-notes)

#### Test 8.1: Créer une note idée ✅
- [ ] Aller sur la section "Bloc-notes" (ideas)
- [ ] Cliquer sur "Nouvelle idée"
- [ ] Vérifier que la modale IdeaNoteFormModal s'ouvre
- [ ] Remplir les champs:
  - Catégorie (subject/trainer/location/other)
  - Titre
  - Contenu (textarea)
  - Tags (séparés par virgules)
- [ ] Cliquer sur "Créer la note"
- [ ] Vérifier que la note apparaît
- [ ] Vérifier qu'aucune erreur console

#### Test 8.2: Modifier une note idée ✅
- [ ] Cliquer sur "Modifier" sur une note
- [ ] Vérifier que les champs sont pré-remplis
- [ ] Modifier le titre et le contenu
- [ ] Ajouter/modifier des tags
- [ ] Cliquer sur "Enregistrer les modifications"
- [ ] Vérifier que la note est mise à jour
- [ ] Vérifier qu'aucune erreur console

---

## 🎨 Tests d'accessibilité

### Navigation clavier ✅
- [ ] Ouvrir chaque modale
- [ ] Vérifier que le focus est sur le premier champ
- [ ] Naviguer avec Tab/Shift+Tab
- [ ] Vérifier que tous les champs sont accessibles
- [ ] Appuyer sur Escape pour fermer
- [ ] Vérifier que la modale se ferme

### Lecteur d'écran ✅
- [ ] Activer VoiceOver (Cmd+F5 sur Mac)
- [ ] Ouvrir une modale
- [ ] Vérifier que les labels sont lus correctement
- [ ] Vérifier que les erreurs sont annoncées
- [ ] Vérifier les attributs ARIA

---

## 📱 Tests responsive

### Mobile (< 640px) ✅
- [ ] Ouvrir DevTools (Responsive mode)
- [ ] Tester sur iPhone SE (375px)
- [ ] Vérifier que les modales sont full-screen
- [ ] Vérifier que tous les champs sont accessibles
- [ ] Vérifier que le scroll fonctionne

### Tablet (640-1024px) ✅
- [ ] Tester sur iPad (768px)
- [ ] Vérifier que les modales sont centrées
- [ ] Vérifier la largeur des modales (max-w-2xl)
- [ ] Vérifier que les layouts sont adaptés

### Desktop (> 1024px) ✅
- [ ] Tester sur écran standard (1440px)
- [ ] Vérifier le backdrop blur
- [ ] Vérifier les animations d'ouverture
- [ ] Vérifier le positionnement centré

---

## 🐛 Tests d'erreur

### Validation client ✅
- [ ] Soumettre un formulaire vide
- [ ] Vérifier que les erreurs s'affichent
- [ ] Vérifier que les champs requis sont marqués
- [ ] Vérifier que la soumission est bloquée

### Erreurs réseau ✅
- [ ] Ouvrir DevTools (Network tab)
- [ ] Activer "Offline" mode
- [ ] Tenter une création/modification
- [ ] Vérifier que l'erreur s'affiche
- [ ] Vérifier que la modale reste ouverte

### Gestion busy state ✅
- [ ] Soumettre un formulaire
- [ ] Vérifier que le bouton affiche "En cours..."
- [ ] Vérifier que les champs sont désactivés
- [ ] Vérifier qu'on ne peut pas soumettre 2 fois

---

## ✅ Critères de succès globaux

### Fonctionnel ✅
- [ ] 0 `window.prompt` dans le code
- [ ] Toutes les modales s'ouvrent correctement
- [ ] Tous les formulaires se soumettent
- [ ] Toutes les données sont sauvegardées
- [ ] Toutes les modales se ferment après succès

### Technique ✅
- [ ] Build Vite réussit sans erreur
- [ ] Aucune erreur console JavaScript
- [ ] Aucun warning React dans la console
- [ ] Bundle size acceptable (<2 MB)
- [ ] Performance acceptable (<500ms ouverture)

### UX ✅
- [ ] Design cohérent (couleur Academy #B01A19)
- [ ] Animations fluides
- [ ] Feedback visuel clair
- [ ] Messages d'erreur compréhensibles
- [ ] Navigation intuitive

### Accessibilité ✅
- [ ] Navigation clavier complète
- [ ] Focus visible et logique
- [ ] Labels et ARIA corrects
- [ ] Lecteur d'écran fonctionnel
- [ ] Contraste suffisant (WCAG AA)

---

## 📊 Rapport de tests

Après avoir effectué tous les tests, remplir ce tableau:

| Catégorie | Tests passés | Tests échoués | Taux de réussite |
|-----------|--------------|---------------|------------------|
| TrainingFormModal | _ / 2 | _ | _ % |
| SessionFormModal | _ / 2 | _ | _ % |
| RegistrationFormModal | _ / 2 | _ | _ % |
| PaymentStatusModal | _ / 1 | _ | _ % |
| DocumentFormModal | _ / 1 | _ | _ % |
| ChecklistItemModal | _ / 1 | _ | _ % |
| ExpenseFormModal | _ / 2 | _ | _ % |
| IdeaNoteFormModal | _ / 2 | _ | _ % |
| **Total** | **_ / 13** | **_** | **_ %** |

| Tests non-fonctionnels | Résultat |
|------------------------|----------|
| Accessibilité | ✅ / ❌ |
| Responsive | ✅ / ❌ |
| Erreurs | ✅ / ❌ |
| Performance | ✅ / ❌ |

---

## 🚀 Go/No-Go Production

### Critères obligatoires (Go = tous ✅)
- [ ] Toutes les modales fonctionnent (13/13)
- [ ] 0 erreur console JavaScript
- [ ] Build Vite réussit
- [ ] Accessibilité clavier complète
- [ ] Design responsive validé

### Critères recommandés
- [ ] Performance <500ms
- [ ] Tests E2E passent
- [ ] Documentation à jour
- [ ] Code review validé

**Décision**: ⏳ En attente de validation manuelle

---

**Date de création**: 2026-02-16
**Version**: 1.0.0
**Testeur**: _____________
**Date de test**: _____________
**Résultat**: ✅ GO / ❌ NO-GO
