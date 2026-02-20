# Academy Modal Components

8 composants modales React pour remplacer les `window.prompt` dans Academy/Index.jsx.

## Composants créés

### Priorité 1 (Core Features)

#### 1. TrainingFormModal
**Usage**: Créer/modifier une formation

**Props**:
```js
{
  training?: Training | null,        // null = create, Training = edit
  trainingTypes: TrainingType[],     // Liste des types de formation
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  training_type_id: string,
  title: string,
  price: number,
  max_participants: number,
  requires_accommodation: boolean,
  description: string,
  coordinator_note: string
}
```

---

#### 2. RegistrationFormModal
**Usage**: Créer/modifier une inscription de participant

**Props**:
```js
{
  registration?: TrainingRegistration | null,
  trainingPrice: number,             // Prix de la formation (pour affichage)
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  contact_name: string,
  contact_email: string,
  amount_paid: number,
  payment_status: 'pending' | 'partial' | 'paid',
  internal_note: string
}
```

---

#### 3. PaymentStatusModal
**Usage**: Mettre à jour le statut de paiement d'une inscription

**Props**:
```js
{
  registration: TrainingRegistration,  // Registration actuelle
  trainingPrice: number,                // Prix de la formation
  onSubmit: (status, amountPaid) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Signature onSubmit**: `(status: string, amountPaid: number) => Promise<void>`

---

### Priorité 2 (Session & Finance)

#### 4. SessionFormModal
**Usage**: Créer/modifier une session de formation

**Props**:
```js
{
  session?: TrainingSession | null,
  locations: TrainingLocation[],     // Lieux disponibles
  members: Member[],                  // Membres (formateurs/assistants)
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  start_date: string,        // YYYY-MM-DD
  end_date: string,          // YYYY-MM-DD
  location_ids: number[],
  trainer_ids: number[],
  assistant_ids: number[],
  description: string
}
```

---

#### 5. ExpenseFormModal
**Usage**: Créer/modifier une dépense de formation

**Props**:
```js
{
  expense?: TrainingExpense | null,
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  category: 'location' | 'material' | 'food' | 'accommodation' | 'transport' | 'other',
  description: string,
  amount: number,
  date: string  // YYYY-MM-DD
}
```

---

#### 6. DocumentFormModal
**Usage**: Ajouter un document à une formation

**Props**:
```js
{
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  name: string,
  document_type: 'pdf' | 'link' | 'image' | 'video',
  url: string  // URL valide (http/https)
}
```

---

### Priorité 3 (Support Features)

#### 7. ChecklistItemModal
**Usage**: Ajouter un item à la checklist de préparation

**Props**:
```js
{
  onSubmit: (item: string) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Signature onSubmit**: `(item: string) => Promise<void>`

---

#### 8. IdeaNoteFormModal
**Usage**: Créer/modifier une note d'idée de formation

**Props**:
```js
{
  note?: IdeaNote | null,
  onSubmit: (values) => Promise<void>,
  onCancel: () => void,
  busy?: boolean
}
```

**Values retournées**:
```js
{
  category: 'subject' | 'trainer' | 'location' | 'other',
  title: string,
  content: string,
  tags: string[]
}
```

---

## Import

```js
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

## Pattern commun

Toutes les modales suivent le même pattern :

1. **Backdrop** : clic pour fermer
2. **Header** : titre, description, bouton X
3. **Form Content** : champs avec validation
4. **Footer** : boutons Annuler / Soumettre
5. **Escape** : ferme la modale
6. **Focus** : auto-focus sur premier champ
7. **Validation** : validation en temps réel
8. **Erreurs** : affichage clair des erreurs
9. **Busy state** : désactivation pendant soumission
10. **Accessibilité** : ARIA labels, keyboard navigation

## Couleurs Academy

- Accent principal : `#B01A19` (rouge)
- Hover : `#8f1514`
- Background : `from-red-50 to-white`

## Prochaine étape

Phase 3 : Intégrer ces modales dans `/app/frontend/pages/Academy/Index.jsx` en remplacement des 23 `window.prompt`.
