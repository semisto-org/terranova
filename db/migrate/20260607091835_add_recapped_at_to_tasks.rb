class AddRecappedAtToTasks < ActiveRecord::Migration[8.1]
  def change
    add_column :tasks, :recapped_at, :datetime
  end
end
