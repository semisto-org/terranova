# Migration Guide: Academy window.prompt → React Modals

## Contexte

Phase 2 (GREEN) du cycle TDD : Remplacement de 23 `window.prompt` par 8 modales React dans Academy/Index.jsx.

## Composants créés ✅

| Composant | Fichier | Lignes | Status |
|-----------|---------|--------|--------|
| TrainingFormModal | `/app/frontend/components/academy/TrainingFormModal.jsx` | 13 KB | ✅ Créé |
| RegistrationFormModal | `/app/frontend/components/academy/RegistrationFormModal.jsx` | 12 KB | ✅ Créé |
| PaymentStatusModal | `/app/frontend/components/academy/PaymentStatusModal.jsx` | 13 KB | ✅ Créé |
| SessionFormModal | `/app/frontend/components/academy/SessionFormModal.jsx` | 17 KB | ✅ Créé |
| ExpenseFormModal | `/app/frontend/components/academy/ExpenseFormModal.jsx` | 11 KB | ✅ Créé |
| DocumentFormModal | `/app/frontend/components/academy/DocumentFormModal.jsx` | 11 KB | ✅ Créé |
| ChecklistItemModal | `/app/frontend/components/academy/ChecklistItemModal.jsx` | 7.3 KB | ✅ Créé |
| IdeaNoteFormModal | `/app/frontend/components/academy/IdeaNoteFormModal.jsx` | 12 KB | ✅ Créé |

**Total**: 8 composants, ~96 KB de code

## Validation Vite ✅

```bash
npm run build
# ✓ built in 2.26s
# ✓ 314 modules transformed
```

Tous les composants compilent sans erreur.

## Prochaines étapes (Phase 3)

### 1. Importer les modales dans Academy/Index.jsx

```jsx
import {
  TrainingFormModal,
  RegistrationFormModal,
  PaymentStatusModal,
  SessionFormModal,
  ExpenseFormModal,
  DocumentFormModal,
  ChecklistItemModal,
  IdeaNoteFormModal
} from '@/components/academy'
```

### 2. Ajouter les états de modale

```jsx
const [activeModal, setActiveModal] = useState(null)
const [modalData, setModalData] = useState(null)
```

### 3. Mapper les window.prompt vers les modales

| Fonction actuelle | Lignes | Modale à utiliser | Action |
|-------------------|--------|-------------------|--------|
| `createTraining()` | 265-268 | TrainingFormModal | Créer formation |
| `editTraining(id)` | 271-278 | TrainingFormModal | Modifier formation |
| `addSession(trainingId)` | 281 | SessionFormModal | Créer session |
| `editSession(sessionId)` | 282-288 | SessionFormModal | Modifier session |
| `addRegistration(trainingId)` | 291-294 | RegistrationFormModal | Créer inscription |
| `editRegistration(registrationId)` | 297-303 | RegistrationFormModal | Modifier inscription |
| `updatePaymentStatus(registrationId)` | 305-309 | PaymentStatusModal | Mettre à jour paiement |
| `addDocument(trainingId)` | 312-316 | DocumentFormModal | Ajouter document |
| `addChecklistItem(trainingId)` | 320-323 | ChecklistItemModal | Ajouter item checklist |
| `addExpense(trainingId)` | 326-329 | ExpenseFormModal | Créer dépense |
| `editExpense(expenseId)` | 331-336 | ExpenseFormModal | Modifier dépense |
| `createIdeaNote()` | 339-342 | IdeaNoteFormModal | Créer note idée |
| `editIdeaNote(id)` | 344-349 | IdeaNoteFormModal | Modifier note idée |

**Total à remplacer**: 23 `window.prompt`

### 4. Exemple de remplacement

**Avant** (ligne 265-268):
```jsx
const trainingTypeId = window.prompt(`Type ID (${data.trainingTypes.map((item) => item.id).join(', ')})`, data.trainingTypes[0].id)
const title = window.prompt('Titre de la formation')
if (!trainingTypeId || !title) return
runMutation(() => apiRequest('/api/v1/academy/trainings', { method: 'POST', body: JSON.stringify({ training_type_id: trainingTypeId, title, price: 180, max_participants: 20, requires_accommodation: false, description: '', coordinator_note: '' }) }))
```

**Après**:
```jsx
setModalData({ trainingTypes: data.trainingTypes })
setActiveModal('createTraining')

// Dans le render:
{activeModal === 'createTraining' && (
  <TrainingFormModal
    trainingTypes={modalData.trainingTypes}
    onSubmit={async (values) => {
      await runMutation(() =>
        apiRequest('/api/v1/academy/trainings', {
          method: 'POST',
          body: JSON.stringify(values)
        })
      )
      setActiveModal(null)
    }}
    onCancel={() => setActiveModal(null)}
    busy={mutation.loading}
  />
)}
```

### 5. Checklist d'intégration

- [ ] Importer les 8 composants
- [ ] Ajouter les états `activeModal` et `modalData`
- [ ] Remplacer `createTraining()` → TrainingFormModal (create)
- [ ] Remplacer `editTraining()` → TrainingFormModal (edit)
- [ ] Remplacer `addSession()` → SessionFormModal (create)
- [ ] Remplacer `editSession()` → SessionFormModal (edit)
- [ ] Remplacer `addRegistration()` → RegistrationFormModal (create)
- [ ] Remplacer `editRegistration()` → RegistrationFormModal (edit)
- [ ] Remplacer `updatePaymentStatus()` → PaymentStatusModal
- [ ] Remplacer `addDocument()` → DocumentFormModal
- [ ] Remplacer `addChecklistItem()` → ChecklistItemModal
- [ ] Remplacer `addExpense()` → ExpenseFormModal (create)
- [ ] Remplacer `editExpense()` → ExpenseFormModal (edit)
- [ ] Remplacer `createIdeaNote()` → IdeaNoteFormModal (create)
- [ ] Remplacer `editIdeaNote()` → IdeaNoteFormModal (edit)
- [ ] Ajouter le render conditionnel des 8 modales
- [ ] Tester chaque modale
- [ ] Vérifier que les tests passent toujours

### 6. Tests à vérifier

```bash
npm run test:academy
# Tous les tests d'intégration doivent toujours passer
```

## Pattern de migration

Pour chaque `window.prompt` :

1. **Identifier** la fonction qui l'utilise
2. **Mapper** vers la modale appropriée
3. **Extraire** les données nécessaires
4. **Remplacer** par `setActiveModal()` et `setModalData()`
5. **Ajouter** le render conditionnel
6. **Tester** le comportement

## Avantages des modales

✅ **UX améliorée**: Modales modernes vs prompts natifs
✅ **Validation**: Validation en temps réel côté client
✅ **Accessibilité**: Support clavier, ARIA, focus management
✅ **Responsive**: Design adaptatif mobile/desktop
✅ **Cohérence**: Design system Academy (#B01A19)
✅ **Maintenabilité**: Code modulaire et réutilisable
✅ **Tests**: Plus facile à tester que window.prompt

## Structure des fichiers

```
app/frontend/components/academy/
├── TrainingFormModal.jsx       # 13 KB - PRIORITÉ 1
├── RegistrationFormModal.jsx   # 12 KB - PRIORITÉ 1
├── PaymentStatusModal.jsx      # 13 KB - PRIORITÉ 1
├── SessionFormModal.jsx        # 17 KB - PRIORITÉ 2
├── ExpenseFormModal.jsx        # 11 KB - PRIORITÉ 2
├── DocumentFormModal.jsx       # 11 KB - PRIORITÉ 2
├── ChecklistItemModal.jsx      #  7 KB - PRIORITÉ 3
├── IdeaNoteFormModal.jsx       # 12 KB - PRIORITÉ 3
├── index.js                    # Export centralisé
├── README.md                   # Documentation API
└── LocationsMap.jsx            # Existant (carte Leaflet)
```

## Ressources

- 📁 **Code source**: `/app/frontend/components/academy/`
- 📖 **Documentation**: `/app/frontend/components/academy/README.md`
- 🧪 **Tests**: `/app/frontend/pages/Academy/Index.jsx` (à modifier)
- 🎨 **Design**: Pattern basé sur `MemberForm.tsx` (Lab Management)

## Timeline

- ✅ **Phase 1** (RED): Tests d'intégration écrits
- ✅ **Phase 2** (GREEN): 8 modales React créées
- ⏳ **Phase 3** (GREEN): Intégration dans Index.jsx
- ⏳ **Phase 4** (REFACTOR): Amélioration qualité code

---

**Date de création**: 2026-02-16
**Dernière mise à jour**: 2026-02-16
**Status**: Phase 2 terminée ✅
