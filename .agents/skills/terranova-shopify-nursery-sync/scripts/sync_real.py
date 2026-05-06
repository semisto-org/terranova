#!/usr/bin/env python3
"""Real sync execution. Creates containers, species, varieties, stock_batches in order."""
import json
import re
import os
import sys
import time
from urllib import request, error

API = "https://terranova.semisto.org"
KEY = os.environ["KNOWLEDGE_API_KEY"]
NURSERY_ID = "2"
NURSERY_NAME = "Arbuste Fruitier"
SHOPIFY_HOST = "arbustefruitier.com"
CONTRIBUTOR_ID = 1  # Nova

UA_HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "User-Agent": "terranova-sync/1.0 (+terranova-shopify-nursery-sync)",
    "Accept": "application/json",
}

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
    parts = latin.split()
    if not parts:
        return latin
    out = [parts[0].capitalize()]
    for p in parts[1:]:
        if p in ("x", "X", "×"):
            out.append("x")
        elif len(p) > 1 and p[0].isupper() and p[1:].islower():
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
        prefix = "Pot profond" if deep else "Pot"
        return {"name": f"{prefix} de {volume:g}L", "short_name": f"{volume:g}L{' prof.' if deep else ''}", "volume_liters": volume}
    if GODET_RE.match(t):
        return {"name": "Godet", "short_name": "Godet", "volume_liters": 0.3}
    if RACINE_NUE_RE.match(t):
        return {"name": "Racine nue", "short_name": "RN", "volume_liters": 0.0}
    m = TIGE_RACINE_RE.match(t)
    if m:
        tige = m.group("tige").capitalize()
        return {"name": f"{tige}-tige / Racine nue", "short_name": f"{tige[0]}T-RN", "volume_liters": 0.0}
    return None


def get_json(url):
    req = request.Request(url, headers=UA_HEADERS)
    with request.urlopen(req, timeout=20) as r:
        return json.load(r)


def post_json(url, body, expect_201=False):
    data = json.dumps(body).encode("utf-8")
    headers = dict(UA_HEADERS)
    headers["Content-Type"] = "application/json"
    req = request.Request(url, data=data, headers=headers, method="POST")
    try:
        with request.urlopen(req, timeout=30) as r:
            return r.status, json.load(r)
    except error.HTTPError as e:
        body_txt = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"HTTP {e.code} on POST {url} body={body!r} -> {body_txt}") from e


# ====== Phase 0: load inputs ======
print("[0/4] Loading inputs and refreshing snapshots...", flush=True)
with open("/tmp/shopify-products.json") as f:
    shopify = json.load(f)["products"]

# Re-fetch fresh snapshot of containers, genera, species
ny_payload = get_json(f"{API}/api/v1/nursery?nursery_id={NURSERY_ID}")
containers = ny_payload.get("containers", [])
existing_batches = {
    b["origin"]: b for b in ny_payload.get("stockBatches", [])
    if b["nurseryId"] == NURSERY_ID and (b.get("origin") or "").startswith("shopify-variant:")
}
genera = get_json(f"{API}/api/v1/plants/genera")["items"]
species_list = get_json(f"{API}/api/v1/plants/species")["items"]
genus_by_latin = {g["latinName"].lower(): g for g in genera}
species_by_latin = {s["latinName"].lower(): s for s in species_list}
container_by_name = {c["name"]: c for c in containers}
print(f"  containers: {len(containers)}, genera: {len(genera)}, species: {len(species_list)}, existing batches: {len(existing_batches)}", flush=True)

# Variety cache: species_id -> {variety_name_lower: variety_obj_with_smallest_id}
variety_cache = {}


def fetch_varieties_for_species(sid):
    if sid in variety_cache:
        return variety_cache[sid]
    detail = get_json(f"{API}/api/v1/plants/species/{sid}")
    by_name = {}
    for v in (detail.get("varieties") or []):
        key = v["latinName"].lower().strip()
        existing = by_name.get(key)
        if existing is None or int(v["id"]) < int(existing["id"]):
            by_name[key] = v
    variety_cache[sid] = by_name
    return by_name


# ====== Phase 1: parse all titles, build plan ======
print("[1/4] Parsing all Shopify titles and planning...", flush=True)
parsing_errors = []
plan = []  # one entry per variant
unique_containers_needed = {}
unique_species_to_create = {}  # latin -> {common, genus}
unique_varieties_to_create = {}  # (species_latin, variety_name) -> {common, species_id_now_or_NEW}

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

    # Lookup species
    sp_match = species_by_latin.get(latin.lower())
    if not sp_match and latin not in unique_species_to_create:
        genus_latin = latin.split()[0]
        unique_species_to_create[latin] = {"common": common, "genus": genus_latin}

    # Lookup variety (only if species exists in DB; for new species, mark for creation)
    var_match = None
    if variety_name:
        if sp_match:
            vmap = fetch_varieties_for_species(sp_match["id"])
            var_match = vmap.get(variety_name.lower())
        if not var_match:
            key = (latin, variety_name)
            if key not in unique_varieties_to_create:
                unique_varieties_to_create[key] = {"common": common}

    for variant in product["variants"]:
        vt = variant["title"]
        c_parsed = parse_container(vt)
        if c_parsed and c_parsed["name"] not in container_by_name and c_parsed["name"] not in unique_containers_needed:
            unique_containers_needed[c_parsed["name"]] = c_parsed

        plan.append({
            "title": title,
            "handle": handle,
            "variant_id": variant["id"],
            "variant_title": vt,
            "available": variant["available"],
            "price_str": variant["price"],
            "latin": latin,
            "variety_name": variety_name,
            "common": common,
            "sp_match_id": sp_match["id"] if sp_match else None,
            "var_match_id": var_match["id"] if var_match else None,
            "container_parsed": c_parsed,
        })

print(f"  parsed: {len(plan)} variants, errors: {len(parsing_errors)}", flush=True)
print(f"  to create: {len(unique_containers_needed)} containers, {len(unique_species_to_create)} species, {len(unique_varieties_to_create)} varieties", flush=True)

# ====== Phase 2: create containers ======
print(f"[2/4] Creating {len(unique_containers_needed)} containers...", flush=True)
for name, c in unique_containers_needed.items():
    body = {"name": c["name"], "short_name": c["short_name"], "volume_liters": c["volume_liters"]}
    status, resp = post_json(f"{API}/api/v1/nursery/containers", body)
    container_by_name[name] = resp
    print(f"  + container '{name}' id={resp.get('id')}", flush=True)

# ====== Phase 3: create species (and genera if missing) ======
print(f"[3/4a] Creating {len(unique_species_to_create)} species...", flush=True)
newly_created_species_ids = []
for latin, info in unique_species_to_create.items():
    genus_latin = info["genus"]
    g_match = genus_by_latin.get(genus_latin.lower())
    if not g_match:
        # create genus
        status, gresp = post_json(f"{API}/api/v1/plants/genera", {"latin_name": genus_latin, "contributor_id": CONTRIBUTOR_ID})
        g_match = gresp
        genus_by_latin[genus_latin.lower()] = gresp
        print(f"  + genus '{genus_latin}' id={gresp.get('id')}", flush=True)
    # Heuristic plant_type from common name (will be refined by terranova-update-species later)
    common_lower = info["common"].lower()
    if any(w in common_lower for w in ["kiwa", "vigne", "liane", "chèvrefeuille", "akebia"]):
        plant_type = "climber"
    elif "fraise" in common_lower and "arbuste" not in common_lower:
        plant_type = "herbaceous"
    elif any(w in common_lower for w in ["pommier", "cerisier", "poirier", "prunier", "mûrier", "noyer",
                                          "tilleul", "châtaignier", "asiminier", "kaki", "figuier",
                                          "amélanchier", "aubépine", "sorbier", "pluot", "noisetier",
                                          "pêcher", "abricotier", "néflier", "cognassier"]):
        plant_type = "tree"
    else:
        plant_type = "shrub"
    body = {
        "genus_id": int(g_match["id"]),
        "latin_name": latin,
        "plant_type": plant_type,
        "common_names": [{"language": "fr", "name": info["common"]}],
        "contributor_id": CONTRIBUTOR_ID,
    }
    status, resp = post_json(f"{API}/api/v1/plants/species", body)
    sp = resp.get("species") or resp
    species_by_latin[latin.lower()] = sp
    newly_created_species_ids.append(sp["id"])
    print(f"  + species '{latin}' id={sp.get('id')}", flush=True)

# Now resolve sp_match_id for plan entries that depended on new species
for p in plan:
    if p["sp_match_id"] is None:
        sp = species_by_latin.get(p["latin"].lower())
        if sp:
            p["sp_match_id"] = sp["id"]

# ====== Phase 3b: create varieties ======
print(f"[3/4b] Creating {len(unique_varieties_to_create)} varieties...", flush=True)
newly_created_variety_ids = []
created_variety_keys = {}  # (species_id, variety_name_lower) -> variety_obj
for (species_latin, variety_name), info in unique_varieties_to_create.items():
    sp = species_by_latin.get(species_latin.lower())
    if not sp:
        print(f"  ! cannot create variety '{variety_name}' — species '{species_latin}' missing", flush=True)
        continue
    # Variety latinName uses just the variety short name (per Plant DB convention)
    body = {
        "species_id": int(sp["id"]),
        "latin_name": variety_name,
        "common_names": [{"language": "fr", "name": f"{info['common']} '{variety_name}'"}],
        "contributor_id": CONTRIBUTOR_ID,
    }
    status, resp = post_json(f"{API}/api/v1/plants/varieties", body)
    var_obj = resp
    created_variety_keys[(sp["id"], variety_name.lower())] = var_obj
    if status == 201:
        newly_created_variety_ids.append(var_obj["id"])
        print(f"  + variety '{species_latin} {variety_name!r}' id={var_obj.get('id')}", flush=True)
    else:
        print(f"  = variety '{species_latin} {variety_name!r}' already existed (id={var_obj.get('id')})", flush=True)

# Resolve var_match_id for plan
for p in plan:
    if p["variety_name"] and p["var_match_id"] is None:
        sp_id = p["sp_match_id"]
        if sp_id:
            key = (sp_id, p["variety_name"].lower())
            v = created_variety_keys.get(key)
            if v:
                p["var_match_id"] = v["id"]
            else:
                # may be already in variety_cache from earlier match attempt
                vmap = variety_cache.get(sp_id)
                if vmap:
                    vm = vmap.get(p["variety_name"].lower())
                    if vm:
                        p["var_match_id"] = vm["id"]

# ====== Phase 4: create stock batches ======
print(f"[4/4] Creating {len(plan)} stock batches...", flush=True)
created_count = 0
skipped_existing = 0
errors = []
for p in plan:
    origin = f"shopify-variant:{p['variant_id']}"
    if origin in existing_batches:
        skipped_existing += 1
        continue
    if p["sp_match_id"] is None:
        errors.append({"reason": "species missing", "variant": p})
        continue
    container = container_by_name.get(p["container_parsed"]["name"]) if p["container_parsed"] else None
    available = bool(p["available"])
    body = {
        "nursery_id": int(NURSERY_ID),
        "species_id": int(p["sp_match_id"]),
        "variety_id": int(p["var_match_id"]) if p["var_match_id"] else None,
        "container_id": int(container["id"]) if container else None,
        "quantity": 1,
        "available_quantity": 1 if available else 0,
        "reserved_quantity": 0,
        "status": "available" if available else "sold_out",
        "growth_stage": "established",
        "price_euros": float(p["price_str"]),
        "accepts_semos": False,
        "origin": origin,
        "notes": f"https://{SHOPIFY_HOST}/products/{p['handle']}",
    }
    try:
        status, resp = post_json(f"{API}/api/v1/nursery/stock-batches", body)
        created_count += 1
        if created_count % 20 == 0:
            print(f"  ... {created_count}/{len(plan)} batches created", flush=True)
    except Exception as e:
        errors.append({"reason": str(e), "variant": p})
        print(f"  ! error on '{p['title']}' / {p['variant_title']}: {e}", flush=True)

print()
print("=" * 78)
print(f"## Sync Arbuste Fruitier — RUN RÉEL — terminé")
print("=" * 78)
print(f"- Containers créés : {len(unique_containers_needed)}")
print(f"- Espèces créées : {len(unique_species_to_create)} (ids: {newly_created_species_ids})")
print(f"- Variétés créées : {len(newly_created_variety_ids)} (ids: {newly_created_variety_ids[:30]}{'...' if len(newly_created_variety_ids) > 30 else ''})")
print(f"- Stock batches créés : {created_count}")
print(f"- Stock batches skippés (déjà existants) : {skipped_existing}")
print(f"- Erreurs : {len(errors)}")
print()
if errors:
    print("### Erreurs détaillées")
    for e in errors[:20]:
        print(f"- {e['reason']} | {e['variant']['title']} / {e['variant']['variant_title']}")
    if len(errors) > 20:
        print(f"... +{len(errors) - 20} autres")
print()
if parsing_errors:
    print(f"### Titres ignorés (non parsables, {len(parsing_errors)})")
    for pe in parsing_errors:
        print(f"- {pe['title']} (handle: {pe['handle']})")
print()
if newly_created_species_ids or newly_created_variety_ids:
    print("### Pour enrichir les brouillons via terranova-update-species")
    if newly_created_species_ids:
        print(f"  Espèces : ids {','.join(map(str, newly_created_species_ids))}")
    if newly_created_variety_ids:
        print(f"  Variétés : ids {','.join(map(str, newly_created_variety_ids))}")
