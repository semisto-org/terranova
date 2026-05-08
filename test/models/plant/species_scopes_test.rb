require "test_helper"

class Plant::SpeciesScopesTest < ActiveSupport::TestCase
  setup do
    Plant::IllustrationJob.delete_all
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus")
    @with    = Plant::Species.create!(latin_name: "Testus withus",    plant_type: "tree", genus: @genus)
    @without = Plant::Species.create!(latin_name: "Testus withoutus", plant_type: "tree", genus: @genus)
    @with.silhouette_illustration.attach(
      io: StringIO.new("\x89PNG\r\n\x1a\n" + "x" * 1000),
      filename: "fake.png",
      content_type: "image/png"
    )
  end

  test "with_illustration includes only species with attached illustration" do
    ids = Plant::Species.with_illustration.pluck(:id)
    assert_includes ids, @with.id
    refute_includes ids, @without.id
  end

  test "without_illustration excludes species with attached illustration" do
    ids = Plant::Species.without_illustration.pluck(:id)
    refute_includes ids, @with.id
    assert_includes ids, @without.id
  end

  test "last_illustration_job returns most recent" do
    member = Member.first || Member.create!(
      first_name: "T", last_name: "U", email: "tu@test.local", password: "x12345678",
      is_admin: true, status: "active", joined_at: Date.current
    )
    Plant::IllustrationJob.create!(species: @with, triggered_by: member, kind: "initial",      triggered_at: 1.hour.ago)
    newer = Plant::IllustrationJob.create!(species: @with, triggered_by: member, kind: "regeneration", triggered_at: Time.current)
    assert_equal newer, @with.last_illustration_job
  end
end
