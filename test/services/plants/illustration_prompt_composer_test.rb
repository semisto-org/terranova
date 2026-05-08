require "test_helper"

class Plants::IllustrationPromptComposerTest < ActiveSupport::TestCase
  setup do
    ENV["ANTHROPIC_API_KEY"] ||= "test-stub-key"
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Amelanchier")
    @species = Plant::Species.create!(
      latin_name: "Amelanchier canadensis",
      plant_type: "tree",
      genus: @genus,
      height_min_cm: 400, height_max_cm: 800,
      spread_min_cm: 400, spread_max_cm: 600,
      growth_habit: "buissonnant-elance",
      strate: "tree"
    )
  end

  test "compose returns Claude response text (stubbed)" do
    fake_text = "Generate a botanical illustration of Amelanchier canadensis..."
    stub_anthropic_response(fake_text)

    result = Plants::IllustrationPromptComposer.new(species: @species, style: :a2s).compose
    assert_match(/botanical illustration/, result)
  end

  test "compose includes feedback when provided" do
    captured = nil
    stub_anthropic_capture { |params| captured = params }

    Plants::IllustrationPromptComposer.new(
      species: @species,
      style: :a2s,
      feedback: "less dense, more flowers"
    ).compose

    user_message = captured[:messages].first
    assert user_message[:content].include?("less dense, more flowers")
  end

  test "raises Plants::IllustrationPromptComposer::Error on Anthropic error" do
    stub_anthropic_raises(StandardError.new("rate limit"))
    assert_raises(Plants::IllustrationPromptComposer::Error) do
      Plants::IllustrationPromptComposer.new(species: @species).compose
    end
  end

  private

  def fake_response(text)
    block = Struct.new(:text).new(text)
    Struct.new(:content).new([block])
  end

  def stub_anthropic_response(text)
    messages_helper = mock("messages_helper")
    messages_helper.stubs(:create).returns(fake_response(text))
    Anthropic::Client.any_instance.stubs(:messages).returns(messages_helper)
  end

  def stub_anthropic_capture(&block)
    messages_helper = mock("messages_helper")
    messages_helper.stubs(:create).with do |params|
      block.call(params)
      true
    end.returns(fake_response("ignored"))
    Anthropic::Client.any_instance.stubs(:messages).returns(messages_helper)
  end

  def stub_anthropic_raises(error)
    messages_helper = mock("messages_helper")
    messages_helper.stubs(:create).raises(error)
    Anthropic::Client.any_instance.stubs(:messages).returns(messages_helper)
  end
end
