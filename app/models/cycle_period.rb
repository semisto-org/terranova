class CyclePeriod < ApplicationRecord
  validates :name, :starts_on, :ends_on, :cooldown_starts_on, :cooldown_ends_on, :color, presence: true

  validate :coherent_dates

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(starts_on: :desc) }

  private

  def coherent_dates
    return if starts_on.blank? || ends_on.blank? || cooldown_starts_on.blank? || cooldown_ends_on.blank?

    if ends_on < starts_on
      errors.add(:ends_on, "doit être après la date de début")
    end

    if cooldown_starts_on < ends_on
      errors.add(:cooldown_starts_on, "doit être le même jour ou après la fin du cycle")
    end

    if cooldown_ends_on < cooldown_starts_on
      errors.add(:cooldown_ends_on, "doit être après le début du cooldown")
    end
  end
end
