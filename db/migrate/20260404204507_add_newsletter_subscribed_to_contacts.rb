class AddNewsletterSubscribedToContacts < ActiveRecord::Migration[8.1]
  def change
    add_column :contacts, :newsletter_subscribed, :boolean, default: false, null: false
  end
end
