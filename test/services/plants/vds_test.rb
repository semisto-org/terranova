require "test_helper"

class Plants::VdsTest < ActiveSupport::TestCase
  setup { Plants::Vds.load! }

  test "loads version" do
    assert_match(/^\d+\.\d+/, Plants::Vds.version)
  end

  test "exposes a2s template" do
    template = Plants::Vds.template_for(:a2s)
    assert_kind_of Hash, template
    assert template["template"].include?("WHITE background")
  end

  test "exposes important_rules" do
    rules = Plants::Vds.important_rules
    assert rules.include?("IMPORTANT RULES")
    assert rules.include?("NO TEXT integrated")
  end

  test "raises on unknown style" do
    assert_raises(KeyError) { Plants::Vds.template_for(:unknown_style) }
  end
end
