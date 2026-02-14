module Design
  class ClientContribution < ApplicationRecord
    self.table_name = 'design_client_contributions'

    belongs_to :project, class_name: 'Design::Project'
  end
end
