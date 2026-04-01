# frozen_string_literal: true

class BackfillUnifiedTaskSystem < ActiveRecord::Migration[8.1]
  def up
    # ---------------------------------------------------------------
    # 2.1 Backfill task_lists.taskable_type/taskable_id from legacy FKs
    # ---------------------------------------------------------------
    execute <<~SQL
      UPDATE task_lists SET taskable_type = 'PoleProject', taskable_id = pole_project_id
      WHERE pole_project_id IS NOT NULL AND taskable_type IS NULL;
    SQL

    execute <<~SQL
      UPDATE task_lists SET taskable_type = 'Academy::Training', taskable_id = training_id
      WHERE training_id IS NOT NULL AND taskable_type IS NULL;
    SQL

    execute <<~SQL
      UPDATE task_lists SET taskable_type = 'Guild', taskable_id = guild_id
      WHERE guild_id IS NOT NULL AND taskable_type IS NULL;
    SQL

    # ---------------------------------------------------------------
    # 2.2 Copy design_task_lists → task_lists with taskable polymorphic
    # ---------------------------------------------------------------
    execute <<~SQL
      INSERT INTO task_lists (name, position, taskable_type, taskable_id, created_at, updated_at)
      SELECT name, position, 'Design::Project', project_id, created_at, updated_at
      FROM design_task_lists;
    SQL

    # ---------------------------------------------------------------
    # 2.3 Copy actions → tasks (with status mapping and assignee resolution)
    # ---------------------------------------------------------------
    execute <<~SQL
      INSERT INTO tasks (name, description, status, due_date, assignee_name, priority, tags, time_minutes, position, parent_id, task_list_id, assignee_id, created_at, updated_at)
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
        CASE
          WHEN a.priority IN ('low', 'medium', 'high') THEN a.priority
          ELSE NULL
        END,
        COALESCE(a.tags, '[]'::jsonb),
        a.time_minutes,
        a.position,
        NULL,
        a.task_list_id,
        (SELECT m.id FROM members m
         WHERE LOWER(TRIM(a.assignee_name)) IN (
           LOWER(TRIM(m.first_name)),
           LOWER(TRIM(m.first_name || ' ' || m.last_name))
         )
         LIMIT 1),
        a.created_at,
        a.updated_at
      FROM actions a
      WHERE a.task_list_id IS NOT NULL;
    SQL

    # ---------------------------------------------------------------
    # 2.4 Copy design_tasks → tasks (using new task_list mapping)
    #     Match design_task_lists to the new task_lists rows by
    #     (taskable_type='Design::Project', taskable_id=project_id, name, position)
    # ---------------------------------------------------------------
    execute <<~SQL
      INSERT INTO tasks (name, description, status, due_date, assignee_id, assignee_name, position, task_list_id, created_at, updated_at)
      SELECT
        dt.name,
        dt.notes,
        dt.status,
        dt.due_date,
        dt.assignee_id,
        dt.assignee_name,
        dt.position,
        tl.id,
        dt.created_at,
        dt.updated_at
      FROM design_tasks dt
      INNER JOIN design_task_lists dtl ON dtl.id = dt.task_list_id
      INNER JOIN task_lists tl ON tl.taskable_type = 'Design::Project'
        AND tl.taskable_id = dtl.project_id
        AND tl.name = dtl.name
        AND tl.position = dtl.position;
    SQL

    # ---------------------------------------------------------------
    # 2.5 Backfill project_memberships
    # ---------------------------------------------------------------

    # From guild_memberships → role "member"
    execute <<~SQL
      INSERT INTO project_memberships (projectable_type, projectable_id, member_id, role, joined_at, created_at, updated_at)
      SELECT 'Guild', guild_id, member_id, 'member', created_at, created_at, updated_at
      FROM guild_memberships
      ON CONFLICT DO NOTHING;
    SQL

    # From guilds.leader_id → role "lead"
    execute <<~SQL
      INSERT INTO project_memberships (projectable_type, projectable_id, member_id, role, joined_at, created_at, updated_at)
      SELECT 'Guild', id, leader_id, 'lead', created_at, created_at, updated_at
      FROM guilds
      WHERE leader_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    SQL

    # From design_team_members → preserve role and is_paid
    execute <<~SQL
      INSERT INTO project_memberships (projectable_type, projectable_id, member_id, role, is_paid, joined_at, created_at, updated_at)
      SELECT 'Design::Project', project_id, CAST(member_id AS bigint), role, is_paid, assigned_at, created_at, updated_at
      FROM design_team_members
      WHERE deleted_at IS NULL
        AND member_id ~ '^\d+$'
      ON CONFLICT DO NOTHING;
    SQL

    # From pole_projects.lead_name → role "lead" (resolve name to member_id)
    execute <<~SQL
      INSERT INTO project_memberships (projectable_type, projectable_id, member_id, role, joined_at, created_at, updated_at)
      SELECT 'PoleProject', pp.id, m.id, 'lead', pp.created_at, pp.created_at, pp.updated_at
      FROM pole_projects pp
      INNER JOIN members m ON LOWER(TRIM(pp.lead_name)) = LOWER(TRIM(m.first_name || ' ' || m.last_name))
      WHERE pp.lead_name IS NOT NULL AND pp.lead_name != ''
      ON CONFLICT DO NOTHING;
    SQL
  end

  def down
    execute "DELETE FROM tasks"
    execute "DELETE FROM project_memberships"
    execute "UPDATE task_lists SET taskable_type = NULL, taskable_id = NULL"
    execute "DELETE FROM task_lists WHERE pole_project_id IS NULL AND training_id IS NULL AND guild_id IS NULL AND taskable_type = 'Design::Project'"
  end
end
