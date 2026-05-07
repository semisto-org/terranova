namespace :plants do
  desc 'Migrate legacy interests/ecosystem_needs/edible_parts/fragrance/fodder_qualities into the new card fields. Idempotent.'
  task migrate_legacy: :environment do
    interests_to_eco = {
      'nitrogen-fixer' => 'nitrogen',
      'pollinator'     => 'mellifere',
      'hedge'          => 'windbreak'
    }.freeze

    interests_to_resource = {
      'edible'    => 'edible',
      'medicinal' => 'medicinal'
    }.freeze

    needs_to_role = {
      'nurse-tree' => 'nurse',
      'pioneer'    => 'pioneer',
      'climax'     => 'climax'
    }.freeze

    needs_to_eco = %w[ground-cover erosion-control].freeze

    stats = Hash.new(0)
    Plant::Species.find_each do |s|
      original_provided = Array(s.eco_services_provided)
      original_role     = s.successional_role
      original_parts    = s.resource_parts.is_a?(Hash) ? s.resource_parts : {}

      provided = original_provided.dup
      role     = original_role
      parts    = original_parts.dup

      # interests → eco_services_provided + resource_parts
      Array(s.interests).each do |interest|
        if (eco = interests_to_eco[interest])
          provided |= [eco]
        end
        if (cat = interests_to_resource[interest])
          parts[cat] ||= []
        end
        if interest == 'ornamental'
          parts['sensory'] = (parts['sensory'] || []) | ['ornamental']
        end
      end

      # ecosystem_needs → role + eco_services_provided
      Array(s.ecosystem_needs).each do |need|
        if (mapped_role = needs_to_role[need])
          role ||= mapped_role
        end
        if needs_to_eco.include?(need)
          provided |= [need]
        end
      end

      # edible_parts → resource_parts.edible
      if Array(s.edible_parts).any?
        existing = Array(parts['edible'])
        parts['edible'] = (existing | s.edible_parts).sort
      end

      # fragrance strong/medium → resource_parts.sensory += fragrant
      if %w[strong medium].include?(s.fragrance.to_s)
        parts['sensory'] = (parts['sensory'] || []) | ['fragrant']
      end

      # fodder_qualities → resource_parts.animal += browsed
      if Array(s.fodder_qualities).any?
        parts['animal'] = (parts['animal'] || []) | ['browsed']
      end

      changed = provided != original_provided ||
                role != original_role ||
                parts != original_parts

      if changed
        s.update_columns(
          eco_services_provided: provided,
          successional_role: role,
          resource_parts: parts
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
