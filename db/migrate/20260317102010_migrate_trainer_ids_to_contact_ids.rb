class MigrateTrainerIdsToContactIds < ActiveRecord::Migration[8.1]
  def up
    Academy::TrainingSession.where.not(trainer_ids: nil).where.not(trainer_ids: []).find_each do |session|
      new_ids = session.trainer_ids.filter_map do |member_id|
        member = Member.find_by(id: member_id)
        next nil unless member

        contact = Contact.find_by("LOWER(email) = ?", member.email.to_s.downcase)
        unless contact
          contact = Contact.create!(
            contact_type: "person",
            name: "#{member.first_name} #{member.last_name}".strip,
            email: member.email.to_s
          )
        end

        unless contact.contact_tags.exists?(name: "academy")
          contact.contact_tags.create!(name: "academy")
        end

        contact.id.to_s
      end

      session.update_column(:trainer_ids, new_ids) if new_ids != session.trainer_ids
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
