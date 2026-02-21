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

  # Fetch all blocks (content) of a Notion page, recursively
  def fetch_page_blocks(page_id)
    blocks = []
    cursor = nil

    loop do
      path = "/blocks/#{page_id}/children?page_size=100"
      path += "&start_cursor=#{cursor}" if cursor
      response = api_get(path)
      results = response["results"] || []

      results.each do |block|
        if block["has_children"]
          block["children"] = fetch_page_blocks(block["id"])
        end
        blocks << block
      end

      break unless response["has_more"]
      cursor = response["next_cursor"]
    end

    blocks
  end

  # Convert Notion blocks to HTML
  def blocks_to_html(blocks)
    html_parts = []
    i = 0

    while i < blocks.length
      block = blocks[i]
      type = block["type"]

      case type
      when "paragraph"
        text = rich_text_to_html(block.dig("paragraph", "rich_text"))
        html_parts << "<p>#{text}</p>" if text.present?
      when "heading_1"
        text = rich_text_to_html(block.dig("heading_1", "rich_text"))
        html_parts << "<h1>#{text}</h1>"
      when "heading_2"
        text = rich_text_to_html(block.dig("heading_2", "rich_text"))
        html_parts << "<h2>#{text}</h2>"
      when "heading_3"
        text = rich_text_to_html(block.dig("heading_3", "rich_text"))
        html_parts << "<h3>#{text}</h3>"
      when "bulleted_list_item"
        items = collect_list_items(blocks, i, "bulleted_list_item")
        html_parts << "<ul>#{items.map { |b| list_item_html(b, "bulleted_list_item") }.join}</ul>"
        i += items.length - 1
      when "numbered_list_item"
        items = collect_list_items(blocks, i, "numbered_list_item")
        html_parts << "<ol>#{items.map { |b| list_item_html(b, "numbered_list_item") }.join}</ol>"
        i += items.length - 1
      when "to_do"
        checked = block.dig("to_do", "checked") ? "checked" : ""
        text = rich_text_to_html(block.dig("to_do", "rich_text"))
        html_parts << %(<p><input type="checkbox" disabled #{checked}> #{text}</p>)
      when "code"
        text = rich_text_to_html(block.dig("code", "rich_text"))
        lang = block.dig("code", "language") || ""
        html_parts << "<pre><code class=\"language-#{lang}\">#{text}</code></pre>"
      when "image"
        url = block.dig("image", "file", "url") || block.dig("image", "external", "url") || ""
        caption = rich_text_to_html(block.dig("image", "caption")) || ""
        html_parts << %(<figure><img src="#{url}" alt="#{caption}"><figcaption>#{caption}</figcaption></figure>)
      when "divider"
        html_parts << "<hr>"
      when "quote"
        text = rich_text_to_html(block.dig("quote", "rich_text"))
        children_html = block["children"] ? blocks_to_html(block["children"]) : ""
        html_parts << "<blockquote>#{text}#{children_html}</blockquote>"
      when "callout"
        text = rich_text_to_html(block.dig("callout", "rich_text"))
        icon = block.dig("callout", "icon", "emoji") || ""
        children_html = block["children"] ? blocks_to_html(block["children"]) : ""
        html_parts << %(<div class="callout">#{icon} #{text}#{children_html}</div>)
      when "toggle"
        text = rich_text_to_html(block.dig("toggle", "rich_text"))
        children_html = block["children"] ? blocks_to_html(block["children"]) : ""
        html_parts << "<details><summary>#{text}</summary>#{children_html}</details>"
      when "table"
        html_parts << table_to_html(block)
      when "bookmark"
        url = block.dig("bookmark", "url") || ""
        caption = rich_text_to_html(block.dig("bookmark", "caption"))
        label = caption.present? ? caption : url
        html_parts << %(<p><a href="#{url}">#{label}</a></p>)
      when "embed"
        url = block.dig("embed", "url") || ""
        html_parts << %(<p><a href="#{url}">#{url}</a></p>)
      when "video"
        url = block.dig("video", "file", "url") || block.dig("video", "external", "url") || ""
        html_parts << %(<p><a href="#{url}">Video</a></p>)
      end

      i += 1
    end

    html_parts.join("\n")
  end

  # Create or update a NotionRecord for a page
  def upsert_notion_record(page, database_name:, database_id:, content_blocks: nil, content_html: nil)
    notion_id = page["id"]
    title = extract(page["properties"], "Name") || extract(page["properties"], "Nom") || ""

    record = NotionRecord.find_or_initialize_by(notion_id: notion_id)
    record.assign_attributes(
      database_name: database_name,
      database_id: database_id,
      title: title,
      properties: page["properties"],
      content: content_blocks&.to_json,
      content_html: content_html
    )
    record.save!
    record
  end

  # Fetch page content and convert to HTML
  def fetch_and_convert_page_content(page_id)
    blocks = fetch_page_blocks(page_id)
    html = blocks_to_html(blocks)
    [blocks, html]
  end

  private

  def collect_list_items(blocks, start_index, type)
    items = []
    i = start_index
    while i < blocks.length && blocks[i]["type"] == type
      items << blocks[i]
      i += 1
    end
    items
  end

  def list_item_html(block, type)
    text = rich_text_to_html(block.dig(type, "rich_text"))
    children_html = block["children"] ? blocks_to_html(block["children"]) : ""
    "<li>#{text}#{children_html}</li>"
  end

  def table_to_html(block)
    return "<table></table>" unless block["children"]

    rows = block["children"]
    html = "<table>"
    rows.each_with_index do |row, idx|
      cells = row.dig("table_row", "cells") || []
      tag = idx == 0 && block.dig("table", "has_column_header") ? "th" : "td"
      html += "<tr>"
      cells.each do |cell|
        html += "<#{tag}>#{rich_text_to_html(cell)}</#{tag}>"
      end
      html += "</tr>"
    end
    html += "</table>"
    html
  end

  def rich_text_to_html(arr)
    return "" if arr.nil? || arr.empty?
    arr.map { |t| format_rich_text(t) }.join
  end

  def format_rich_text(t)
    text = t["plain_text"] || ""
    text = ERB::Util.html_escape(text)
    annotations = t["annotations"] || {}

    text = "<strong>#{text}</strong>" if annotations["bold"]
    text = "<em>#{text}</em>" if annotations["italic"]
    text = "<s>#{text}</s>" if annotations["strikethrough"]
    text = "<u>#{text}</u>" if annotations["underline"]
    text = "<code>#{text}</code>" if annotations["code"]

    color = annotations["color"]
    if color.present? && color != "default"
      if color.end_with?("_background")
        text = %(<span style="background-color: #{color.sub('_background', '')}">#{text}</span>)
      else
        text = %(<span style="color: #{color}">#{text}</span>)
      end
    end

    href = t.dig("href")
    text = %(<a href="#{href}">#{text}</a>) if href.present?

    text
  end

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
