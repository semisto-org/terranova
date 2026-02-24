# Global Search Premium

## API
- `GET /api/v1/search/global?q=...&types=projects,contacts&limit=24&status=...&pole=...&owner=...&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/search/recent`

Payload type:
`{ query, sections:[{ section, items:[{ id,type,title,snippet,url,score,meta }] }], total }`

## Ajouter un nouveau type indexé
Dans `app/services/global_search_service.rb`, ajouter une entrée dans `TYPE_CONFIG` avec:
- `model`, `table`, `title_sql`, `content_sql`
- `url`, `meta`, `filters`

## Perf
- Full-text weighted (`A` titre, `B` contenu)
- Trigram similarity si `pg_trgm` disponible, fallback ILIKE/tsquery
- Limite globale + limite par type
- Index trigram via migration `20260224235000_add_global_search_indexes.rb`
