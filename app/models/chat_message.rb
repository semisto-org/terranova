# frozen_string_literal: true

# Message Campfire (#145, tranche 119a) — chat léger par projet (epic #101,
# Phase 4). Polymorphe `projectable` : n'importe quel projet (PoleProject,
# Academy::Training, Design::Project, Guild) porte son salon.
#
# Doctrine calme (Basecamp) : un message de chat NE notifie PAS en soi ;
# seule une @mention crée une entrée Hey! (#104). Les @mentions sont extraites
# côté serveur depuis le HTML TipTap (<span data-type="mention" data-id="…">),
# exactement comme Comment (#102), puis consommées par NotificationService.
#
# PAS de diffusion temps réel ici (ActionCable / solid_cable = tranche 119b) —
# uniquement le socle + la couche REST.
class ChatMessage < ApplicationRecord
  include SanitizesRichText

  MENTION_SELECTOR = 'span[data-type="mention"]'

  belongs_to :projectable, polymorphic: true
  # optional + sans FK : aligné sur Comment (#102) et le pattern de la couche.
  belongs_to :author, class_name: "Member", optional: true

  validates :body, presence: true

  sanitizes_rich_text :body,
    extra_tags: %w[span],
    extra_attributes: %w[data-type data-id data-label class]

  scope :ordered, -> { order(created_at: :asc, id: :asc) }

  # Notifications (#104) — APRÈS save pour que le body sanitizé soit en place.
  # Doctrine calme : un seul ActivityEvent par message, fan-out UNIQUEMENT vers
  # les membres @mentionnés (pas d'abonnés : un message ambiant ne notifie pas).
  # Sans @mention → aucun destinataire → aucune Notification.
  after_create :record_mention_notifications

  # Ids des membres mentionnés dans le body (uniquement ceux qui existent).
  def mentioned_member_ids
    fragment = Nokogiri::HTML.fragment(body.to_s)
    raw_ids = fragment.css(MENTION_SELECTOR).filter_map { |node| node["data-id"].presence }.uniq
    Member.where(id: raw_ids).pluck(:id)
  end

  # Projet parent pour le filtrage cross-projets du flux Activity (#110).
  def notification_project
    projectable
  end

  private

  def record_mention_notifications
    mentioned_ids = mentioned_member_ids
    return if mentioned_ids.empty?

    NotificationService.record!(
      action: "chat_message_mentioned",
      subject: self,
      actor: author,
      recipients: mentioned_ids,
      kind_for: ->(_recipient_id) { "mention" }
    )
  end
end
