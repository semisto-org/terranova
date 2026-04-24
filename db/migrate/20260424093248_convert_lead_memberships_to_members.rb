class ConvertLeadMembershipsToMembers < ActiveRecord::Migration[8.1]
  def up
    execute(<<~SQL)
      UPDATE project_memberships
      SET role = 'member'
      WHERE role = 'lead'
        AND NOT EXISTS (
          SELECT 1 FROM project_memberships pm2
          WHERE pm2.projectable_type = project_memberships.projectable_type
            AND pm2.projectable_id = project_memberships.projectable_id
            AND pm2.member_id = project_memberships.member_id
            AND pm2.role = 'member'
            AND pm2.id <> project_memberships.id
        );
    SQL

    execute("DELETE FROM project_memberships WHERE role = 'lead';")
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
