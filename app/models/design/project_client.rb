# frozen_string_literal: true

module Design
  # Liaison N-N entre un projet design et les `Contact` qui en sont les
  # clients/porteurs externes. Distincte des `project_memberships` (concern
  # `Projectable`) qui lient des `Member` (équipe interne) au projet.
  #
  # Un seul client peut être `is_primary` par projet : c'est lui qui pilote les
  # champs dénormalisés `client_name/email/phone` du projet (voir
  # Design::Project#sync_primary_client!).
  class ProjectClient < ApplicationRecord
    self.table_name = 'design_project_clients'

    belongs_to :project, class_name: 'Design::Project'
    belongs_to :contact

    validates :contact_id, uniqueness: { scope: :project_id }

    after_save :enforce_single_primary, if: :is_primary?

    private

    # Garantit qu'au plus un client est primaire par projet.
    def enforce_single_primary
      Design::ProjectClient
        .where(project_id: project_id)
        .where.not(id: id)
        .where(is_primary: true)
        .update_all(is_primary: false)
    end
  end
end
