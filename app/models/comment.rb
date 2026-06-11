# frozen_string_literal: true

# Commentaire polymorphe (#102) — substrat générique de la couche Basecamp
# (epic #101). Aucune liste fermée de commentable_type : câbler un nouveau
# parent = déclarer `has_many :comments, as: :commentable` + ses routes.
#
# Les @mentions sont extraites côté serveur depuis le HTML TipTap
# (<span data-type="mention" data-id="…">) et persistées en `Mention`,
# pour que le service de notifications (#104) puisse les consommer.
class Comment < ApplicationRecord
  include SanitizesRichText

  MENTION_SELECTOR = 'span[data-type="mention"]'

  belongs_to :commentable, polymorphic: true
  # optional + sans FK : aligné sur la forme de table déjà présente dans
  # schema.rb (cf. note de la migration) et sur le pattern DeliberationComment.
  belongs_to :author, class_name: "Member", optional: true

  has_many :mentions, dependent: :destroy
  has_many :mentioned_members, through: :mentions, source: :member

  validates :body, presence: true

  sanitizes_rich_text :body,
    extra_tags: %w[span],
    extra_attributes: %w[data-type data-id data-label class]

  after_save :sync_mentions!, if: :saved_change_to_body?
  # Abonnement auto (#103) : commenter = suivre l'objet commenté.
  after_create :auto_subscribe_author
  # Notifications (#104) — en after_save déclaré APRÈS sync_mentions! pour que
  # les mentions soient extraites et les mentionnés abonnés avant le fan-out.
  # (after_create s'exécuterait AVANT les after_save → mentions invisibles.)
  after_save :record_creation_activity, if: :previously_new_record?

  has_many :activity_events, as: :subject, dependent: :destroy

  scope :ordered, -> { order(created_at: :asc) }

  # Ids des membres mentionnés dans le corps (uniquement ceux qui existent).
  def mentioned_member_ids_from_body
    fragment = Nokogiri::HTML.fragment(body.to_s)
    raw_ids = fragment.css(MENTION_SELECTOR).filter_map { |node| node["data-id"].presence }.uniq
    Member.where(id: raw_ids).pluck(:id)
  end

  private

  def auto_subscribe_author
    return unless commentable.respond_to?(:auto_subscribe!)

    commentable.auto_subscribe!(author)
  end

  # Un seul ActivityEvent par commentaire ; le fan-out distingue les kinds :
  # `mention` pour les membres mentionnés, `comment` pour les autres abonnés.
  def record_creation_activity
    mentioned_ids = mentions.pluck(:member_id)
    subscriber_ids = commentable.respond_to?(:notifiable_member_ids) ? commentable.notifiable_member_ids : []

    NotificationService.record!(
      action: "comment_created",
      subject: self,
      actor: author,
      recipients: subscriber_ids | mentioned_ids,
      kind_for: ->(recipient_id) { mentioned_ids.include?(recipient_id) ? "mention" : "comment" }
    )
  end

  def sync_mentions!
    target_ids = mentioned_member_ids_from_body
    current_ids = mentions.pluck(:member_id)

    mentions.where(member_id: current_ids - target_ids).destroy_all
    (target_ids - current_ids).each { |member_id| mentions.create!(member_id: member_id) }

    # Abonnement auto (#103) : être @mentionné = suivre l'objet du commentaire.
    if commentable.respond_to?(:auto_subscribe!)
      Member.where(id: target_ids - current_ids).find_each { |m| commentable.auto_subscribe!(m) }
    end
  end
end
