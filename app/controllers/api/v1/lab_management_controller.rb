module Api
  module V1
    class LabManagementController < BaseController
      class DomainError < StandardError; end

      before_action :set_member, only: [:show_member, :update_member]
      before_action :set_contact, only: [:show_contact, :update_contact, :destroy_contact]
      before_action :set_pitch, only: [:update_pitch, :destroy_pitch, :create_scope, :add_chowder_item]
      before_action :set_scope, only: [:update_hill_position, :add_task]
      before_action :set_task, only: [:toggle_task]
      before_action :set_event, only: [:show_event, :update_event, :destroy_event]
      before_action :set_event_type, only: [:update_event_type, :destroy_event_type]
      before_action :set_timesheet, only: [:update_timesheet, :destroy_timesheet, :mark_invoiced]

      def overview
        render json: {
          members: serialize_members,
          cycles: serialize_cycles,
          guilds: serialize_guilds,
          pitches: serialize_pitches,
          bets: serialize_bets,
          scopes: serialize_scopes,
          hillChartSnapshots: serialize_snapshots,
          chowderItems: serialize_chowder_items,
          ideaLists: serialize_idea_lists,
          events: serialize_events,
          eventTypes: serialize_event_types,
          wallets: serialize_wallets,
          semosTransactions: serialize_transactions,
          semosEmissions: serialize_emissions,
          semosRates: serialize_rates,
          timesheets: serialize_timesheets,
          contacts: serialize_contacts
        }
      end

      def list_contacts
        scope = Contact.includes(:contact_tags, :organization)
        scope = scope.where(contact_type: params[:contact_type]) if params[:contact_type].present?
        scope = scope.joins(:contact_tags).where(contact_tags: { name: params[:tag] }).distinct if params[:tag].present?
        if params[:q].present?
          q = "%#{params[:q].strip}%"
          scope = scope.where(
            "contacts.name ILIKE :q OR contacts.email ILIKE :q",
            q: q
          )
        end
        render json: { items: scope.order(:name).map { |c| serialize_contact(c) } }
      end

      def show_contact
        render json: {
          contact: serialize_contact(@contact),
          linkedActivities: fetch_linked_activities(@contact)
        }
      end

      def create_contact
        contact = Contact.new(contact_params)

        ActiveRecord::Base.transaction do
          contact.save!
          Array(contact_params[:tag_names]).each do |tag_name|
            contact.contact_tags.find_or_create_by!(name: tag_name.strip) if tag_name.present?
          end
        end

        render json: serialize_contact(contact.reload), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def update_contact
        ActiveRecord::Base.transaction do
          @contact.update!(contact_params.except(:tag_names))

          if contact_params.key?(:tag_names)
            @contact.contact_tags.destroy_all
            Array(contact_params[:tag_names]).each do |tag_name|
              @contact.contact_tags.create!(name: tag_name.strip) if tag_name.present?
            end
          end
        end

        render json: serialize_contact(@contact.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def destroy_contact
        @contact.destroy!
        head :no_content
      end

      def list_cycles
        render json: { items: serialize_cycles }
      end

      def list_members
        render json: { items: serialize_members }
      end

      def show_member
        render json: serialize_member(@member)
      end

      def create_member
        member = Member.new(member_params.except(:roles, :guild_ids))

        ActiveRecord::Base.transaction do
          member.save!
          Array(member_params[:roles]).each { |role| member.member_roles.create!(role: role) }
          Array(member_params[:guild_ids]).each { |guild_id| GuildMembership.create!(member_id: member.id, guild_id: guild_id) }
          Wallet.create!(member: member)
        end

        render json: serialize_member(member), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def update_member
        ActiveRecord::Base.transaction do
          @member.update!(member_params.except(:roles, :guild_ids))

          if member_params.key?(:roles)
            @member.member_roles.delete_all
            Array(member_params[:roles]).each { |role| @member.member_roles.create!(role: role) }
          end

          if member_params.key?(:guild_ids)
            @member.guild_memberships.delete_all
            Array(member_params[:guild_ids]).each { |guild_id| GuildMembership.create!(member_id: @member.id, guild_id: guild_id) }
          end
        end

        render json: serialize_member(@member)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def list_pitches
        render json: { items: serialize_pitches }
      end

      def show_pitch
        render json: serialize_pitch(Pitch.find(params.require(:id)))
      end

      def create_pitch
        pitch = Pitch.new(pitch_params)

        if pitch.save
          render json: serialize_pitch(pitch), status: :created
        else
          render json: { error: pitch.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_pitch
        if @pitch.update(pitch_params)
          render json: serialize_pitch(@pitch)
        else
          render json: { error: @pitch.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy_pitch
        @pitch.destroy!
        head :no_content
      end

      def place_bet
        bet = nil

        ActiveRecord::Base.transaction do
          bet = Bet.create!(
            pitch_id: params.require(:pitch_id),
            cycle_id: params.require(:cycle_id),
            status: params[:status] || "pending",
            placed_by_id: params[:placed_by_id],
            placed_at: Time.current
          )

          Array(params[:team_member_ids]).each do |member_id|
            bet.bet_team_memberships.create!(member_id: member_id)
          end

          pitch = bet.pitch
          pitch.update!(status: "betting") if pitch.shaped?
        end

        render json: serialize_bet(bet), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def remove_bet
        Bet.find(params.require(:id)).destroy!
        head :no_content
      end

      def create_scope
        scope = @pitch.scopes.new(scope_params)

        if scope.save
          render json: serialize_scope(scope), status: :created
        else
          render json: { error: scope.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_hill_position
        position = params.require(:position).to_i

        ActiveRecord::Base.transaction do
          @scope.update!(hill_position: position)

          snapshot_positions = @scope.pitch.scopes.map do |scope|
            { scopeId: scope.id.to_s, position: scope.hill_position }
          end

          HillChartSnapshot.create!(pitch: @scope.pitch, positions: snapshot_positions)
        end

        render json: serialize_scope(@scope)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def add_task
        task = @scope.scope_tasks.new(task_params)

        if task.save
          render json: serialize_task(task), status: :created
        else
          render json: { error: task.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def toggle_task
        @task.update!(completed: !@task.completed)
        render json: serialize_task(@task)
      end

      def add_chowder_item
        item = @pitch.chowder_items.new(title: params.require(:title), created_by_id: params[:created_by_id])

        if item.save
          render json: serialize_chowder_item(item), status: :created
        else
          render json: { error: item.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def move_to_scope
        item = ChowderItem.find(params.require(:chowder_item_id))
        scope = Scope.find(params.require(:scope_id))

        ActiveRecord::Base.transaction do
          scope.scope_tasks.create!(title: item.title, is_nice_to_have: false, completed: false)
          item.destroy!
        end

        render json: { moved: true }
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def destroy_chowder_item
        ChowderItem.find(params.require(:id)).destroy!
        head :no_content
      end

      def add_idea
        idea_list = IdeaList.find(params.require(:idea_list_id))
        idea = idea_list.idea_items.create!(title: params.require(:title), votes: 0)
        render json: serialize_idea_item(idea), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def vote_idea
        idea = IdeaItem.find(params.require(:idea_id))
        idea.increment!(:votes)
        render json: { id: idea.id.to_s, votes: idea.votes }
      end

      def list_events
        render json: { items: serialize_events }
      end

      def show_event
        render json: serialize_event(@event)
      end

      def calendar
        render json: {
          cycles: serialize_cycles,
          events: serialize_events
        }
      end

      def create_event
        # Handle both event_type_id (new) and event_type_label (label-based lookup)
        event_params_hash = event_params.to_h
        if event_params_hash[:event_type_label].present? && event_params_hash[:event_type_id].blank?
          event_type = EventType.find_by(label: event_params_hash[:event_type_label])
          event_params_hash[:event_type_id] = event_type&.id
          event_params_hash.delete(:event_type_label)
        end

        event = Event.new(event_params_hash)

        ActiveRecord::Base.transaction do
          event.save!
          replace_event_attendees(event, params[:attendee_ids])
        end

        render json: serialize_event(event), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      rescue ActiveRecord::RecordNotFound => e
        render json: { error: 'Type d\'événement introuvable' }, status: :unprocessable_entity
      end

      def update_event
        # Handle both event_type_id (new) and event_type_label (label-based lookup)
        event_params_hash = event_params.to_h
        if event_params_hash[:event_type_label].present? && event_params_hash[:event_type_id].blank?
          event_type = EventType.find_by(label: event_params_hash[:event_type_label])
          event_params_hash[:event_type_id] = event_type&.id
          event_params_hash.delete(:event_type_label)
        end

        ActiveRecord::Base.transaction do
          @event.update!(event_params_hash)
          replace_event_attendees(@event, params[:attendee_ids]) if params.key?(:attendee_ids)
        end

        render json: serialize_event(@event)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      rescue ActiveRecord::RecordNotFound => e
        render json: { error: 'Type d\'événement introuvable' }, status: :unprocessable_entity
      end

      def destroy_event
        @event.destroy!
        head :no_content
      end

      def list_event_types
        render json: { items: serialize_event_types }
      end

      def create_event_type
        event_type = EventType.new(event_type_params)

        if event_type.save
          render json: serialize_event_type(event_type), status: :created
        else
          render json: { error: event_type.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_event_type
        if @event_type.update(event_type_params)
          render json: serialize_event_type(@event_type)
        else
          render json: { error: @event_type.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy_event_type
        @event_type.destroy!
        head :no_content
      end

      def semos
        render json: {
          wallets: serialize_wallets,
          semosTransactions: serialize_transactions,
          semosEmissions: serialize_emissions,
          semosRates: serialize_rates
        }
      end

      def transfer_semos
        from_wallet = Wallet.find(params.require(:from_wallet_id))
        to_wallet = Wallet.find(params.require(:to_wallet_id))
        amount = params.require(:amount).to_i
        description = params[:description].to_s

        raise DomainError, "Transfert vers soi-meme interdit" if from_wallet.id == to_wallet.id

        ActiveRecord::Base.transaction do
          raise DomainError, "Montant invalide" if amount <= 0
          raise DomainError, "Solde insuffisant" if (from_wallet.balance - amount) < from_wallet.floor
          raise DomainError, "Plafond destinataire depasse" if (to_wallet.balance + amount) > to_wallet.ceiling

          from_wallet.update!(balance: from_wallet.balance - amount)
          to_wallet.update!(balance: to_wallet.balance + amount)

          SemosTransaction.create!(
            from_wallet: from_wallet,
            to_wallet: to_wallet,
            amount: amount,
            description: description,
            transaction_type: "transfer"
          )
        end

        render json: {
          success: true,
          from_wallet: serialize_wallet(from_wallet.reload),
          to_wallet: serialize_wallet(to_wallet.reload)
        }
      rescue DomainError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def emit_semos
        wallet = Wallet.find(params.require(:wallet_id))
        amount = params.require(:amount).to_i

        ActiveRecord::Base.transaction do
          raise DomainError, "Montant invalide" if amount <= 0
          raise DomainError, "Plafond depasse" if (wallet.balance + amount) > wallet.ceiling

          wallet.update!(balance: wallet.balance + amount)

          SemosEmission.create!(
            wallet: wallet,
            amount: amount,
            reason: params.require(:reason),
            description: params[:description].to_s,
            created_by_id: params[:created_by_id]
          )
        end

        render json: serialize_wallet(wallet.reload)
      rescue DomainError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
      end

      def update_rate
        rate = SemosRate.find(params.require(:id))

        if rate.update(amount: params.require(:amount), description: params[:description] || rate.description)
          render json: serialize_rate(rate)
        else
          render json: { error: rate.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def list_timesheets
        scope = Timesheet.includes(:member)

        scope = scope.where(member_id: params[:member_id]) if params[:member_id].present?
        scope = scope.where(category: params[:category]) if params[:category].present?
        scope = scope.where(invoiced: ActiveModel::Type::Boolean.new.cast(params[:invoiced])) if params.key?(:invoiced)
        scope = scope.where("date >= ?", params[:start_date]) if params[:start_date].present?
        scope = scope.where("date <= ?", params[:end_date]) if params[:end_date].present?

        render json: { items: scope.order(date: :desc).map { |timesheet| serialize_timesheet(timesheet) } }
      end

      def create_timesheet
        timesheet = Timesheet.new(timesheet_params)

        if timesheet.save
          render json: serialize_timesheet(timesheet), status: :created
        else
          render json: { error: timesheet.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def update_timesheet
        if @timesheet.update(timesheet_params)
          render json: serialize_timesheet(@timesheet)
        else
          render json: { error: @timesheet.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      def destroy_timesheet
        @timesheet.destroy!
        head :no_content
      end

      def mark_invoiced
        @timesheet.update!(invoiced: true)
        render json: serialize_timesheet(@timesheet)
      end

      private

      def member_params
        params.permit(:first_name, :last_name, :email, :avatar, :status, :is_admin, :joined_at, roles: [], guild_ids: [])
      end

      def pitch_params
        params.permit(
          :title,
          :status,
          :appetite,
          :author_id,
          :problem,
          :solution,
          :fat_marker_sketch,
          rabbit_holes: [],
          no_gos: [],
          breadboard: [
            { places: [], affordances: [], connections: [:from, :to, :via] }
          ]
        )
      end

      def scope_params
        params.permit(:name, :description, :hill_position)
      end

      def task_params
        params.permit(:title, :is_nice_to_have, :completed)
      end

      def event_params
        params.permit(:title, :event_type_label, :event_type_id, :start_date, :end_date, :location, :description, :cycle_id)
      end

      def event_type_params
        params.permit(:label)
      end

      def timesheet_params
        params.permit(:member_id, :date, :hours, :payment_type, :description, :category, :invoiced, :kilometers, :project_id, :course_id, :guild_id)
      end

      def contact_params
        params.permit(:contact_type, :name, :email, :phone, :address, :organization_type, :notes, :organization_id, tag_names: [])
      end

      def set_contact
        @contact = Contact.find(params.require(:id))
      end

      def set_member
        @member = Member.find(params.require(:id))
      end

      def set_pitch
        @pitch = Pitch.find(params.require(:id))
      end

      def set_scope
        @scope = Scope.find(params.require(:id))
      end

      def set_task
        @task = ScopeTask.find(params.require(:id))
      end

      def set_event
        @event = Event.find(params.require(:id))
      end

      def set_event_type
        @event_type = EventType.find(params.require(:id))
      end

      def set_timesheet
        @timesheet = Timesheet.find(params.require(:id))
      end

      def replace_event_attendees(event, attendee_ids)
        return if attendee_ids.nil?

        event.event_attendees.delete_all
        Array(attendee_ids).each { |member_id| event.event_attendees.create!(member_id: member_id) }
      end

      def serialize_members
        Member.includes(:member_roles, :guild_memberships, :wallet).order(:id).map { |member| serialize_member(member) }
      end

      def serialize_member(member)
        {
          id: member.id.to_s,
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          avatar: member.avatar_url,
          roles: member.member_roles.map(&:role),
          status: member.status,
          isAdmin: member.is_admin,
          joinedAt: member.joined_at&.iso8601,
          walletId: member.wallet&.id&.to_s,
          guildIds: member.guild_memberships.map { |gm| gm.guild_id.to_s }
        }
      end

      def serialize_guilds
        Guild.includes(:guild_memberships).order(:id).map do |guild|
          {
            id: guild.id.to_s,
            name: guild.name,
            description: guild.description,
            leaderId: guild.leader_id&.to_s,
            memberIds: guild.guild_memberships.map { |gm| gm.member_id.to_s },
            color: guild.color
          }
        end
      end

      def serialize_cycles
        Cycle.includes(:bets).order(start_date: :desc).map do |cycle|
          {
            id: cycle.id.to_s,
            name: cycle.name,
            startDate: cycle.start_date.iso8601,
            endDate: cycle.end_date.iso8601,
            cooldownStart: cycle.cooldown_start.iso8601,
            cooldownEnd: cycle.cooldown_end.iso8601,
            status: cycle.status,
            betIds: cycle.bets.map { |bet| bet.id.to_s }
          }
        end
      end

      def serialize_pitches
        Pitch.order(created_at: :desc).map { |pitch| serialize_pitch(pitch) }
      end

      def serialize_pitch(pitch)
        {
          id: pitch.id.to_s,
          title: pitch.title,
          status: pitch.status,
          appetite: pitch.appetite,
          authorId: pitch.author_id&.to_s,
          createdAt: pitch.created_at.iso8601,
          problem: pitch.problem,
          solution: pitch.solution,
          rabbitHoles: pitch.rabbit_holes,
          noGos: pitch.no_gos,
          breadboard: pitch.breadboard,
          fatMarkerSketch: pitch.fat_marker_sketch
        }
      end

      def serialize_bets
        Bet.includes(:bet_team_memberships).order(placed_at: :desc).map { |bet| serialize_bet(bet) }
      end

      def serialize_bet(bet)
        {
          id: bet.id.to_s,
          pitchId: bet.pitch_id.to_s,
          cycleId: bet.cycle_id.to_s,
          teamMemberIds: bet.bet_team_memberships.map { |btm| btm.member_id.to_s },
          status: bet.status,
          placedAt: bet.placed_at.iso8601,
          placedBy: bet.placed_by_id&.to_s
        }
      end

      def serialize_scopes
        Scope.includes(:scope_tasks).order(:id).map { |scope| serialize_scope(scope) }
      end

      def serialize_scope(scope)
        {
          id: scope.id.to_s,
          pitchId: scope.pitch_id.to_s,
          name: scope.name,
          description: scope.description,
          hillPosition: scope.hill_position,
          tasks: scope.scope_tasks.map { |task| serialize_task(task) }
        }
      end

      def serialize_task(task)
        {
          id: task.id.to_s,
          title: task.title,
          isNiceToHave: task.is_nice_to_have,
          completed: task.completed
        }
      end

      def serialize_snapshots
        HillChartSnapshot.order(created_at: :desc).map do |snapshot|
          {
            id: snapshot.id.to_s,
            pitchId: snapshot.pitch_id.to_s,
            createdAt: snapshot.created_at.iso8601,
            positions: snapshot.positions
          }
        end
      end

      def serialize_chowder_items
        ChowderItem.order(created_at: :desc).map { |item| serialize_chowder_item(item) }
      end

      def serialize_chowder_item(item)
        {
          id: item.id.to_s,
          pitchId: item.pitch_id.to_s,
          title: item.title,
          createdAt: item.created_at.iso8601,
          createdBy: item.created_by_id&.to_s
        }
      end

      def serialize_idea_lists
        IdeaList.includes(:idea_items).order(:id).map do |idea_list|
          {
            id: idea_list.id.to_s,
            name: idea_list.name,
            description: idea_list.description,
            items: idea_list.idea_items.map { |item| serialize_idea_item(item) }
          }
        end
      end

      def serialize_idea_item(item)
        {
          id: item.id.to_s,
          title: item.title,
          createdAt: item.created_at.iso8601,
          votes: item.votes
        }
      end

      def serialize_events
        Event.includes(:event_attendees, :event_type).order(start_date: :asc).map { |event| serialize_event(event) }
      end

      def serialize_event(event)
        {
          id: event.id.to_s,
          title: event.title,
          type: event.event_type.label,
          eventTypeId: event.event_type_id.to_s,
          startDate: event.start_date.iso8601,
          endDate: event.end_date.iso8601,
          location: event.location,
          description: event.description,
          attendeeIds: event.event_attendees.map { |ea| ea.member_id.to_s },
          cycleId: event.cycle_id&.to_s
        }
      end

      def serialize_event_types
        EventType.ordered.map { |et| serialize_event_type(et) }
      end

      def serialize_event_type(event_type)
        {
          id: event_type.id.to_s,
          label: event_type.label
        }
      end

      def serialize_wallets
        Wallet.order(:id).map { |wallet| serialize_wallet(wallet) }
      end

      def serialize_wallet(wallet)
        {
          id: wallet.id.to_s,
          memberId: wallet.member_id.to_s,
          balance: wallet.balance,
          floor: wallet.floor,
          ceiling: wallet.ceiling
        }
      end

      def serialize_transactions
        SemosTransaction.order(created_at: :desc).map do |transaction|
          {
            id: transaction.id.to_s,
            fromWalletId: transaction.from_wallet_id.to_s,
            toWalletId: transaction.to_wallet_id.to_s,
            amount: transaction.amount,
            description: transaction.description,
            createdAt: transaction.created_at.iso8601,
            type: transaction.transaction_type
          }
        end
      end

      def serialize_emissions
        SemosEmission.order(created_at: :desc).map do |emission|
          {
            id: emission.id.to_s,
            walletId: emission.wallet_id.to_s,
            amount: emission.amount,
            reason: emission.reason,
            description: emission.description,
            createdAt: emission.created_at.iso8601,
            createdBy: emission.created_by_id&.to_s
          }
        end
      end

      def serialize_rates
        SemosRate.order(:id).map { |rate| serialize_rate(rate) }
      end

      def serialize_rate(rate)
        {
          id: rate.id.to_s,
          type: rate.rate_type,
          amount: rate.amount,
          description: rate.description
        }
      end

      def serialize_timesheets
        Timesheet.order(date: :desc).map { |timesheet| serialize_timesheet(timesheet) }
      end

      def serialize_timesheet(timesheet)
        {
          id: timesheet.id.to_s,
          memberId: timesheet.member_id.to_s,
          date: timesheet.date.iso8601,
          hours: timesheet.hours.to_f,
          paymentType: timesheet.payment_type,
          description: timesheet.description,
          category: timesheet.category,
          invoiced: timesheet.invoiced,
          kilometers: timesheet.kilometers.to_f,
          projectId: timesheet.project_id,
          courseId: timesheet.course_id,
          guildId: timesheet.guild_id&.to_s
        }
      end

      def serialize_contacts
        Contact.includes(:contact_tags, :organization).order(:name).map { |c| serialize_contact(c) }
      end

      def serialize_contact(contact)
        {
          id: contact.id.to_s,
          contactType: contact.contact_type,
          name: contact.name,
          email: contact.email.to_s,
          phone: contact.phone.to_s,
          address: contact.address.to_s,
          organizationType: contact.organization_type.to_s,
          notes: contact.notes.to_s,
          organizationId: contact.organization_id&.to_s,
          organization: contact.organization ? { id: contact.organization.id.to_s, name: contact.organization.name } : nil,
          tagNames: contact.tag_names,
          createdAt: contact.created_at.iso8601,
          updatedAt: contact.updated_at.iso8601
        }
      end

      def fetch_linked_activities(contact)
        name_normalized = contact.name.strip.downcase
        email_normalized = contact.email.present? ? contact.email.strip.downcase : nil

        design_projects = Design::Project.where("LOWER(TRIM(client_name)) = ?", name_normalized)
        design_projects = design_projects.or(Design::Project.where("LOWER(TRIM(client_email)) = ?", email_normalized)) if email_normalized.present?

        academy_registrations = Academy::TrainingRegistration.includes(:training)
          .where("LOWER(TRIM(contact_name)) = ?", name_normalized)
        academy_registrations = academy_registrations.or(
          Academy::TrainingRegistration.where("LOWER(TRIM(contact_email)) = ?", email_normalized)
        ) if email_normalized.present?

        nursery_orders = Nursery::Order.where("LOWER(TRIM(customer_name)) = ?", name_normalized)
        nursery_orders = nursery_orders.or(Nursery::Order.where("LOWER(TRIM(customer_email)) = ?", email_normalized)) if email_normalized.present?

        {
          designProjects: design_projects.limit(20).map do |p|
            { id: p.id.to_s, name: p.name, clientName: p.client_name, phase: p.phase, status: p.status }
          end,
          academyRegistrations: academy_registrations.limit(20).map do |r|
            {
              id: r.id.to_s,
              contactName: r.contact_name,
              trainingId: r.training_id.to_s,
              trainingName: r.training&.name,
              paymentStatus: r.payment_status,
              registeredAt: r.registered_at&.iso8601
            }
          end,
          nurseryOrders: nursery_orders.limit(20).map do |o|
            {
              id: o.id.to_s,
              orderNumber: o.order_number,
              customerName: o.customer_name,
              status: o.status
            }
          end
        }
      end
    end
  end
end
