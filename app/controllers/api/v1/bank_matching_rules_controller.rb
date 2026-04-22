# frozen_string_literal: true

module Api
  module V1
    class BankMatchingRulesController < BaseController
      before_action :require_effective_member
      before_action :set_rule, only: [:update, :destroy]

      def index
        rules = BankMatchingRule.order(created_at: :desc).includes(:suggested_supplier_contact, :suggested_expense_category, :created_by, :organization)
        render json: { items: rules.map { |r| serialize(r) } }
      end

      def create
        rule = BankMatchingRule.new(rule_params)
        rule.created_by = current_member
        if rule.save
          render json: serialize(rule.reload), status: :created
        else
          render json: { error: rule.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update
        if @rule.update(rule_params)
          render json: serialize(@rule.reload)
        else
          render json: { error: @rule.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy
        @rule.destroy!
        head :no_content
      end

      # GET /api/v1/bank/transactions/:id/applicable_rules
      def applicable
        transaction = BankTransaction.find(params.require(:id))
        rules = BankMatchingRule.applicable_to(transaction)
        render json: { items: rules.map { |r| serialize(r) } }
      end

      private

      def set_rule
        @rule = BankMatchingRule.find(params[:id])
      end

      def rule_params
        params.permit(
          :organization_id, :pattern_field, :pattern_value,
          :suggested_supplier_contact_id, :suggested_expense_category_id,
          :suggested_expense_type, :suggested_vat_rate, :notes
        )
      end

      def serialize(rule)
        {
          id: rule.id.to_s,
          organizationId: rule.organization_id&.to_s,
          organizationName: rule.organization&.name,
          patternField: rule.pattern_field,
          patternValue: rule.pattern_value,
          suggestedSupplierContactId: rule.suggested_supplier_contact_id&.to_s,
          suggestedSupplierContactName: rule.suggested_supplier_contact&.name,
          suggestedExpenseCategoryId: rule.suggested_expense_category_id&.to_s,
          suggestedExpenseCategoryLabel: rule.suggested_expense_category&.label,
          suggestedExpenseType: rule.suggested_expense_type,
          suggestedVatRate: rule.suggested_vat_rate,
          notes: rule.notes.to_s,
          appliedCount: rule.applied_count,
          lastAppliedAt: rule.last_applied_at&.iso8601,
          createdBy: rule.created_by ? { id: rule.created_by.id.to_s, name: "#{rule.created_by.first_name} #{rule.created_by.last_name}" } : nil,
          createdAt: rule.created_at.iso8601,
          updatedAt: rule.updated_at.iso8601
        }
      end
    end
  end
end
