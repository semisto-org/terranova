# frozen_string_literal: true

class NurseryMailer < ApplicationMailer
  def order_received_to_nursery(order)
    @order = order
    @nursery = order.pickup_nursery
    @lines = order.lines.order(:id)

    recipient = @nursery.contact_email.presence
    return if recipient.blank?

    mail(
      to: recipient,
      reply_to: order.customer_email.presence,
      subject: "Nouvelle commande #{order.order_number} — #{order.customer_name}"
    )
  end

  def order_confirmation_to_customer(order)
    @order = order
    @nursery = order.pickup_nursery
    @lines = order.lines.order(:id)

    mail(
      to: @order.customer_email,
      subject: "Confirmation de votre commande #{order.order_number} — Pépinière Semisto"
    )
  end

  def order_ready_to_customer(order)
    @order = order
    @nursery = order.pickup_nursery
    @lines = order.lines.order(:id)

    mail(
      to: @order.customer_email,
      subject: "Votre commande #{order.order_number} est prête — Pépinière Semisto"
    )
  end
end
