require "test_helper"
require "base64"

class Plants::GeminiImageClientTest < ActiveSupport::TestCase
  PNG_HEADER = "\x89PNG\r\n\x1a\n".dup.force_encoding("ASCII-8BIT")

  setup do
    ENV["GEMINI_API_KEY"] ||= "test-stub-key"
  end

  test "generate returns image bytes on success" do
    fake_bytes = PNG_HEADER + "x" * 2000
    Net::HTTP.any_instance.stubs(:request).returns(build_response(200, image_response_body(fake_bytes)))

    result = Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    assert_equal fake_bytes.bytes, result.bytes
  end

  test "generate retries on 503 then succeeds" do
    fake_bytes = PNG_HEADER + "x" * 2000
    Plants::GeminiImageClient.any_instance.stubs(:sleep)
    Net::HTTP.any_instance.stubs(:request).returns(
      build_response(503, "{}"),
      build_response(200, image_response_body(fake_bytes))
    )

    result = Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    assert result.bytesize > 1000
  end

  test "generate raises RateLimitError after 2 failed 503s" do
    Plants::GeminiImageClient.any_instance.stubs(:sleep)
    Net::HTTP.any_instance.stubs(:request).returns(build_response(503, "{}"))

    assert_raises(Plants::GeminiImageClient::RateLimitError) do
      Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    end
  end

  test "generate raises InvalidImageError on non-image bytes" do
    Net::HTTP.any_instance.stubs(:request).returns(build_response(200, image_response_body("not an image")))

    assert_raises(Plants::GeminiImageClient::InvalidImageError) do
      Plants::GeminiImageClient.new(api_key: "fake").generate(prompt: "anything")
    end
  end

  private

  def build_response(code, body)
    response_class = Net::HTTPResponse.send(:response_class, code.to_s)
    r = response_class.new("1.1", code.to_s, "OK")
    r.instance_variable_set(:@body, body)
    r.define_singleton_method(:body) { @body }
    r
  end

  def image_response_body(bytes)
    {
      candidates: [{
        content: {
          parts: [{ inlineData: { mimeType: "image/png", data: Base64.encode64(bytes) } }]
        }
      }]
    }.to_json
  end
end
