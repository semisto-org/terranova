# Soft delete concern for ActiveRecord models.
#
# Adds a `deleted_at` timestamp column to mark records as deleted
# instead of destroying them. All default scopes filter out soft-deleted
# records so the rest of the application works transparently.
#
# Usage:
#   class MyModel < ApplicationRecord
#     include SoftDeletable
#   end
#
#   record.soft_delete!       # sets deleted_at to now
#   record.restore!           # clears deleted_at
#   record.deleted?           # true if soft-deleted
#   MyModel.all               # excludes soft-deleted records
#   MyModel.with_deleted       # includes soft-deleted records
#   MyModel.only_deleted       # only soft-deleted records
#
module SoftDeletable
  extend ActiveSupport::Concern

  included do
    default_scope { where(deleted_at: nil) }

    scope :with_deleted, -> { unscope(where: :deleted_at) }
    scope :only_deleted, -> { unscope(where: :deleted_at).where.not(deleted_at: nil) }
  end

  # Soft-delete the record by setting deleted_at.
  # Skips callbacks and validations for speed.
  def soft_delete!
    update_column(:deleted_at, Time.current)
  end

  # Restore a soft-deleted record.
  def restore!
    update_column(:deleted_at, nil)
  end

  # Whether this record has been soft-deleted.
  def deleted?
    deleted_at.present?
  end
end
