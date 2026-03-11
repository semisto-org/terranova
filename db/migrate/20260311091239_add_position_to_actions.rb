class AddPositionToActions < ActiveRecord::Migration[8.1]
  def change
    add_column :actions, :position, :integer, default: 0
  end
end
