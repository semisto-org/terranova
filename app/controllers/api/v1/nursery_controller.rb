module Api
  module V1
    class NurseryController < BaseController
      def index
        render json: nursery_payload(filters: filter_params)
      end

      def dashboard
        render json: build_dashboard
      end

      def catalog
        render json: build_catalog(filters: catalog_filter_params)
      end

      def create_stock_batch
        item = Nursery::StockBatch.new(stock_batch_params)
        item.available_quantity = item.quantity if item.available_quantity.to_i.zero?
        item.reserved_quantity = 0 if item.reserved_quantity.nil?
        item.save!

        render json: serialize_stock_batch(item), status: :created
      end

      def update_stock_batch
        item = Nursery::StockBatch.find(params.require(:batch_id))
        item.update!(stock_batch_params)
        render json: serialize_stock_batch(item)
      end

      def destroy_stock_batch
        Nursery::StockBatch.find(params.require(:batch_id)).destroy!
        head :no_content
      end

      def create_order
        pickup_nursery = Nursery::Nursery.find(params.require(:pickup_nursery_id))
        order = Nursery::Order.create!(
          order_params.merge(
            pickup_nursery: pickup_nursery,
            status: 'new',
            order_number: next_order_number
          )
        )

        order_lines_params.each do |line|
          create_order_line!(order, line.to_h)
        end
        recalculate_order_totals!(order)

        render json: serialize_order(order.reload), status: :created
      end

      def process_order
        order = Nursery::Order.find(params.require(:order_id))
        order.update!(status: 'processing')
        reserve_order_stock!(order)
        render json: serialize_order(order)
      end

      def mark_order_ready
        order = Nursery::Order.find(params.require(:order_id))
        order.update!(status: 'ready', ready_at: Time.current)
        render json: serialize_order(order)
      end

      def mark_order_picked_up
        order = Nursery::Order.find(params.require(:order_id))
        order.update!(status: 'picked-up', picked_up_at: Time.current)
        fulfill_order_stock!(order)
        render json: serialize_order(order)
      end

      def cancel_order
        order = Nursery::Order.find(params.require(:order_id))
        order.update!(status: 'cancelled')
        release_order_stock!(order)
        render json: serialize_order(order)
      end

      def validate_mother_plant
        item = Nursery::MotherPlant.find(params.require(:mother_plant_id))
        item.update!(status: 'validated', validated_at: Time.current, validated_by: params[:validated_by].presence || 'Nursery Manager')
        render json: serialize_mother_plant(item)
      end

      def reject_mother_plant
        item = Nursery::MotherPlant.find(params.require(:mother_plant_id))
        item.update!(status: 'rejected', validated_at: Time.current, validated_by: params[:validated_by].presence || 'Nursery Manager', notes: params[:notes].to_s.presence || item.notes)
        render json: serialize_mother_plant(item)
      end

      # --- Nurseries CRUD ---

      def create_nursery
        item = Nursery::Nursery.create!(nursery_params)
        render json: serialize_nursery(item), status: :created
      end

      def update_nursery
        item = Nursery::Nursery.find(params.require(:nursery_id))
        item.update!(nursery_params)
        render json: serialize_nursery(item)
      end

      def destroy_nursery
        Nursery::Nursery.find(params.require(:nursery_id)).destroy!
        head :no_content
      end

      # --- Containers CRUD ---

      def create_container
        item = Nursery::Container.create!(container_params)
        render json: serialize_container(item), status: :created
      end

      def update_container
        item = Nursery::Container.find(params.require(:container_id))
        item.update!(container_params)
        render json: serialize_container(item)
      end

      def destroy_container
        Nursery::Container.find(params.require(:container_id)).destroy!
        head :no_content
      end

      # --- Orders ---

      def show_order
        order = Nursery::Order.includes(:lines, :pickup_nursery).find(params.require(:order_id))
        render json: serialize_order(order)
      end

      # --- Transfers ---

      def create_transfer
        order = Nursery::Order.find(params.require(:order_id))
        transfer = Nursery::Transfer.create!(
          order: order,
          status: 'planned',
          scheduled_date: params.require(:scheduled_date),
          stops: params[:stops] || [],
          total_distance_km: params[:total_distance_km] || 0,
          estimated_duration: params[:estimated_duration] || '',
          driver_id: params[:driver_id] || '',
          driver_name: params[:driver_name] || '',
          vehicle_info: params[:vehicle_info] || '',
          notes: params[:notes] || ''
        )
        render json: serialize_transfer(transfer), status: :created
      end

      def start_transfer
        transfer = Nursery::Transfer.find(params.require(:transfer_id))
        transfer.update!(status: 'in-progress')
        render json: serialize_transfer(transfer)
      end

      def complete_transfer
        transfer = Nursery::Transfer.find(params.require(:transfer_id))
        transfer.update!(status: 'completed', completed_at: Time.current)
        render json: serialize_transfer(transfer)
      end

      def cancel_transfer
        transfer = Nursery::Transfer.find(params.require(:transfer_id))
        transfer.update!(status: 'cancelled')
        render json: serialize_transfer(transfer)
      end

      # --- Team Members ---

      def list_team_members
        members = Nursery::TeamMember.order(:name)
        members = members.where(nursery_id: params[:nursery_id]) if params[:nursery_id].present?
        render json: members.map { |m| serialize_team_member(m) }
      end

      def create_team_member
        nursery = Nursery::Nursery.find(params.require(:nursery_id))
        member = Nursery::TeamMember.create!(
          team_member_params.merge(nursery: nursery, nursery_name: nursery.name)
        )
        render json: serialize_team_member(member), status: :created
      end

      def update_team_member
        member = Nursery::TeamMember.find(params.require(:member_id))
        member.update!(team_member_params)
        render json: serialize_team_member(member)
      end

      def destroy_team_member
        Nursery::TeamMember.find(params.require(:member_id)).destroy!
        head :no_content
      end

      # --- Schedule ---

      def list_schedule
        slots = Nursery::ScheduleSlot.order(:date, :start_time)
        slots = slots.where(nursery_id: params[:nursery_id]) if params[:nursery_id].present?
        if params[:week_start].present?
          start_date = Date.parse(params[:week_start])
          slots = slots.where(date: start_date..(start_date + 6))
        end
        render json: slots.map { |s| serialize_schedule_slot(s) }
      end

      def create_schedule_slot
        member = Nursery::TeamMember.find(params.require(:member_id))
        nursery = member.nursery
        slot = Nursery::ScheduleSlot.create!(
          schedule_slot_params.merge(
            member: member, member_name: member.name, member_role: member.role,
            nursery: nursery, nursery_name: nursery.name
          )
        )
        render json: serialize_schedule_slot(slot), status: :created
      end

      def update_schedule_slot
        slot = Nursery::ScheduleSlot.find(params.require(:slot_id))
        slot.update!(schedule_slot_params)
        render json: serialize_schedule_slot(slot)
      end

      def destroy_schedule_slot
        Nursery::ScheduleSlot.find(params.require(:slot_id)).destroy!
        head :no_content
      end

      # --- Documentation ---

      def list_documentation
        entries = Nursery::DocumentationEntry.order(published_at: :desc)
        entries = entries.where(nursery_id: params[:nursery_id]) if params[:nursery_id].present?
        entries = entries.where(entry_type: params[:type]) if params[:type].present?
        render json: entries.map { |e| serialize_documentation_entry(e) }
      end

      def create_documentation
        entry = Nursery::DocumentationEntry.create!(documentation_params.merge(published_at: Time.current))
        render json: serialize_documentation_entry(entry), status: :created
      end

      def update_documentation
        entry = Nursery::DocumentationEntry.find(params.require(:doc_id))
        entry.update!(documentation_params)
        render json: serialize_documentation_entry(entry)
      end

      def destroy_documentation
        Nursery::DocumentationEntry.find(params.require(:doc_id)).destroy!
        head :no_content
      end

      # --- Timesheets ---

      def list_timesheets
        entries = Nursery::TimesheetEntry.order(date: :desc)
        entries = entries.where(nursery_id: params[:nursery_id]) if params[:nursery_id].present?
        entries = entries.where(member_id: params[:member_id]) if params[:member_id].present?
        entries = entries.where(category: params[:category]) if params[:category].present?
        render json: entries.map { |e| serialize_timesheet_entry(e) }
      end

      def create_timesheet
        member = Nursery::TeamMember.find(params.require(:member_id))
        nursery = member.nursery
        entry = Nursery::TimesheetEntry.create!(
          timesheet_params.merge(
            member: member, member_name: member.name,
            nursery: nursery, nursery_name: nursery.name
          )
        )
        render json: serialize_timesheet_entry(entry), status: :created
      end

      def update_timesheet
        entry = Nursery::TimesheetEntry.find(params.require(:entry_id))
        entry.update!(timesheet_params)
        render json: serialize_timesheet_entry(entry)
      end

      def destroy_timesheet
        Nursery::TimesheetEntry.find(params.require(:entry_id)).destroy!
        head :no_content
      end

      private

      def filter_params
        params.permit(:nursery_id, :species_id, :container_id, :stage, :order_status, :mother_status)
      end

      def catalog_filter_params
        params.permit(:nursery_id, :species_query, :available_only)
      end

      def stock_batch_params
        params.permit(:nursery_id, :species_id, :species_name, :variety_id, :variety_name, :container_id, :quantity, :available_quantity, :reserved_quantity, :sowing_date, :origin, :growth_stage, :price_euros, :accepts_semos, :price_semos, :notes)
      end

      def order_params
        params.permit(:customer_id, :customer_name, :customer_email, :customer_phone, :is_member, :price_level, :notes)
      end

      def nursery_params
        params.permit(:name, :nursery_type, :integration, :address, :city, :postal_code, :country, :latitude, :longitude, :contact_name, :contact_email, :contact_phone, :website, :description, :is_pickup_point, specialties: [])
      end

      def container_params
        params.permit(:name, :short_name, :volume_liters, :description, :sort_order)
      end

      def team_member_params
        params.permit(:name, :email, :role, :phone, :avatar_url, :start_date, :end_date)
      end

      def schedule_slot_params
        params.permit(:date, :start_time, :end_time, :activity, :notes)
      end

      def documentation_params
        params.permit(:entry_type, :title, :content, :video_url, :thumbnail_url, :author_id, :author_name, :nursery_id, :nursery_name, tags: [])
      end

      def timesheet_params
        params.permit(:date, :category, :hours, :description)
      end

      def order_lines_params
        params.permit(lines: [:stock_batch_id, :quantity, :unit_price_euros, :unit_price_semos, :pay_in_semos]).fetch(:lines, [])
      end

      def nursery_payload(filters:)
        nurseries = Nursery::Nursery.order(:name)
        containers = Nursery::Container.order(:sort_order, :name)
        stock_batches = Nursery::StockBatch.includes(:nursery, :container).order(updated_at: :desc)
        mother_plants = Nursery::MotherPlant.order(created_at: :desc)
        orders = Nursery::Order.includes(:lines, :pickup_nursery).order(created_at: :desc)
        transfers = Nursery::Transfer.includes(:order).order(created_at: :desc)

        stock_batches = stock_batches.where(nursery_id: filters[:nursery_id]) if filters[:nursery_id].present?
        stock_batches = stock_batches.where(species_id: filters[:species_id]) if filters[:species_id].present?
        stock_batches = stock_batches.where(container_id: filters[:container_id]) if filters[:container_id].present?
        stock_batches = stock_batches.where(growth_stage: filters[:stage]) if filters[:stage].present?
        orders = orders.where(status: filters[:order_status]) if filters[:order_status].present?
        mother_plants = mother_plants.where(status: filters[:mother_status]) if filters[:mother_status].present?

        team_members = Nursery::TeamMember.order(:name)
        schedule_slots = Nursery::ScheduleSlot.order(:date, :start_time)
        documentation = Nursery::DocumentationEntry.order(published_at: :desc)
        timesheets = Nursery::TimesheetEntry.order(date: :desc)

        {
          nurseries: nurseries.map { |item| serialize_nursery(item) },
          containers: containers.map { |item| serialize_container(item) },
          stockBatches: stock_batches.map { |item| serialize_stock_batch(item) },
          motherPlants: mother_plants.map { |item| serialize_mother_plant(item) },
          orders: orders.map { |item| serialize_order(item) },
          transfers: transfers.map { |item| serialize_transfer(item) },
          teamMembers: team_members.map { |item| serialize_team_member(item) },
          schedule: schedule_slots.map { |item| serialize_schedule_slot(item) },
          documentation: documentation.map { |item| serialize_documentation_entry(item) },
          timesheets: timesheets.map { |item| serialize_timesheet_entry(item) },
          catalog: build_catalog(filters: catalog_filter_params),
          dashboard: build_dashboard
        }
      end

      def build_dashboard
        stock_batches = Nursery::StockBatch.all
        orders = Nursery::Order.all
        transfers = Nursery::Transfer.all
        mother_plants = Nursery::MotherPlant.all

        {
          lowStockCount: stock_batches.where('available_quantity <= 10').count,
          pendingOrdersCount: orders.where(status: 'new').count,
          pendingTransfersCount: transfers.where(status: %w[planned in-progress]).count,
          pendingValidationsCount: mother_plants.where(status: 'pending').count,
          alerts: build_alerts(stock_batches, orders, transfers, mother_plants),
          todaySchedule: [],
          recentOrders: orders.order(created_at: :desc).limit(6).map { |item| serialize_order(item) }
        }
      end

      def build_alerts(stock_batches, orders, transfers, mother_plants)
        alerts = []
        stock_batches.where('available_quantity <= 10').limit(5).find_each do |item|
          alerts << {
            id: "low-#{item.id}",
            type: 'low-stock',
            title: "Stock bas : #{item.species_name}",
            description: "Disponible: #{item.available_quantity}",
            priority: item.available_quantity <= 5 ? 'high' : 'medium',
            relatedId: item.id.to_s,
            createdAt: Time.current.iso8601
          }
        end
        if orders.where(status: 'new').exists?
          alerts << {
            id: "ord-new-#{Time.current.to_i}",
            type: 'pending-order',
            title: "#{orders.where(status: 'new').count} nouvelles commandes",
            description: 'Commandes à traiter',
            priority: 'high',
            relatedId: orders.where(status: 'new').order(:id).first.id.to_s,
            createdAt: Time.current.iso8601
          }
        end
        if transfers.where(status: %w[planned in-progress]).exists?
          alerts << {
            id: "trf-pending-#{Time.current.to_i}",
            type: 'pending-transfer',
            title: 'Transfert à organiser',
            description: 'Un ou plusieurs transferts en attente',
            priority: 'medium',
            relatedId: transfers.where(status: %w[planned in-progress]).order(:id).first.id.to_s,
            createdAt: Time.current.iso8601
          }
        end
        if mother_plants.where(status: 'pending').exists?
          alerts << {
            id: "mp-pending-#{Time.current.to_i}",
            type: 'pending-validation',
            title: "#{mother_plants.where(status: 'pending').count} plants-mères en attente",
            description: 'Propositions à valider',
            priority: 'low',
            relatedId: mother_plants.where(status: 'pending').order(:id).first.id.to_s,
            createdAt: Time.current.iso8601
          }
        end
        alerts
      end

      def build_catalog(filters:)
        batches = Nursery::StockBatch.includes(:nursery, :container).where('available_quantity > 0')
        batches = batches.where(nursery_id: filters[:nursery_id]) if filters[:nursery_id].present?
        if filters[:species_query].present?
          q = "%#{filters[:species_query].to_s.downcase}%"
          batches = batches.where('LOWER(species_name) LIKE ?', q)
        end
        available_only = ActiveModel::Type::Boolean.new.cast(filters[:available_only])
        batches = batches.where('available_quantity > 0') if available_only

        batches.map do |batch|
          {
            stockBatchId: batch.id.to_s,
            speciesId: batch.species_id,
            speciesName: batch.species_name,
            varietyName: batch.variety_name.presence,
            nurseryId: batch.nursery_id.to_s,
            nurseryName: batch.nursery.name,
            nurseryIntegration: batch.nursery.integration,
            availableQuantity: batch.nursery.integration == 'manual' ? nil : batch.available_quantity,
            available: batch.available_quantity.to_i.positive?,
            containerName: batch.container.short_name,
            priceEuros: batch.price_euros.to_f,
            acceptsSemos: batch.accepts_semos,
            priceSemos: batch.price_semos&.to_f
          }
        end
      end

      def create_order_line!(order, params_hash)
        batch = Nursery::StockBatch.find(params_hash.fetch('stock_batch_id'))
        quantity = params_hash.fetch('quantity').to_i
        raise ActiveRecord::RecordInvalid.new(batch), 'quantity must be positive' if quantity <= 0

        euros = params_hash['unit_price_euros'].presence || batch.price_euros
        semos = params_hash['unit_price_semos'].presence || batch.price_semos
        pay_in_semos = ActiveModel::Type::Boolean.new.cast(params_hash['pay_in_semos'])

        order.lines.create!(
          stock_batch: batch,
          nursery: batch.nursery,
          nursery_name: batch.nursery.name,
          species_name: batch.species_name,
          variety_name: batch.variety_name,
          container_name: batch.container.short_name,
          quantity: quantity,
          unit_price_euros: euros,
          unit_price_semos: semos,
          pay_in_semos: pay_in_semos,
          total_euros: pay_in_semos ? 0 : quantity * euros.to_f,
          total_semos: pay_in_semos ? quantity * semos.to_f : 0
        )
      end

      def recalculate_order_totals!(order)
        subtotal_euros = order.lines.sum(:total_euros)
        subtotal_semos = order.lines.sum(:total_semos)
        order.update!(
          subtotal_euros: subtotal_euros,
          subtotal_semos: subtotal_semos,
          total_euros: subtotal_euros,
          total_semos: subtotal_semos
        )
      end

      def reserve_order_stock!(order)
        order.lines.includes(:stock_batch).find_each do |line|
          batch = line.stock_batch
          next unless batch.available_quantity >= line.quantity

          batch.update!(
            available_quantity: batch.available_quantity - line.quantity,
            reserved_quantity: batch.reserved_quantity + line.quantity
          )
        end
        order.update!(prepared_at: Time.current) if order.prepared_at.blank?
      end

      def release_order_stock!(order)
        order.lines.includes(:stock_batch).find_each do |line|
          batch = line.stock_batch
          next if batch.reserved_quantity <= 0

          released = [batch.reserved_quantity, line.quantity].min
          batch.update!(
            available_quantity: batch.available_quantity + released,
            reserved_quantity: batch.reserved_quantity - released
          )
        end
      end

      def fulfill_order_stock!(order)
        order.lines.includes(:stock_batch).find_each do |line|
          batch = line.stock_batch
          next if batch.reserved_quantity <= 0

          fulfilled = [batch.reserved_quantity, line.quantity].min
          batch.update!(reserved_quantity: batch.reserved_quantity - fulfilled)
        end
      end

      def next_order_number
        "PEP-#{Time.current.year}-#{(Nursery::Order.count + 1).to_s.rjust(4, '0')}"
      end

      def serialize_nursery(item)
        {
          id: item.id.to_s,
          name: item.name,
          type: item.nursery_type,
          integration: item.integration,
          address: item.address,
          city: item.city,
          postalCode: item.postal_code,
          country: item.country,
          coordinates: { lat: item.latitude.to_f, lng: item.longitude.to_f },
          contactName: item.contact_name,
          contactEmail: item.contact_email,
          contactPhone: item.contact_phone.presence,
          website: item.website.presence,
          description: item.description.presence,
          specialties: item.specialties,
          isPickupPoint: item.is_pickup_point,
          createdAt: item.created_at.iso8601
        }
      end

      def serialize_container(item)
        {
          id: item.id.to_s,
          name: item.name,
          shortName: item.short_name,
          volumeLiters: item.volume_liters&.to_f,
          description: item.description.presence,
          sortOrder: item.sort_order
        }
      end

      def serialize_stock_batch(item)
        {
          id: item.id.to_s,
          nurseryId: item.nursery_id.to_s,
          speciesId: item.species_id,
          speciesName: item.species_name,
          varietyId: item.variety_id.presence,
          varietyName: item.variety_name.presence,
          containerId: item.container_id.to_s,
          quantity: item.quantity,
          availableQuantity: item.available_quantity,
          reservedQuantity: item.reserved_quantity,
          sowingDate: item.sowing_date&.iso8601,
          origin: item.origin.presence,
          growthStage: item.growth_stage,
          priceEuros: item.price_euros.to_f,
          acceptsSemos: item.accepts_semos,
          priceSemos: item.price_semos&.to_f,
          notes: item.notes.presence,
          createdAt: item.created_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_mother_plant(item)
        {
          id: item.id.to_s,
          speciesId: item.species_id,
          speciesName: item.species_name,
          varietyId: item.variety_id.presence,
          varietyName: item.variety_name.presence,
          placeId: item.place_id,
          placeName: item.place_name,
          placeAddress: item.place_address,
          plantingDate: item.planting_date.iso8601,
          source: item.source,
          projectId: item.project_id.presence,
          projectName: item.project_name.presence,
          memberId: item.member_id.presence,
          memberName: item.member_name.presence,
          status: item.status,
          validatedAt: item.validated_at&.iso8601,
          validatedBy: item.validated_by.presence,
          quantity: item.quantity,
          notes: item.notes.presence,
          lastHarvestDate: item.last_harvest_date&.iso8601,
          createdAt: item.created_at.iso8601
        }
      end

      def serialize_order(item)
        {
          id: item.id.to_s,
          orderNumber: item.order_number,
          customerId: item.customer_id,
          customerName: item.customer_name,
          customerEmail: item.customer_email,
          customerPhone: item.customer_phone.presence,
          isMember: item.is_member,
          status: item.status,
          priceLevel: item.price_level,
          pickupNurseryId: item.pickup_nursery_id.to_s,
          pickupNurseryName: item.pickup_nursery.name,
          lines: item.lines.order(:id).map { |line| serialize_order_line(line) },
          subtotalEuros: item.subtotal_euros.to_f,
          subtotalSemos: item.subtotal_semos.to_f,
          totalEuros: item.total_euros.to_f,
          totalSemos: item.total_semos.to_f,
          notes: item.notes.presence,
          createdAt: item.created_at.iso8601,
          preparedAt: item.prepared_at&.iso8601,
          readyAt: item.ready_at&.iso8601,
          pickedUpAt: item.picked_up_at&.iso8601
        }
      end

      def serialize_order_line(item)
        {
          id: item.id.to_s,
          stockBatchId: item.stock_batch_id.to_s,
          nurseryId: item.nursery_id.to_s,
          nurseryName: item.nursery_name,
          speciesName: item.species_name,
          varietyName: item.variety_name.presence,
          containerName: item.container_name,
          quantity: item.quantity,
          unitPriceEuros: item.unit_price_euros.to_f,
          unitPriceSemos: item.unit_price_semos&.to_f,
          payInSemos: item.pay_in_semos,
          totalEuros: item.total_euros.to_f,
          totalSemos: item.total_semos.to_f
        }
      end

      def serialize_transfer(item)
        {
          id: item.id.to_s,
          orderId: item.order_id.to_s,
          orderNumber: item.order.order_number,
          status: item.status,
          stops: item.stops,
          totalDistanceKm: item.total_distance_km.to_f,
          estimatedDuration: item.estimated_duration,
          driverId: item.driver_id.presence,
          driverName: item.driver_name.presence,
          vehicleInfo: item.vehicle_info.presence,
          scheduledDate: item.scheduled_date.iso8601,
          notes: item.notes.presence,
          createdAt: item.created_at.iso8601,
          completedAt: item.completed_at&.iso8601
        }
      end

      def serialize_team_member(item)
        {
          id: item.id.to_s,
          name: item.name,
          email: item.email,
          role: item.role,
          nurseryId: item.nursery_id.to_s,
          nurseryName: item.nursery_name,
          avatarUrl: item.avatar_url.presence,
          phone: item.phone.presence,
          startDate: item.start_date.iso8601,
          endDate: item.end_date&.iso8601
        }
      end

      def serialize_schedule_slot(item)
        {
          id: item.id.to_s,
          memberId: item.member_id.to_s,
          memberName: item.member_name,
          memberRole: item.member_role,
          nurseryId: item.nursery_id.to_s,
          nurseryName: item.nursery_name,
          date: item.date.iso8601,
          startTime: item.start_time,
          endTime: item.end_time,
          activity: item.activity.presence,
          notes: item.notes.presence
        }
      end

      def serialize_documentation_entry(item)
        {
          id: item.id.to_s,
          type: item.entry_type,
          title: item.title,
          content: item.content.presence,
          videoUrl: item.video_url.presence,
          thumbnailUrl: item.thumbnail_url.presence,
          authorId: item.author_id,
          authorName: item.author_name,
          nurseryId: item.nursery_id&.to_s,
          nurseryName: item.nursery_name.presence,
          tags: item.tags,
          publishedAt: item.published_at.iso8601,
          updatedAt: item.updated_at.iso8601
        }
      end

      def serialize_timesheet_entry(item)
        {
          id: item.id.to_s,
          memberId: item.member_id.to_s,
          memberName: item.member_name,
          nurseryId: item.nursery_id.to_s,
          nurseryName: item.nursery_name,
          date: item.date.iso8601,
          category: item.category,
          hours: item.hours.to_f,
          description: item.description.presence,
          createdAt: item.created_at.iso8601
        }
      end
    end
  end
end
