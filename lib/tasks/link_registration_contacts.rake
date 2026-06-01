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
        existed = Contact.exists?(["LOWER(email) = ?", reg.contact_email.strip.downcase])

        contact_id = Academy::RegistrationContactResolver.call(
          name: reg.contact_name,
          email: reg.contact_email,
          phone: reg.phone
        )
        reg.update_column(:contact_id, contact_id)

        if existed
          linked += 1
          puts "  Linked registration #{reg.id} -> contact #{contact_id}"
        else
          created += 1
          puts "  Created contact #{contact_id} for registration #{reg.id} (#{reg.contact_name})"
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
