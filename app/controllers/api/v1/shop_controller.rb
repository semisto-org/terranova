# frozen_string_literal: true

module Api
  module V1
    class ShopController < BaseController
      before_action :require_effective_member
      before_action :require_admin_for_product_mutations, only: [:create_product, :update_product, :destroy_product, :restock_product]

      # --- Products ---

      def list_products
        scope = Shop::Product
        scope = scope.active unless params[:include_archived].to_s == "true"
        render json: { items: scope.order(:name).map { |p| serialize_product(p) } }
      end

      def create_product
        product = Shop::Product.new(product_params)
        if product.save
          render json: serialize_product(product), status: :created
        else
          render json: { error: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_product
        product = Shop::Product.find(params[:id])
        if product.update(product_params)
          render json: serialize_product(product)
        else
          render json: { error: product.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy_product
        product = Shop::Product.find(params[:id])
        if product.sale_items.any?
          product.archive!
          render json: serialize_product(product)
        else
          product.destroy!
          head :no_content
        end
      end

      # Adjust stock by +/- quantity (notes optional)
      def restock_product
        product = Shop::Product.find(params[:id])
        delta = params.require(:quantity).to_i
        new_qty = product.stock_quantity.to_i + delta
        if new_qty.negative?
          return render json: { error: "Stock final négatif interdit" }, status: :unprocessable_entity
        end
        product.update!(stock_quantity: new_qty)
        render json: serialize_product(product)
      end

      # --- Sales ---

      def list_sales
        scope = Shop::Sale.includes(:organization, :contact, items: :product)
        scope = scope.where("sold_at >= ?", params[:date_from].to_date) if params[:date_from].present?
        scope = scope.where("sold_at <= ?", params[:date_to].to_date) if params[:date_to].present?
        scope = scope.where(organization_id: params[:organization_id]) if params[:organization_id].present?
        if params[:product_id].present?
          scope = scope.joins(:items).where(shop_sale_items: { shop_product_id: params[:product_id] }).distinct
        end
        sales = scope.order(sold_at: :desc, id: :desc)
        render json: { items: sales.map { |s| serialize_sale(s) } }
      end

      def show_sale
        sale = Shop::Sale.includes(:organization, :contact, items: :product).find(params[:id])
        render json: serialize_sale(sale)
      end

      def create_sale
        sale = Shop::Sale.new(sale_params)
        if sale.save
          render json: serialize_sale(sale.reload), status: :created
        else
          render json: { error: sale.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def update_sale
        sale = Shop::Sale.find(params[:id])

        # If items are being replaced, roll back stock for the old items and restock
        # according to the new set. Simpler approach: destroy+recreate items inside a tx,
        # re-apply stock delta.
        Shop::Sale.transaction do
          if params[:items].is_a?(Array)
            # restock old items
            sale.items.reload.each do |i|
              p = i.product
              p.update_columns(stock_quantity: p.stock_quantity.to_i + i.quantity.to_i, updated_at: Time.current)
            end
            sale.items.destroy_all
            params[:items].each do |item_params|
              product = Shop::Product.find(item_params[:product_id] || item_params[:shop_product_id])
              sale.items.create!(
                product: product,
                quantity: item_params[:quantity].to_i,
                unit_price: item_params[:unit_price] || product.unit_price,
                vat_rate: item_params[:vat_rate] || product.vat_rate
              )
              product.update_columns(
                stock_quantity: product.stock_quantity.to_i - item_params[:quantity].to_i,
                updated_at: Time.current
              )
            end
          end
          sale.update!(sale_scalar_params)
          sale.resync_revenue!
        end

        render json: serialize_sale(sale.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def destroy_sale
        sale = Shop::Sale.find(params[:id])
        sale.destroy!
        head :no_content
      end

      private

      def require_admin_for_product_mutations
        unless current_member&.is_admin?
          render json: { error: "Accès réservé aux administrateurs" }, status: :forbidden
        end
      end

      def product_params
        params.permit(:name, :description, :sku, :unit_price, :vat_rate, :stock_quantity, :archived_at)
      end

      def sale_scalar_params
        params.permit(:sold_at, :organization_id, :contact_id, :payment_method, :notes, :customer_label)
      end

      # Full params for create (scalar + nested items).
      def sale_params
        attrs = sale_scalar_params.to_h
        items = Array(params[:items]).map do |item|
          product = Shop::Product.find(item[:product_id] || item[:shop_product_id])
          {
            shop_product_id: product.id,
            quantity: item[:quantity].to_i,
            unit_price: item[:unit_price] || product.unit_price,
            vat_rate: item[:vat_rate] || product.vat_rate
          }
        end
        attrs[:items_attributes] = items
        attrs[:organization_id] ||= Organization.default&.id
        attrs
      end

      def serialize_product(p)
        {
          id: p.id.to_s,
          name: p.name,
          description: p.description.to_s,
          sku: p.sku,
          unitPrice: p.unit_price.to_f,
          vatRate: p.vat_rate,
          stockQuantity: p.stock_quantity,
          archivedAt: p.archived_at&.iso8601,
          createdAt: p.created_at.iso8601,
          updatedAt: p.updated_at.iso8601
        }
      end

      def serialize_sale(s)
        {
          id: s.id.to_s,
          soldAt: s.sold_at.iso8601,
          organizationId: s.organization_id.to_s,
          organizationName: s.organization&.name,
          contactId: s.contact_id&.to_s,
          contactName: s.contact&.name,
          customerLabel: s.customer_label.to_s,
          paymentMethod: s.payment_method,
          notes: s.notes.to_s,
          totalAmount: s.total_amount.to_f,
          revenueId: s.revenue_id&.to_s,
          items: s.items.map do |item|
            {
              id: item.id.to_s,
              productId: item.shop_product_id.to_s,
              productName: item.product&.name,
              quantity: item.quantity,
              unitPrice: item.unit_price.to_f,
              vatRate: item.vat_rate,
              subtotal: item.subtotal.to_f
            }
          end,
          createdAt: s.created_at.iso8601,
          updatedAt: s.updated_at.iso8601
        }
      end
    end
  end
end
