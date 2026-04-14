module Api
  module V1
    class ExpenseNotesController < BaseController
      before_action :require_admin!, except: [:index, :show, :pdf]
      before_action :load_expense_note, only: [:show, :update, :destroy, :update_status, :pdf]

      def index
        scope = ExpenseNote.includes(:contact, :organization, :lines).order(created_at: :desc)
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = scope.where(contact_id: params[:contact_id]) if params[:contact_id].present?
        if params[:q].present?
          q = "%#{params[:q].to_s.downcase}%"
          scope = scope.where("LOWER(subject) LIKE ? OR LOWER(number) LIKE ?", q, q)
        end

        render json: { items: scope.map { |n| serialize(n) } }
      end

      def show
        render json: serialize(@expense_note, full: true)
      end

      def create
        note = ExpenseNote.new(expense_note_params)
        note.save!
        render json: serialize(note.reload, full: true), status: :created
      end

      def update
        @expense_note.update!(expense_note_params)
        render json: serialize(@expense_note.reload, full: true)
      end

      def destroy
        unless @expense_note.status == "draft"
          render json: { error: "Seules les notes en brouillon peuvent être supprimées" }, status: :unprocessable_entity
          return
        end
        @expense_note.soft_delete!
        head :no_content
      end

      def update_status
        new_status = params.require(:status)
        unless ExpenseNote::STATUSES.include?(new_status)
          render json: { error: "Statut invalide" }, status: :unprocessable_entity
          return
        end
        @expense_note.update!(status: new_status)
        render json: serialize(@expense_note.reload, full: true)
      end

      def pdf
        pdf_data = ExpenseNotePdf.new(@expense_note).render
        org_name = @expense_note.organization.name.to_s.split(/\s+/).first.presence || "Semisto"
        send_data pdf_data,
                  filename: "#{org_name} - Note de frais #{@expense_note.number}.pdf",
                  type: "application/pdf",
                  disposition: params[:download].present? ? "attachment" : "inline"
      end

      private

      def load_expense_note
        @expense_note = ExpenseNote.includes(:contact, :organization, :lines).find(params[:id])
      end

      def require_admin!
        unless current_member&.is_admin?
          render json: { error: "Accès réservé aux administrateurs" }, status: :forbidden
        end
      end

      def expense_note_params
        params.require(:expense_note).permit(
          :subject, :note_date, :status, :contact_id, :organization_id, :notes,
          lines_attributes: [:id, :label, :unit_amount_cents, :quantity, :position, :_destroy]
        )
      end

      def serialize(note, full: false)
        data = {
          id: note.id.to_s,
          number: note.number,
          subject: note.subject,
          noteDate: note.note_date.iso8601,
          status: note.status,
          contactId: note.contact_id.to_s,
          contactName: note.contact.display_name,
          organizationId: note.organization_id.to_s,
          organizationName: note.organization.name,
          totalCents: note.total_cents.to_i,
          totalAmount: note.total_amount,
          notes: note.notes,
          createdAt: note.created_at.iso8601,
          updatedAt: note.updated_at.iso8601
        }
        if full
          data[:lines] = note.lines.map { |line|
            {
              id: line.id.to_s,
              label: line.label,
              quantity: line.quantity.to_f,
              unitAmountCents: line.unit_amount_cents.to_i,
              lineTotalCents: line.line_total_cents.to_i,
              position: line.position
            }
          }
          data[:contact] = {
            id: note.contact.id.to_s,
            name: note.contact.display_name,
            email: note.contact.email,
            address: note.contact.address
          }
          data[:organization] = serialize_organization(note.organization)
        end
        data
      end

      def serialize_organization(org)
        {
          id: org.id.to_s,
          name: org.name,
          legalForm: org.legal_form,
          registrationNumber: org.registration_number,
          address: org.address,
          iban: org.iban,
          email: org.email,
          phone: org.phone,
          isDefault: org.is_default,
          logoUrl: org.logo.attached? ? Rails.application.routes.url_helpers.rails_blob_url(org.logo, only_path: true) : nil
        }
      end
    end
  end
end
