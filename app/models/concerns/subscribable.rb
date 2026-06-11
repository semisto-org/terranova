# frozen_string_literal: true

# Objets suivables (#103) — v1 : Task, Event, Strategy::Deliberation.
# Sémantique actée (10-11/06) :
# - l'abonnement AUTO ne crée jamais d'état par-dessus une position explicite
#   (un `unsubscribed` n'est jamais écrasé par un auto futur) ;
# - le suivi EXPLICITE prime sur le mute du projet parent ;
# - `notifiable_member_ids` est le point de consommation prévu pour #104.
module Subscribable
  extend ActiveSupport::Concern

  included do
    has_many :subscriptions, as: :subscribable, dependent: :destroy
  end

  def subscription_for(member)
    return nil if member.nil?

    subscriptions.find_by(member_id: member.id)
  end

  def subscribed?(member)
    !!subscription_for(member)&.active?
  end

  # Abonnement implicite — no-op si le membre a déjà une position (quelle
  # qu'elle soit) : on ne dégrade jamais un explicit, on ne ressuscite jamais
  # un unsubscribed.
  def auto_subscribe!(member)
    return if member.nil?
    return if subscriptions.exists?(member_id: member.id)

    subscriptions.create!(member_id: member.id, state: "auto")
  rescue ActiveRecord::RecordNotUnique
    nil # course concurrente : une position existe déjà — on ne l'écrase pas
  end

  # Suivi choisi — prime sur le mute projet.
  def subscribe!(member)
    sub = subscriptions.find_or_initialize_by(member_id: member.id)
    sub.update!(state: "explicit")
    sub
  end

  # Désabonnement choisi — bloque définitivement les autos futurs.
  def unsubscribe!(member)
    sub = subscriptions.find_or_initialize_by(member_id: member.id)
    sub.update!(state: "unsubscribed")
    sub
  end

  # Projet parent au sens "mute" (nil si l'objet n'a pas de projet — cas des
  # délibérations, muables individuellement via unsubscribe!).
  def notification_project
    if respond_to?(:task_list) && task_list&.taskable.is_a?(ApplicationRecord)
      task_list.taskable
    elsif respond_to?(:projectable)
      projectable
    end
  end

  # Membres à notifier pour cet objet — consommé par le service de
  # notifications (#104). Abonnés actifs, moins les autos dont le projet
  # parent est muté (les explicit passent à travers le mute).
  def notifiable_member_ids
    subs = subscriptions.active.to_a
    project = notification_project
    return subs.map(&:member_id) unless project.respond_to?(:muted_member_ids)

    muted_ids = project.muted_member_ids
    subs.reject { |s| s.state == "auto" && muted_ids.include?(s.member_id) }
        .map(&:member_id)
  end
end
