# frozen_string_literal: true

module BankSync
  class GocardlessClient
    BASE_URL = "https://bankaccountdata.gocardless.com/api/v2"
    TRIODOS_BE_INSTITUTION_ID = "TRIODOS_TRIOBEBB"

    class ApiError < StandardError
      attr_reader :status, :body

      def initialize(message, status: nil, body: nil)
        @status = status
        @body = body
        super(message)
      end
    end

    def initialize
      @secret_id = credentials[:secret_id]
      @secret_key = credentials[:secret_key]
      raise ApiError, "GoCardless credentials not configured" if @secret_id.blank? || @secret_key.blank?
    end

    # Step 1: Create an end-user agreement for Triodos BE (90 days, 730 days history)
    def create_agreement(max_historical_days: 730)
      post("/agreements/enduser/", {
        institution_id: TRIODOS_BE_INSTITUTION_ID,
        max_historical_days: max_historical_days,
        access_valid_for_days: 90,
        access_scope: ["balances", "details", "transactions"]
      })
    end

    # Step 2: Create a requisition (bank connection link)
    def create_requisition(redirect_url:, agreement_id:, reference: nil)
      post("/requisitions/", {
        redirect: redirect_url,
        institution_id: TRIODOS_BE_INSTITUTION_ID,
        agreement: agreement_id,
        reference: reference || SecureRandom.hex(16)
      })
    end

    # Step 3: Get requisition status and linked accounts
    def get_requisition(requisition_id)
      get("/requisitions/#{requisition_id}/")
    end

    # Get account details (IBAN, owner, etc.)
    def get_account_details(account_id)
      get("/accounts/#{account_id}/details/")
    end

    # Get account balances
    def get_balances(account_id)
      get("/accounts/#{account_id}/balances/")
    end

    # Get transactions for a date range
    def get_transactions(account_id, date_from:, date_to: nil)
      params = { date_from: date_from.to_s }
      params[:date_to] = date_to.to_s if date_to.present?
      get("/accounts/#{account_id}/transactions/", params)
    end

    # Delete a requisition (revoke access)
    def delete_requisition(requisition_id)
      delete("/requisitions/#{requisition_id}/")
    end

    private

    def credentials
      Rails.application.credentials.gocardless || {}
    end

    def access_token
      @access_token ||= fetch_access_token
    end

    def fetch_access_token
      response = connection.post("/api/v2/token/new/") do |req|
        req.headers["Content-Type"] = "application/json"
        req.body = { secret_id: @secret_id, secret_key: @secret_key }.to_json
      end

      unless response.success?
        raise ApiError.new("Failed to obtain access token", status: response.status, body: response.body)
      end

      JSON.parse(response.body)["access"]
    end

    def get(path, params = {})
      request(:get, path, params: params)
    end

    def post(path, body = {})
      request(:post, path, body: body)
    end

    def delete(path)
      request(:delete, path)
    end

    def request(method, path, params: {}, body: nil)
      response = connection.send(method, "#{BASE_URL}#{path}") do |req|
        req.headers["Authorization"] = "Bearer #{access_token}"
        req.headers["Content-Type"] = "application/json"
        req.params = params if params.present?
        req.body = body.to_json if body.present?
      end

      unless response.success?
        raise ApiError.new(
          "GoCardless API error: #{response.status}",
          status: response.status,
          body: response.body
        )
      end

      JSON.parse(response.body)
    end

    def connection
      @connection ||= Faraday.new do |f|
        f.options.timeout = 30
        f.options.open_timeout = 10
        f.adapter Faraday.default_adapter
      end
    end
  end
end
