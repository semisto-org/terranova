# Application Shell

## Overview

Le shell de Terranova suit un pattern "Pôle Focus" avec un sélecteur contextuel unifié. L'interface reste minimaliste malgré la complexité multi-pôles en ne montrant que les sous-sections pertinentes au contexte actuel.

## Layout

- **Header**: Sélecteur contextuel (logo pôle + nom Lab + chevron) à gauche, notifications et recherche à droite
- **Sidebar**: Sous-sections du pôle actif, collapsible sur tablet, drawer sur mobile
- **Content**: Zone principale

## Sélecteur Contextuel

Unifie la navigation et le user menu en un seul point d'entrée:
1. Identité utilisateur (avatar, nom, email)
2. Pôles métier (Design Studio, Academy, Nursery, Mise en oeuvre)
3. Accès spéciaux (Gestion du Lab, Website)
4. Labs (si multi-Lab)
5. Actions (Paramètres, Déconnexion)

## Sidebar par Pôle

- **Design Studio**: Projets, Clients, Offres, Plantations
- **Academy**: Formations, Inscriptions, Contenus, Participants
- **Nursery**: Stocks, Commandes, Catalogue
- **Mise en oeuvre**: Chantiers, Heroes, Événements, Matériothèque
- **Gestion du Lab**: Cycles, Membres, Guildes, Semos, Finance, Reporting
- **Website**: Pages, Transformation Map, Boutique, Portfolio, Formations

## Pole Colors

| Pole | Accent | Background |
|------|--------|------------|
| Design Studio | #AFBD00 | #e1e6d8 |
| Academy | #B01A19 | #eac7b8 |
| Nursery | #EF9B0D | #fbe6c3 |
| Mise en oeuvre | #234766 | #c9d1d9 |
| Gestion du Lab | #5B5781 | #c8bfd2 |
| Website | #5B5781 | #FFFFFF |

## Responsive

- **Desktop (≥1024px)**: Sidebar visible, header complet
- **Tablet (768-1023px)**: Sidebar collapsible
- **Mobile (<768px)**: Sidebar en drawer

## Components

- `AppShell` — Main layout wrapper
- `ContextSwitcher` — Pole/Lab/User selector dropdown
- `MainNav` — Sidebar navigation
- `SearchDialog` — Global search overlay
- `NotificationsDrawer` — Notifications panel
