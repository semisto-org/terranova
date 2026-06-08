require 'test_helper'

class AcademyClosureReadinessTest < ActionDispatch::IntegrationTest
  setup do
    @type = Academy::TrainingType.create!(name: "Clôture #{SecureRandom.hex(3)}")
    @training = Academy::Training.create!(title: 'JF Pro', status: 'post_production', training_type: @type)
  end

  def add_registration(payment_status)
    Academy::TrainingRegistration.create!(
      training: @training,
      contact_name: "P-#{SecureRandom.hex(3)}",
      payment_status: payment_status,
      carpooling: 'none',
      registered_at: Time.current
    )
  end

  def readiness_for(training_id)
    get '/api/v1/academy', as: :json
    JSON.parse(response.body)['trainings']
      .find { |t| t['id'] == training_id.to_s }['closureReadiness']
  end

  test 'closure readiness counts unpaid participant payments' do
    add_registration('paid')
    add_registration('paid')
    add_registration('pending')

    r = readiness_for(@training.id)
    assert_equal 3, r['totalRegistrations']
    assert_equal 2, r['paidCount']
    assert_equal 1, r['unpaidCount']
    assert_equal false, r['allPaid']
  end

  test 'closure readiness is allPaid when every registration is paid' do
    add_registration('paid')
    add_registration('paid')

    r = readiness_for(@training.id)
    assert_equal 0, r['unpaidCount']
    assert_equal true, r['allPaid']
  end

  test 'a training with no registrations is considered ready to close' do
    r = readiness_for(@training.id)
    assert_equal 0, r['totalRegistrations']
    assert_equal true, r['allPaid']
    assert_equal true, r['readyToClose']
    assert_equal 0, r['pendingExpensesCount']
  end

  test 'an unpaid supplier expense blocks closure readiness' do
    add_registration('paid')
    Expense.create!(
      projectable: @training, status: 'processing', expense_type: 'services_and_goods',
      total_incl_vat: 250, supplier: 'Salle X', invoice_date: Date.current
    )

    r = readiness_for(@training.id)
    assert_equal true, r['allPaid']
    assert_equal 1, r['pendingExpensesCount']
    assert_equal false, r['readyToClose'], 'une dépense non réglée empêche readyToClose'
  end

  test 'a paid supplier expense does not block closure' do
    add_registration('paid')
    Expense.create!(
      projectable: @training, status: 'paid', expense_type: 'services_and_goods',
      total_incl_vat: 250, supplier: 'Salle X', invoice_date: Date.current
    )

    r = readiness_for(@training.id)
    assert_equal 0, r['pendingExpensesCount']
    assert_equal true, r['readyToClose']
  end

  test 'closure payload exposes document count' do
    r = readiness_for(@training.id)
    assert r.key?('documentsCount')
  end
end
