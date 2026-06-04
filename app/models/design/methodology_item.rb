module Design
  # État de progression d'un projet sur un nœud de la méthodologie (cf. Design::Methodology).
  # Table sparse : une ligne seulement par nœud effectivement touché par le designer.
  class MethodologyItem < ApplicationRecord
    self.table_name = 'design_methodology_items'

    STATUSES = %w[todo in_progress done].freeze

    belongs_to :project, class_name: 'Design::Project', foreign_key: :project_id

    validates :node_key, presence: true
    validates :node_key, uniqueness: { scope: :project_id }
    validates :status, inclusion: { in: STATUSES }
    validate :node_key_is_defined

    private

    # Le node_key doit exister dans la définition canonique — sinon 422.
    def node_key_is_defined
      return if node_key.blank?
      return if Design::Methodology.valid_node_key?(node_key)

      errors.add(:node_key, "n'existe pas dans la méthodologie : #{node_key}")
    end
  end
end
