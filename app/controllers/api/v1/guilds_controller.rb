# frozen_string_literal: true

module Api
  module V1
    class GuildsController < BaseController
      before_action :require_effective_member
      before_action :set_guild, only: [
        :show, :update, :destroy,
        :list_documents, :create_document, :destroy_document,
        :list_task_lists, :create_task_list, :update_task_list, :destroy_task_list,
        :create_action, :update_action, :destroy_action,
        :list_credentials, :create_credential, :update_credential, :reveal_credential, :destroy_credential,
        :add_member, :remove_member
      ]

      # GET /api/v1/guilds
      def index
        guilds = Guild.includes(:project_memberships, :lab).order(:name)
        guilds = guilds.where(guild_type: params[:guild_type]) if params[:guild_type].present?
        guilds = guilds.where(lab_id: params[:lab_id]) if params[:lab_id].present?

        render json: { guilds: guilds.map { |g| serialize_guild_brief(g) } }
      end

      # GET /api/v1/guilds/:id
      def show
        render json: { guild: serialize_guild_full(@guild) }
      end

      # POST /api/v1/guilds
      def create
        guild = Guild.new(guild_params)
        if guild.save
          render json: { guild: serialize_guild_brief(guild) }, status: :created
        else
          render json: { errors: guild.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/guilds/:id
      def update
        if @guild.update(guild_params)
          render json: { guild: serialize_guild_brief(@guild) }
        else
          render json: { errors: @guild.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/guilds/:id
      def destroy
        @guild.destroy!
        head :no_content
      end

      # --- Documents ---

      def list_documents
        docs = @guild.documents.order(created_at: :desc)
        docs = docs.by_tag(params[:tag]) if params[:tag].present?
        render json: { documents: docs.map { |d| serialize_document(d) } }
      end

      def create_document
        doc = @guild.documents.build(document_params)
        doc.uploaded_by_id = current_member&.id
        if doc.save
          render json: { document: serialize_document(doc) }, status: :created
        else
          render json: { errors: doc.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy_document
        doc = @guild.documents.find(params[:id])
        doc.destroy!
        head :no_content
      end

      # --- Task Lists ---

      def list_task_lists
        lists = @guild.unified_task_lists.includes(:actions).order(:position, :id)
        render json: { taskLists: lists.map { |l| serialize_task_list(l) } }
      end

      def create_task_list
        list = @guild.unified_task_lists.build(task_list_params)
        if list.save
          render json: { taskList: serialize_task_list(list) }, status: :created
        else
          render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update_task_list
        list = @guild.unified_task_lists.find(params[:id])
        if list.update(task_list_params)
          render json: { taskList: serialize_task_list(list) }
        else
          render json: { errors: list.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy_task_list
        list = @guild.unified_task_lists.find(params[:id])
        list.destroy!
        head :no_content
      end

      # --- Actions ---

      def create_action
        list = @guild.unified_task_lists.find(params[:task_list_id])
        action = list.actions.build(action_params)
        action.guild = @guild
        if action.save
          render json: { action: serialize_action(action) }, status: :created
        else
          render json: { errors: action.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update_action
        action = Action.find(params[:id])
        if action.update(action_params)
          render json: { action: serialize_action(action) }
        else
          render json: { errors: action.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy_action
        action = Action.find(params[:id])
        action.destroy!
        head :no_content
      end

      # --- Credentials ---

      def list_credentials
        render json: { credentials: @guild.credentials.map { |c| serialize_credential(c) } }
      end

      def create_credential
        cred = @guild.credentials.build(credential_params)
        cred.created_by_id = current_member&.id
        if cred.save
          render json: { credential: serialize_credential(cred) }, status: :created
        else
          render json: { errors: cred.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update_credential
        cred = @guild.credentials.find(params[:id])
        if cred.update(credential_params)
          render json: { credential: serialize_credential(cred) }
        else
          render json: { errors: cred.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def reveal_credential
        cred = @guild.credentials.find(params[:id])
        render json: { credential: serialize_credential(cred, reveal: true) }
      end

      def destroy_credential
        cred = @guild.credentials.find(params[:id])
        cred.destroy!
        head :no_content
      end

      # --- Members ---

      def add_member
        membership = @guild.project_memberships.build(member_id: params[:member_id], role: "member")
        if membership.save
          render json: { memberIds: @guild.project_memberships.where(role: "member").pluck(:member_id).map(&:to_s) }, status: :created
        else
          render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def remove_member
        membership = @guild.project_memberships.find_by!(member_id: params[:member_id])
        membership.destroy!
        head :no_content
      end

      private

      def set_guild
        @guild = Guild.find(params[:guild_id] || params[:id])
      end

      def guild_params
        params.permit(:name, :description, :color, :guild_type, :lab_id, :icon, :leader_id)
      end

      def document_params
        params.permit(:name, :file, tags: [])
      end

      def task_list_params
        params.permit(:name, :position)
      end

      def action_params
        params.permit(:name, :status, :due_date, :assignee_name, :priority, :position, :parent_id, tags: [])
      end

      def credential_params
        params.permit(:service_name, :username, :password, :url, :notes)
      end

      # --- Serializers ---

      def serialize_guild_brief(guild)
        {
          id: guild.id.to_s,
          name: guild.name,
          description: guild.description,
          color: guild.color,
          guildType: guild.guild_type,
          labId: guild.lab_id&.to_s,
          labName: guild.lab&.name,
          icon: guild.icon,
          leaderId: guild.leader_id&.to_s,
          memberIds: guild.project_memberships.where(role: "member").map { |pm| pm.member_id.to_s },
          memberCount: guild.project_memberships.where(role: "member").size,
          createdAt: guild.created_at&.iso8601
        }
      end

      def serialize_guild_full(guild)
        serialize_guild_brief(guild).merge(
          documents: guild.documents.order(created_at: :desc).map { |d| serialize_document(d) },
          taskLists: guild.unified_task_lists.includes(:actions).order(:position, :id).map { |l| serialize_task_list(l) },
          knowledgeSections: guild.knowledge_sections.ordered.map(&:as_json_brief),
          credentials: guild.credentials.map { |c| serialize_credential(c) }
        )
      end

      def serialize_document(doc)
        {
          id: doc.id.to_s,
          name: doc.name,
          tags: doc.tags || [],
          uploadedById: doc.uploaded_by_id&.to_s,
          fileUrl: doc.file.attached? ? Rails.application.routes.url_helpers.rails_blob_path(doc.file, only_path: true) : nil,
          fileName: doc.file.attached? ? doc.file.filename.to_s : nil,
          contentType: doc.file.attached? ? doc.file.content_type : nil,
          byteSize: doc.file.attached? ? doc.file.byte_size : nil,
          createdAt: doc.created_at&.iso8601
        }
      end

      def serialize_task_list(list)
        {
          id: list.id.to_s,
          name: list.name,
          position: list.position,
          actions: list.actions.order(:position, :id).map { |a| serialize_action(a) }
        }
      end

      def serialize_action(action)
        {
          id: action.id.to_s,
          name: action.name,
          status: action.status,
          dueDate: action.due_date&.iso8601,
          assigneeName: action.assignee_name,
          priority: action.priority,
          position: action.position,
          tags: action.tags || [],
          parentId: action.parent_id&.to_s
        }
      end

      def serialize_credential(cred, reveal: false)
        data = {
          id: cred.id.to_s,
          serviceName: cred.service_name,
          username: cred.username,
          url: cred.url,
          notes: cred.notes,
          createdById: cred.created_by_id&.to_s,
          createdAt: cred.created_at&.iso8601,
          hasPassword: cred.password.present?
        }
        data[:password] = cred.password if reveal
        data
      end
    end
  end
end
