module Design
  # Données structurées libres rattachées à une sous-section de la méthodologie
  # (formulaires d'analyse : tri des données, échelle de temps, ressources, systémique…).
  # Table sparse : une ligne par sous-section effectivement remplie. Le `data` JSONB porte
  # la forme propre à chaque sous-section (validée côté frontend), le backend reste générique.
  class AnalysisSection < ApplicationRecord
    self.table_name = 'design_analysis_sections'

    belongs_to :project, class_name: 'Design::Project', foreign_key: :project_id

    validates :node_key, presence: true
    validates :node_key, uniqueness: { scope: :project_id }
    validate :node_key_is_defined

    private

    # Le node_key doit correspondre à une sous-section connue de la méthodologie.
    def node_key_is_defined
      return if node_key.blank?
      return if Design::Methodology.valid_node_key?(node_key)

      errors.add(:node_key, "n'existe pas dans la méthodologie : #{node_key}")
    end
  end
end
