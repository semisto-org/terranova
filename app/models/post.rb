# frozen_string_literal: true

# Message Board par projet (#118, epic #101 — Phase 4).
#
# Un Post est un message async structuré (annonce / proposition / compte-rendu)
# rattaché polymorphiquement à un Projectable (PoleProject, Design::Project,
# Academy::Training, Guild). C'est le foyer des « conversations sans objet hôte »
# qui remplace les annonces Slack (#106).
#
# Substrats réutilisés (déjà mergés) :
# - #102 commentable : `has_many :comments, as: :commentable` (aucune liste
#   fermée côté Comment).
# - #103 suivable    : include Subscribable → un membre suit un post.
# - #104 notifications + #110 Activity : à la création, on abonne les membres du
#   projet au post puis on émet UN ActivityEvent + le fan-out de Notification via
#   NotificationService.record! (séquence d'architecture du 11/06).
class Post < ApplicationRecord
  include SanitizesRichText
  include Subscribable

  belongs_to :projectable, polymorphic: true
  # optional + sans FK : aligné sur Comment#author (un membre supprimé ne doit
  # pas casser l'historique des messages).
  belongs_to :author, class_name: "Member", optional: true

  has_many :comments, as: :commentable, dependent: :destroy
  has_many :activity_events, as: :subject, dependent: :destroy

  validates :title, presence: true
  validates :body, presence: true

  sanitizes_rich_text :body,
    extra_tags: %w[span],
    extra_attributes: %w[data-type data-id data-label class]

  scope :recent_first, -> { order(created_at: :desc) }

  # Notifications (#104) + Activity (#110) — un seul ActivityEvent par post.
  after_create :subscribe_project_members
  after_create :record_creation_activity

  private

  # Abonne l'auteur et tous les membres du projet au post, pour que les
  # commentaires ultérieurs (et un futur suivi) les atteignent. L'auteur est
  # abonné explicitement (il a créé le post) ; les autres en auto.
  def subscribe_project_members
    auto_subscribe!(author) if author
    project_member_ids.each do |member_id|
      next if member_id == author&.id

      subscriptions.find_or_create_by!(member_id: member_id) { |s| s.state = "auto" }
    rescue ActiveRecord::RecordNotUnique
      next
    end
  end

  # Création d'un post → notifie les membres du projet (l'acteur exclu par le
  # service). L'ActivityEvent est écrit AVANT le fan-out (invariant #104).
  def record_creation_activity
    recipients = (project_member_ids - [author&.id].compact).uniq

    NotificationService.record!(
      action: "post_created",
      subject: self,
      actor: author,
      recipients: recipients
    )
  end

  # Membres du projet parent (abonnés implicites d'un nouveau post). Tolère un
  # projectable sans association `project_members`.
  def project_member_ids
    return [] unless projectable.respond_to?(:project_members)

    projectable.project_members.pluck(:id)
  end
end
