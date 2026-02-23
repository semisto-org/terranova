class AddStructuredAddressToDesignProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :design_projects, :street, :string, default: '', null: false
    add_column :design_projects, :number, :string, default: '', null: false
    add_column :design_projects, :city, :string, default: '', null: false
    add_column :design_projects, :postcode, :string, default: '', null: false
    add_column :design_projects, :country_name, :string, default: '', null: false

    # Migrate existing address values to city (Localité)
    execute <<-SQL.squish
      UPDATE design_projects SET city = address WHERE address IS NOT NULL AND address != ''
    SQL

    remove_column :design_projects, :address
  end

  def down
    add_column :design_projects, :address, :string, default: '', null: false
    execute <<-SQL.squish
      UPDATE design_projects SET address = city WHERE city IS NOT NULL AND city != ''
    SQL
    remove_column :design_projects, :street
    remove_column :design_projects, :number
    remove_column :design_projects, :city
    remove_column :design_projects, :postcode
    remove_column :design_projects, :country_name
  end
end
