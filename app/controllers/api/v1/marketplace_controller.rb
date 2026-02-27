module Api
  module V1
    class MarketplaceController < BaseController
      # GET /api/v1/marketplace
      def index
        listings = MarketplaceListing.visible
                     .includes(:member, images_attachments: :blob)
                     .order(created_at: :desc)

        listings = listings.where(category: params[:category]) if params[:category].present?

        if params[:search].present?
          term = "%#{params[:search]}%"
          listings = listings.where("title ILIKE :t OR description ILIKE :t", t: term)
        end

        render json: {
          listings: listings.map { |l| serialize_listing(l) }
        }
      end

      # GET /api/v1/marketplace/mine
      def mine
        listings = MarketplaceListing
                     .where(member_id: current_member.id, deleted_at: nil)
                     .includes(:member, images_attachments: :blob)
                     .order(created_at: :desc)

        render json: {
          listings: listings.map { |l| serialize_listing(l, include_status: true) }
        }
      end

      # GET /api/v1/marketplace/:id
      def show
        listing = MarketplaceListing.where(deleted_at: nil)
                    .includes(:member, images_attachments: :blob)
                    .find(params[:id])

        render json: {
          listing: serialize_listing(listing, include_seller_email: true, include_status: true)
        }
      end

      # POST /api/v1/marketplace
      def create
        listing = MarketplaceListing.new(listing_params)
        listing.member = current_member
        listing.save!

        attach_images!(listing) if params[:images].present?

        render json: { listing: serialize_listing(listing, include_status: true) }, status: :created
      end

      # PATCH /api/v1/marketplace/:id
      def update
        listing = current_member_listing!
        listing.update!(listing_params)

        attach_images!(listing) if params[:images].present?

        render json: { listing: serialize_listing(listing, include_status: true) }
      end

      # DELETE /api/v1/marketplace/:id
      def destroy
        listing = current_member_listing!
        listing.soft_delete!
        head :no_content
      end

      # DELETE /api/v1/marketplace/:id/images/:image_id
      def destroy_image
        listing = current_member_listing!
        image = listing.images.find(params[:image_id])
        image.purge
        head :no_content
      end

      private

      def current_member_listing!
        MarketplaceListing.where(member_id: current_member.id, deleted_at: nil)
                          .find(params[:id])
      end

      def listing_params
        params.permit(:title, :description, :price_semos, :category, :status)
      end

      def attach_images!(listing)
        Array(params[:images]).each { |img| listing.images.attach(img) }
      end

      def serialize_listing(listing, include_seller_email: false, include_status: false)
        data = {
          id: listing.id.to_s,
          title: listing.title,
          description: listing.description,
          priceSemos: listing.price_semos,
          category: listing.category,
          createdAt: listing.created_at.iso8601,
          seller: {
            id: listing.member_id.to_s,
            firstName: listing.member.first_name,
            lastName: listing.member.last_name,
            avatar: listing.member.avatar_url
          },
          images: listing.images.map { |img|
            {
              id: img.id.to_s,
              url: Rails.application.routes.url_helpers.rails_blob_url(img, only_path: true)
            }
          }
        }
        data[:seller][:email] = listing.member.email if include_seller_email
        data[:status] = listing.status if include_status
        data
      end
    end
  end
end
