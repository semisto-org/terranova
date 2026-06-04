module Design
  # Définition canonique de la méthodologie Semisto de conception de forêts comestibles
  # (Design Checklist, v. 01/12/2025). Donnée de RÉFÉRENCE versionnée dans le code, pas en base :
  # la checklist évolue par PR, pas par opérations data. L'état par projet vit dans
  # `Design::MethodologyItem`. Le module sert l'arbre, la boîte à outils permacole et les références.
  #
  # node_key = chemin : "<etape>" | "<etape>/<sous-section>" | "<etape>/<sous-section>/<item>".
  module Methodology
    module_function

    # Version de la checklist (cf. PDF « Design Checklist, v. 01/12/2025 »).
    # Exposée dans le payload API pour que frontend/Nova détectent une dérive de définition.
    # RÈGLE DE STABILITÉ : les `key` sont des identifiants PERMANENTS. On n'en renomme jamais
    # (sinon les lignes `design_methodology_items` existantes deviennent invalides en silence) —
    # on ajoute ou on déprécie. Tout changement de l'ensemble des clés doit être un diff délibéré
    # (cf. test `flat_node_keys` figé) et s'accompagne d'un bump de VERSION.
    VERSION = '2025-12-01'.freeze

    # Les 6 étapes, dans l'ordre méthodologique impératif.
    def tree
      @tree ||= [
        {
          key: 'observation', label: 'Observation', sub_sections: [
            { key: 'promenade-sensible', label: 'Promenade sensible', tool: 'album', items: [
              { key: 'prise-de-contact', label: 'Prise de contact informelle avec le terrain et les porteurs' },
              { key: 'prise-de-notes', label: 'Prise de notes subjectives' },
              { key: 'captation', label: 'Photos / vidéos / enregistrement du déplacement' }
            ] },
            { key: 'entrevue', label: 'Entrevue', items: [
              { key: 'notes-spontanees', label: 'Notes spontanées' },
              { key: 'questionnaire', label: 'Questionnaire porteur' },
              { key: 'enregistrement', label: "Enregistrement audio de l'entrevue" }
            ] },
            { key: 'releve', label: 'Relevé', items: [
              { key: 'plan-subjectif', label: 'Plan subjectif' },
              { key: 'notes', label: 'Notes' },
              { key: 'photos-videos', label: 'Photos et vidéos' },
              { key: 'analyse-de-sol', label: 'Analyse de sol (! polluants)' }
            ] }
          ]
        },
        {
          key: 'analyse-evaluation', label: 'Analyse-évaluation', sub_sections: [
            { key: 'tri-des-donnees', label: 'Tri des données', items: [
              { key: 'porteur', label: 'Porteur' },
              { key: 'projet', label: 'Projet' },
              { key: 'ecosysteme', label: 'Écosystème' }
            ] },
            { key: 'cartographie-du-site', label: 'Cartographie du site', tool: 'site-analysis', items: [
              { key: 'elements-secteurs', label: 'Éléments du site / secteurs (échelle de permanence)' },
              { key: 'zones-actuelles', label: 'Zones actuelles' }
            ] },
            { key: 'biome', label: 'Biome', tool: 'site-analysis', items: [
              { key: 'climat-rusticite', label: 'Climat / zone de rusticité' },
              { key: 'succession-ecologique', label: 'Succession écologique (espèces clés)' },
              { key: 'sous-sol', label: 'Sous-sol' }
            ] },
            { key: 'echelle-de-temps', label: 'Échelle de temps', items: [
              { key: 'historique', label: 'Historique' },
              { key: 'planning-porteurs', label: 'Planning des porteurs (design / mise en œuvre / maintenance)' }
            ] },
            { key: 'ressources-facteurs-limitants', label: 'Ressources / Facteurs limitants', items: [
              { key: 'temps', label: 'Temps' },
              { key: 'argent', label: 'Argent' },
              { key: 'ressources-humaines', label: 'Ressources humaines' },
              { key: 'matieres', label: 'Matières disponibles sur site / hors site' }
            ] },
            { key: 'systemique-en-place', label: 'Systémique en place', items: [
              { key: 'fleur-permaculturelle', label: 'Fleur permaculturelle' },
              { key: 'carte-mentale', label: 'Carte mentale' }
            ] }
          ]
        },
        {
          key: 'positionnement', label: 'Positionnement du projet', sub_sections: [
            { key: 'analyse-fonctionnelle', label: 'Analyse fonctionnelle', items: [
              { key: 'besoins', label: 'Besoins' },
              { key: 'fonctions-cle', label: 'Fonctions-clé et productions' }
            ] },
            { key: 'positionnement-ecosysteme', label: "Positionnement dans l'écosystème", items: [
              { key: 'raison-d-etre', label: "Raison d'être" },
              { key: 'fil-conducteur', label: 'Fil conducteur' }
            ] },
            { key: 'positionnement-contraintes', label: 'Positionnement / contraintes', items: [
              { key: 'echelle', label: "D'échelle (socio-technique)" },
              { key: 'milieu', label: 'Du milieu (pédo-climatique)' },
              { key: 'productives', label: 'Productives' },
              { key: 'fonctionnelles', label: 'Fonctionnelles (mise en œuvre)' }
            ] },
            { key: 'strategies', label: 'Stratégies', items: [
              { key: 'logique-d-action', label: "Logique d'action" }
            ] }
          ]
        },
        {
          key: 'design', label: 'Design', sub_sections: [
            { key: 'reve-brainstorming', label: 'Rêve et brainstorming', items: [
              { key: 'no-limit', label: 'No limit' },
              { key: 'projection', label: 'Projection à 10-15 ans' }
            ] },
            { key: 'design-fonctionnel', label: 'Design fonctionnel', items: [
              { key: 'elements-fonctions', label: 'Éléments distribués sur les fonctions et sous-fonctions' }
            ] },
            { key: 'construire-solutions', label: 'Construire les solutions', items: [
              { key: 'echelle-permanence', label: 'Échelle de permanence' },
              { key: 'principes', label: 'Principes' },
              { key: 'fleur-permaculturelle', label: 'Fleur permaculturelle' }
            ] },
            { key: 'secteurs-zones-bordures', label: 'Secteurs / zones / bordures', tool: 'site-analysis', items: [
              { key: 'flux', label: 'Flux internes et externes (humains, animaux, récoltes, financiers, eau)' },
              { key: 'cycles', label: 'Cycles (énergie, eau, carbone/azote)' }
            ] },
            { key: 'integrer-optimiser', label: 'Intégrer / patterns / optimiser', items: [
              { key: 'elements-importants', label: 'Éléments importants' },
              { key: 'elements-secondaires', label: 'Éléments secondaires' },
              { key: 'esthetique', label: 'Esthétique' }
            ] },
            { key: 'renforcement-systemique', label: 'Renforcement (éco)systémique', items: [
              { key: 'proteger-reguler', label: 'Protéger, réguler' },
              { key: 'agrader', label: 'Agrader (eau, sol, biodiversité)' },
              { key: 'combiner', label: 'Combiner (productions, fonctions)' },
              { key: 'entretenir', label: 'Entretenir (accès, outils)' }
            ] },
            { key: 'evaluer-options', label: 'Évaluer les options', items: [
              { key: 'biosourcees', label: 'Biosourcées (naturelles, renouvelables, locales, low-tech)' },
              { key: 'interactions', label: 'Interactions systémiques (résilience, robustesse)' }
            ] },
            { key: 'plans-modelisation', label: 'Plans et modélisation', tool: 'planting-plan', items: [
              { key: 'spatial', label: 'Spatial' },
              { key: 'logique', label: 'Logique' },
              { key: 'chronologique', label: 'Chronologique / stratégies' },
              { key: 'moodboard', label: 'Moodboard' },
              { key: 'financier', label: 'Financier' }
            ] },
            { key: 'selection-palette', label: 'Sélection de la palette végétale', tool: 'palette', items: [
              { key: 'diversification', label: 'Diversification raisonnée (morphologie, saisonnalité, redondance, rationalité)' },
              { key: 'evaluation-plants', label: 'Évaluation nb de plants / volume de production (court & long terme)' }
            ] }
          ]
        },
        {
          key: 'mise-en-oeuvre-maintenance', label: 'Mise en œuvre et maintenance', sub_sections: [
            { key: 'phaser', label: 'Phaser', items: [
              { key: 'echelle-permanence', label: 'Échelle de permanence' },
              { key: 'strategies-succession', label: 'Stratégies de succession (tout-en-une-fois / successionnelle / incrémentielle)' },
              { key: 'productions-combinees', label: 'Productions combinées (canopée ouverte / intermédiaire / mature)' }
            ] },
            { key: 'gestion-du-projet', label: 'Gestion du projet', tool: 'tasks', items: [
              { key: 'gouvernance', label: 'Gouvernance' },
              { key: 'planning', label: 'Planning' },
              { key: 'communication', label: 'Communication' },
              { key: 'budget', label: "Budget (achats, main d'œuvre, autoproduction de plants)" },
              { key: 'entretien', label: 'Entretien (STUN, taille, récolte)' }
            ] }
          ]
        },
        {
          key: 'evolution', label: 'Évolution', sub_sections: [
            { key: 'observation-retroaction', label: 'Observation', tool: 'co-gestion', items: [
              { key: 'boucles-retroaction', label: 'Boucles de rétroaction' }
            ] },
            { key: 'visualisation', label: 'Visualisation', tool: 'co-gestion', items: [
              { key: 'impacts', label: 'Impacts à moyen et long terme' }
            ] },
            { key: 'anticipation', label: 'Anticipation', items: [
              { key: 'adaptation', label: 'Adaptation (agilité, re-design)' }
            ] },
            { key: 'accelerer-processus', label: 'Accélérer les processus', items: [
              { key: 'redesign', label: 'Redesign écosystémique' },
              { key: 'upscaling', label: 'Upscaling' }
            ] }
          ]
        }
      ]
    end

    def steps
      tree
    end

    # Toutes les clés valides : étapes + sous-sections + items.
    def flat_node_keys
      @flat_node_keys ||= begin
        keys = []
        tree.each do |step|
          keys << step[:key]
          Array(step[:sub_sections]).each do |sub|
            keys << "#{step[:key]}/#{sub[:key]}"
            Array(sub[:items]).each do |item|
              keys << "#{step[:key]}/#{sub[:key]}/#{item[:key]}"
            end
          end
        end
        keys.freeze
      end
    end

    def valid_node_key?(key)
      flat_node_keys.include?(key.to_s)
    end

    # Clés de feuilles (items) uniquement — base de l'avancement. Distinct de `flat_node_keys`
    # (qui inclut étapes + sous-sections pour la validation). Seules les feuilles comptent dans `total`.
    def countable_node_keys
      @countable_node_keys ||= tree.flat_map { |step| leaf_keys_for_step(step[:key]) }.freeze
    end

    # Clé d'étape de tête d'un node_key ("observation/releve" → "observation").
    def step_for(node_key)
      node_key.to_s.split('/').first
    end

    # Nombre d'items (feuilles) par étape — base du calcul d'avancement.
    def leaf_counts_by_step
      @leaf_counts_by_step ||= tree.each_with_object({}) do |step, acc|
        acc[step[:key]] = Array(step[:sub_sections]).sum { |sub| Array(sub[:items]).size }
      end.freeze
    end

    # Liste des node_keys de feuilles (items) d'une étape donnée.
    def leaf_keys_for_step(step_key)
      step = tree.find { |s| s[:key] == step_key }
      return [] unless step

      Array(step[:sub_sections]).flat_map do |sub|
        Array(sub[:items]).map { |item| "#{step_key}/#{sub[:key]}/#{item[:key]}" }
      end
    end

    # Boîte à outils permacole (référentiels statiques) — consommée par le panneau frontend.
    TOOLBOX = {
      fleur_permaculturelle: [
        'Terre & nature', 'Habitat & construction', 'Outils & technologie',
        'Culture & éducation', 'Santé & spiritualité', 'Finance & économie', 'Patrimoine & communauté'
      ],
      echelle_de_permanence: [
        '(Climat et) microclimats', 'Relief', 'Eau', 'Accès / impétrants',
        'Structures', 'Plantations', 'Parcelles / animaux', 'Sol'
      ],
      carte_secteurs: [
        'Ensoleillement', 'Vent', 'Pente', 'Faune', 'Vues / intimité', 'Nuisances', 'Pollutions'
      ],
      carte_zones: ['Zone 00', 'Zone 0', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
      principes_mollison: [
        "Prévoir l'efficacité énergétique", 'Relativiser en fonction du lieu',
        "Créer la circulation d'énergie", "Utiliser l'effet de bordure",
        'Chaque élément doit avoir plusieurs fonctions', 'Chaque fonction est remplie par plusieurs éléments',
        'Travailler avec la nature plutôt que contre elle',
        'Faire le plus petit effort pour le plus grand changement', 'Le problème est la solution'
      ],
      principes_holmgren: [
        'Observer et interagir', "Capter et stocker l'énergie", 'Obtenir une production',
        "Appliquer l'autorégulation et accepter la rétroaction",
        'Utiliser et valoriser des ressources et services renouvelables', 'Ne pas produire de déchets',
        "Partir des structures d'ensemble pour arriver aux détails", 'Intégrer au lieu de séparer',
        'Utiliser des solutions à petite échelle avec patience', 'Utiliser et valoriser la diversité',
        'Utiliser les interfaces et valoriser les bordures',
        'Utiliser le changement et y réagir de manière créative'
      ],
      contraintes: {
        socio_techniques: [
          'Échelle : petite … grande', 'Modèle économique : autonomie … commercial',
          'Outils & technologie : low … high tech', 'Historique : vierge … planté', 'Santé : pro … anti-bio'
        ],
        environnementales: ['Sol', 'Climat', 'Exposition', 'Semences', 'Pollutions', 'Législation'],
        fonctionnelles: [
          'Santé des cultures / taille', 'Récoltes', 'Planification', 'Plantation',
          'Accès', 'Eau', 'Transmissions', "Soin à l'écosystème"
        ],
        productives: [
          'Alimentation (verger, maraîchage, champignons, élevage, aromatique, médicinal)',
          "Artisanat (tinctoriale, bois d'œuvre, vannerie)",
          "Support (biomasse, fixateur d'azote, mellifère)", 'Bien-être (ornemental)', 'Pépinière'
        ]
      },
      stun: 'STUN (Mark Shepard) — Sheer, Total, Utter Negligence : négligence pure, totale et absolue.'
    }.freeze

    # Références externes contextualisables par étape.
    REFERENCES = {
      sites: [
        { label: 'Géoportail de Wallonie', url: 'https://geoportail.wallonie.be/walonmap' },
        { label: 'Inondations Wallonie', url: 'https://inondations.wallonie.be/accueil.html' },
        { label: 'Fichier des essences écologiques', url: 'https://www.fichierecologique.be' },
        { label: 'IRM — climat communal', url: 'https://www.meteo.be/fr/climat/climat-de-la-belgique/climat-dans-votre-commune' },
        { label: 'ShadeMap', url: 'https://shademap.app' },
        { label: 'SunEarthTools', url: 'https://www.sunearthtools.com/' },
        { label: 'PFAF', url: 'https://pfaf.org' },
        { label: 'Plantes Semisto', url: 'https://plantes.semisto.org' }
      ],
      apps: [
        { label: 'Strava', usage: 'Déplacement GPS' },
        { label: 'Sun Seeker', usage: 'Course du soleil' },
        { label: 'Seek / PlantNet / Flora Incognita', usage: 'Reconnaissance des plantes' },
        { label: 'Spyglass', usage: 'Pentes' },
        { label: 'Dictaphone', usage: 'Enregistrement entrevue' }
      ]
    }.freeze
  end
end
