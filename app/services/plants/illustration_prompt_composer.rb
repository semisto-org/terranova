require "anthropic"

module Plants
  class IllustrationPromptComposer
    Error = Class.new(StandardError)

    SYSTEM_PROMPT = <<~SYS.freeze
      You compose botanical illustration prompts for Gemini Imagen, following
      the Semisto Visual Design System exactly. Output the final English prompt
      only — no preamble, no markdown, no explanations.
    SYS

    def initialize(species:, style: :a2s, feedback: nil)
      @species  = species
      @style    = style
      @feedback = feedback
    end

    def compose
      response = client.messages.create(
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: user_prompt }]
      )
      response.content.first.text.strip
    rescue Error
      raise
    rescue => e
      raise Error, "Claude API error: #{e.class}: #{e.message}"
    end

    private

    def client
      @client ||= Anthropic::Client.new(api_key: ENV.fetch("ANTHROPIC_API_KEY"))
    end

    def user_prompt
      <<~PROMPT
        Compose an illustration prompt for the following species using style #{@style.to_s.upcase}.

        Species data:
        - Latin name: #{@species.latin_name}
        - Common name (FR): #{@species.common_names_fr}
        - Height: #{@species.height_min_cm}-#{@species.height_max_cm} cm
        - Spread: #{@species.spread_min_cm}-#{@species.spread_max_cm} cm
        - Growth habit: #{@species.growth_habit}
        - Strate: #{@species.strate}
        - Foliage type: #{@species.foliage_type}
        - Plant type: #{@species.plant_type}

        Style template:
        #{Plants::Vds.template_for(@style)["template"]}

        Important rules to append at end of prompt:
        #{Plants::Vds.important_rules}

        #{"User feedback for this regeneration (incorporate naturally into the composition): #{@feedback}" if @feedback.present?}

        Output the final English prompt to send to Gemini, ready to use as-is.
      PROMPT
    end
  end
end
