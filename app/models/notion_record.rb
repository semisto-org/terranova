# frozen_string_literal: true

class NotionRecord < ApplicationRecord
  validates :notion_id, presence: true, uniqueness: true
  validates :database_name, presence: true
  validates :database_id, presence: true
end
