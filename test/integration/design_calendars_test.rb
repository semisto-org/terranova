require 'test_helper'

# Fusion des calendriers Design en une table unique design_calendars (#161).
# Vérifie la discrimination par calendar_type, l'unicité (project_id,
# calendar_type), et l'accès récolte/entretien via Design::Project.
class DesignCalendarsTest < ActionDispatch::IntegrationTest
  setup do
    [Design::Calendar, Design::Project].each(&:delete_all)
    @project = Design::Project.create!(
      name: 'Projet calendriers', client_id: 'c1', client_name: 'Client',
      client_email: 'c@test.be', client_phone: '0', phase: 'reception',
      status: 'active', project_manager_id: ''
    )
  end

  test 'a project exposes harvest and maintenance calendars from the single table' do
    @project.create_harvest_calendar!(months: [{ month: 1, name: 'Janvier', tasks: [], harvests: [] }])
    @project.create_maintenance_calendar!(months: [{ month: 1, name: 'Janvier', tasks: [], harvests: [] }])

    assert_equal 'harvest', @project.reload.harvest_calendar.calendar_type
    assert_equal 'maintenance', @project.maintenance_calendar.calendar_type
    # Les deux vivent dans la même table, discriminés par calendar_type.
    assert_equal 2, Design::Calendar.where(project_id: @project.id).count
  end

  test 'a project cannot have two calendars of the same type' do
    @project.create_harvest_calendar!(months: [])
    dup = Design::Calendar.new(project: @project, calendar_type: 'harvest', months: [])
    assert_not dup.valid?
    assert dup.errors[:project_id].any?
  end

  test 'calendar_type is constrained to the closed list' do
    bad = Design::Calendar.new(project: @project, calendar_type: 'weather', months: [])
    assert_not bad.valid?
    assert bad.errors[:calendar_type].any?
  end

  test 'destroying a project cascades to its calendars' do
    @project.create_harvest_calendar!(months: [])
    @project.create_maintenance_calendar!(months: [])
    assert_difference -> { Design::Calendar.count }, -2 do
      @project.destroy
    end
  end
end
