module Api
  module V1
    class NovaController < BaseController
      # POST /api/v1/nova/chat
      # Body: { message: "..." }
      # Response: { reply: "..." }
      def chat
        message = params[:message]
        return render json: { error: "Message requis" }, status: :unprocessable_entity if message.blank?

        reply = nova_send(message, page: params[:page], url: params[:url])
        render json: { reply: reply }
      end

      private

      def nova_send(message, page: nil, url: nil)
        idempotency_key = "terranova-chat-#{SecureRandom.hex(8)}"

        context_parts = []
        if current_member
          context_parts << "[Contexte] Membre connecté : #{current_member.first_name} #{current_member.last_name} (email: #{current_member.email}, slack_user_id: #{current_member.slack_user_id || 'non lié'})"
        end
        if page.present?
          context_parts << "[Contexte] Page courante : #{page} (#{url})"
        end
        context_prefix = context_parts.any? ? context_parts.join("\n") + "\n\n" : ""

        params_json = {
          message: "#{context_prefix}#{message}",
          idempotencyKey: idempotency_key,
          sessionKey: "agent:main:main"
        }.to_json

        Rails.logger.info("[Nova] Sending message (key=#{idempotency_key}, member=#{current_member&.id})")

        result = `openclaw gateway call agent \
          --url "ws://127.0.0.1:18789" \
          --token "#{ENV['NOVA_GATEWAY_TOKEN']}" \
          --params '#{params_json.gsub("'", "\\\\'")}' \
          --expect-final \
          --timeout 60000 2>&1`

        exit_status = $?.exitstatus
        Rails.logger.info("[Nova] CLI exit_status=#{exit_status}, output_length=#{result.to_s.length}")
        Rails.logger.debug("[Nova] Raw CLI output: #{result.to_s.first(500)}")

        begin
          # Extract JSON from "Gateway call: agent {...}" response
          json_text = result.to_s.sub(/^Gateway call: agent\s*/, '').strip
          parsed = JSON.parse(json_text)
          if parsed["result"] && parsed["result"]["payloads"]
            reply = parsed["result"]["payloads"].map { |p| p["text"] }.compact.join("\n")
            Rails.logger.info("[Nova] Success, reply_length=#{reply.length}")
            reply
          elsif parsed["error"]
            Rails.logger.warn("[Nova] Gateway returned error: #{parsed['error']}")
            "Désolée, je rencontre un problème technique : #{parsed['error']} 🌱"
          else
            Rails.logger.warn("[Nova] No payloads in response: #{json_text.first(300)}")
            "Désolée, je n'ai pas pu traiter ta demande. Réessaie dans un moment 🌱"
          end
        rescue JSON::ParserError => e
          Rails.logger.error("[Nova] JSON parse error: #{e.message}")
          Rails.logger.error("[Nova] Unparseable output (first 500 chars): #{result.to_s.first(500)}")
          result.present? ? result.strip : "Désolée, Nova est temporairement indisponible 🌱"
        end
      rescue => e
        Rails.logger.error("[Nova] Exception: #{e.class} - #{e.message}")
        Rails.logger.error("[Nova] Backtrace: #{e.backtrace&.first(5)&.join("\n")}")
        "Désolée, je rencontre un problème technique. Réessaie dans un moment 🌱"
      end
    end
  end
end
