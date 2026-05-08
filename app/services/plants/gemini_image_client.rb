require "net/http"
require "json"
require "base64"

module Plants
  class GeminiImageClient
    GenerationError = Class.new(StandardError)
    InvalidImageError = Class.new(GenerationError)
    RateLimitError = Class.new(GenerationError)

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent".freeze
    MAX_ATTEMPTS = 2

    def initialize(api_key: ENV.fetch("GEMINI_API_KEY"))
      @api_key = api_key
    end

    def generate(prompt:)
      attempt = 0
      begin
        attempt += 1
        response = post_request(prompt)
        case response.code.to_i
        when 200
          bytes = extract_image_bytes(JSON.parse(response.body))
          validate_image!(bytes)
          bytes
        when 503
          raise GenerationError, "Gemini 503"
        when 429
          raise RateLimitError, "Gemini 429 (rate limited)"
        else
          raise GenerationError, "Gemini #{response.code}: #{response.body[0..500]}"
        end
      rescue GenerationError => e
        if attempt < MAX_ATTEMPTS && e.message.include?("503")
          sleep 10
          retry
        end
        raise RateLimitError, "Gemini 503 after #{MAX_ATTEMPTS} attempts" if e.message.include?("503")
        raise
      end
    end

    private

    def post_request(prompt)
      uri = URI("#{BASE_URL}?key=#{@api_key}")
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: %w[TEXT IMAGE] }
      }
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 120
      req = Net::HTTP::Post.new(uri)
      req["Content-Type"] = "application/json"
      req.body = payload.to_json
      http.request(req)
    end

    def extract_image_bytes(response_json)
      part = response_json.dig("candidates", 0, "content", "parts")&.find { |p| p["inlineData"] }
      raise GenerationError, "Gemini did not return an inline image part" unless part
      Base64.decode64(part["inlineData"]["data"])
    end

    def validate_image!(bytes)
      raise InvalidImageError, "Empty bytes returned" if bytes.blank? || bytes.bytesize < 1000
      magic = bytes[0..3].bytes
      png  = magic == [137, 80, 78, 71]
      jpeg = magic[0..1] == [255, 216]
      raise InvalidImageError, "Returned bytes are not PNG or JPEG (magic: #{magic.inspect})" unless png || jpeg
    end
  end
end
