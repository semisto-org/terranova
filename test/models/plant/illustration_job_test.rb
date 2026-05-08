require "test_helper"

class Plant::IllustrationJobTest < ActiveSupport::TestCase
  setup do
    Plant::IllustrationJob.delete_all
    @member = Member.first || Member.create!(first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678", is_admin: true, status: "active", joined_at: Date.current)
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus")
    @species = Plant::Species.create!(latin_name: "Testus testus", plant_type: "tree", genus: @genus)
  end

  test "creates job with required fields" do
    job = Plant::IllustrationJob.create!(
      species: @species,
      triggered_by: @member,
      kind: "initial",
      triggered_at: Time.current
    )
    assert job.persisted?
    assert_equal "pending", job.status
    assert_equal 0, job.gemini_attempts
  end

  test "status helpers reflect status field" do
    job = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current)
    assert job.pending?
    job.update!(status: "running", started_at: Time.current)
    assert job.running?
    job.update!(status: "completed", finished_at: Time.current)
    assert job.completed?
  end

  test "scope recent orders by triggered_at desc" do
    older = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: 1.hour.ago)
    newer = Plant::IllustrationJob.create!(species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current)
    assert_equal [newer, older], Plant::IllustrationJob.recent.to_a
  end
end
