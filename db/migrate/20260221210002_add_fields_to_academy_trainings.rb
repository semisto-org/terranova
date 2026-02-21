# frozen_string_literal: true

class AddFieldsToAcademyTrainings < ActiveRecord::Migration[7.1]
  def change
    change_table :academy_trainings, bulk: true do |t|
      t.text :feedback, default: "", null: false
      t.string :photo_album_url, default: "", null: false
      t.string :public_page_url, default: "", null: false
      t.string :private_page_url, default: "", null: false
      t.string :punchpass_url, default: "", null: false
      t.string :registration_mode, default: "open", null: false
    end
  end
end
