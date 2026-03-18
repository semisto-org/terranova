class AddGuildTypeAndLabToGuilds < ActiveRecord::Migration[8.1]
  def change
    add_column :guilds, :guild_type, :string, default: "network", null: false
    add_reference :guilds, :lab, null: true, foreign_key: true
    add_column :guilds, :icon, :string

    add_index :guilds, :guild_type
  end
end
