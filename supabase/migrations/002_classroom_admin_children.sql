-- Allow classroom admins to manage children in classrooms they administer
DROP POLICY IF EXISTS "classroom admins can manage their children" ON children;
CREATE POLICY "classroom admins can manage their children" ON children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE profile_id = auth.uid()
        AND classroom_id = children.classroom_id
        AND role = 'classroom_admin'
        AND approved = true
    )
  );

-- Allow classroom admins to manage family_members for children in their classrooms
DROP POLICY IF EXISTS "classroom admins can manage family members" ON family_members;
CREATE POLICY "classroom admins can manage family members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN memberships m ON m.classroom_id = c.classroom_id
      WHERE c.id = family_members.child_id
        AND m.profile_id = auth.uid()
        AND m.role = 'classroom_admin'
        AND m.approved = true
    )
  );

-- Fix progress_reports insert policy: use membership role, not profile role
DROP POLICY IF EXISTS "admins can insert reports" ON progress_reports;
CREATE POLICY "admins can insert reports" ON progress_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM memberships m
      JOIN children c ON c.classroom_id = m.classroom_id
      WHERE m.profile_id = auth.uid()
        AND m.role = 'classroom_admin'
        AND m.approved = true
        AND c.id = progress_reports.child_id
    )
  );

-- Fix progress_reports delete policy similarly
DROP POLICY IF EXISTS "admins can delete reports" ON progress_reports;
CREATE POLICY "admins can delete reports" ON progress_reports
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM memberships m
      JOIN children c ON c.classroom_id = m.classroom_id
      WHERE m.profile_id = auth.uid()
        AND m.role = 'classroom_admin'
        AND m.approved = true
        AND c.id = progress_reports.child_id
    )
  );
