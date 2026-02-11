module Api
  module V1
    class WebsiteController < ApplicationController
      def home
        render json: {
          hero: {
            title: "Terranova",
            subtitle: "Infrastructure numerique pour l'agroforesterie en Europe"
          },
          featured_counts: {
            transformed_hectares: 1274,
            active_labs: 22,
            citizen_contributors: 4890
          }
        }
      end

      def articles
        render json: {
          items: [
            {
              slug: "repenser-les-paysages-anthropises",
              title: "Repenser les paysages anthropises",
              summary: "Comment les Labs Semisto transforment les zones urbanisees en ecosystemes nourriciers.",
              published_at: "2026-02-01"
            },
            {
              slug: "monnaie-interne-et-impact-territorial",
              title: "Monnaie interne et impact territorial",
              summary: "Comprendre le role du Semos dans la coordination des contributions locales.",
              published_at: "2026-01-20"
            }
          ]
        }
      end

      def events
        render json: {
          items: [
            {
              id: "evt_plantation_collective_lyon",
              title: "Plantation collective - Lyon",
              starts_at: "2026-03-14T09:00:00Z",
              city: "Lyon"
            },
            {
              id: "evt_demo_haies_fruitieres_lille",
              title: "Demonstration de haies fruitieres - Lille",
              starts_at: "2026-03-28T13:30:00Z",
              city: "Lille"
            }
          ]
        }
      end

      def courses
        render json: {
          items: [
            {
              slug: "initiation-foret-comestible",
              title: "Initiation a la foret comestible",
              duration_days: 2,
              level: "debutant"
            },
            {
              slug: "design-avance-jardin-foret",
              title: "Design avance de jardin-foret",
              duration_days: 4,
              level: "intermediaire"
            }
          ]
        }
      end
    end
  end
end
