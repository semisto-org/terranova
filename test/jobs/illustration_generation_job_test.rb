require "test_helper"

class IllustrationGenerationJobTest < ActiveSupport::TestCase
  PNG_HEADER = "\x89PNG\r\n\x1a\n".dup.force_encoding("ASCII-8BIT")

  setup do
    ENV["GEMINI_API_KEY"] ||= "test-stub-key"
    ENV["ANTHROPIC_API_KEY"] ||= "test-stub-key"
    Plant::IllustrationJob.delete_all
    @member = Member.first || Member.create!(
      first_name: "T", last_name: "U", email: "tu@test.local",
      password: "x12345678", is_admin: true,
      status: "active", joined_at: Date.current
    )
    @genus = Plant::Genus.find_or_create_by!(latin_name: "Testus")
    @species = Plant::Species.create!(latin_name: "Testus testus", plant_type: "tree", genus: @genus)
    @job = Plant::IllustrationJob.create!(
      species: @species, triggered_by: @member, kind: "initial", triggered_at: Time.current
    )
    IllustrationGenerationJob.any_instance.stubs(:broadcast)
  end

  test "perform sets status running, calls services, attaches image, sets completed" do
    Plants::IllustrationPromptComposer.any_instance.stubs(:compose).returns("English prompt for Gemini")
    Plants::GeminiImageClient.any_instance.stubs(:generate).returns(PNG_HEADER + "x" * 2000)

    IllustrationGenerationJob.new.perform(@job.id)

    @job.reload
    assert_equal "completed", @job.status
    assert @job.species.silhouette_illustration.attached?
    assert_match(/English prompt/, @job.prompt_used)
    assert_equal "1.2", @job.vds_version
    assert @job.byte_size > 1000
  end

  test "perform marks job failed on exception and re-raises" do
    Plants::IllustrationPromptComposer.any_instance.stubs(:compose).raises(StandardError, "boom")

    assert_raises(StandardError) { IllustrationGenerationJob.new.perform(@job.id) }
    @job.reload
    assert_equal "failed", @job.status
    assert_equal "boom", @job.error_message
    assert_equal "StandardError", @job.error_class
  end

  test "perform is idempotent (skips completed jobs)" do
    @job.update!(status: "completed", finished_at: Time.current)
    Plants::IllustrationPromptComposer.any_instance.expects(:compose).never

    IllustrationGenerationJob.new.perform(@job.id)
  end
end
