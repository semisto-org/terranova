# frozen_string_literal: true

require "prawn"
require "prawn/table"

Prawn::Fonts::AFM.hide_m17n_warning = true

# Renders a Note de frais to PDF using Prawn.
#
# Layout: clean editorial / refined typography. Top section: emitter
# coordinates (organization). Right-aligned: document number, date, status.
# Recipient block. Lines table. Total. Footer with IBAN.
class ExpenseNotePdf
  PRIMARY = "5B5781"
  INK = "1C1917"
  MUTED = "78716C"
  HAIRLINE = "E7E5E4"

  def initialize(expense_note)
    @note = expense_note
    @org = expense_note.organization
    @contact = expense_note.contact
  end

  def render
    pdf = Prawn::Document.new(
      page_size: "A4",
      margin: [48, 56, 56, 56],
      info: {
        Title: @note.number,
        Author: @org.name,
        Subject: @note.subject,
        Creator: "Terranova"
      }
    )

    setup_fonts(pdf)
    draw_header(pdf)
    draw_recipient_and_meta(pdf)
    draw_subject(pdf)
    draw_lines_table(pdf)
    draw_total(pdf)
    draw_footer(pdf)

    pdf.render
  end

  private

  def setup_fonts(pdf)
    pdf.font_families.update(
      "Helvetica" => {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italic: "Helvetica-Oblique",
        bold_italic: "Helvetica-BoldOblique"
      }
    )
    pdf.font "Helvetica"
    pdf.default_leading 2
  end

  def draw_header(pdf)
    start_y = pdf.cursor
    logo_data = fetch_logo_blob
    text_x = 0
    text_width = pdf.bounds.width

    if logo_data
      begin
        pdf.image StringIO.new(logo_data), at: [0, start_y], fit: [64, 64]
        text_x = 80
        text_width = pdf.bounds.width - 80
      rescue Prawn::Errors::UnsupportedImageType, StandardError
        # fall back to text-only header if the logo can't be decoded
      end
    end

    pdf.bounding_box([text_x, start_y], width: text_width) do
      pdf.fill_color PRIMARY
      pdf.font("Helvetica", style: :bold) do
        pdf.text @org.name.upcase, size: 16, character_spacing: 1.5
      end

      pdf.fill_color MUTED
      pdf.move_down 4
      pdf.text "NOTE DE FRAIS", size: 8, character_spacing: 2

      pdf.fill_color INK
      pdf.move_down 2

      if @org.address.present?
        pdf.text @org.address.to_s, size: 9, leading: 2
      end

      detail_bits = []
      detail_bits << @org.legal_form if @org.legal_form.present?
      detail_bits << "BCE #{@org.registration_number}" if @org.registration_number.present?
      detail_bits << @org.email if @org.email.present?
      detail_bits << @org.phone if @org.phone.present?
      if detail_bits.any?
        pdf.fill_color MUTED
        pdf.move_down 2
        pdf.text detail_bits.join("  ·  "), size: 8
      end
    end

    # Ensure cursor is below the logo if the logo is taller than the text block
    pdf.move_cursor_to([pdf.cursor, start_y - 70].min)
    pdf.stroke_color HAIRLINE
    pdf.line_width 0.5
    pdf.stroke_horizontal_rule
    pdf.move_down 22
  end

  def fetch_logo_blob
    return nil unless @org.logo.attached?

    @org.logo.download
  rescue StandardError
    nil
  end

  def draw_recipient_and_meta(pdf)
    start_y = pdf.cursor

    # Left: recipient
    pdf.bounding_box([0, start_y], width: 280) do
      pdf.fill_color MUTED
      pdf.text "DESTINATAIRE", size: 7, character_spacing: 1.5
      pdf.move_down 4
      pdf.fill_color INK
      pdf.font("Helvetica", style: :bold) do
        pdf.text @contact.display_name, size: 12
      end
      pdf.fill_color INK
      if @contact.address.present?
        pdf.move_down 2
        pdf.text @contact.address.to_s, size: 9, leading: 2
      end
      if @contact.email.present?
        pdf.fill_color MUTED
        pdf.move_down 2
        pdf.text @contact.email, size: 8
      end
    end

    # Right: meta block
    pdf.bounding_box([300, start_y], width: pdf.bounds.width - 300) do
      formatted_date = @note.note_date.strftime("%d/%m/%Y")
      meta = [
        ["Numéro", @note.number],
        ["Date", formatted_date],
        ["Statut", status_label(@note.status)]
      ]
      meta.each do |label, value|
        pdf.fill_color MUTED
        pdf.text label.upcase, size: 7, character_spacing: 1.2
        pdf.move_down 1
        pdf.fill_color INK
        pdf.font("Helvetica", style: :bold) do
          pdf.text value.to_s, size: 10
        end
        pdf.move_down 6
      end
    end

    pdf.move_down 30
  end

  def draw_subject(pdf)
    pdf.fill_color MUTED
    pdf.text "OBJET", size: 7, character_spacing: 1.5
    pdf.move_down 3
    pdf.fill_color INK
    pdf.font("Helvetica", style: :bold) do
      pdf.text @note.subject, size: 13
    end
    pdf.move_down 18
  end

  def draw_lines_table(pdf)
    rows = [["Libellé", "Quantité", "Montant unitaire", "Total"]]
    @note.lines.each do |line|
      rows << [
        line.label,
        format_quantity(line.quantity),
        format_money(line.unit_amount_cents),
        format_money(line.line_total_cents)
      ]
    end

    pdf.table(rows, width: pdf.bounds.width, header: true,
                    cell_style: { borders: [:bottom], border_width: 0.5, border_color: HAIRLINE,
                                  padding: [10, 6, 10, 6], size: 9, text_color: INK }) do
      row(0).font_style = :bold
      row(0).size = 7
      row(0).text_color = MUTED
      row(0).borders = [:bottom]
      row(0).border_width = 1
      row(0).border_color = INK
      columns(1..3).align = :right
      column(0).width = pdf.bounds.width * 0.5
    end
    pdf.move_down 14
  end

  def draw_total(pdf)
    label_w = 120
    pdf.bounding_box([pdf.bounds.width - 240, pdf.cursor], width: 240) do
      pdf.stroke_color INK
      pdf.line_width 1
      pdf.stroke_horizontal_rule
      pdf.move_down 10
      pdf.font("Helvetica", style: :bold) do
        pdf.fill_color INK
        pdf.text_box "TOTAL À RÉGLER", at: [0, pdf.cursor], width: label_w, size: 9, character_spacing: 1.2
        pdf.text_box format_money(@note.total_cents),
                     at: [label_w, pdf.cursor],
                     width: 240 - label_w,
                     size: 16,
                     align: :right
      end
    end
    pdf.move_down 50
  end

  def draw_footer(pdf)
    pdf.bounding_box([0, 70], width: pdf.bounds.width, height: 60) do
      pdf.stroke_color HAIRLINE
      pdf.line_width 0.5
      pdf.stroke_horizontal_rule
      pdf.move_down 10
      pdf.fill_color MUTED
      pdf.text "Document émis par #{@org.name}", size: 8
      if @org.iban.present?
        pdf.move_down 3
        pdf.text "Paiement par virement sur #{@org.iban} — communication : #{@note.number}", size: 8
      end
      if @note.notes.present?
        pdf.move_down 6
        pdf.text @note.notes.to_s, size: 8, color: MUTED
      end
    end
  end

  def format_money(cents)
    euros = (cents.to_i / 100.0)
    formatted = format("%.2f", euros).tr(".", ",")
    int_part, dec_part = formatted.split(",")
    int_with_sep = int_part.reverse.gsub(/(\d{3})(?=\d)/, '\\1 ').reverse
    "#{int_with_sep},#{dec_part} €"
  end

  def format_quantity(qty)
    f = qty.to_f
    f == f.to_i ? f.to_i.to_s : format("%.2f", f).tr(".", ",")
  end

  def status_label(status)
    {
      "draft" => "Brouillon",
      "to_send" => "À envoyer",
      "sent" => "Envoyée",
      "paid" => "Payée"
    }[status] || status
  end
end
