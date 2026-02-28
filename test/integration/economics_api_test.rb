require "test_helper"

class EconomicsApiTest < ActionDispatch::IntegrationTest
  test "inputs CRUD and filters" do
    location_1 = Location.create!(name: "Loc 1")
    location_2 = Location.create!(name: "Loc 2")

    post "/api/v1/economics/inputs", params: {
      economic_input: {
        date: "2026-02-10",
        category: "plants",
        amount_cents: 1200,
        quantity: 3,
        unit: "kg",
        location_id: location_1.id
      }
    }
    assert_response :created
    id = JSON.parse(response.body)["id"]

    post "/api/v1/economics/inputs", params: {
      economic_input: {
        date: "2026-02-11",
        category: "labor",
        amount_cents: 800,
        quantity: 1,
        unit: "h",
        location_id: location_2.id
      }
    }
    assert_response :created

    get "/api/v1/economics/inputs", params: { location_id: location_1.id }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["inputs"].size
    assert_equal "plants", body["inputs"].first["category"]

    patch "/api/v1/economics/inputs/#{id}", params: { economic_input: { notes: "updated" } }
    assert_response :success
    assert_equal "updated", JSON.parse(response.body)["notes"]

    delete "/api/v1/economics/inputs/#{id}"
    assert_response :no_content
  end

  test "input with labor_type" do
    post "/api/v1/economics/inputs", params: {
      economic_input: {
        date: "2026-02-15",
        category: "labor",
        amount_cents: 500,
        quantity: 2,
        unit: "h",
        labor_type: "plantation"
      }
    }
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "plantation", body["labor_type"]
    assert_equal "labor", body["category"]
  end

  test "labor_type rejected for non-labor category" do
    post "/api/v1/economics/inputs", params: {
      economic_input: {
        date: "2026-02-15",
        category: "plants",
        amount_cents: 500,
        quantity: 2,
        unit: "kg",
        labor_type: "plantation"
      }
    }
    assert_response :unprocessable_entity
  end

  test "outputs CRUD and dashboard" do
    project = Design::Project.create!(name: "P2", client_name: "Client", client_id: "c2", area: 1000)

    post "/api/v1/economics/outputs", params: {
      economic_output: {
        date: "2026-02-12",
        category: "sale",
        amount_cents: 4000,
        quantity: 5,
        unit: "kg",
        design_project_id: project.id
      }
    }
    assert_response :created
    output_id = JSON.parse(response.body)["id"]

    get "/api/v1/economics/outputs", params: { design_project_id: project.id }
    assert_response :success
    assert_equal 1, JSON.parse(response.body)["outputs"].size

    patch "/api/v1/economics/outputs/#{output_id}", params: { economic_output: { species_name: "Tomato" } }
    assert_response :success
    assert_equal "Tomato", JSON.parse(response.body)["species_name"]

    get "/api/v1/economics/dashboard", params: { design_project_id: project.id }
    assert_response :success
    dashboard = JSON.parse(response.body)
    assert_equal 4000, dashboard["totals"]["outputs_cents"]

    delete "/api/v1/economics/outputs/#{output_id}"
    assert_response :no_content
  end

  test "output with species_id" do
    genus = Plant::Genus.create!(latin_name: "Malus")
    species = Plant::Species.create!(latin_name: "Malus domestica", genus: genus, plant_type: "tree")

    post "/api/v1/economics/outputs", params: {
      economic_output: {
        date: "2026-02-15",
        category: "harvest",
        amount_cents: 2000,
        quantity: 10,
        unit: "kg",
        species_id: species.id,
        species_name: "Malus domestica"
      }
    }
    assert_response :created
    body = JSON.parse(response.body)
    assert_equal species.id.to_s, body["species_id"]
    assert_equal "Malus domestica", body["species_latin_name"]
    assert_equal "Malus domestica", body["species_name"]
  end
end
