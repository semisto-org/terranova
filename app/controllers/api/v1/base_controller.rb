module Api
  module V1
    class BaseController < ApplicationController
      skip_forgery_protection
      before_action :require_authentication, unless: -> { Rails.env.test? }
    end
  end
end
