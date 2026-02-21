# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

class NotionImporter
  BASE_URL = "https://api.notion.com/v1"
  NOTION_VERSION = "2022-06-28"
  MAX_RETRIES = 5

  def initialize
    @api_key = ENV.fetch("NOTION_API_KEY")
  end

  # Fetch all pages from a Notion database, handling pagination
  def fetch_database(database_id)
    pages = []
    cursor = nil

    loop do
      body = { page_size: 100 }
      body[:start_cursor] = cursor if cursor

      response = api_post("/databases/#{database_id}/query", body)
      pages.concat(response["results"])

      break unless response["has_more"]
      cursor = response["next_cursor"]
    end

    pages
  end

  # Fetch a single database schema
  def fetch_database_schema(database_id)
    api_get("/databases/#{database_id}")
  end

  # Extract a property value from a Notion page
  def extract(properties, name)
    prop = properties[name]
    return nil unless prop

    extract_value(prop)
  end

  # Extract relation IDs from a Notion property
  def extract_relations(properties, name)
    prop = properties[name]
    return [] unless prop && prop["type"] == "relation"

    prop["relation"].map { |r| r["id"] }
  end

  private

  def extract_value(prop)
    case prop["type"]
    when "title"
      rich_text_plain(prop["title"])
    when "rich_text"
      rich_text_plain(prop["rich_text"])
    when "number"
      prop["number"]
    when "date"
      prop.dig("date", "start")
    when "select"
      prop.dig("select", "name")
    when "multi_select"
      (prop["multi_select"] || []).map { |s| s["name"] }
    when "status"
      prop.dig("status", "name")
    when "relation"
      prop["relation"].map { |r| r["id"] }
    when "url"
      prop["url"]
    when "email"
      prop["email"]
    when "phone_number"
      prop["phone_number"]
    when "people"
      (prop["people"] || []).map { |p| p["name"] || p["id"] }
    when "formula"
      extract_formula(prop["formula"])
    when "rollup"
      extract_rollup(prop["rollup"])
    when "files"
      (prop["files"] || []).map { |f| f.dig("file", "url") || f.dig("external", "url") }.compact
    when "checkbox"
      prop["checkbox"]
    when "created_time"
      prop["created_time"]
    when "last_edited_time"
      prop["last_edited_time"]
    end
  end

  def extract_formula(formula)
    return nil unless formula
    case formula["type"]
    when "string" then formula["string"]
    when "number" then formula["number"]
    when "boolean" then formula["boolean"]
    when "date" then formula.dig("date", "start")
    end
  end

  def extract_rollup(rollup)
    return nil unless rollup
    case rollup["type"]
    when "number" then rollup["number"]
    when "array" then rollup["array"].map { |item| extract_value(item) }
    end
  end

  def rich_text_plain(arr)
    return nil if arr.nil? || arr.empty?
    arr.map { |t| t["plain_text"] }.join
  end

  def headers
    {
      "Authorization" => "Bearer #{@api_key}",
      "Content-Type" => "application/json",
      "Notion-Version" => NOTION_VERSION
    }
  end

  def api_get(path)
    request_with_retry(:get, path)
  end

  def api_post(path, body = {})
    request_with_retry(:post, path, body)
  end

  def request_with_retry(method, path, body = nil)
    retries = 0
    loop do
      uri = URI("#{BASE_URL}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      req = if method == :get
              Net::HTTP::Get.new(uri, headers)
            else
              r = Net::HTTP::Post.new(uri, headers)
              r.body = body.to_json if body
              r
            end

      response = http.request(req)

      if response.code == "429"
        retries += 1
        raise "Rate limited after #{MAX_RETRIES} retries" if retries > MAX_RETRIES
        wait = (response["Retry-After"] || 1).to_f
        puts "  ⏳ Rate limited, waiting #{wait}s..."
        sleep(wait)
        next
      end

      unless response.code.start_with?("2")
        raise "Notion API error #{response.code}: #{response.body}"
      end

      return JSON.parse(response.body)
    end
  end
end
