module Api
  module V1
    # Réactions polymorphes (#111) — add / remove idempotent ; la réponse renvoie
    # le comptage par contenu + les auteurs. Une réaction n'émet AUCUNE
    # notification. Allowlist stricte des types réactionnables : un client ne peut
    # pas faire instancier une classe arbitraire via reactable_type.
    class ReactionsController < BaseController
      REACTABLE_TYPES = %w[Comment Task Event Strategy::Deliberation].freeze

      def create
        reactable = resolve_reactable
        return unless reactable

        content = params[:content].to_s
        unless Reaction::CONTENTS.include?(content)
          return render json: { error: "Réaction non supportée" }, status: :unprocessable_entity
        end

        reaction = reactable.reactions.find_or_initialize_by(member: current_member, content: content)
        if reaction.new_record? && !reaction.save
          return render json: { errors: reaction.errors.full_messages }, status: :unprocessable_entity
        end

        render json: serialize(reactable), status: :created
      end

      def destroy
        reactable = resolve_reactable
        return unless reactable

        reactable.reactions.where(member: current_member, content: params[:content]).destroy_all
        render json: serialize(reactable)
      end

      private

      def resolve_reactable
        unless REACTABLE_TYPES.include?(params[:reactable_type].to_s)
          render json: { error: "Type non réactionnable" }, status: :unprocessable_entity
          return nil
        end

        params[:reactable_type].constantize.find(params[:reactable_id])
      end

      def serialize(reactable)
        { counts: reactable.reaction_counts, authors: reactable.reaction_authors }
      end
    end
  end
end
