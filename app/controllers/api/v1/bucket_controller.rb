# frozen_string_literal: true

module Api
  module V1
    class BucketController < BaseController
      before_action :set_projectable, only: [:index, :create]
      before_action :set_transaction, only: [:destroy]
      before_action :require_admin, only: [:create, :destroy]

      # GET /api/v1/projects/:type/:id/bucket
      def index
        txns = @projectable.bucket_transactions.order(date: :desc, created_at: :desc)
        credits = txns.where(kind: "credit").sum(:amount)
        debits = txns.where(kind: "debit").sum(:amount)

        render json: {
          transactions: txns.map { |t| serialize_transaction(t) },
          totalCredits: credits.to_f,
          totalDebits: debits.to_f,
          balance: (credits - debits).to_f
        }
      end

      # POST /api/v1/projects/:type/:id/bucket
      def create
        txn = @projectable.bucket_transactions.build(transaction_params)
        txn.recorded_by_id = current_member.id
        txn.recorded_by_name = "#{current_member.first_name} #{current_member.last_name}".strip

        if txn.member_id.present?
          member = Member.find(txn.member_id)
          txn.member_name = "#{member.first_name} #{member.last_name}".strip
        end

        if txn.save
          render json: serialize_transaction(txn), status: :created
        else
          render json: { errors: txn.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/bucket/:id
      def destroy
        @transaction.soft_delete!
        head :no_content
      end

      private

      def set_projectable
        type_key = params[:type]
        klass_name = Projectable::PROJECT_TYPE_KEYS.key(type_key)
        raise ActiveRecord::RecordNotFound, "Unknown project type: #{type_key}" unless klass_name

        @projectable = klass_name.constantize.find(params[:id])
      end

      def set_transaction
        @transaction = BucketTransaction.find(params[:id])
      end

      def require_admin
        unless current_member&.is_admin?
          render json: { error: "Accès non autorisé" }, status: :forbidden
        end
      end

      def transaction_params
        params.expect(bucket: [:kind, :amount, :description, :date, :member_id])
      end

      def serialize_transaction(txn)
        {
          id: txn.id.to_s,
          kind: txn.kind,
          amount: txn.amount.to_f,
          description: txn.description,
          date: txn.date.iso8601,
          memberId: txn.member_id&.to_s,
          memberName: txn.member_name,
          recordedById: txn.recorded_by_id.to_s,
          recordedByName: txn.recorded_by_name,
          createdAt: txn.created_at.iso8601
        }
      end
    end
  end
end
