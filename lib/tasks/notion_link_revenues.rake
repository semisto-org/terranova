# frozen_string_literal: true

namespace :notion do
  desc "Link revenues to contacts based on Notion Client relation"
  task link_revenue_contacts: :environment do
    puts "🔗 Linking revenues to contacts..."
    
    resolved = 0
    not_found = 0
    errors = 0
    
    Revenue.where(contact_id: nil).where.not(notion_id: [nil, ""]).find_each do |rev|
      nr = NotionRecord.find_by(notion_id: rev.notion_id)
      
      unless nr
        not_found += 1
        next
      end
      
      # Try to find client name from properties
      client_name = nr.properties["Client"] || nr.properties["Nom"] || nr.properties["Facturation"]
      
      if client_name.present?
        # Try exact match first
        contact = Contact.where("name ILIKE ?", client_name.to_s).first
        
        # Try email match if name not found
        if contact.nil? && client_name.to_s.include?("@")
          contact = Contact.find_by(email: client_name.to_s.downcase.strip)
        end
        
        if contact
          rev.update!(contact_id: contact.id)
          resolved += 1
          puts "  ✓ Linked revenue #{rev.id} to contact #{contact.name}"
        else
          not_found += 1
          puts "  ⚠ Contact not found for: #{client_name}"
        end
      else
        not_found += 1
      end
    rescue => e
      errors += 1
      puts "  ✗ Error: #{e.message}"
    end
    
    puts ""
    puts "Results:"
    puts "  #{resolved} revenues linked"
    puts "  #{not_found} not found"
    puts "  #{errors} errors"
  end
end
