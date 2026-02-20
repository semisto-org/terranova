# frozen_string_literal: true

class KnowledgeSection < ApplicationRecord
  belongs_to :creator, class_name: "Member", foreign_key: :created_by_id, optional: true
  has_many :topics, class_name: "KnowledgeTopic", foreign_key: :section_id, dependent: :nullify

  validates :name, presence: true, uniqueness: true

  scope :ordered, -> { order(position: :asc, name: :asc) }

  def as_json_brief
    {
      id: id,
      name: name,
      description: description,
      position: position,
      topicsCount: topics.published.count,
      createdAt: created_at&.iso8601
    }
  end
end
