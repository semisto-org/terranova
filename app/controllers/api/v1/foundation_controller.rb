module Api
  module V1
    class FoundationController < BaseController
      def routes
        render json: {
          milestone: "foundation",
          items: [
            { path: "/lab", section: "Lab Management" },
            { path: "/lab/cycles", section: "Lab Management" },
            { path: "/lab/members", section: "Lab Management" },
            { path: "/lab/semos", section: "Lab Management" },
            { path: "/lab/timesheets", section: "Lab Management" },
            { path: "/lab/calendar", section: "Lab Management" },
            { path: "/plants", section: "Plant Database" },
            { path: "/plants/:speciesId", section: "Plant Database" },
            { path: "/design", section: "Design Studio" },
            { path: "/design/:projectId", section: "Design Studio" },
            { path: "/academy", section: "Academy" },
            { path: "/academy/:trainingId", section: "Academy" },
            { path: "/academy/calendar", section: "Academy" },
            { path: "/nursery", section: "Nursery" },
            { path: "/nursery/orders", section: "Nursery" },
            { path: "/nursery/catalog", section: "Nursery" },
            { path: "/", section: "Website" },
            { path: "/:labSlug", section: "Website" },
            { path: "/engagement", section: "Citizen Engagement" },
            { path: "/engagement/map", section: "Citizen Engagement" },
            { path: "/partner", section: "Partner Portal" }
          ]
        }
      end

      def shell
        render json: {
          context_switcher: {
            user: {
              name: "Demo User",
              email: "demo@terranova.local"
            },
            poles: [
              "Design Studio",
              "Academy",
              "Nursery",
              "Mise en oeuvre",
              "Gestion du Lab",
              "Website"
            ]
          },
          sidebar: {
            design_studio: ["Projets", "Clients", "Offres", "Plantations"],
            academy: ["Formations", "Inscriptions", "Contenus", "Participants"],
            nursery: ["Stocks", "Commandes", "Catalogue"],
            implementation: ["Chantiers", "Heroes", "Evenements", "Materiotheque"],
            lab_management: ["Cycles", "Membres", "Guildes", "Semos", "Finance", "Reporting"],
            website: ["Pages", "Transformation Map", "Boutique", "Portfolio", "Formations"]
          }
        }
      end

      def milestone
        render json: {
          name: "Foundation",
          status: "in_progress",
          sequence_position: 1,
          next_milestone: "Lab Management"
        }
      end
    end
  end
end
