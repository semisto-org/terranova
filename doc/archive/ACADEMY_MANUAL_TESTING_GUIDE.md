# Guide de Tests Manuels - Academy Modals

## 🎯 Objectif

Valider manuellement que les 8 modales React fonctionnent correctement dans le navigateur et remplacent bien les anciens `window.prompt`.

---

## 🚀 Démarrage

```bash
# 1. Démarrer le serveur de développement
cd /Users/michael/code/terranova
bin/dev

# 2. Ouvrir le navigateur
# http://localhost:3000/academy
```

---

## ✅ Checklist de Validation (13 Tests)

### 1. TrainingFormModal - Créer une Formation

**Étapes**:
1. Aller dans la vue Kanban
2. Cliquer sur le bouton "Créer une formation" (ou équivalent)
3. Vérifier que la modale TrainingFormModal s'ouvre
4. Vérifier les champs:
   - [ ] Type de formation (select avec options)
   - [ ] Titre (text input)
   - [ ] Prix (number input, min 0)
   - [ ] Participants max (number input, min 1)
   - [ ] Hébergement requis (checkbox)
   - [ ] Description (textarea)
   - [ ] Note coordinateur (textarea)
5. Tester la validation:
   - [ ] Soumettre sans titre → erreur affichée
   - [ ] Entrer un prix négatif → erreur affichée
   - [ ] Entrer 0 participants → erreur affichée
6. Remplir correctement et soumettre
   - [ ] Modale se ferme
   - [ ] Formation apparaît dans le Kanban
   - [ ] Aucun `window.prompt` ne s'affiche

**Accessibilité**:
- [ ] Focus automatique sur premier champ
- [ ] Touche Escape ferme la modale
- [ ] Navigation au clavier fonctionne

---

### 2. TrainingFormModal - Éditer une Formation

**Étapes**:
1. Sélectionner une formation existante
2. Cliquer sur "Éditer" (ou icône crayon)
3. Vérifier que la modale s'ouvre avec les données pré-remplies
4. Modifier le titre
5. Soumettre
   - [ ] Modale se ferme
   - [ ] Changements visibles dans le Kanban
   - [ ] Aucun `window.prompt`

---

### 3. SessionFormModal - Ajouter une Session

**Étapes**:
1. Ouvrir les détails d'une formation
2. Aller dans l'onglet "Sessions"
3. Cliquer sur "Ajouter session"
4. Vérifier les champs:
   - [ ] Date début (date picker)
   - [ ] Date fin (date picker)
   - [ ] Lieux (multi-select)
   - [ ] Formateurs (multi-select)
   - [ ] Assistants (multi-select)
   - [ ] Description (textarea)
5. Tester validation:
   - [ ] Date fin < date début → erreur
6. Soumettre avec succès
   - [ ] Session ajoutée dans le calendrier
   - [ ] Aucun `window.prompt`

---

### 4. SessionFormModal - Éditer une Session

**Étapes**:
1. Sélectionner une session existante
2. Cliquer sur "Éditer"
3. Modifier les dates
4. Soumettre
   - [ ] Changements sauvegardés
   - [ ] Aucun `window.prompt`

---

### 5. RegistrationFormModal - Ajouter une Inscription

**Étapes**:
1. Ouvrir les détails d'une formation
2. Aller dans l'onglet "Inscriptions"
3. Cliquer sur "Ajouter inscription"
4. Vérifier les champs:
   - [ ] Nom du contact (text)
   - [ ] Email (email input)
   - [ ] Montant payé (number, min 0)
   - [ ] Statut paiement (select: pending/partial/paid)
   - [ ] Note interne (textarea)
5. Tester validation:
   - [ ] Soumettre sans nom → erreur
   - [ ] Email invalide → erreur
6. Soumettre avec succès
   - [ ] Inscription ajoutée
   - [ ] Compteur participants mis à jour
   - [ ] Aucun `window.prompt`

---

### 6. RegistrationFormModal - Éditer une Inscription

**Étapes**:
1. Sélectionner une inscription existante
2. Cliquer sur "Éditer"
3. Modifier l'email
4. Soumettre
   - [ ] Changements sauvegardés
   - [ ] Aucun `window.prompt`

---

### 7. PaymentStatusModal - Mettre à Jour le Paiement

**Étapes**:
1. Sélectionner une inscription
2. Cliquer sur "Modifier statut paiement"
3. Vérifier les champs:
   - [ ] Statut (select)
   - [ ] Montant payé (number)
   - [ ] Montant restant (calculé automatiquement)
4. Changer le statut de "pending" à "partial"
5. Entrer un montant partiel
6. Soumettre
   - [ ] Statut mis à jour
   - [ ] Indicateur visuel mis à jour
   - [ ] Aucun `window.prompt`

---

### 8. DocumentFormModal - Ajouter un Document

**Étapes**:
1. Ouvrir les détails d'une formation
2. Aller dans l'onglet "Documents"
3. Cliquer sur "Ajouter document"
4. Vérifier les champs:
   - [ ] Nom (text)
   - [ ] Type (select: pdf/link/image/video)
   - [ ] URL (text)
5. Tester validation:
   - [ ] URL invalide → erreur
6. Soumettre avec succès
   - [ ] Document ajouté à la liste
   - [ ] Aucun `window.prompt`

---

### 9. ChecklistItemModal - Ajouter un Item à la Checklist

**Étapes**:
1. Ouvrir les détails d'une formation
2. Aller dans l'onglet "Checklist"
3. Cliquer sur "Ajouter item"
4. Vérifier le champ:
   - [ ] Texte de l'item (text input)
5. Tester validation:
   - [ ] Soumettre vide → erreur
6. Soumettre avec succès
   - [ ] Item ajouté à la checklist
   - [ ] Aucun `window.prompt`

---

### 10. ExpenseFormModal - Ajouter une Dépense

**Étapes**:
1. Ouvrir les détails d'une formation
2. Aller dans l'onglet "Finances"
3. Cliquer sur "Ajouter dépense"
4. Vérifier les champs:
   - [ ] Catégorie (select avec 6 options + icônes)
   - [ ] Description (text)
   - [ ] Montant (number, min > 0)
   - [ ] Date (date picker)
5. Tester validation:
   - [ ] Montant = 0 → erreur
   - [ ] Champs requis vides → erreur
6. Soumettre avec succès
   - [ ] Dépense ajoutée
   - [ ] Total dépenses mis à jour
   - [ ] Aucun `window.prompt`

---

### 11. ExpenseFormModal - Éditer une Dépense

**Étapes**:
1. Sélectionner une dépense existante
2. Cliquer sur "Éditer"
3. Modifier le montant
4. Soumettre
   - [ ] Changements sauvegardés
   - [ ] Total recalculé
   - [ ] Aucun `window.prompt`

---

### 12. IdeaNoteFormModal - Créer une Note d'Idée

**Étapes**:
1. Aller dans la vue "Idées"
2. Cliquer sur "Nouvelle idée"
3. Vérifier les champs:
   - [ ] Catégorie (select: subject/trainer/location/other)
   - [ ] Titre (text)
   - [ ] Contenu (textarea)
   - [ ] Tags (text input, séparés par virgule)
4. Tester validation:
   - [ ] Soumettre sans titre → erreur
5. Soumettre avec tags séparés par virgule
   - [ ] Note ajoutée
   - [ ] Tags affichés séparément
   - [ ] Aucun `window.prompt`

---

### 13. IdeaNoteFormModal - Éditer une Note d'Idée

**Étapes**:
1. Sélectionner une note existante
2. Cliquer sur "Éditer"
3. Modifier le contenu et les tags
4. Soumettre
   - [ ] Changements sauvegardés
   - [ ] Aucun `window.prompt`

---

## 🎨 Validation Visuelle Générale

### Design
- [ ] Couleur accent Academy (#B01A19) présente
- [ ] Backdrop avec blur
- [ ] Animations d'entrée fluides
- [ ] Design responsive (tester sur mobile/tablet)

### Accessibilité
- [ ] Tous les champs ont des labels clairs
- [ ] Messages d'erreur visibles et clairs
- [ ] Navigation au clavier fonctionne partout
- [ ] Escape ferme toutes les modales

### UX
- [ ] Aucun freeze ou lag
- [ ] États de chargement (busy) affichés
- [ ] Pas de bugs d'affichage
- [ ] Messages de succès/erreur appropriés

---

## 🐛 Problèmes Potentiels à Vérifier

### Cas d'Erreur
- [ ] Erreur réseau → message d'erreur affiché
- [ ] Session expirée → redirect vers login
- [ ] Validation échouée → erreurs spécifiques affichées

### Edge Cases
- [ ] Formation sans type → message d'erreur avant d'ouvrir modale
- [ ] Supprimer une entité utilisée ailleurs → message approprié
- [ ] Très long texte → pas de débordement UI

---

## 📝 Rapport de Test

Une fois les tests terminés, noter:

**Modales testées**: __ / 8

**Tests réussis**: __ / 13

**Bugs trouvés**:
- ...

**Améliorations suggérées**:
- ...

---

## 🚀 Si Tout Fonctionne

✅ **Phase 3 validée!**

Prochaines étapes possibles:
1. Phase 4 - Refactoring (optimisation)
2. Appliquer la même approche aux autres sections (Plants, Design, Nursery)
3. Tests E2E automatisés (Playwright/Cypress)

---

**Date**: 2026-02-16
**Version**: 1.0.0
**Status**: Ready for manual testing
