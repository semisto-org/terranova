require "test_helper"

class AcademyRealtimeTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  setup do
    [Academy::Training, Academy::TrainingType].each(&:delete_all)
    @training_type = Academy::TrainingType.create!(name: "Permaculture")
    @training = Academy::Training.create!(
      training_type: @training_type,
      title: "Formation live",
      status: "idea",
      price: 100,
      vat_rate: 21,
      deposit_amount: 0
    )
  end

  test "update training broadcasts realtime payload" do
    assert_broadcasts("academy_trainings", 1) do
      patch "/api/v1/academy/trainings/#{@training.id}", params: {
        title: "Formation live MAJ"
      }, as: :json
    end

    assert_response :success
    raw = broadcasts("academy_trainings").last
    payload = raw.is_a?(String) ? JSON.parse(raw) : raw.deep_stringify_keys
    assert_equal "training", payload["type"]
    assert_equal "updated", payload["action"]
    assert_equal @training.id.to_s, payload["training"]["id"]
  end
end
