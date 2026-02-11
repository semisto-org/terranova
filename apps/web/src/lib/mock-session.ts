import type { Pole, Lab, User, NavItem } from '@/components/shell/AppShell'

export const mockUser: User = {
  name: 'Marie Dupont',
  email: 'marie@semisto.org',
}

export const mockLabs: Lab[] = [
  { id: 'lab-wallonie', name: 'Semisto Wallonie' },
]

export const mockPoles: Pole[] = [
  { id: 'design-studio', label: 'Design Studio', color: '#AFBD00', bgColor: '#e1e6d8' },
  { id: 'academy', label: 'Academy', color: '#B01A19', bgColor: '#eac7b8' },
  { id: 'nursery', label: 'Nursery', color: '#EF9B0D', bgColor: '#fbe6c3' },
  { id: 'mise-en-oeuvre', label: 'Mise en œuvre', color: '#234766', bgColor: '#c9d1d9' },
]

export const navigationConfig: Record<string, NavItem[]> = {
  'design-studio': [
    { label: 'Projets', href: '/design' },
    { label: 'Clients', href: '/design/clients' },
    { label: 'Offres', href: '/design/offres' },
    { label: 'Plantations', href: '/design/plantations' },
  ],
  'academy': [
    { label: 'Formations', href: '/academy' },
    { label: 'Calendrier', href: '/academy/calendar' },
    { label: 'Inscriptions', href: '/academy/inscriptions' },
    { label: 'Contenus', href: '/academy/contenus' },
    { label: 'Participants', href: '/academy/participants' },
  ],
  'nursery': [
    { label: 'Stocks', href: '/nursery' },
    { label: 'Commandes', href: '/nursery/orders' },
    { label: 'Catalogue', href: '/nursery/catalog' },
  ],
  'mise-en-oeuvre': [
    { label: 'Chantiers', href: '/engagement' },
    { label: 'Heroes', href: '/engagement/heroes' },
    { label: 'Événements', href: '/engagement/evenements' },
    { label: 'Matériothèque', href: '/engagement/materiotheque' },
    { label: 'Carte', href: '/engagement/map' },
  ],
  'lab-management': [
    { label: 'Cycles', href: '/lab/cycles' },
    { label: 'Membres', href: '/lab/members' },
    { label: 'Guildes', href: '/lab/guildes' },
    { label: 'Semos', href: '/lab/semos' },
    { label: 'Shape Up', href: '/lab/shape-up' },
    { label: 'Finance', href: '/lab/finance' },
    { label: 'Reporting', href: '/lab/reporting' },
    { label: 'Feuilles de temps', href: '/lab/timesheets' },
    { label: 'Calendrier', href: '/lab/calendar' },
  ],
  'website': [
    { label: 'Pages', href: '/website' },
    { label: 'Boutique', href: '/website/boutique' },
    { label: 'Portfolio', href: '/website/portfolio' },
    { label: 'Formations', href: '/website/formations' },
  ],
}
