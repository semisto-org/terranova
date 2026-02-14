module Plant
  class AiSummary < ApplicationRecord
    self.table_name = 'plant_ai_summaries'

    enum :status, {
      idle: 'idle',
      loading: 'loading',
      success: 'success',
      error: 'error'
    }, validate: true

    validates :target_type, :target_id, :status, presence: true
  end
end
