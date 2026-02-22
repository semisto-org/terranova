module Api
  module V1
    class NovaController < BaseController
      # POST /api/v1/nova/chat
      # Body: { message: "..." }
      # Response: { reply: "..." }
      def chat
        message = params[:message]
        return render json: { error: "Message requis" }, status: :unprocessable_entity if message.blank?

        reply = nova_send(message)
        render json: { reply: reply }
      end

      private

      def nova_send(message)
        idempotency_key = "terranova-chat-#{SecureRandom.hex(8)}"

        params_json = {
          message: message,
          idempotencyKey: idempotency_key,
          sessionKey: "agent:main:main"
        }.to_json

        result = `openclaw gateway call agent \
          --url "#{ENV.fetch('NOVA_GATEWAY_URL', 'wss://hatchboxed.tailef7c98.ts.net')}" \
          --token "#{ENV['NOVA_GATEWAY_TOKEN']}" \
          --params '#{params_json.gsub("'", "\\\\'")}' \
          --expect-final \
          --timeout 60000 2>&1`

        begin
          parsed = JSON.parse(result)
          if parsed["result"] && parsed["result"]["payloads"]
            parsed["result"]["payloads"].map { |p| p["text"] }.compact.join("\n")
          elsif parsed["error"]
            "Désolée, je rencontre un problème technique : #{parsed['error']} 🌱"
          else
            "Désolée, je n'ai pas pu traiter ta demande. Réessaie dans un moment 🌱"
          end
        rescue JSON::ParserError
          result.present? ? result.strip : "Désolée, Nova est temporairement indisponible 🌱"
        end
      rescue => e
        Rails.logger.error("Nova chat error: #{e.message}")
        "Désolée, je rencontre un problème technique. Réessaie dans un moment 🌱"
      end
    end
  end
end
