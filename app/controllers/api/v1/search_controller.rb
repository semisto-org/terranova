module Api
  module V1
    class SearchController < BaseController
      def index
        query = params[:q].to_s.strip
        return render(json: { results: [] }) if query.length < 2

        results = []
        pattern = "%#{query}%"

        # Members
        Member.where("first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q", q: pattern)
              .limit(5).each do |m|
          results << {
            type: "member",
            id: m.id,
            title: "#{m.first_name} #{m.last_name}",
            subtitle: m.email,
            url: "/lab",
            icon: "user"
          }
        end

        # Contacts
        Contact.where("name ILIKE :q OR email ILIKE :q", q: pattern)
               .limit(5).each do |c|
          results << {
            type: "contact",
            id: c.id,
            title: c.name,
            subtitle: [c.contact_type&.capitalize, c.email].compact.join(" · "),
            url: "/lab",
            icon: "contact"
          }
        end

        # Events
        Event.where("title ILIKE :q OR description ILIKE :q OR location ILIKE :q", q: pattern)
             .order(start_date: :desc).limit(5).each do |e|
          results << {
            type: "event",
            id: e.id,
            title: e.title,
            subtitle: e.start_date&.strftime("%d/%m/%Y"),
            url: "/lab",
            icon: "calendar"
          }
        end

        # Design Projects
        Design::Project.where(
          "name ILIKE :q OR client_name ILIKE :q OR number ILIKE :q OR city ILIKE :q", q: pattern
        ).limit(5).each do |p|
          results << {
            type: "design_project",
            id: p.id,
            title: p.name,
            subtitle: [p.client_name, p.phase&.humanize].compact.join(" · "),
            url: "/design/#{p.id}",
            icon: "palette"
          }
        end

        # Academy Trainings
        Academy::Training.where("title ILIKE :q OR description ILIKE :q", q: pattern)
                         .limit(5).each do |t|
          results << {
            type: "training",
            id: t.id,
            title: t.title,
            subtitle: t.status&.humanize,
            url: "/academy/#{t.id}",
            icon: "graduation-cap"
          }
        end

        # Knowledge Topics
        KnowledgeTopic.where("title ILIKE :q OR content ILIKE :q", q: pattern)
                      .where(status: "published")
                      .limit(5).each do |t|
          results << {
            type: "knowledge",
            id: t.id,
            title: t.title,
            subtitle: "Base de connaissances",
            url: "/knowledge",
            icon: "book-open"
          }
        end

        # Plant Genera
        Plant::Genus.where("latin_name ILIKE :q OR common_name ILIKE :q", q: pattern)
                    .limit(5).each do |g|
          results << {
            type: "plant_genus",
            id: g.id,
            title: g.latin_name,
            subtitle: g.common_name,
            url: "/plants/genus/#{g.id}",
            icon: "leaf"
          }
        end

        # Plant Species
        Plant::Species.where("latin_name ILIKE :q OR common_names_fr ILIKE :q", q: pattern)
                      .limit(5).each do |s|
          results << {
            type: "plant_species",
            id: s.id,
            title: s.latin_name,
            subtitle: s.common_names_fr,
            url: "/plants/species/#{s.id}",
            icon: "sprout"
          }
        end

        # Pole Projects
        PoleProject.where("name ILIKE :q", q: pattern)
                   .limit(5).each do |p|
          results << {
            type: "project",
            id: p.id,
            title: p.name,
            subtitle: "Projet",
            url: "/lab",
            icon: "folder"
          }
        end

        render json: { results: results, query: query }
      end
    end
  end
end
