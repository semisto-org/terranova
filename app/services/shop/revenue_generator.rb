# frozen_string_literal: true

module Shop
  class RevenueGenerator
    CATEGORY_LABEL = "Ventes shop"

    def initialize(sale)
      @sale = sale
    end

    # Creates or updates the Revenue attached to this ShopSale, computing VAT
    # according to the organization's regime (exempt organizations force all
    # items to vat_rate 'exempt' on the generated Revenue).
    def sync!
      revenue = @sale.revenue || Revenue.new
      revenue.assign_attributes(revenue_attributes)
      revenue.save!

      if @sale.revenue_id != revenue.id
        @sale.update_columns(revenue_id: revenue.id, updated_at: Time.current)
      end

      revenue
    end

    private

    def revenue_attributes
      exempt = !@sale.organization.vat_subject?
      totals = compute_totals(exempt)

      {
        organization: @sale.organization,
        contact: @sale.contact,
        projectable: @sale,
        date: @sale.sold_at,
        paid_at: @sale.sold_at,
        status: "received",
        pole: "shop",
        payment_method: @sale.payment_method,
        revenue_type: "shop_sale",
        category: CATEGORY_LABEL,
        label: @sale.label,
        description: @sale.notes.presence || @sale.customer_label.presence || "",
        amount: totals[:total],
        amount_excl_vat: totals[:excl_vat],
        vat_6: totals[:vat_6],
        vat_21: totals[:vat_21],
        vat_rate: totals[:vat_rate_label],
        vat_exemption: exempt,
        invoice_url: ""
      }
    end

    # Aggregates VAT per item; collapses to a single label if homogeneous.
    def compute_totals(exempt)
      excl_vat = 0.to_d
      vat_6 = 0.to_d
      vat_21 = 0.to_d
      rates_seen = []

      @sale.items.each do |item|
        rate = exempt ? "exempt" : item.vat_rate
        rates_seen << rate
        subtotal = item.subtotal.to_d

        case rate
        when "6"
          # TTC = HTVA × 1.06
          net = (subtotal / 1.06).round(2)
          excl_vat += net
          vat_6 += (subtotal - net).round(2)
        when "21"
          net = (subtotal / 1.21).round(2)
          excl_vat += net
          vat_21 += (subtotal - net).round(2)
        when "12"
          net = (subtotal / 1.12).round(2)
          excl_vat += net
          # No vat_12 column on Revenue — merge into vat_21 bucket as a crude fallback.
          vat_21 += (subtotal - net).round(2)
        else # '0' or 'exempt'
          excl_vat += subtotal
        end
      end

      total = (excl_vat + vat_6 + vat_21).round(2)
      rate_label = rates_seen.uniq.size == 1 ? rates_seen.first : "mixed"

      {
        excl_vat: excl_vat.round(2),
        vat_6: vat_6.round(2),
        vat_21: vat_21.round(2),
        total: total,
        vat_rate_label: rate_label
      }
    end
  end
end
