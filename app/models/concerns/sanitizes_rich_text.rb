# Sanitizes rich text attributes (HTML produced by TipTap) before save.
#
# TipTap output is structurally clean, but an attacker could bypass the
# editor and POST arbitrary HTML directly to the API. This concern enforces
# a whitelist of tags/attributes matching what SimpleEditor can produce.
#
# Usage:
#   class MyModel < ApplicationRecord
#     include SanitizesRichText
#     sanitizes_rich_text :content, :description
#   end
module SanitizesRichText
  extend ActiveSupport::Concern

  ALLOWED_TAGS = %w[
    p br strong em s u
    a ul ol li
    blockquote code pre
    h2 h3 hr
  ].freeze

  ALLOWED_ATTRIBUTES = %w[href target rel].freeze

  class_methods do
    # extra_tags / extra_attributes élargissent la whitelist PAR MODÈLE
    # (ex. Comment autorise <span data-type="mention">) sans toucher aux
    # autres modèles qui partagent le concern.
    def sanitizes_rich_text(*attributes, extra_tags: [], extra_attributes: [])
      allowed_tags = SanitizesRichText::ALLOWED_TAGS + extra_tags
      allowed_attributes = SanitizesRichText::ALLOWED_ATTRIBUTES + extra_attributes

      before_validation do
        attributes.each do |attr|
          value = read_attribute(attr)
          next if value.blank?

          sanitized = ActionController::Base.helpers.sanitize(
            value,
            tags: allowed_tags,
            attributes: allowed_attributes
          )
          write_attribute(attr, sanitized)
        end
      end
    end
  end
end
