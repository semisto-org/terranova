# Nursery

## Overview

Section dédiée à la gestion des pépinières Semisto et du réseau de pépinières partenaires. Gestion des stocks avec détail par lot, suivi des plants-mères, traitement des commandes avec fulfillment multi-pépinières, transferts inter-pépinières, et catalogue multi-pépinières pour les designers.

## User Flows

- **Stock Management**: Add/edit batches with species, container, growth stage, pricing
- **Mother Plants**: View and validate mother plant sources
- **Order Processing**: New → Processing → Ready → Picked Up workflow
- **Catalog**: Multi-nursery view for designers with real-time availability

## Components Provided

- `StockManagement` / `StockBatchForm` / `StockBatchRow` — Stock management
- `Catalog` / `CatalogItem` — Multi-nursery catalog
- `MotherPlantList` / `MotherPlantRow` — Mother plant tracking

## Callback Props

| Callback | Description |
|----------|-------------|
| `onCreate` | Create stock batch |
| `onEdit` | Edit stock batch |
| `onDelete` | Delete stock batch |
| `onFilter` | Filter stock by nursery/species/container/stage |
| `onValidate` | Validate a mother plant |
| `onReject` | Reject a mother plant |
| `onProcess` | Start processing an order |
| `onMarkReady` | Mark order as ready for pickup |
