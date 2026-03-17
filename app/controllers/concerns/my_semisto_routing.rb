# frozen_string_literal: true

module MySemistoRouting
  extend ActiveSupport::Concern

  private

  def on_my_semisto_domain?
    ENV["MY_SEMISTO_HOST"].present? && request.host == ENV["MY_SEMISTO_HOST"]
  end

  def my_semisto_path(path = "/")
    prefix = on_my_semisto_domain? ? "" : "/my"
    "#{prefix}#{path}"
  end
end
