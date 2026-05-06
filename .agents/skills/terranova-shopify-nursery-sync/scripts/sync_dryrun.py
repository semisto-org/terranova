#!/usr/bin/env python3
"""Dry-run analysis for Arbuste Fruitier sync. v2 with relaxed parsers."""
import json
import re
import os
from urllib import request

API = "https://terranova.semisto.org"
KEY = os.environ["KNOWLEDGE_API_KEY"]
NURSERY_ID = "2"
NURSERY_NAME = "Arbuste Fruitier"
SHOPIFY_HOST = "arbustefruitier.com"

# Genus + (epithet | hybrid marker | other genus){1..4}
TITLE_RE = re.compile(
    r"^(?P<common>.+?)"
    r"(?:\s+['‘’]\s*(?P<variety>[^'‘’]+?)\s*['‘’])?"
    r"\s*-\s*(?P<latin>[A-Z][a-z]+(?:\s+(?:[a-z\-]+|[xX×]|[A-Z][a-z]+)){1,4})\s*$"
)

POT_RE = re.compile(r"^Pot(?P<deep>\s+profond)?\s+de\s+(?P<vol>\d+(?:[.,]\d+)?)\s*L$", re.IGNORECASE)
GODET_RE = re.compile(r"^Godet$", re.IGNORECASE)
RACINE_NUE_RE = re.compile(r"^Racine\s+nue(?:\s*/\s*Plant\s+de.*)?$", re.IGNORECASE)
TIGE_RACINE_RE = re.compile(r"^(?P<tige>Basse|Demi|Haute)-tige\s*/\s*Racine\s+nue$", re.IGNORECASE)


def normalize_latin(latin):
    """Title-case the latin name correctly: Genus species (lowercase epithets, except Capitalized hybrid parent)."""
    parts = latin.split()
    if not parts:
        return latin
    out = [parts[0].capitalize()]
    for p in parts[1:]:
        if p in ("x", "X", "×"):
            out.append("x")
        elif len(p) > 1 and p[0].isupper() and p[1:].islower():
            # Likely intergeneric hybrid parent (e.g. "Sorbaronia")
            out.append(p)
        else:
            out.append(p.lower())
    return " ".join(out)


def parse_title(title):
    m = TITLE_RE.match(title.strip())
    if not m:
        return None
    return {
        "common": m.group("common").strip(),
        "variety": (m.group("variety") or "").strip() or None,
        "latin": normalize_latin(m.group("latin").strip()),
    }


def parse_container(variant_title):
    t = variant_title.strip()
    m = POT_RE.match(t)
    if m:
        deep = bool(m.group("deep"))
        volume = float(m.group("vol").replace(",", "."))
        suffix = " prof." if deep else ""
        prefix = "Pot profond" if deep else "Pot"
        return {
            "name": f"{prefix} de {volume:g}L",
            "short_name": f"{volume:g}L{suffix}",
            "volume_liters": volume,
        }
    if GODET_RE.match(t):
        return {"name": "Godet", "short_name": "Godet", "volume_liters": 0.3}
    if RACINE_NUE_RE.match(t):
        return {"name": "Racine nue", "short_name": "RN", "volume_liters": 0.0}
    m = TIGE_RACINE_RE.match(t)
    if m:
        tige = m.group("tige").capitalize()
        return {
            "name": f"{tige}-tige / Racine nue",
            "short_name": f"{tige[0]}T-RN",
            "volume_liters": 0.0,
        }
    return None


def get_json(url):
    req = request.Request(url, headers={
        "Authorization": f"Bearer {KEY}",
        "User-Agent": "terranova-sync/1.0 (+terranova-shopify-nursery-sync)",
        "Accept": "application/json",
    })
    with request.urlopen(req, timeout=20) as r:
        return json.load(r)


# Load inputs
with open("/tmp/shopify-products.json") as f:
    shopify = json.load(f)["products"]
with open("/tmp/terranova-snapshot.json") as f:
    snap = json.load(f)
with open("/tmp/tn-genera.json") as f:
    genera = json.load(f)["items"]
with open("/tmp/tn-species.json") as f:
    species_list = json.load(f)["items"]

genus_by_latin = {g["latinName"].lower(): g for g in genera}
species_by_latin = {s["latinName"].lower(): s for s in species_list}
variety_cache = {}  # species_id -> {variety_name_lower: smallest_id_variety_obj}


def fetch_varieties_for_species(species_id):
    if species_id in variety_cache:
        return variety_cache[species_id]
    detail = get_json(f"{API}/api/v1/plants/species/{species_id}")
    by_name = {}
    for v in (detail.get("varieties") or []):
        key = v["latinName"].lower().strip()
        existing = by_name.get(key)
        # Pick smallest id when duplicates
        if existing is None or int(v["id"]) < int(existing["id"]):
            by_name[key] = v
    variety_cache[species_id] = by_name
    return by_name


existing_batches = {
    b["origin"]: b
    for b in snap["stockBatches"]
    if b["nurseryId"] == NURSERY_ID and (b.get("origin") or "").startswith("shopify-variant:")
}

parsing_errors = []
container_errors = []
unique_containers_needed = {}
species_to_create = []  # [{latin, common, genus}]
genera_to_create = set()
varieties_to_create = []  # [{species_latin, variety_name, common, species_id_or_NEW}]
planned_batches = []

# Avoid duplicates in to_create lists
species_create_keys = set()
variety_create_keys = set()

for product in shopify:
    title = product["title"]
    handle = product["handle"]
    parsed = parse_title(title)
    if not parsed:
        parsing_errors.append({"title": title, "handle": handle})
        continue
    latin = parsed["latin"]
    variety_name = parsed["variety"]
    common = parsed["common"]
    genus_latin = latin.split()[0]

    species_match = species_by_latin.get(latin.lower())
    if species_match:
        species_status = {"action": "match", "id": species_match["id"]}
    else:
        if latin not in species_create_keys:
            species_create_keys.add(latin)
            if genus_latin.lower() not in genus_by_latin:
                genera_to_create.add(genus_latin)
            species_to_create.append({"latin": latin, "common": common, "genus": genus_latin})
        species_status = {"action": "create", "id": "NEW"}

    variety_status = None
    if variety_name:
        if species_match:
            try:
                vmap = fetch_varieties_for_species(species_match["id"])
                vmatch = vmap.get(variety_name.lower())
                if vmatch:
                    variety_status = {"action": "match", "id": vmatch["id"]}
                else:
                    key = (latin, variety_name)
                    if key not in variety_create_keys:
                        variety_create_keys.add(key)
                        varieties_to_create.append({
                            "species_latin": latin, "variety_name": variety_name,
                            "common": common, "species_id": species_match["id"],
                        })
                    variety_status = {"action": "create", "id": "NEW"}
            except Exception as e:
                # Surface lookup errors loudly so they don't silently degrade results
                print(f"!! variety lookup failed for species {species_match['id']} ({latin}): {e}", flush=True)
                variety_status = {"action": "error", "msg": str(e)}
        else:
            key = (latin, variety_name)
            if key not in variety_create_keys:
                variety_create_keys.add(key)
                varieties_to_create.append({
                    "species_latin": latin, "variety_name": variety_name,
                    "common": common, "species_id": "NEW",
                })
            variety_status = {"action": "create", "id": "NEW"}

    for variant in product["variants"]:
        v_title = variant["title"]
        c_parsed = parse_container(v_title)
        if c_parsed is None:
            container_errors.append({"product": title, "variant_title": v_title})
            container_action = "null"
        else:
            unique_containers_needed.setdefault(c_parsed["name"], c_parsed)
            container_action = "create"

        origin = f"shopify-variant:{variant['id']}"
        existing = existing_batches.get(origin)
        action = "create" if existing is None else "update_check"
        planned_batches.append({
            "origin": origin,
            "title": title,
            "handle": handle,
            "variant_title": v_title,
            "available": variant["available"],
            "price": variant["price"],
            "species": species_status,
            "variety": variety_status,
            "container_name": c_parsed["name"] if c_parsed else None,
            "container_action": container_action,
            "action": action,
        })

shopify_variant_ids = {f"shopify-variant:{v['id']}" for p in shopify for v in p["variants"]}
orphans = [b for origin, b in existing_batches.items() if origin not in shopify_variant_ids]

# Stats
new_creates = sum(1 for p in planned_batches if p["action"] == "create")
matched_species = sum(1 for p in planned_batches if p["species"]["action"] == "match")
new_species_variants = sum(1 for p in planned_batches if p["species"]["action"] == "create")
matched_varieties = sum(1 for p in planned_batches if p["variety"] and p["variety"]["action"] == "match")
new_varieties_variants = sum(1 for p in planned_batches if p["variety"] and p["variety"]["action"] == "create")
no_container_count = sum(1 for p in planned_batches if p["container_name"] is None)

print("=" * 78)
print(f"## Sync Arbuste Fruitier — DRY RUN v2 — {len(shopify)} produits / {len(planned_batches)} variants")
print("=" * 78)
print()
print(f"**Pépinière** : {NURSERY_NAME} (id {NURSERY_ID}, integration=manual)")
print(f"**Source** : https://{SHOPIFY_HOST}/products.json")
print()
print("### Statistiques globales")
print(f"- Produits Shopify lus : **{len(shopify)}**")
print(f"- Variantes Shopify totales : **{len(planned_batches) + len(parsing_errors)}**  (parsing OK : {len(planned_batches)}, échecs : {len(parsing_errors)})")
print(f"- Stock batches existants pour cette pépinière : **{len(existing_batches)}**")
print(f"- Stock batches qui seraient **créés** : **{new_creates}**")
print(f"- Stock batches qui seraient **archivés** (orphelins) : **{len(orphans)}**")
print()
print("### Plant DB")
print(f"- Species **trouvés** : **{matched_species} variants** ({len(species_list) - len(species_to_create)} candidats en base)")
print(f"- Species **à créer** : **{new_species_variants} variants** = {len(species_to_create)} uniques")
print(f"- Genera à créer : **{len(genera_to_create)}**" + (f" → {sorted(genera_to_create)}" if genera_to_create else ""))
print(f"- Varieties **trouvés** : **{matched_varieties} variants**")
print(f"- Varieties **à créer** : **{new_varieties_variants} variants** = {len(varieties_to_create)} uniques")
print()
print(f"### Containers à auto-créer ({len(unique_containers_needed)})")
for name, p in sorted(unique_containers_needed.items(), key=lambda kv: (kv[1]["volume_liters"], kv[0])):
    print(f"- `{name}` short=`{p['short_name']}` vol={p['volume_liters']}L")
print()
print(f"### Variants sans container (resteront avec container_id=null) : **{no_container_count}**")
if container_errors:
    sample = container_errors[:5]
    for ce in sample:
        print(f"  - {ce['product']} / {ce['variant_title']}")
    if len(container_errors) > 5:
        print(f"  - ... +{len(container_errors) - 5} autres")
print()
if parsing_errors:
    print(f"### Titres NON parsables ({len(parsing_errors)})")
    for pe in parsing_errors:
        print(f"- {pe['title']}")
    print()
else:
    print("### Titres non parsables : 0 ✓")
    print()

print(f"### Espèces qui seraient créées ({len(species_to_create)})")
for s in species_to_create:
    print(f"- `{s['latin']}` (genus `{s['genus']}`, common `{s['common']}`)")
print()
print(f"### Variétés qui seraient créées ({len(varieties_to_create)})")
for v in varieties_to_create[:30]:
    print(f"- `{v['species_latin']} '{v['variety_name']}'`")
if len(varieties_to_create) > 30:
    print(f"- ... +{len(varieties_to_create) - 30} autres")
print()
print(f"### Échantillon de batches qui seraient créés (10/{new_creates})")
for p in planned_batches[:10]:
    s_info = "match" if p["species"]["action"] == "match" else "🆕"
    v_info = "—"
    if p["variety"]:
        v_info = "match" if p["variety"]["action"] == "match" else "🆕"
    cont = p["container_name"] or "(null)"
    print(f"- {p['title'][:55]:55} | {p['variant_title'][:25]:25} | sp={s_info} var={v_info} cont={cont}")
print()
print("=" * 78)
print(f"END DRY RUN v2 — aucune écriture. À créer en réel : {new_creates} batches, {len(species_to_create)} espèces, {len(varieties_to_create)} variétés, {len(unique_containers_needed)} containers, {len(genera_to_create)} genera.")
print("=" * 78)
