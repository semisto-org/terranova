module Api
  module V1
    class PlantsController < BaseController
      STRATE_KEYS = %w[aquatic groundCover herbaceous climbers shrubs trees].freeze

      def filter_options
        render json: {
          types: build_options(%w[tree shrub small-shrub climber herbaceous ground-cover]),
          exposures: build_options(%w[sun partial-shade shade]),
          hardinessZones: build_options(%w[zone-5 zone-6 zone-7 zone-8 zone-9]),
          edibleParts: build_options(%w[fruit leaf flower seed root bark sap]),
          interests: build_options(%w[edible medicinal nitrogen-fixer pollinator hedge ornamental]),
          ecosystemNeeds: build_options(%w[nurse-tree pioneer climax ground-cover erosion-control]),
          propagationMethods: build_options(%w[seed cutting layering grafting division sucker]),
          flowerColors: build_options(%w[white pink red yellow orange purple blue green]),
          plantingSeasons: build_options(%w[autumn winter spring]),
          months: build_options(%w[jan feb mar apr may jun jul aug sep oct nov dec]),
          foliageTypes: build_options(%w[deciduous semi-evergreen evergreen marcescent]),
          europeanCountries: build_options(%w[be fr de nl lu ch es it pt uk ie at pl cz dk se no fi]),
          fertilityTypes: build_options(%w[self-fertile self-sterile partially-self-fertile]),
          rootSystems: build_options(%w[taproot fibrous spreading shallow deep]),
          growthRates: build_options(%w[slow medium fast slow-start fast-start]),
          forestGardenZones: build_options(%w[edge light-shade full-sun understory canopy]),
          pollinationTypes: build_options(%w[insect wind self bird]),
          soilTypes: build_options(%w[clay loam sandy chalky peaty]),
          soilMoistures: build_options(%w[dry moist wet waterlogged]),
          soilRichness: build_options(%w[poor moderate rich very-rich]),
          wateringNeeds: build_options(%w[1 2 3 4 5]),
          lifeCycles: build_options(%w[annual biennial perennial]),
          foliageColors: build_options(%w[green dark-green light-green purple variegated silver golden]),
          fragranceLevels: build_options(%w[none light medium strong]),
          transformations: build_options(%w[jam jelly compote juice syrup liqueur dried frozen vinegar chutney]),
          fodderQualities: build_options(%w[sheep goats pigs cattle poultry rabbits]),
          strates: build_options(STRATE_KEYS)
        }
      end

      def search
        query = params[:query].to_s.strip

        render json: {
          items: search_items(query),
          query: query
        }
      end

      def genus
        genus = Plant::Genus.find(params.require(:id))

        render json: {
          genus: serialize_genus(genus),
          species: genus.species.order(:latin_name).map { |item| serialize_species_card(item) },
          commonNames: common_names_for('genus', genus.id),
          photos: photos_for('genus', genus.id),
          notes: notes_for('genus', genus.id),
          references: references_for('genus', genus.id),
          aiSummary: serialize_ai_summary('genus', genus.id),
          contributors: contributors_for_target('genus', genus.id)
        }
      end

      def species
        species = Plant::Species.includes(:genus, :varieties).find(params.require(:id))

        render json: {
          species: serialize_species(species),
          genus: species.genus ? serialize_genus(species.genus) : nil,
          siblingSpecies: species.genus ? species.genus.species.where.not(id: species.id).order(:latin_name).map { |item| serialize_species_card(item) } : [],
          varieties: species.varieties.order(:latin_name).map { |item| serialize_variety(item) },
          commonNames: common_names_for('species', species.id),
          photos: photos_for('species', species.id),
          notes: notes_for('species', species.id),
          references: references_for('species', species.id),
          locations: locations_for('species', species.id),
          nurseryStock: nursery_stocks_for('species', species.id),
          aiSummary: serialize_ai_summary('species', species.id),
          contributors: contributors_for_target('species', species.id)
        }
      end

      def variety
        variety = Plant::Variety.includes(species: :genus).find(params.require(:id))

        render json: {
          variety: serialize_variety(variety),
          species: serialize_species_card(variety.species),
          genus: variety.species.genus ? serialize_genus(variety.species.genus) : nil,
          siblingVarieties: variety.species.varieties.where.not(id: variety.id).order(:latin_name).map { |item| serialize_variety(item) },
          commonNames: common_names_for('variety', variety.id),
          photos: photos_for('variety', variety.id),
          notes: notes_for('variety', variety.id),
          references: references_for('variety', variety.id),
          locations: locations_for('variety', variety.id),
          nurseryStock: nursery_stocks_for('variety', variety.id),
          aiSummary: serialize_ai_summary('variety', variety.id),
          contributors: contributors_for_target('variety', variety.id)
        }
      end

      def generate_ai_summary
        target_type = params.require(:target_type)
        target_id = params.require(:target_id)

        summary = Plant::AiSummary.find_or_initialize_by(target_type: target_type, target_id: target_id)
        summary.status = 'loading'
        summary.content = nil
        summary.error = nil
        summary.generated_at = nil
        summary.save!

        summary.update!(
          status: 'success',
          content: "Resume IA genere pour #{target_type} #{target_id}. Ce contenu synthétise les proprietes botaniques et notes contributeurs.",
          generated_at: Time.current,
          error: nil
        )

        render json: serialize_ai_summary(target_type, target_id)
      end

      def activity_feed
        items = Plant::ActivityItem.includes(:contributor).order(timestamp: :desc).limit(100)

        render json: {
          items: items.map { |item| serialize_activity_item(item) }
        }
      end

      def contributor
        contributor = Plant::Contributor.find(params.require(:id))

        render json: {
          contributor: serialize_contributor(contributor),
          recentActivity: Plant::ActivityItem.where(contributor_id: contributor.id).order(timestamp: :desc).limit(30).map { |item| serialize_activity_item(item) }
        }
      end

      def create_palette
        palette = Plant::Palette.create!(palette_params)
        render json: serialize_palette(palette), status: :created
      end

      def show_palette
        palette = Plant::Palette.includes(:items).find(params.require(:id))
        render json: serialize_palette(palette)
      end

      def update_palette
        palette = Plant::Palette.find(params.require(:id))
        palette.update!(params.permit(:name, :description))
        render json: serialize_palette(palette)
      end

      def export_palette_pdf
        palette = Plant::Palette.includes(:items).find(params.require(:id))
        pdf_data = render_palette_pdf(palette)

        send_data(
          pdf_data,
          filename: "palette-#{palette.id}.pdf",
          type: 'application/pdf',
          disposition: 'attachment'
        )
      end

      def send_to_design_studio
        palette = Plant::Palette.find(params.require(:id))
        destination = "/app/design?palette_id=#{palette.id}"

        render json: {
          status: 'sent',
          paletteId: palette.id.to_s,
          designStudioUrl: destination,
          message: 'Palette envoyee au Design Studio.'
        }
      end

      def add_palette_item
        palette = Plant::Palette.find(params.require(:palette_id))
        item = palette.items.create!(
          item_type: params.require(:item_type),
          item_id: params.require(:item_id),
          strate_key: params.require(:strate_key),
          position: params[:position] || 0
        )

        render json: {
          id: item.id.to_s,
          paletteId: palette.id.to_s
        }, status: :created
      end

      def move_palette_item
        item = Plant::PaletteItem.find(params.require(:id))
        item.update!(strate_key: params.require(:strate_key), position: params[:position] || item.position)
        render json: { id: item.id.to_s, strateKey: item.strate_key, position: item.position }
      end

      def remove_palette_item
        Plant::PaletteItem.find(params.require(:id)).soft_delete!
        head :no_content
      end

      def create_genus
        genus = Plant::Genus.create!(genus_params)

        # Create common names if provided
        Array(params[:common_names]).each do |cn|
          Plant::CommonName.create!(
            target_type: 'genus',
            target_id: genus.id,
            language: cn[:language] || 'fr',
            name: cn[:name]
          )
        end

        if params[:contributor_id].present?
          contributor = Plant::Contributor.find(params[:contributor_id])
          create_activity!(
            activity_type: 'species_created',
            contributor: contributor,
            target_type: 'genus',
            target_id: genus.id,
            target_name: genus.latin_name
          )
        end

        render json: serialize_genus(genus), status: :created
      end

      def update_genus
        genus = Plant::Genus.find(params.require(:id))
        genus.update!(genus_params)

        # Replace common names if provided
        if params.key?(:common_names)
          Plant::CommonName.where(target_type: 'genus', target_id: genus.id).destroy_all
          Array(params[:common_names]).each do |cn|
            Plant::CommonName.create!(
              target_type: 'genus',
              target_id: genus.id,
              language: cn[:language] || 'fr',
              name: cn[:name]
            )
          end
        end

        render json: serialize_genus(genus)
      end

      def create_species
        species = Plant::Species.create!(species_params)

        # Create common names if provided
        Array(params[:common_names]).each do |cn|
          Plant::CommonName.create!(
            target_type: 'species',
            target_id: species.id,
            language: cn[:language] || 'fr',
            name: cn[:name]
          )
        end

        if params[:contributor_id].present?
          contributor = Plant::Contributor.find(params[:contributor_id])
          increment_contributor_counter(contributor, :species_created)
          create_activity!(
            activity_type: 'species_created',
            contributor: contributor,
            target_type: 'species',
            target_id: species.id,
            target_name: species.latin_name
          )
        end

        render json: serialize_species(species), status: :created
      end

      def update_species
        species = Plant::Species.find(params.require(:id))
        species.update!(species_params)

        if params.key?(:common_names)
          Plant::CommonName.where(target_type: 'species', target_id: species.id).destroy_all
          Array(params[:common_names]).each do |cn|
            Plant::CommonName.create!(
              target_type: 'species',
              target_id: species.id,
              language: cn[:language] || 'fr',
              name: cn[:name]
            )
          end
        end

        render json: serialize_species(species)
      end

      def create_variety
        variety = Plant::Variety.create!(variety_params)

        # Create common names if provided
        Array(params[:common_names]).each do |cn|
          Plant::CommonName.create!(
            target_type: 'variety',
            target_id: variety.id,
            language: cn[:language] || 'fr',
            name: cn[:name]
          )
        end

        if params[:contributor_id].present?
          contributor = Plant::Contributor.find(params[:contributor_id])
          increment_contributor_counter(contributor, :varieties_created)
          create_activity!(
            activity_type: 'variety_created',
            contributor: contributor,
            target_type: 'variety',
            target_id: variety.id,
            target_name: variety.latin_name
          )
        end

        render json: serialize_variety(variety), status: :created
      end

      def update_variety
        variety = Plant::Variety.find(params.require(:id))
        variety.update!(variety_params)

        if params.key?(:common_names)
          Plant::CommonName.where(target_type: 'variety', target_id: variety.id).destroy_all
          Array(params[:common_names]).each do |cn|
            Plant::CommonName.create!(
              target_type: 'variety',
              target_id: variety.id,
              language: cn[:language] || 'fr',
              name: cn[:name]
            )
          end
        end

        render json: serialize_variety(variety)
      end

      def create_note
        item = Plant::Note.create!(note_params)
        increment_contributor_counter(item.contributor, :notes_written)
        create_activity!(
          activity_type: 'note_added',
          contributor: item.contributor,
          target_type: item.target_type,
          target_id: item.target_id,
          target_name: target_latin_name(item.target_type, item.target_id)
        )

        render json: {
          id: item.id.to_s,
          targetId: item.target_id.to_s,
          targetType: item.target_type,
          contributorId: item.contributor_id.to_s,
          content: item.content,
          language: item.language,
          photos: item.photos,
          createdAt: item.created_at.iso8601
        }, status: :created
      end

      def create_photo
        item = Plant::Photo.create!(photo_params)
        increment_contributor_counter(item.contributor, :photos_added)
        create_activity!(
          activity_type: 'photo_added',
          contributor: item.contributor,
          target_type: item.target_type,
          target_id: item.target_id,
          target_name: target_latin_name(item.target_type, item.target_id)
        )

        render json: {
          id: item.id.to_s,
          targetId: item.target_id.to_s,
          targetType: item.target_type,
          url: item.url,
          caption: item.caption,
          contributorId: item.contributor_id.to_s,
          createdAt: item.created_at.iso8601
        }, status: :created
      end

      def create_reference
        item = Plant::Reference.create!(reference_params)

        if params[:contributor_id].present?
          contributor = Plant::Contributor.find(params.require(:contributor_id))
          create_activity!(
            activity_type: 'reference_added',
            contributor: contributor,
            target_type: item.target_type,
            target_id: item.target_id,
            target_name: target_latin_name(item.target_type, item.target_id)
          )
        end

        render json: {
          id: item.id.to_s,
          targetId: item.target_id.to_s,
          targetType: item.target_type,
          type: item.reference_type,
          title: item.title,
          url: item.url,
          source: item.source
        }, status: :created
      end

      private

      def build_options(values)
        values.map { |value| { id: value, label: value.to_s.tr('-', ' ').capitalize } }
      end

      def genus_params
        params.permit(:latin_name, :description)
      end

      def species_params
        params.permit(
          :genus_id, :latin_name, :plant_type, :hardiness, :life_cycle,
          :fertility, :origin, :foliage_type, :foliage_color, :fragrance,
          :growth_rate, :forest_garden_zone, :pollination_type, :root_system,
          :soil_moisture, :soil_richness, :watering_need, :is_invasive,
          :therapeutic_properties, :toxic_elements, :additional_notes,
          edible_parts: [], interests: [], ecosystem_needs: [], exposures: [],
          flower_colors: [], flowering_months: [], fruiting_months: [],
          harvest_months: [], planting_seasons: [], propagation_methods: [],
          native_countries: [], soil_types: [], fodder_qualities: [],
          transformations: []
        )
      end

      def variety_params
        params.permit(
          :species_id, :latin_name, :productivity, :taste_rating,
          :fruit_size, :storage_life, :maturity, :disease_resistance,
          :additional_notes
        )
      end

      def palette_params
        params.permit(:name, :description, :created_by)
      end

      def note_params
        params.permit(:target_type, :target_id, :contributor_id, :content, :language, photos: [])
      end

      def photo_params
        params.permit(:target_type, :target_id, :contributor_id, :url, :caption)
      end

      def reference_params
        params.permit(:target_type, :target_id, :reference_type, :title, :url, :source)
      end

      def search_items(query)
        genus_items = build_genus_search(query)
        species_items = build_species_search(query)
        variety_items = build_variety_search(query)

        (genus_items + species_items + variety_items).first(100)
      end

      def build_genus_search(query)
        scope = Plant::Genus.order(:latin_name)

        if query.present?
          name_match_ids = Plant::CommonName.where(target_type: 'genus').where('name ILIKE ?', "%#{query}%").select(:target_id)
          scope = scope.where('latin_name ILIKE ? OR id IN (?)', "%#{query}%", name_match_ids)
        end

        scope.limit(20).map do |item|
          {
            id: item.id.to_s,
            type: 'genus',
            latinName: item.latin_name,
            commonName: first_common_name('genus', item.id)
          }
        end
      end

      def build_species_search(query)
        scope = filter_species_scope(Plant::Species.includes(:genus))

        if query.present?
          name_match_ids = Plant::CommonName.where(target_type: 'species').where('name ILIKE ?', "%#{query}%").select(:target_id)
          scope = scope.where('latin_name ILIKE ? OR id IN (?)', "%#{query}%", name_match_ids)
        end

        scope.order(:latin_name).limit(40).map do |item|
          {
            id: item.id.to_s,
            type: 'species',
            latinName: item.latin_name,
            commonName: first_common_name('species', item.id),
            genusName: item.genus&.latin_name,
            plantType: item.plant_type,
            exposures: item.exposures,
            hardiness: item.hardiness
          }
        end
      end

      def build_variety_search(query)
        scope = Plant::Variety.includes(species: :genus)
        scope = scope.where(species_id: filter_species_scope(Plant::Species.all).select(:id))

        if query.present?
          name_match_ids = Plant::CommonName.where(target_type: 'variety').where('name ILIKE ?', "%#{query}%").select(:target_id)
          scope = scope.where('latin_name ILIKE ? OR id IN (?)', "%#{query}%", name_match_ids)
        end

        scope.order(:latin_name).limit(40).map do |item|
          {
            id: item.id.to_s,
            type: 'variety',
            latinName: item.latin_name,
            commonName: first_common_name('variety', item.id),
            speciesId: item.species_id.to_s,
            speciesName: item.species&.latin_name
          }
        end
      end

      def filter_species_scope(scope)
        result = scope
        result = result.where(plant_type: params[:types]) if params[:types].present?

        if params[:exposures].present?
          Array(params[:exposures]).each do |value|
            result = result.where('exposures @> ?', [value].to_json)
          end
        end

        if params[:hardinessZones].present?
          patterns = Array(params[:hardinessZones]).map { |value| "%#{value}%" }
          clauses = patterns.map { 'hardiness ILIKE ?' }.join(' OR ')
          result = result.where(clauses, *patterns)
        end

        if params[:edibleParts].present?
          Array(params[:edibleParts]).each do |value|
            result = result.where('edible_parts @> ?', [value].to_json)
          end
        end

        if params[:interests].present?
          Array(params[:interests]).each do |value|
            result = result.where('interests @> ?', [value].to_json)
          end
        end

        if params[:nativeCountries].present?
          Array(params[:nativeCountries]).each do |value|
            result = result.where('native_countries @> ?', [value].to_json)
          end
        end

        if params[:soilTypes].present?
          Array(params[:soilTypes]).each do |value|
            result = result.where('soil_types @> ?', [value].to_json)
          end
        end

        result = result.where(soil_moisture: params[:soilMoisture]) if params[:soilMoisture].present?
        result = result.where(watering_need: params[:wateringNeed]) if params[:wateringNeed].present?

        result
      end

      def first_common_name(target_type, target_id)
        Plant::CommonName.where(target_type: target_type, target_id: target_id).order(:id).pick(:name)
      end

      def common_names_for(target_type, target_id)
        Plant::CommonName.where(target_type: target_type, target_id: target_id).order(:id).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            language: item.language,
            name: item.name
          }
        end
      end

      def references_for(target_type, target_id)
        Plant::Reference.where(target_type: target_type, target_id: target_id).order(:id).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            type: item.reference_type,
            title: item.title,
            url: item.url,
            source: item.source
          }
        end
      end

      def photos_for(target_type, target_id)
        Plant::Photo.where(target_type: target_type, target_id: target_id).order(created_at: :desc).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            url: item.url,
            caption: item.caption,
            contributorId: item.contributor_id.to_s,
            createdAt: item.created_at.iso8601
          }
        end
      end

      def notes_for(target_type, target_id)
        Plant::Note.where(target_type: target_type, target_id: target_id).order(created_at: :desc).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            contributorId: item.contributor_id.to_s,
            content: item.content,
            language: item.language,
            photos: item.photos,
            createdAt: item.created_at.iso8601
          }
        end
      end

      def locations_for(target_type, target_id)
        Plant::Location.where(target_type: target_type, target_id: target_id).order(:id).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            latitude: item.latitude.to_f,
            longitude: item.longitude.to_f,
            placeName: item.place_name,
            labId: item.lab_id,
            isMotherPlant: item.is_mother_plant,
            plantedYear: item.planted_year,
            isPublic: item.is_public
          }
        end
      end

      def nursery_stocks_for(target_type, target_id)
        Plant::NurseryStock.where(target_type: target_type, target_id: target_id).order(:id).map do |item|
          {
            id: item.id.to_s,
            targetId: item.target_id.to_s,
            targetType: item.target_type,
            nurseryId: item.nursery_id,
            nurseryName: item.nursery_name,
            quantity: item.quantity,
            rootstock: item.rootstock,
            age: item.age,
            price: item.price.to_f
          }
        end
      end

      def serialize_ai_summary(target_type, target_id)
        summary = Plant::AiSummary.find_or_initialize_by(target_type: target_type, target_id: target_id)

        {
          status: summary.status || 'idle',
          content: summary.content,
          generatedAt: summary.generated_at&.iso8601,
          error: summary.error
        }
      end

      def serialize_genus(item)
        {
          id: item.id.to_s,
          latinName: item.latin_name,
          description: item.description
        }
      end

      def serialize_species_card(item)
        {
          id: item.id.to_s,
          genusId: item.genus_id&.to_s,
          latinName: item.latin_name,
          type: item.plant_type,
          exposures: item.exposures,
          hardiness: item.hardiness
        }
      end

      def serialize_species(item)
        {
          id: item.id.to_s,
          genusId: item.genus_id&.to_s,
          latinName: item.latin_name,
          type: item.plant_type,
          edibleParts: item.edible_parts,
          interests: item.interests,
          ecosystemNeeds: item.ecosystem_needs,
          propagationMethods: item.propagation_methods,
          origin: item.origin,
          flowerColors: item.flower_colors,
          plantingSeasons: item.planting_seasons,
          harvestMonths: item.harvest_months,
          exposures: item.exposures,
          hardiness: item.hardiness,
          fruitingMonths: item.fruiting_months,
          floweringMonths: item.flowering_months,
          foliageType: item.foliage_type,
          nativeCountries: item.native_countries,
          fertility: item.fertility,
          rootSystem: item.root_system,
          growthRate: item.growth_rate,
          forestGardenZone: item.forest_garden_zone,
          pollinationType: item.pollination_type,
          soilTypes: item.soil_types,
          soilMoisture: item.soil_moisture,
          soilRichness: item.soil_richness,
          wateringNeed: item.watering_need,
          toxicElements: item.toxic_elements,
          isInvasive: item.is_invasive,
          therapeuticProperties: item.therapeutic_properties,
          lifeCycle: item.life_cycle,
          foliageColor: item.foliage_color,
          fragrance: item.fragrance,
          transformations: item.transformations,
          fodderQualities: item.fodder_qualities,
          additionalNotes: item.additional_notes
        }
      end

      def serialize_variety(item)
        {
          id: item.id.to_s,
          speciesId: item.species_id.to_s,
          latinName: item.latin_name,
          productivity: item.productivity,
          fruitSize: item.fruit_size,
          tasteRating: item.taste_rating,
          storageLife: item.storage_life,
          maturity: item.maturity,
          diseaseResistance: item.disease_resistance,
          additionalNotes: item.additional_notes
        }
      end

      def serialize_contributor(item)
        {
          id: item.id.to_s,
          name: item.name,
          avatarUrl: item.avatar_url,
          joinedAt: item.joined_at.iso8601,
          labId: item.lab_id,
          stats: {
            speciesCreated: item.species_created,
            varietiesCreated: item.varieties_created,
            photosAdded: item.photos_added,
            notesWritten: item.notes_written
          },
          semosEarned: item.semos_earned,
          activityByMonth: item.activity_by_month
        }
      end

      def serialize_activity_item(item)
        {
          id: item.id.to_s,
          type: item.activity_type,
          contributorId: item.contributor_id.to_s,
          targetId: item.target_id.to_s,
          targetType: item.target_type,
          targetName: item.target_name,
          timestamp: item.timestamp.iso8601
        }
      end

      def serialize_palette(item)
        grouped = item.items.order(:position, :id).group_by(&:strate_key)

        {
          id: item.id.to_s,
          name: item.name,
          description: item.description,
          createdBy: item.created_by,
          createdAt: item.created_at.iso8601,
          strates: STRATE_KEYS.index_with do |key|
            Array(grouped[key]).map do |palette_item|
              {
                id: palette_item.item_id.to_s,
                paletteItemId: palette_item.id.to_s,
                type: palette_item.item_type,
                latinName: target_latin_name(palette_item.item_type, palette_item.item_id),
                position: palette_item.position
              }
            end
          end
        }
      end

      def render_palette_pdf(palette)
        lines = []
        lines << "Terranova - Palette vegetale"
        lines << ""
        lines << "Nom: #{palette.name}"
        lines << "Description: #{palette.description.presence || '-'}"
        lines << "Date: #{Time.current.strftime('%Y-%m-%d %H:%M')}"
        lines << ""

        grouped = palette.items.order(:position, :id).group_by(&:strate_key)
        STRATE_KEYS.each do |key|
          items = Array(grouped[key])
          lines << "#{key}: #{items.count}"
          items.each do |item|
            latin = target_latin_name(item.item_type, item.item_id)
            lines << " - #{latin} (#{item.item_type})"
          end
          lines << ""
        end

        build_simple_pdf(lines.first(120))
      end

      def build_simple_pdf(lines)
        safe_lines = lines.map { |line| line.to_s.gsub(/[()\\]/) { |char| "\\#{char}" } }
        stream = +"BT\n/F1 11 Tf\n40 800 Td\n14 TL\n"
        safe_lines.each_with_index do |line, index|
          stream << (index.zero? ? "(#{line}) Tj\n" : "T* (#{line}) Tj\n")
        end
        stream << "ET\n"

        objects = []
        objects << "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        objects << "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        objects << "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n"
        objects << "4 0 obj << /Length #{stream.bytesize} >> stream\n#{stream}endstream\nendobj\n"
        objects << "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"

        pdf = +"%PDF-1.4\n"
        offsets = [0]
        objects.each do |object|
          offsets << pdf.bytesize
          pdf << object
        end

        xref_start = pdf.bytesize
        pdf << "xref\n0 #{objects.size + 1}\n"
        pdf << "0000000000 65535 f \n"
        offsets.drop(1).each do |offset|
          pdf << format("%010d 00000 n \n", offset)
        end
        pdf << "trailer << /Size #{objects.size + 1} /Root 1 0 R >>\n"
        pdf << "startxref\n#{xref_start}\n%%EOF\n"
        pdf
      end

      def contributors_for_target(target_type, target_id)
        ids = []
        ids.concat(Plant::Photo.where(target_type: target_type, target_id: target_id).pluck(:contributor_id))
        ids.concat(Plant::Note.where(target_type: target_type, target_id: target_id).pluck(:contributor_id))

        Plant::Contributor.where(id: ids.uniq).order(:name).map { |item| serialize_contributor(item) }
      end

      def increment_contributor_counter(contributor, counter)
        contributor.increment!(counter)
        contributor.increment!(:semos_earned, 5)
      end

      def create_activity!(activity_type:, contributor:, target_type:, target_id:, target_name:)
        Plant::ActivityItem.create!(
          activity_type: activity_type,
          contributor: contributor,
          target_type: target_type,
          target_id: target_id,
          target_name: target_name,
          timestamp: Time.current
        )
      end

      def target_latin_name(target_type, target_id)
        case target_type.to_s
        when 'genus'
          Plant::Genus.where(id: target_id).pick(:latin_name) || "Genus ##{target_id}"
        when 'species'
          Plant::Species.where(id: target_id).pick(:latin_name) || "Species ##{target_id}"
        when 'variety'
          Plant::Variety.where(id: target_id).pick(:latin_name) || "Variety ##{target_id}"
        else
          "Plant ##{target_id}"
        end
      end
    end
  end
end
