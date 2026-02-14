module Design
  class QuoteLine < ApplicationRecord
    self.table_name = 'design_quote_lines'

    belongs_to :quote, class_name: 'Design::Quote'

    validates :description, presence: true
  end
end
