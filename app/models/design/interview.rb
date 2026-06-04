module Design
  # Entrevue du/des porteur·s (étape Observation / entrevue) : questionnaire structuré
  # rempli par le designer + enregistrement audio de l'entrevue. Un par projet.
  class Interview < ApplicationRecord
    self.table_name = 'design_interviews'

    # Jeu de questions guidé de l'entrevue porteur.
    QUESTIONS = [
      { key: 'objectifs', label: 'Objectifs et motivations du/des porteur·s' },
      { key: 'usages', label: 'Usages et activités prévus sur le site' },
      { key: 'contraintes', label: 'Contraintes connues (temps, budget, accès, réglementation)' },
      { key: 'vision', label: 'Vision à 10-15 ans' },
      { key: 'ressources', label: 'Ressources humaines et matérielles disponibles' },
      { key: 'attentes', label: 'Attentes vis-à-vis de Semisto' }
    ].freeze

    QUESTION_KEYS = QUESTIONS.map { |q| q[:key] }.freeze

    belongs_to :project, class_name: 'Design::Project', foreign_key: :project_id
    has_one_attached :audio

    validate :responses_keys_are_known

    # Fusionne les réponses entrantes (déjà filtrées sur les clés connues par le contrôleur).
    def assign_responses(incoming)
      self.responses = (responses || {}).merge(incoming.to_h.stringify_keys.slice(*QUESTION_KEYS))
    end

    private

    def responses_keys_are_known
      unknown = (responses || {}).keys.map(&:to_s) - QUESTION_KEYS
      errors.add(:responses, "clés inconnues : #{unknown.join(', ')}") if unknown.any?
    end
  end
end
