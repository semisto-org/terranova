# frozen_string_literal: true

class FixBackfillOrphanedActions < ActiveRecord::Migration[8.1]
  def up
    # ---------------------------------------------------------------
    # Fix 1: Create default task lists for actions attached directly
    #         to pole_projects without a task_list_id
    # ---------------------------------------------------------------
    execute <<~SQL
      INSERT INTO task_lists (name, position, taskable_type, taskable_id, pole_project_id, created_at, updated_at)
      SELECT DISTINCT 'Actions', 0, 'PoleProject', a.pole_project_id, a.pole_project_id, NOW(), NOW()
      FROM actions a
      WHERE a.task_list_id IS NULL AND a.pole_project_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM task_lists tl
          WHERE tl.taskable_type = 'PoleProject' AND tl.taskable_id = a.pole_project_id AND tl.name = 'Actions'
        );
    SQL

    # Migrate orphaned pole_project actions → tasks
    execute <<~SQL
      INSERT INTO tasks (name, description, status, due_date, assignee_name, priority, tags, time_minutes, position, task_list_id, assignee_id, created_at, updated_at)
      SELECT
        a.name,
        NULL,
        CASE
          WHEN a.status IN ('Terminé', 'completed') THEN 'completed'
          WHEN a.status IN ('En cours', 'in_progress') THEN 'in_progress'
          ELSE 'pending'
        END,
        a.due_date,
        a.assignee_name,
        CASE WHEN a.priority IN ('low', 'medium', 'high') THEN a.priority ELSE NULL END,
        COALESCE(a.tags, '[]'::jsonb),
        a.time_minutes,
        a.position,
        tl.id,
        (SELECT m.id FROM members m
         WHERE LOWER(TRIM(a.assignee_name)) IN (
           LOWER(TRIM(m.first_name)),
           LOWER(TRIM(m.first_name || ' ' || m.last_name))
         ) LIMIT 1),
        a.created_at,
        a.updated_at
      FROM actions a
      INNER JOIN task_lists tl ON tl.taskable_type = 'PoleProject'
        AND tl.taskable_id = a.pole_project_id AND tl.name = 'Actions'
      WHERE a.task_list_id IS NULL AND a.pole_project_id IS NOT NULL;
    SQL

    # ---------------------------------------------------------------
    # Fix 2: Create default task lists for actions attached directly
    #         to trainings without a task_list_id
    # ---------------------------------------------------------------
    execute <<~SQL
      INSERT INTO task_lists (name, position, taskable_type, taskable_id, training_id, created_at, updated_at)
      SELECT DISTINCT 'Actions', 0, 'Academy::Training', a.training_id, a.training_id, NOW(), NOW()
      FROM actions a
      WHERE a.task_list_id IS NULL AND a.training_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM task_lists tl
          WHERE tl.taskable_type = 'Academy::Training' AND tl.taskable_id = a.training_id AND tl.name = 'Actions'
        );
    SQL

    # Migrate orphaned training actions → tasks
    execute <<~SQL
      INSERT INTO tasks (name, description, status, due_date, assignee_name, priority, tags, time_minutes, position, task_list_id, assignee_id, created_at, updated_at)
      SELECT
        a.name,
        NULL,
        CASE
          WHEN a.status IN ('Terminé', 'completed') THEN 'completed'
          WHEN a.status IN ('En cours', 'in_progress') THEN 'in_progress'
          ELSE 'pending'
        END,
        a.due_date,
        a.assignee_name,
        CASE WHEN a.priority IN ('low', 'medium', 'high') THEN a.priority ELSE NULL END,
        COALESCE(a.tags, '[]'::jsonb),
        a.time_minutes,
        a.position,
        tl.id,
        (SELECT m.id FROM members m
         WHERE LOWER(TRIM(a.assignee_name)) IN (
           LOWER(TRIM(m.first_name)),
           LOWER(TRIM(m.first_name || ' ' || m.last_name))
         ) LIMIT 1),
        a.created_at,
        a.updated_at
      FROM actions a
      INNER JOIN task_lists tl ON tl.taskable_type = 'Academy::Training'
        AND tl.taskable_id = a.training_id AND tl.name = 'Actions'
      WHERE a.task_list_id IS NULL AND a.training_id IS NOT NULL;
    SQL

    # ---------------------------------------------------------------
    # Fix 3: Re-backfill design_team_members with corrected regex
    # ---------------------------------------------------------------
    execute "INSERT INTO project_memberships (projectable_type, projectable_id, member_id, role, is_paid, joined_at, created_at, updated_at) " \
            "SELECT 'Design::Project', project_id, CAST(member_id AS bigint), role, is_paid, assigned_at, created_at, updated_at " \
            "FROM design_team_members " \
            "WHERE deleted_at IS NULL AND member_id ~ '^\\d+$' " \
            "ON CONFLICT DO NOTHING;"
  end

  def down
    # Handled by parent migration rollback
  end
end
