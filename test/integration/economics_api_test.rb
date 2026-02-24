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
end
