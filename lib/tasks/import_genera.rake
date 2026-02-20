# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

namespace :notion do
  desc "Import plant genera from Notion database"
  task import_genera: :environment do
    NOTION_TOKEN = ENV.fetch("NOTION_TOKEN") { abort "Set NOTION_TOKEN env var (Notion integration token)" }
    DATABASE_ID = "0d53231650fd4d4496520814662f02b8"
    COMMON_NAME_PROPERTY = "Nom commun"

    api = NotionApi.new(NOTION_TOKEN)

    puts "Fetching genera from Notion database..."
    pages = api.query_database(DATABASE_ID)
    puts "Found #{pages.size} genera."

    pages.each_with_index do |page, index|
      title = extract_title(page)
      common_name = extract_rich_text_property(page, COMMON_NAME_PROPERTY)

      if title.blank?
        puts "  [#{index + 1}] Skipping page with no title"
        next
      end

      puts "  [#{index + 1}/#{pages.size}] #{title} (#{common_name.presence || 'no common name'})"

      # Fetch page body blocks and convert to HTML
      blocks = api.get_blocks(page["id"])
      description_html = NotionBlocksToHtml.convert(blocks, api)

      # Upsert genus
      genus = Plant::Genus.find_or_initialize_by(latin_name: title)
      genus.description = description_html
      genus.save!

      # Upsert common name in French
      if common_name.present?
        Plant::CommonName.find_or_initialize_by(
          target_type: "genus",
          target_id: genus.id,
          language: "fr"
        ).tap do |cn|
          cn.name = common_name
          cn.save!
        end
      end
    end

    puts "Done! Imported #{pages.size} genera."
  end
end

# ------------------------------------------------------------------
# Notion API client — minimal wrapper around the REST API
# ------------------------------------------------------------------
class NotionApi
  BASE_URL = "https://api.notion.com/v1"
  NOTION_VERSION = "2022-06-28"

  def initialize(token)
    @token = token
  end

  # Query all pages from a database (handles pagination)
  def query_database(database_id)
    pages = []
    cursor = nil

    loop do
      body = { page_size: 100 }
      body[:start_cursor] = cursor if cursor

      data = post("/databases/#{database_id}/query", body)
      pages.concat(data["results"])

      break unless data["has_more"]
      cursor = data["next_cursor"]
    end

    pages
  end

  # Fetch all child blocks of a page/block (handles pagination)
  def get_blocks(block_id)
    blocks = []
    cursor = nil

    loop do
      path = "/blocks/#{block_id}/children?page_size=100"
      path += "&start_cursor=#{cursor}" if cursor

      data = get(path)
      blocks.concat(data["results"])

      break unless data["has_more"]
      cursor = data["next_cursor"]
    end

    blocks
  end

  private

  def headers
    {
      "Authorization" => "Bearer #{@token}",
      "Notion-Version" => NOTION_VERSION,
      "Content-Type" => "application/json"
    }
  end

  def get(path)
    uri = URI("#{BASE_URL}#{path}")
    request = Net::HTTP::Get.new(uri, headers)
    execute(uri, request)
  end

  def post(path, body)
    uri = URI("#{BASE_URL}#{path}")
    request = Net::HTTP::Post.new(uri, headers)
    request.body = body.to_json
    execute(uri, request)
  end

  def execute(uri, request)
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      abort "Notion API error #{response.code}: #{response.body}"
    end

    JSON.parse(response.body)
  end
end

# ------------------------------------------------------------------
# Convert Notion blocks to basic HTML
# ------------------------------------------------------------------
module NotionBlocksToHtml
  module_function

  def convert(blocks, api)
    html_parts = []
    i = 0

    while i < blocks.size
      block = blocks[i]
      type = block["type"]

      case type
      when "paragraph"
        text = rich_text_to_html(block.dig("paragraph", "rich_text"))
        html_parts << "<p>#{text}</p>" if text.present?

      when "heading_1"
        text = rich_text_to_html(block.dig("heading_1", "rich_text"))
        html_parts << "<h2>#{text}</h2>"

      when "heading_2"
        text = rich_text_to_html(block.dig("heading_2", "rich_text"))
        html_parts << "<h3>#{text}</h3>"

      when "heading_3"
        text = rich_text_to_html(block.dig("heading_3", "rich_text"))
        html_parts << "<h4>#{text}</h4>"

      when "bulleted_list_item"
        list_html, i = collect_list_items(blocks, i, "bulleted_list_item", "ul", api)
        html_parts << list_html
        next

      when "numbered_list_item"
        list_html, i = collect_list_items(blocks, i, "numbered_list_item", "ol", api)
        html_parts << list_html
        next

      when "to_do"
        text = rich_text_to_html(block.dig("to_do", "rich_text"))
        checked = block.dig("to_do", "checked") ? "x" : " "
        html_parts << "<p>[#{checked}] #{text}</p>"

      when "quote"
        text = rich_text_to_html(block.dig("quote", "rich_text"))
        html_parts << "<blockquote>#{text}</blockquote>"

      when "callout"
        text = rich_text_to_html(block.dig("callout", "rich_text"))
        html_parts << "<blockquote>#{text}</blockquote>"

      when "divider"
        html_parts << "<hr>"

      when "toggle"
        text = rich_text_to_html(block.dig("toggle", "rich_text"))
        children_html = fetch_children_html(block, api)
        html_parts << "<details><summary>#{text}</summary>#{children_html}</details>"

      when "code"
        text = rich_text_to_html(block.dig("code", "rich_text"))
        html_parts << "<pre><code>#{text}</code></pre>"

      when "image"
        url = block.dig("image", "file", "url") || block.dig("image", "external", "url")
        caption = rich_text_to_html(block.dig("image", "caption")) if block.dig("image", "caption")
        if url
          html_parts << "<figure><img src=\"#{url}\">"
          html_parts.last << "<figcaption>#{caption}</figcaption>" if caption.present?
          html_parts.last << "</figure>"
        end

      when "table"
        children_html = fetch_table_html(block, api)
        html_parts << children_html if children_html.present?
      end

      i += 1
    end

    html_parts.join("\n")
  end

  # Collect consecutive list items of the same type into a single <ul>/<ol>
  def collect_list_items(blocks, start_index, block_type, tag, api)
    items = []
    i = start_index

    while i < blocks.size && blocks[i]["type"] == block_type
      block = blocks[i]
      text = rich_text_to_html(block.dig(block_type, "rich_text"))
      children_html = fetch_children_html(block, api)
      items << "<li>#{text}#{children_html}</li>"
      i += 1
    end

    ["<#{tag}>#{items.join}</#{tag}>", i]
  end

  # Fetch and convert nested children blocks (for toggles, list items with sub-items)
  def fetch_children_html(block, api)
    return "" unless block["has_children"]

    children = api.get_blocks(block["id"])
    convert(children, api)
  end

  # Convert a Notion table block to an HTML table
  def fetch_table_html(block, api)
    return "" unless block["has_children"]

    rows = api.get_blocks(block["id"])
    has_header = block.dig("table", "has_column_header")

    html = "<table>"
    rows.each_with_index do |row, idx|
      cells = row.dig("table_row", "cells") || []
      tag = (idx == 0 && has_header) ? "th" : "td"
      row_html = cells.map { |cell| "<#{tag}>#{rich_text_to_html(cell)}</#{tag}>" }.join
      html << "<tr>#{row_html}</tr>"
    end
    html << "</table>"
    html
  end

  # Convert Notion rich_text array to HTML with inline formatting
  def rich_text_to_html(rich_text_array)
    return "" if rich_text_array.blank?

    rich_text_array.map do |segment|
      text = ERB::Util.html_escape(segment["plain_text"] || "")
      annotations = segment["annotations"] || {}

      text = "<strong>#{text}</strong>" if annotations["bold"]
      text = "<em>#{text}</em>" if annotations["italic"]
      text = "<s>#{text}</s>" if annotations["strikethrough"]
      text = "<u>#{text}</u>" if annotations["underline"]
      text = "<code>#{text}</code>" if annotations["code"]

      if segment.dig("href").present?
        text = "<a href=\"#{ERB::Util.html_escape(segment["href"])}\">#{text}</a>"
      end

      text
    end.join
  end
end

# ------------------------------------------------------------------
# Helpers to extract properties from a Notion page
# ------------------------------------------------------------------

def extract_title(page)
  page["properties"]&.each do |_key, prop|
    next unless prop["type"] == "title"
    return prop["title"]&.map { |t| t["plain_text"] }&.join("")
  end
  nil
end

def extract_rich_text_property(page, property_name)
  prop = page.dig("properties", property_name)
  return nil unless prop && prop["type"] == "rich_text"

  prop["rich_text"]&.map { |t| t["plain_text"] }&.join("")
end
