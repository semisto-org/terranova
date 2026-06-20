module Academy
  class Training < ApplicationRecord
    include SoftDeletable
    include Projectable
    self.table_name = 'academy_trainings'

    # « in_construction » retiré (fusionné dans « in_preparation », séance 2).
    STATUSES = %w[
      idea in_preparation registrations_open
      in_progress post_production completed cancelled
    ].freeze
    REGISTRATION_MODES = %w[open closed].freeze

    belongs_to :training_type, class_name: 'Academy::TrainingType'
    has_many :sessions, class_name: 'Academy::TrainingSession', foreign_key: :training_id, dependent: :destroy
    has_many :registrations, class_name: 'Academy::TrainingRegistration', foreign_key: :training_id, dependent: :destroy
    has_many :documents, class_name: 'Academy::TrainingDocument', foreign_key: :training_id, dependent: :destroy
    has_many :participant_categories, class_name: 'Academy::ParticipantCategory', foreign_key: :training_id, dependent: :destroy
    has_many :packs, class_name: 'Academy::TrainingPack', foreign_key: :training_id, dependent: :destroy
    has_one :album, as: :albumable, dependent: :destroy

    validates :title, :status, presence: true
    after_update :create_album_when_in_preparation, if: :saved_change_to_status?
    # Amorce les tâches automatiques de portée « activité » à la création
    # (dates affinées au fur et à mesure que des sessions sont ajoutées).
    after_create_commit :seed_template_tasks
    validates :status, inclusion: { in: STATUSES }
    validates :registration_mode, inclusion: { in: REGISTRATION_MODES }, allow_blank: true
    validates :vat_rate, numericality: { greater_than_or_equal_to: 0, less_than: 100 }
    validates :deposit_amount, numericality: { greater_than_or_equal_to: 0 }

    # Soft-delete en cascade (#137). `SoftDeletable#soft_delete!` fait un
    # `update_column` qui saute les callbacks : `dependent: :destroy` ne
    # s'exécute donc pas, et les enfants (inscriptions, sessions, packs…)
    # deviennent orphelins — leur parent masqué par le default_scope. Ces
    # orphelins cassaient l'index Academy (500). On masque explicitement les
    # enfants SoftDeletable avant de masquer la formation.
    def soft_delete!
      transaction do
        sessions.each(&:soft_delete!)
        registrations.each(&:soft_delete!)
        documents.each(&:soft_delete!)
        participant_categories.each(&:soft_delete!)
        packs.each(&:soft_delete!)
        album&.soft_delete!
        super
      end
    end

    def price_excl_vat
      vat_rate.to_f > 0 ? (price / (1 + vat_rate / 100.0)).round(2) : price
    end

    # Première date de session (min start_date) ; nil si aucune session.
    def first_session_date
      sessions.filter_map(&:start_date).min
    end

    # Dernière date de session (max end_date, sinon start_date) ; nil si aucune.
    def last_session_date
      sessions.filter_map { |s| s.end_date || s.start_date }.max
    end

    # Recettes HTVA — somme des paiements participants hors TVA.
    # Calcul identique à l'action `reporting` du contrôleur Academy.
    def revenue_excl_vat
      vr = vat_rate.to_f
      registrations.sum do |r|
        vr > 0 ? (r.amount_paid.to_f / (1 + vr / 100.0)).round(2) : r.amount_paid.to_f
      end
    end

    # Dépenses HTVA attribuées à l'activité (multi-projets réparties incluses).
    def expenses_excl_vat
      attributed_expenses.sum { |e| e.attributed_amount_excl_vat_for(self).to_f }
    end

    # Marge en euros : recettes HTVA − dépenses HTVA.
    def profit_excl_vat
      revenue_excl_vat - expenses_excl_vat
    end

    # Marge en ratio (0..1) ; nil si recettes nulles (% non calculable).
    def profit_margin
      rev = revenue_excl_vat
      return nil if rev.zero?

      profit_excl_vat / rev
    end

    # Nombre d'inscriptions ayant un paiement (cohérent avec les recettes).
    def paid_registrations_count
      registrations.select { |r| r.amount_paid.to_f > 0 }.size
    end

    # Tarifs disponibles : prix des catégories de participants (packs exclus).
    def category_prices
      participant_categories.sort_by { |c| c.position.to_i }.map { |c| c.price.to_f }
    end

    def total_capacity
      participant_categories.sum(:max_spots)
    end

    def total_spots_taken
      participant_categories.sum(&:spots_taken)
    end

    def total_spots_remaining
      total_capacity - total_spots_taken
    end

    private

    def seed_template_tasks
      Academy::TaskGenerator.for_training(self)
    rescue StandardError => e
      Rails.logger.warn("[Academy::TaskGenerator] training #{id}: #{e.message}")
    end

    def create_album_when_in_preparation
      return unless status == "in_preparation"
      return if album.present?

      create_album!(title: title, albumable: self)
    end
  end
end
