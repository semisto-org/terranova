module Plants
  class Vds
    cattr_accessor :data

    class << self
      def load!
        @@data = YAML.safe_load_file(
          Rails.root.join("config/visual_design_system.yml"),
          permitted_classes: []
        )
      end

      def template_for(style)
        ensure_loaded!
        @@data["styles"].fetch(style.to_s)
      end

      def important_rules
        ensure_loaded!
        @@data["important_rules"]
      end

      def version
        ensure_loaded!
        @@data["version"]
      end

      private

      def ensure_loaded!
        load! if @@data.nil?
      end
    end
  end
end
