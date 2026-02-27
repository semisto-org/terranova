# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class DeliberationsController < BaseController
        def index
          deliberations = ::Strategy::Deliberation.all
          deliberations = deliberations.by_status(params[:status])
          deliberations = deliberations.search(params[:search])
          deliberations = deliberations.order(created_at: :desc)

          render json: { deliberations: deliberations.map(&:as_json_brief) }
        end

        def show
          deliberation = ::Strategy::Deliberation.find(params[:id])
          render json: { deliberation: deliberation.as_json_full }
        end

        def create
          deliberation = ::Strategy::Deliberation.new(deliberation_params)
          deliberation.created_by_id = current_member&.id

          if deliberation.save
            render json: { deliberation: deliberation.as_json_full }, status: :created
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          deliberation = ::Strategy::Deliberation.find(params[:id])

          if deliberation.update(deliberation_params)
            render json: { deliberation: deliberation.as_json_full }
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          deliberation = ::Strategy::Deliberation.find(params[:id])
          deliberation.destroy!
          head :no_content
        end

        def decide
          deliberation = ::Strategy::Deliberation.find(params[:id])
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

          if proposal.update(proposal_params)
            render json: { proposal: proposal.as_json_full }
          else
            render json: { errors: proposal.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy_proposal
          proposal = ::Strategy::Proposal.find(params[:id])
          proposal.destroy!
          head :no_content
        end

        # Reactions
        def create_reaction
          proposal = ::Strategy::Proposal.find(params[:id])
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
          deliberation = ::Strategy::Deliberation.find(params[:id])
          render json: { comments: deliberation.comments.ordered.map(&:as_json_brief) }
        end

        def create_comment
          deliberation = ::Strategy::Deliberation.find(params[:id])
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

        def deliberation_params
          params.permit(:title, :context, :status, :decision_mode)
        end

        def proposal_params
          params.permit(:content, :status)
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
