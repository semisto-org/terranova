# frozen_string_literal: true

# Garde-fou finance au niveau MODÈLE (#159) : un enregistrement financier
# (Revenue, Expense, ExpenseProjectAllocation) ne peut pas être rattaché à un
# projectable qui refuse la finance (ex. Design::Project interne). L'interdit
# vit dans le modèle, pas seulement dans l'UI : « il ne faut pas POUVOIR gérer
# les finances ». Les projectables qui ne définissent pas accepts_finance?
# (PoleProject, Academy::Training, Guild…) ne sont pas contraints.
module FinanceGuarded
  extend ActiveSupport::Concern

  included do
    validate :projectable_accepts_finance
  end

  private

  def projectable_accepts_finance
    return if projectable.nil?
    return unless projectable.respond_to?(:accepts_finance?)
    return if projectable.accepts_finance?

    errors.add(:projectable, "n'accepte aucune finance (projet interne)")
  end
end
