# Academy Modals - Guide Développeur

## 🎯 Objectif

Ce document guide les développeurs pour comprendre et maintenir les 8 modales React intégrées dans la section Academy de Terranova.

---

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Composants disponibles](#composants-disponibles)
4. [Utilisation](#utilisation)
5. [Patterns et conventions](#patterns-et-conventions)
6. [Tests](#tests)
7. [Debugging](#debugging)
8. [FAQ](#faq)

---

## Vue d'ensemble

### Contexte

Les modales Academy ont été créées pour remplacer les `window.prompt` natifs par une interface moderne, accessible et validée côté client.

### Statistiques

- **8 composants modales** (~96 KB)
- **0 window.prompt** (100% remplacés)
- **13 actions** refactorisées
- **23 prompts** supprimés
- **Build Vite**: 1.54s
- **Bundle size**: +199 KB

### Technologies

- **React 18** - Framework UI
- **Tailwind CSS 4** - Styling
- **Validation client** - Temps réel
- **Accessibilité** - ARIA + keyboard nav

---

## Architecture

### Structure des fichiers

```
app/frontend/
├── components/academy/
│   ├── TrainingFormModal.jsx      # Créer/modifier formations
│   ├── SessionFormModal.jsx       # Créer/modifier sessions
│   ├── RegistrationFormModal.jsx  # Créer/modifier inscriptions
│   ├── PaymentStatusModal.jsx     # Mettre à jour paiements
│   ├── DocumentFormModal.jsx      # Ajouter documents
│   ├── ChecklistItemModal.jsx     # Ajouter items checklist
│   ├── ExpenseFormModal.jsx       # Créer/modifier dépenses
│   ├── IdeaNoteFormModal.jsx      # Créer/modifier notes idées
│   ├── index.js                   # Export centralisé
│   └── README.md                  # Documentation API
└── pages/Academy/
    └── Index.jsx                  # Page principale (utilise les modales)
```

### Pattern d'intégration

```jsx
// 1. Import des modales
import { TrainingFormModal } from '@/components/academy'

// 2. État React
const [activeModal, setActiveModal] = useState(null)
const [modalData, setModalData] = useState(null)

// 3. Handler de soumission
const handleSubmit = async (values) => {
  await runMutation(() => apiRequest(...))
  setActiveModal(null)
}

// 4. Action pour ouvrir
const openModal = () => {
  setModalData({ isEdit: false })
  setActiveModal('training')
}

// 5. Rendu conditionnel
{activeModal === 'training' && (
  <TrainingFormModal
    onSubmit={handleSubmit}
    onCancel={() => setActiveModal(null)}
  />
)}
```

---

## Composants disponibles

### 1. TrainingFormModal

**Usage**: Créer ou modifier une formation

**Props**:
```typescript
{
  training?: Training | null,        // null = create, object = edit
  trainingTypes: TrainingType[],     // Liste des types (requis)
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Exemple**:
```jsx
<TrainingFormModal
  training={editMode ? currentTraining : null}
  trainingTypes={data.trainingTypes}
  onSubmit={handleTrainingSubmit}
  onCancel={closeModal}
  busy={isLoading}
/>
```

### 2. SessionFormModal

**Usage**: Créer ou modifier une session de formation

**Props**:
```typescript
{
  session?: TrainingSession | null,
  locations: TrainingLocation[],
  members: Member[],
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 3. RegistrationFormModal

**Usage**: Créer ou modifier une inscription de participant

**Props**:
```typescript
{
  registration?: TrainingRegistration | null,
  trainingPrice: number,             // Pour affichage
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 4. PaymentStatusModal

**Usage**: Mettre à jour le statut de paiement

**Props**:
```typescript
{
  registration: TrainingRegistration,  // Requis
  trainingPrice: number,
  onSubmit: (status: string, amountPaid: number) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 5. DocumentFormModal

**Usage**: Ajouter un document à une formation

**Props**:
```typescript
{
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 6. ChecklistItemModal

**Usage**: Ajouter un item à la checklist

**Props**:
```typescript
{
  onSubmit: (item: string) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 7. ExpenseFormModal

**Usage**: Créer ou modifier une dépense

**Props**:
```typescript
{
  expense?: TrainingExpense | null,
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

### 8. IdeaNoteFormModal

**Usage**: Créer ou modifier une note d'idée

**Props**:
```typescript
{
  note?: IdeaNote | null,
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

---

## Utilisation

### Créer une nouvelle modale (create mode)

```jsx
// Action qui ouvre la modale
const createTraining = () => {
  setModalData({
    isEdit: false,
    // Données contextuelles si nécessaire
  })
  setActiveModal('training')
}

// Handler de soumission
const handleTrainingSubmit = async (values) => {
  const success = await runMutation(() =>
    apiRequest('/api/v1/academy/trainings', {
      method: 'POST',
      body: JSON.stringify(values)
    })
  )
  if (success) {
    setActiveModal(null)
    setModalData(null)
  }
}

// Render
{activeModal === 'training' && (
  <TrainingFormModal
    training={null}  // null = create mode
    trainingTypes={data.trainingTypes}
    onSubmit={handleTrainingSubmit}
    onCancel={() => {
      setActiveModal(null)
      setModalData(null)
    }}
    busy={busy}
  />
)}
```

### Modifier un élément existant (edit mode)

```jsx
// Action qui ouvre la modale
const editTraining = (id) => {
  const current = data.trainings.find(item => item.id === id)
  if (!current) return

  setModalData({
    isEdit: true,
    training: current  // Données à éditer
  })
  setActiveModal('training')
}

// Handler de soumission
const handleTrainingSubmit = async (values) => {
  const success = await runMutation(() =>
    apiRequest(`/api/v1/academy/trainings/${modalData.training.id}`, {
      method: 'PATCH',
      body: JSON.stringify(values)
    })
  )
  if (success) {
    setActiveModal(null)
    setModalData(null)
  }
}

// Render
{activeModal === 'training' && (
  <TrainingFormModal
    training={modalData.training}  // Object = edit mode
    trainingTypes={data.trainingTypes}
    onSubmit={handleTrainingSubmit}
    onCancel={() => {
      setActiveModal(null)
      setModalData(null)
    }}
    busy={busy}
  />
)}
```

---

## Patterns et conventions

### 1. Gestion de l'état

**État minimal requis**:
```jsx
const [activeModal, setActiveModal] = useState(null)
const [modalData, setModalData] = useState(null)
```

**activeModal**: String identifiant la modale active
- `null` = aucune modale
- `'training'`, `'session'`, etc. = modale correspondante

**modalData**: Object contenant les données contextuelles
- `{ isEdit: false }` = mode création
- `{ isEdit: true, item: {...} }` = mode édition
- Peut contenir d'autres données (IDs, relations, etc.)

### 2. Handler de soumission

**Pattern recommandé**:
```jsx
const handleSubmit = useCallback(async (values) => {
  const endpoint = modalData.isEdit
    ? `/api/v1/resource/${modalData.item.id}`
    : '/api/v1/resource'

  const method = modalData.isEdit ? 'PATCH' : 'POST'

  const success = await runMutation(() =>
    apiRequest(endpoint, {
      method,
      body: JSON.stringify(values)
    })
  )

  if (success) {
    setActiveModal(null)
    setModalData(null)
  }
}, [modalData, runMutation])
```

### 3. Fermeture de modale

**Pattern recommandé**:
```jsx
const closeModal = useCallback(() => {
  setActiveModal(null)
  setModalData(null)
}, [])

// Utilisation
<Modal
  onCancel={closeModal}
/>
```

### 4. Busy state

Toutes les modales supportent le prop `busy`:
```jsx
<Modal
  busy={busy}  // Désactive les boutons et champs
  onSubmit={handleSubmit}
/>
```

Le `busy` est géré automatiquement par `runMutation()`:
```jsx
const runMutation = async (handler) => {
  setBusy(true)
  try {
    await handler()
  } finally {
    setBusy(false)
  }
}
```

---

## Tests

### Tests manuels

Voir le fichier complet: `CHECKLIST_VALIDATION_MODALES.md`

**Checklist rapide**:
- [ ] Modale s'ouvre correctement
- [ ] Champs pré-remplis en mode édition
- [ ] Validation fonctionne
- [ ] Soumission sauvegarde les données
- [ ] Modale se ferme après succès
- [ ] Erreurs s'affichent correctement
- [ ] Navigation clavier fonctionne
- [ ] Escape ferme la modale

### Tests automatisés (À venir - Phase 4)

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

---

## Debugging

### Console logs utiles

```jsx
// Dans le handler
console.log('Modal data:', modalData)
console.log('Values submitted:', values)
console.log('API endpoint:', endpoint)

// Dans le render
console.log('Active modal:', activeModal)
console.log('Modal should render:', activeModal === 'training')
```

### Erreurs courantes

#### 1. Modale ne s'ouvre pas

**Symptôme**: Clic sur le bouton mais rien ne se passe

**Causes possibles**:
- `setActiveModal()` n'est pas appelé
- Nom de la modale incorrect
- Condition de render incorrecte

**Solution**:
```jsx
// Vérifier dans l'action
console.log('Opening modal:', modalName)
setActiveModal(modalName)

// Vérifier le render
{activeModal === 'training' && <TrainingFormModal ... />}
```

#### 2. Modale ne se ferme pas après soumission

**Symptôme**: Modale reste ouverte après succès

**Causes possibles**:
- `setActiveModal(null)` manquant
- Handler ne retourne pas de succès
- `runMutation()` échoue silencieusement

**Solution**:
```jsx
const handleSubmit = async (values) => {
  const success = await runMutation(...)
  if (success) {  // ← Important!
    setActiveModal(null)
    setModalData(null)
  }
}
```

#### 3. Champs non pré-remplis en mode édition

**Symptôme**: Modale s'ouvre vide alors qu'elle devrait afficher des données

**Causes possibles**:
- `modalData` non défini
- Structure de données incorrecte
- Prop non passée à la modale

**Solution**:
```jsx
// Vérifier modalData avant d'ouvrir
const editItem = (id) => {
  const item = data.items.find(x => x.id === id)
  console.log('Editing item:', item)  // ← Debug
  setModalData({ isEdit: true, item })
  setActiveModal('modalName')
}

// Vérifier le render
<Modal
  item={modalData?.isEdit ? modalData.item : null}
/>
```

#### 4. Erreur "Cannot read property 'X' of undefined"

**Symptôme**: Erreur JavaScript dans la console

**Causes possibles**:
- Données manquantes dans `modalData`
- Prop requis non passé
- Données API incomplètes

**Solution**:
```jsx
// Utiliser optional chaining
const price = modalData?.trainingPrice || 0

// Vérifier les props requises
{activeModal === 'payment' && modalData?.registration && (
  <PaymentStatusModal registration={modalData.registration} />
)}
```

### DevTools React

**Installation**:
- Chrome: React Developer Tools
- Firefox: React DevTools

**Usage**:
1. Ouvrir DevTools (F12)
2. Onglet "Components"
3. Chercher "AcademyIndex"
4. Inspecter l'état: `activeModal`, `modalData`, `busy`

---

## FAQ

### Q: Comment ajouter une nouvelle modale?

**R**: Suivre ce pattern:

1. Créer le composant dans `/app/frontend/components/academy/`
2. Exporter dans `index.js`
3. Importer dans `Academy/Index.jsx`
4. Ajouter un handler de soumission
5. Modifier l'action pour ouvrir la modale
6. Ajouter le render conditionnel

### Q: Comment personnaliser le style d'une modale?

**R**: Les modales utilisent Tailwind CSS. Modifier directement le composant:
```jsx
// Changer la largeur
<div className="max-w-4xl">  // Au lieu de max-w-2xl

// Changer la couleur
<button className="bg-[#B01A19]">  // Couleur Academy
```

### Q: Comment ajouter une validation personnalisée?

**R**: Ajouter la validation dans le composant modale:
```jsx
const validate = (values) => {
  if (values.price < 0) {
    setErrors({ price: 'Le prix doit être positif' })
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate(form)) return
  // ...
}
```

### Q: Comment internationaliser les modales?

**R**: (À implémenter en Phase 4) Utiliser react-i18next:
```jsx
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()

<h2>{t('academy.modal.training.title')}</h2>
```

### Q: Les modales sont-elles accessibles?

**R**: Oui! Toutes les modales implémentent:
- Labels ARIA (`aria-label`, `aria-labelledby`)
- Focus management (auto-focus premier champ)
- Keyboard navigation (Tab, Escape, Enter)
- Lecteurs d'écran compatibles

### Q: Comment améliorer les performances?

**R**: Suggestions (Phase 4):
1. Lazy load des modales: `const Modal = lazy(() => import('./Modal'))`
2. Memoization: `const MemoModal = React.memo(Modal)`
3. Code splitting: Séparer les modales du bundle principal
4. Virtualisation: Pour les listes longues (multi-select)

---

## Ressources

### Documentation complète

1. **MIGRATION_ACADEMY_MODALS.md** - Guide de migration
2. **INTEGRATION_ACADEMY_MODALS_COMPLETED.md** - Rapport détaillé
3. **SUMMARY_INTEGRATION_MODALS.md** - Résumé exécutif
4. **CHECKLIST_VALIDATION_MODALES.md** - Checklist tests
5. **FILES_IMPACTED_INTEGRATION.md** - Liste des fichiers
6. **VISUAL_FLOW_MODALS.md** - Diagrammes de flux
7. **app/frontend/components/academy/README.md** - API des modales

### Code source

- **Composants**: `/app/frontend/components/academy/`
- **Page principale**: `/app/frontend/pages/Academy/Index.jsx`

### Liens utiles

- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web Accessibility](https://www.w3.org/WAI/)

---

## Support

### Besoin d'aide?

1. Consulter la documentation (fichiers .md)
2. Inspecter le code source des composants
3. Utiliser React DevTools pour debugger
4. Vérifier la console JavaScript
5. Contacter l'équipe de développement

---

**Date de création**: 2026-02-16
**Dernière mise à jour**: 2026-02-16
**Version**: 1.0.0
**Mainteneur**: Équipe Terranova
**Status**: ✅ Production ready
