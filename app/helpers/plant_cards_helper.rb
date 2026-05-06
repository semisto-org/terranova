module PlantCardsHelper
  STRATE_LABELS = {
    'low'          => 'Basse',
    'medium'       => 'Médiane',
    'shrub'        => 'Arbrisseau',
    'tree'         => 'Arbre',
    'canopy'       => 'Canopée',
    'vine'         => 'Grimpante',
    'aquatic'      => 'Aquatique',
    'subterranean' => 'Racinaire'
  }.freeze

  STRATE_COLORS = {
    'low'          => '#C8E6A0',
    'medium'       => '#8FBC4F',
    'shrub'        => '#5A9A2F',
    'tree'         => '#2D7A1F',
    'canopy'       => '#1B4D14',
    'vine'         => '#B45F8E',
    'aquatic'      => '#4A90C2',
    'subterranean' => '#8B5A3C'
  }.freeze

  STRATE_FG_COLORS = { 'low' => '#2d4a1f' }.freeze

  USDA_TO_CELSIUS = {
    'zone-3' => -40, 'zone-4' => -34, 'zone-5' => -29, 'zone-6' => -23,
    'zone-7' => -18, 'zone-8' => -12, 'zone-9' => -7, 'zone-10' => -1
  }.freeze

  CYCLE_LABELS = {
    'annual'    => 'Annuelle',
    'biennial'  => 'Bisannuelle',
    'perennial' => 'Vivace'
  }.freeze

  ROLE_LABELS = {
    'pioneer' => 'Pionnier',
    'nurse'   => 'Nourricier',
    'climax'  => 'Climax'
  }.freeze

  FOLIAGE_LABELS = {
    'deciduous'      => 'Caduc',
    'semi-evergreen' => 'Semi-persistant',
    'evergreen'      => 'Persistant',
    'marcescent'     => 'Marcescent'
  }.freeze

  ROOT_LABELS = {
    'taproot'   => 'Pivotant',
    'fibrous'   => 'Fasciculé',
    'spreading' => 'Traçant',
    'shallow'   => 'Superficiel',
    'deep'      => 'Profond'
  }.freeze

  TEXTURE_ORDER = %w[light balanced heavy].freeze
  HUMUS_ORDER   = %w[poor moderate rich].freeze
  PH_ORDER      = %w[acid neutral basic].freeze

  # Returns array of booleans, one per segment, indicating which are "active"
  def soil_scale_segments(values, order)
    active = Array(values).map(&:to_s)
    order.map { |id| active.include?(id) }
  end

  PIXELS_PER_METER = 33  # 1 m = 33 px (matches v30 mockup: 1m70 human = 56 px)

  def strate_label(strate); STRATE_LABELS[strate]; end
  def strate_color(strate); STRATE_COLORS[strate]; end
  def strate_fg(strate); STRATE_FG_COLORS[strate] || '#fff'; end

  def cycle_label(cycle); CYCLE_LABELS[cycle]; end
  def cycle_class(cycle); cycle.present? ? "cycle-#{cycle}" : nil; end

  def role_label(role); ROLE_LABELS[role]; end
  def role_class(role); role.present? ? "role-#{role}" : nil; end

  def foliage_label(foliage); FOLIAGE_LABELS[foliage]; end

  def root_label(root_system); ROOT_LABELS[root_system]; end

  def hardiness_celsius(zone)
    return nil if zone.blank?
    return nil unless USDA_TO_CELSIUS.key?(zone)
    "#{USDA_TO_CELSIUS[zone].to_s.tr('-', '−')} °C"
  end

  def pick_photo(photos, role)
    photos.find { |p| p.role == role }
  end

  def cell_state(month_id, species)
    flow = species.flowering_months.include?(month_id)
    harv = species.harvest_months.include?(month_id)
    return 'both' if flow && harv
    return 'flow' if flow
    return 'harv' if harv
    nil
  end

  TOXICITY_TARGET_FR = {
    'humans' => 'humains', 'sheep' => 'brebis', 'dogs' => 'chiens',
    'horses' => 'chevaux', 'poultry' => 'volaille', 'cattle' => 'bovins'
  }.freeze

  def card_warnings(species)
    out = []
    out << 'Drageonne' if species.is_drageonnant
    out << "Allélopathie : #{species.allelopathy}" if species.allelopathy.present?
    Array(species.toxicity).each do |target, parts|
      next if parts.blank?
      label = TOXICITY_TARGET_FR[target.to_s] || target.to_s
      out << "Toxique #{label} (#{parts.join(', ')})"
    end
    out
  end

  def qr_svg(url)
    require 'rqrcode'
    RQRCode::QRCode.new(url).as_svg(
      viewbox: true,
      use_path: true,
      module_size: 4,
      standalone: true
    ).html_safe
  end

  def sun_state_id(exposures)
    ex = Array(exposures).map(&:to_s)
    return 'sun-empty' if ex.empty? || ex == ['shade']
    return 'sun-full'  if ex.include?('sun')
    'sun-half'
  end

  def leaf_symbol_id(foliage_type)
    case foliage_type
    when 'deciduous'      then 'leaf-deciduous'
    when 'marcescent'     then 'leaf-marcescent'
    when 'semi-evergreen' then 'leaf-semi'
    when 'evergreen'      then 'leaf-evergreen'
    else 'leaf-deciduous'
    end
  end

  def water_level_int(watering_need)
    return nil if watering_need.blank?
    Integer(watering_need)
  rescue ArgumentError, TypeError
    nil
  end

  def plant_height_px(height_cm)
    return nil if height_cm.nil? || height_cm.zero?
    (height_cm.to_i * PIXELS_PER_METER / 100.0).round
  end

  def silhouette_partial(species)
    habit = species.growth_habit.to_s.tr('-', '_')
    return 'plant_cards/silhouettes/default' if habit.empty?
    "plant_cards/silhouettes/#{habit}"
  end

  def roots_partial(species)
    rs = species.root_system.to_s
    return 'plant_cards/roots/default' if rs.empty?
    "plant_cards/roots/#{rs}"
  end
end
