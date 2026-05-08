require "test_helper"

class IllustrationsApiTest < ActionDispatch::IntegrationTest
  setup do
    Plant::IllustrationJob.delete_all
    # Ensure an admin member exists so that BaseController#test_member returns
    # an admin (require_admin! gates several endpoints under test).
    admin_member
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus")
    @s1 = Plant::Species.create!(latin_name: "Testus a", plant_type: "tree", genus: @genus)
    @s2 = Plant::Species.create!(latin_name: "Testus b", plant_type: "tree", genus: @genus)
  end

  test "POST /illustrations/generate creates jobs and enqueues" do
    assert_enqueued_jobs 2, only: IllustrationGenerationJob do
      post "/api/v1/plants/illustrations/generate",
           params: { species_ids: [@s1.id, @s2.id] }, as: :json
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["created_jobs"]
    assert_equal 2, body["jobs"].size
    assert_equal "pending", body["jobs"][0]["status"]
  end

  test "POST /illustrations/generate skips species with running jobs" do
    Plant::IllustrationJob.create!(
      species: @s1, triggered_by: admin_member,
      kind: "initial", status: "running", triggered_at: Time.current, started_at: Time.current
    )

    assert_enqueued_jobs 1, only: IllustrationGenerationJob do
      post "/api/v1/plants/illustrations/generate",
           params: { species_ids: [@s1.id, @s2.id] }, as: :json
    end

    body = JSON.parse(response.body)
    assert_equal 1, body["created_jobs"]
    assert_includes body["skipped"], @s1.id
  end

  test "POST /illustrations/generate accepts feedback" do
    post "/api/v1/plants/illustrations/generate",
         params: { species_ids: [@s1.id], feedback: "less dense" }, as: :json
    assert_response :success
    job = Plant::IllustrationJob.last
    assert_equal "less dense", job.feedback
  end

  test "POST /illustrations/generate refuses if queue saturated (>100 pending+running)" do
    101.times do |i|
      Plant::IllustrationJob.create!(
        species: @s1, triggered_by: admin_member, kind: "initial",
        status: "pending", triggered_at: i.seconds.ago
      )
    end

    post "/api/v1/plants/illustrations/generate",
         params: { species_ids: [@s2.id] }, as: :json
    assert_response :unprocessable_entity
    assert_match(/Queue saturée/, JSON.parse(response.body)["error"])
  end

  private

  def admin_member
    @admin_member ||= Member.find_by(is_admin: true) || Member.create!(
      first_name: "T", last_name: "U", email: "tu@test.local",
      password: "x12345678", is_admin: true,
      status: "active", joined_at: Date.current
    )
  end
end
