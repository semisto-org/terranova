# frozen_string_literal: true

module Api
  module V1
    module Strategy
      class DeliberationsController < BaseController
        before_action :ensure_effective_member

        def effective_members
          members = ::Member.where(membership_type: "effective", status: "active").order(:first_name, :last_name)
          render json: {
            members: members.map { |m|
              {
                id: m.id,
                firstName: m.first_name,
                lastName: m.last_name,
                avatar: m.avatar_url
              }
            }
          }
        end

        def index
          deliberations = ::Strategy::Deliberation.visible_to(current_member)
          deliberations = deliberations.by_status(params[:status])
          deliberations = deliberations.search(params[:search])
          deliberations = deliberations.order(created_at: :desc)
          render json: { deliberations: deliberations.map { |d| d.as_json_brief(current_member: current_member) } }
        end

        def show
          deliberation = ::Strategy::Deliberation.visible_to(current_member).find(params[:id])
          render json: { deliberation: deliberation.as_json_full(current_member: current_member) }
        end

        def create
          deliberation = ::Strategy::Deliberation.new(deliberation_params)
          deliberation.status = "draft"
          deliberation.created_by_id = current_member.id

          if deliberation.save
            render json: { deliberation: deliberation.as_json_full(current_member: current_member) }, status: :created
          else
            render json: { errors: deliberation.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut modifier") unless owner?(deliberation)
          return forbid("Modification autorisée uniquement en brouillon") unless deliberation.status == "draft"

          decider_ids_param = params[:decider_ids]

          ActiveRecord::Base.transaction do
            deliberation.update!(deliberation_params)
            sync_deciders!(deliberation, decider_ids_param) unless decider_ids_param.nil?
          end

          render json: { deliberation: deliberation.as_json_full(current_member: current_member) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def publish
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut publier") unless owner?(deliberation)

          unless deliberation.proposals.any?
            return render json: { error: "Une proposition est requise pour publier" }, status: :unprocessable_entity
          end
          if deliberation.decider_memberships.count < ::Strategy::Deliberation::MIN_DECIDERS
            return render json: {
              error: "Au moins #{::Strategy::Deliberation::MIN_DECIDERS} décideurs doivent être sélectionnés pour publier"
            }, status: :unprocessable_entity
          end

          deliberation.publish!
          render json: { deliberation: deliberation.as_json_full(current_member: current_member) }
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
          render json: { deliberation: deliberation.as_json_full(current_member: current_member) }
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
          render json: { deliberation: deliberation.as_json_full(current_member: current_member) }
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
          unless deliberation.decider?(current_member)
            return render json: { error: "Seuls les décideurs désignés peuvent voter sur cette proposition" }, status: :forbidden
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
          render json: { commentsByPhase: deliberation.send(:comments_grouped_by_phase, current_member: current_member) }
        end

        def create_comment
          deliberation = ::Strategy::Deliberation.find(params[:id])
          if %w[cancelled decided].include?(deliberation.status)
            return render json: { error: "Les commentaires sont fermés pour cette phase" }, status: :unprocessable_entity
          end

          comment = deliberation.comments.build(comment_params)
          comment.author = current_member

          if comment.save
            render json: { comment: comment.as_json_brief(current_member: current_member) }, status: :created
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_comment
          comment = ::Strategy::DeliberationComment.find(params[:id])
          return forbid("Seul l'auteur peut modifier son commentaire") unless comment.author_id == current_member&.id
          return forbid("Un commentaire supprimé ne peut pas être modifié") if comment.deleted?

          new_content = params[:content]
          if new_content.blank?
            return render json: { errors: ["Le contenu est obligatoire"] }, status: :unprocessable_entity
          end

          if comment.update(content: new_content, edited_at: Time.current)
            render json: { comment: comment.as_json_brief(current_member: current_member) }
          else
            render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy_comment
          comment = ::Strategy::DeliberationComment.find(params[:id])
          return forbid("Seul l'auteur peut supprimer son commentaire") unless comment.author_id == current_member&.id

          comment.soft_delete!
          head :no_content
        end

        # Comment reactions
        def create_comment_reaction
          comment = ::Strategy::DeliberationComment.find(params[:id])
          emoji = params[:emoji]
          unless ::Strategy::CommentReaction::EMOJIS.include?(emoji)
            return render json: { error: "Emoji non supporté" }, status: :unprocessable_entity
          end

          reaction = comment.reactions.find_or_initialize_by(member: current_member, emoji: emoji)
          if reaction.new_record? && !reaction.save
            return render json: { errors: reaction.errors.full_messages }, status: :unprocessable_entity
          end

          comment.reload
          render json: { comment: comment.as_json_brief(current_member: current_member) }, status: :created
        end

        def destroy_comment_reaction
          comment = ::Strategy::DeliberationComment.find(params[:id])
          emoji = params[:emoji]
          comment.reactions.where(member: current_member, emoji: emoji).destroy_all
          comment.reload
          render json: { comment: comment.as_json_brief(current_member: current_member) }
        end

        # Attachments
        def create_attachment
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut ajouter un document") unless owner?(deliberation)
          unless deliberation.can_manage_attachments?
            return render json: { error: "Les documents ne peuvent être modifiés qu'en brouillon ou en discussion" }, status: :unprocessable_entity
          end

          file = params[:file]
          if file.blank?
            return render json: { error: "Fichier manquant" }, status: :unprocessable_entity
          end

          existing_ids = deliberation.attachments.attachments.pluck(:id)
          deliberation.attachments.attach(file)
          attachment = deliberation.attachments.attachments.where.not(id: existing_ids).order(:id).last
          render json: { attachment: serialize_attachment(attachment) }, status: :created
        end

        def destroy_attachment
          deliberation = ::Strategy::Deliberation.find(params[:id])
          return forbid("Seul l'auteur peut supprimer un document") unless owner?(deliberation)
          unless deliberation.can_manage_attachments?
            return render json: { error: "Les documents ne peuvent être modifiés qu'en brouillon ou en discussion" }, status: :unprocessable_entity
          end

          attachment = deliberation.attachments.attachments.find_by(id: params[:attachment_id])
          return render json: { error: "Document introuvable" }, status: :not_found unless attachment

          attachment.purge
          head :no_content
        end

        private

        def serialize_attachment(attachment)
          {
            id: attachment.id,
            filename: attachment.filename.to_s,
            url: Rails.application.routes.url_helpers.rails_blob_path(attachment, only_path: true),
            contentType: attachment.content_type,
            byteSize: attachment.byte_size
          }
        end

        def sync_deciders!(deliberation, raw_ids)
          target_ids = Array(raw_ids).map(&:to_i).uniq.reject(&:zero?)

          if target_ids.any?
            effective_count = ::Member.where(id: target_ids, membership_type: "effective").count
            if effective_count != target_ids.size
              deliberation.errors.add(:deciders, "doivent tous être des membres effectifs")
              raise ActiveRecord::RecordInvalid.new(deliberation)
            end
          end

          existing_ids = deliberation.decider_memberships.pluck(:member_id)
          to_add = target_ids - existing_ids
          to_remove = existing_ids - target_ids

          deliberation.decider_memberships.where(member_id: to_remove).destroy_all if to_remove.any?
          to_add.each do |mid|
            deliberation.decider_memberships.create!(member_id: mid)
          end
        end

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
          params.permit(:content, :parent_id)
        end
      end
    end
  end
end
