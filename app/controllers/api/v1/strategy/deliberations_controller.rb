# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class DeliberationsController < BaseController
        before_action :ensure_effective_member

        def index
          deliberations = ::Strategy::Deliberation.visible_to(current_member)
          deliberations = deliberations.by_status(params[:status])
          deliberations = deliberations.search(params[:search])
          deliberations = deliberations.order(created_at: :desc)
          render json: { deliberations: deliberations.map(&:as_json_brief) }
        end

        def show
          deliberation = ::Strategy::Deliberation.visible_to(current_member).find(params[:id])
          render json: { deliberation: deliberation.as_json_full }
        end

        def create
          deliberation = ::Strategy::Deliberation.new(deliberation_params)
          deliberation.status = "draft"
          deliberation.created_by_id = current_member.id

          if deliberation.save
            render json: { deliberation: deliberation.as_json_full }, status: :created
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut modifier") unless owner?(deliberation)
          return forbid("Modification autorisée uniquement en brouillon") unless deliberation.status == "draft"

          if deliberation.update(deliberation_params)
            render json: { deliberation: deliberation.as_json_full }
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def publish
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut publier") unless owner?(deliberation)
          unless deliberation.can_publish?
            return render json: { error: "Une proposition est requise pour publier" }, status: :unprocessable_entity
          end

          deliberation.publish!
          render json: { deliberation: deliberation.as_json_full }
        end

        def destroy
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut supprimer") unless owner?(deliberation)
          unless deliberation.status == "draft"
            return render json: { error: "Seul un brouillon peut être supprimé" }, status: :unprocessable_entity
          end

          deliberation.destroy!
          head :no_content
        end

        def cancel
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut annuler") unless owner?(deliberation)
          if deliberation.status == "decided"
            return render json: { error: "Une délibération décidée ne peut pas être annulée" }, status: :unprocessable_entity
          end

          deliberation.cancel!
          render json: { deliberation: deliberation.as_json_full }
        end

        def decide
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut rédiger la décision") unless owner?(deliberation)
          unless deliberation.status == "outcome_pending"
            return render json: { error: "La délibération n'est pas en attente de décision" }, status: :unprocessable_entity
          end

          deliberation.update!(
            status: "decided",
            outcome: params[:outcome],
            decided_at: Time.current
          )
          render json: { deliberation: deliberation.as_json_full }
        end

        # Proposals
        def create_proposal
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut ajouter la proposition") unless owner?(deliberation)
          unless deliberation.status == "draft"
            return render json: { error: "La proposition ne peut être créée qu'en brouillon" }, status: :unprocessable_entity
          end
          if deliberation.proposals.any?
            return render json: { error: "Une proposition existe déjà pour cette délibération" }, status: :unprocessable_entity
          end

          proposal = deliberation.proposals.build(proposal_params)
          proposal.author = current_member

          if proposal.save
            render json: { proposal: proposal.as_json_full }, status: :created
          else
            render json: { errors: proposal.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_proposal
          proposal = ::Strategy::Proposal.find(params[:id])
          deliberation = proposal.deliberation
          return forbid("Seul l'auteur peut amender la proposition") unless owner?(deliberation)
          unless %w[draft open].include?(deliberation.status)
            return render json: { error: "La proposition ne peut plus être modifiée" }, status: :unprocessable_entity
          end

          new_content = params[:content]
          if new_content.blank?
            return render json: { errors: ["Le contenu est obligatoire"] }, status: :unprocessable_entity
          end

          proposal.record_new_version!(new_content)
          render json: { proposal: proposal.as_json_full }
        end

        def proposal_versions
          proposal = ::Strategy::Proposal.find(params[:id])
          ::Strategy::Deliberation.visible_to(current_member).find(proposal.deliberation_id)
          versions = proposal.versions.chronological.map(&:as_json_brief)
          render json: { versions: versions }
        end

        # Reactions
        def create_reaction
          proposal = ::Strategy::Proposal.find(params[:id])
          deliberation = proposal.deliberation
          unless deliberation.status == "voting"
            return render json: { error: "Les réactions ne sont acceptées qu'en phase de vote" }, status: :unprocessable_entity
          end
          if deliberation.voting_deadline && deliberation.voting_deadline <= Time.current
            return render json: { error: "La phase de vote est terminée" }, status: :unprocessable_entity
          end

          reaction = proposal.reactions.find_or_initialize_by(member: current_member)
          reaction.assign_attributes(reaction_params)

          if reaction.save
            render json: { reaction: reaction.as_json_brief }, status: :created
          else
            render json: { errors: reaction.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # Comments
        def comments
          deliberation = ::Strategy::Deliberation.visible_to(current_member).find(params[:id])
          by_phase = deliberation.comments.includes(:author).order(:created_at).group_by(&:phase_at_creation)
          payload = ::Strategy::Deliberation::STATUSES.each_with_object({}) do |phase, acc|
            acc[phase] = (by_phase[phase] || []).map(&:as_json_brief)
          end
          render json: { commentsByPhase: payload }
        end

        def create_comment
          deliberation = ::Strategy::Deliberation.find(params[:id])
          if %w[cancelled decided].include?(deliberation.status)
            return render json: { error: "Les commentaires sont fermés pour cette phase" }, status: :unprocessable_entity
          end

          comment = deliberation.comments.build(comment_params)
          comment.author = current_member

          if comment.save
            render json: { comment: comment.as_json_brief }, status: :created
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy_comment
          comment = ::Strategy::DeliberationComment.find(params[:id])
          comment.destroy!
          head :no_content
        end

        private

        def ensure_effective_member
          return if current_member&.can_access_strategy?
          render json: { error: "Accès réservé aux membres effectifs" }, status: :forbidden
        end

        def owner?(deliberation)
          deliberation.created_by_id == current_member&.id
        end

        def forbid(message)
          render json: { error: message }, status: :forbidden
        end

        def deliberation_params
          params.permit(:title, :context)
        end

        def proposal_params
          params.permit(:content)
        end

        def reaction_params
          params.permit(:position, :rationale)
        end

        def comment_params
          params.permit(:content)
        end
      end
    end
  end
end
