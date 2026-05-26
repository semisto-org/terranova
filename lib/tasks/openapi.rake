require "yaml"
require "json"
require "fileutils"

namespace :openapi do
  MASTER_SPEC = Rails.root.join("doc/openapi.yaml")
  SPLIT_DIR   = Rails.root.join("doc/openapi")

  # A few path prefixes are grouped into a single domain so the slices line up
  # with how the API is actually navigated. Anything not listed becomes its own
  # domain automatically — a new endpoint never gets silently dropped.
  DOMAIN_ALIASES = {
    "health"     => "foundation",
    "search"     => "foundation",
    "geocoding"  => "foundation",
    "profile"    => "foundation",
    "nova"       => "foundation",
    "labs"       => "lab",
    "guilds"     => "lab",
    "billing-config" => "settings",
    "my"         => "my_semisto",
  }.freeze

  HTTP_METHODS = %w[get post put patch delete head options trace].freeze

  desc "Split doc/openapi.yaml into per-domain slices under doc/openapi/ for progressive disclosure"
  task split: :environment do
    unless File.exist?(MASTER_SPEC)
      abort "Master spec not found at #{MASTER_SPEC}. Generate it first: OPENAPI=1 bin/rails test test/integration"
    end

    spec  = YAML.safe_load_file(MASTER_SPEC)
    paths = spec["paths"] || {}

    base = spec.slice("openapi", "info", "servers")

    # Only the /api/v1 JSON API is part of the documented contract. Non-API paths
    # (ICS calendar feeds, HTML plant cards, shortlinks) get bucketed as "misc" and
    # are excluded from the slices the skill consumes.
    by_domain = Hash.new { |h, k| h[k] = {} }
    paths.each do |path, operations|
      domain = domain_for(path)
      next if domain == "misc"

      by_domain[domain][path] = coerce_integer_types(strip_examples(normalize_descriptions(operations)))
    end

    FileUtils.rm_rf(SPLIT_DIR)
    FileUtils.mkdir_p(SPLIT_DIR)

    index_domains = []

    by_domain.keys.sort.each do |domain|
      domain_paths = by_domain[domain]
      slice = deep_sort(base.merge("paths" => domain_paths))
      # Compact JSON keeps slices token-cheap for agent consumption; `jq .` pretties on demand.
      # Deep-sorted keys make output deterministic regardless of test execution order,
      # so CI drift detection never produces spurious diffs.
      File.write(SPLIT_DIR.join("#{domain}.json"), JSON.generate(slice))

      operations = domain_paths.flat_map do |path, ops|
        ops.slice(*HTTP_METHODS).map do |method, op|
          { "method" => method.upcase, "path" => path, "summary" => op["summary"] }
        end
      end

      index_domains << {
        "name"          => domain,
        "file"          => "#{domain}.json",
        "endpointCount" => operations.size,
        "operations"    => operations.sort_by { |o| [o["path"], o["method"]] },
      }
    end

    index = {
      "openapi"        => spec["openapi"],
      "info"           => spec["info"],
      "servers"        => spec["servers"],
      "generatedFrom"  => "doc/openapi.yaml (recorded by rspec-openapi from the Minitest integration suite)",
      "totalEndpoints" => index_domains.sum { |d| d["endpointCount"] },
      "domains"        => index_domains.sort_by { |d| d["name"] },
    }
    File.write(SPLIT_DIR.join("index.json"), JSON.pretty_generate(deep_sort(index)))

    puts "Wrote #{index_domains.size} domain slices + index.json to #{SPLIT_DIR} (#{index['totalEndpoints']} endpoints)"
  end

  # rspec-openapi sets each response's description from the test case name, so the
  # description of whichever test ran last (order varies by seed) would win and cause
  # spurious drift. Replace them with the canonical HTTP status phrase: deterministic
  # and a more correct OpenAPI response description.
  def normalize_descriptions(path_item)
    path_item.each_value do |operation|
      next unless operation.is_a?(Hash) && operation["responses"].is_a?(Hash)

      operation["responses"].each do |status, response|
        next unless response.is_a?(Hash)

        phrase = Rack::Utils::HTTP_STATUS_CODES[status.to_i] || "Response"
        response["description"] = phrase
      end
    end
    path_item
  end

  # Recorded examples carry volatile values (IDs, timestamps) and the gem's
  # enable_example flag behaves inconsistently across environments, so strip examples
  # here — the single deterministic normalization point — to keep local and CI output
  # identical. The inferred schema is the contract and is kept. Context-aware: a schema
  # property literally named "example" (under "properties") is preserved.
  def strip_examples(obj)
    case obj
    when Hash
      obj.delete("example")
      obj.delete("examples")
      obj.each do |key, value|
        if key == "properties" && value.is_a?(Hash)
          value.each_value { |schema| strip_examples(schema) }
        else
          strip_examples(value)
        end
      end
    when Array
      obj.each { |v| strip_examples(v) }
    end
    obj
  end

  # A field observed as a whole number in one test and a fraction in another gets
  # inferred as "integer" or "number" depending on which test recorded last (order
  # varies by seed). Collapse to "number" (the JSON Schema superset of integer) so the
  # type is stable. Trade-off: integer-only fields (IDs, page) are documented as number.
  def coerce_integer_types(obj)
    case obj
    when Hash
      obj["type"] = "number" if obj["type"] == "integer"
      obj.each_value { |v| coerce_integer_types(v) }
    when Array
      obj.each { |v| coerce_integer_types(v) }
    end
    obj
  end

  # Recursively sort hash keys for deterministic, diff-stable output.
  def deep_sort(obj)
    case obj
    when Hash  then obj.sort.to_h.transform_values { |v| deep_sort(v) }
    when Array then obj.map { |v| deep_sort(v) }
    else obj
    end
  end

  # Domain = first path segment after /api/v1/, with a few well-known groupings.
  # Non-/api/v1 paths (ICS feeds, HTML cards, shortlinks) land in "misc".
  def domain_for(path)
    segments = path.sub(%r{\A/}, "").split("/")
    return "misc" unless segments[0] == "api" && segments[1] == "v1"

    key = segments[2].to_s.split(/[?{]/).first.to_s
    return "misc" if key.empty?

    DOMAIN_ALIASES.fetch(key, key)
  end
end
