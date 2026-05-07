namespace :plants do
  desc 'Migrate legacy interests/ecosystem_needs/edible_parts/fragrance/fodder_qualities into the new card fields. Idempotent.'
  task migrate_legacy: :environment do
    interests_to_eco_provided = {
      'Mellifère'             => 'mellifere',
      "Fixation d'azote"      => 'nitrogen',
      'Engrais vert'          => 'nitrogen',
      'Brise-vent'            => 'windbreak',
      'Haie'                  => 'windbreak',
      'Haie champêtre'        => 'windbreak',
      'Haie défensive'        => 'windbreak',
      'Couvre-sol'            => 'ground-cover',
      'Tapissant'             => 'ground-cover',
      'Anti-érosion'          => 'erosion-control',
      'Insectes auxiliaires'  => 'beneficial-insects',
      'Oiseaux'               => 'birds',
      'Pollinisation'         => 'cross-pollination',
      'Ombrage'               => 'light-shade',
      'Effet désherbant'      => 'weed-suppression',
      'Régénération des sols' => 'organic-matter',
      'Matière organique'     => 'organic-matter',
      'Biomasse'              => 'organic-matter',
      'Minéraux'              => 'minerals'
    }.freeze

    interests_to_sensory = {
      'Ornemental'        => 'ornamental',
      'ornemental'        => 'ornamental',
      'ornamental'        => 'ornamental',
      'Fruits décoratifs' => 'ornamental',
      'Tinctorial'        => 'dye',
      'Teinture'          => 'dye',
      'Colorant'          => 'dye',
      'Odorant'           => 'fragrant',
      'Odoriférant'       => 'fragrant',
      'Aromatique'        => 'fragrant',
      'Parfum'            => 'fragrant',
      'Huile essentielle' => 'fragrant'
    }.freeze

    interests_resource_category = {
      'Médicinal'  => 'medicinal',
      'Aromatique' => 'aromatic'
    }.freeze

    interests_to_edible_part = {
      'Fruits comestibles'           => 'fruit',
      'Feuilles comestibles'         => 'leaf',
      'Feuilles comestibles cuites'  => 'leaf',
      'Jeunes feuilles'              => 'leaf',
      'Jeunes pousses comestibles'   => 'stem',
      'Fleurs comestibles'           => 'flower',
      'Graines comestibles'          => 'seed',
      'graines germées comestibles'  => 'seed',
      'Racine comestible'            => 'root',
      'tubercule comestible'         => 'root',
      'bulbe comestible'             => 'root',
      'Bourgeons comestibles'        => 'flower',
      'Tiges comestibles'            => 'stem',
      'Pétioles comestibles'         => 'stem',
      'Sève comestible'              => 'sap',
      'Ecorce comestible'            => 'bark'
    }.freeze

    interests_to_animal = {
      'Brouté par les animaux'     => 'browsed',
      'Picoré par les poules'      => 'pecked',
      'Alimentation des volailles' => 'pecked',
      'Fourrage'                   => 'browsed'
    }.freeze

    needs_to_eco_needed = {
      'Azote'                            => 'nitrogen',
      'Désherbage'                       => 'weed-suppression',
      'Matière organique'                => 'organic-matter',
      'Matière organique ++'             => 'organic-matter',
      'Minéraux'                         => 'minerals',
      "À l'abri du vent"                 => 'windbreak',
      'Pollinisation croisée'            => 'cross-pollination',
      'Anti-érosion (terme à clarifier)' => 'erosion-control',
      'Ombre légère'                     => 'light-shade'
    }.freeze

    edible_parts_fr_to_en = {
      'Fruits'         => 'fruit',
      'fruit'          => 'fruit',
      'Feuilles'       => 'leaf',
      'leaf'           => 'leaf',
      'Jeunes feuilles'=> 'leaf',
      'Fleurs'         => 'flower',
      'Bourgeons'      => 'flower',
      'Capitules'      => 'flower',
      'Graines germées'=> 'seed',
      'Grain'          => 'seed',
      'Racine'         => 'root',
      'Rhizomes'       => 'root',
      'Tubercule'      => 'root',
      'Bulbe'          => 'root',
      'Bulbilles'      => 'root',
      'Tige'           => 'stem',
      'Côtes'          => 'stem',
      'Pédoncules'     => 'stem',
      'Jeunes pousses' => 'stem',
      'Gousses'        => 'fruit'
    }.freeze

    fragrance_triggers = %w[light medium strong].freeze

    stats = Hash.new(0)

    Plant::Species.find_each do |s|
      original_provided = Array(s.eco_services_provided).sort
      original_needed   = Array(s.eco_services_needed).sort
      original_role     = s.successional_role
      original_parts    = s.resource_parts.is_a?(Hash) ? s.resource_parts : {}

      provided = Array(s.eco_services_provided).dup
      needed   = Array(s.eco_services_needed).dup
      role     = s.successional_role
      parts    = original_parts.transform_values { |v| v.dup }

      # interests → multiple maps
      Array(s.interests).each do |interest|
        # eco_services_provided
        if (eco = interests_to_eco_provided[interest])
          provided |= [eco]
        end

        # resource_parts.sensory
        if (sensory = interests_to_sensory[interest])
          parts['sensory'] = (Array(parts['sensory']) | [sensory]).sort
        end

        # resource category bucket presence
        if (cat = interests_resource_category[interest])
          parts[cat] ||= []
        end

        # resource_parts.edible via edible-interest map
        if (edible_part = interests_to_edible_part[interest])
          parts['edible'] = (Array(parts['edible']) | [edible_part]).sort
        end

        # resource_parts.animal
        if (animal = interests_to_animal[interest])
          parts['animal'] = (Array(parts['animal']) | [animal]).sort
        end

        # 'Arbre pionnier' → successional_role pioneer (no overwrite)
        role ||= 'pioneer' if interest == 'Arbre pionnier'
      end

      # ecosystem_needs → eco_services_needed (NOT provided)
      Array(s.ecosystem_needs).each do |need|
        if (eco = needs_to_eco_needed[need])
          needed |= [eco]
        end
      end

      # edible_parts column → resource_parts.edible (translate FR→EN, drop French pollution)
      existing_edible = Array(parts['edible']).select { |v| Plant::Species::PLANT_PARTS.include?(v) }
      translated      = Array(s.edible_parts).filter_map { |v| edible_parts_fr_to_en[v] }
      merged_edible   = (existing_edible | translated).sort
      parts['edible'] = merged_edible if parts.key?('edible') || merged_edible.any?

      # fragrance light/medium/strong → resource_parts.sensory += fragrant
      if fragrance_triggers.include?(s.fragrance.to_s)
        parts['sensory'] = (Array(parts['sensory']) | ['fragrant']).sort
      end

      # fodder_qualities (any) → resource_parts.animal += browsed
      if Array(s.fodder_qualities).any?
        parts['animal'] = (Array(parts['animal']) | ['browsed']).sort
      end

      # Clean up: drop values not in ECO_SERVICES
      provided = provided.select { |v| Plant::Species::ECO_SERVICES.include?(v) }
      needed   = needed.select   { |v| Plant::Species::ECO_SERVICES.include?(v) }

      # Normalise for comparison
      provided_sorted = provided.sort
      needed_sorted   = needed.sort

      changed = provided_sorted != original_provided ||
                needed_sorted   != original_needed   ||
                role            != original_role     ||
                parts           != original_parts

      if changed
        s.update_columns(
          eco_services_provided: provided,
          eco_services_needed:   needed,
          successional_role:     role,
          resource_parts:        parts
        )
        stats[:migrated] += 1
        puts "  ↑ #{s.latin_name}"
      else
        stats[:skipped] += 1
      end
    end

    puts "\n=== Migration summary ==="
    puts "Migrated: #{stats[:migrated]}"
    puts "Skipped:  #{stats[:skipped]} (already up to date or no legacy data)"
  end
end
