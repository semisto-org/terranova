# frozen_string_literal: true

namespace :academy do
  desc "Link existing registrations to contacts by email match, creating contacts when needed"
  task link_registration_contacts: :environment do
    puts "Linking registrations to contacts by email..."

    linked = 0
    created = 0
    skipped = 0

    Academy::TrainingRegistration
      .where(contact_id: nil)
      .where.not(contact_email: [nil, ""])
      .find_each do |reg|
        email = reg.contact_email.strip.downcase
        contact = Contact.find_by("LOWER(email) = ?", email)

        if contact
          reg.update_column(:contact_id, contact.id)
          linked += 1
          puts "  Linked registration #{reg.id} -> contact #{contact.id} (#{contact.name})"
        else
          contact = Contact.create!(
            contact_type: "person",
            name: reg.contact_name,
            email: reg.contact_email.strip,
            phone: reg.phone.to_s.strip.presence
          )
          reg.update_column(:contact_id, contact.id)
          created += 1
          puts "  Created contact #{contact.id} (#{contact.name}) for registration #{reg.id}"
        end
      rescue => e
        skipped += 1
        puts "  Error on registration #{reg.id}: #{e.message}"
      end

    puts ""
    puts "Results:"
    puts "  #{linked} registrations linked to existing contacts"
    puts "  #{created} new contacts created and linked"
    puts "  #{skipped} errors/skipped"
  end
end
