-- Daily activity reports (one per child per day, teacher fills out, parents view)
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  mood text CHECK (mood IN ('great', 'good', 'okay', 'fussy', 'sick')),
  breakfast text CHECK (breakfast IN ('all', 'some', 'little', 'none', 'not_offered')),
  lunch text CHECK (lunch IN ('all', 'some', 'little', 'none', 'not_offered')),
  snack text CHECK (snack IN ('all', 'some', 'little', 'none', 'not_offered')),
  nap_minutes integer,
  activities text,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, report_date)
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_daily_reports" ON daily_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "teacher_manage_daily_reports" ON daily_reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = auth.uid()
      AND classroom_id = daily_reports.classroom_id
      AND role = 'classroom_admin'
      AND approved = true
  )
);

CREATE POLICY "parent_view_daily_reports" ON daily_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_members
    WHERE profile_id = auth.uid() AND child_id = daily_reports.child_id
  )
);

-- Classroom calendar events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT true,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "teacher_manage_events" ON events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = auth.uid()
      AND classroom_id = events.classroom_id
      AND role = 'classroom_admin'
      AND approved = true
  )
);

CREATE POLICY "member_view_events" ON events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = auth.uid()
      AND classroom_id = events.classroom_id
      AND approved = true
  )
);

-- Incident reports
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  location text,
  description text NOT NULL,
  action_taken text NOT NULL,
  parent_notified boolean NOT NULL DEFAULT false,
  reported_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_incidents" ON incident_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "teacher_manage_incidents" ON incident_reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = auth.uid()
      AND classroom_id = incident_reports.classroom_id
      AND role = 'classroom_admin'
      AND approved = true
  )
);

CREATE POLICY "parent_view_incidents" ON incident_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_members
    WHERE profile_id = auth.uid() AND child_id = incident_reports.child_id
  )
);

-- Authorized pickup persons (who is allowed to pick up a child besides parents)
CREATE TABLE IF NOT EXISTS authorized_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text,
  notes text,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE authorized_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pickups" ON authorized_pickups FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "teacher_manage_pickups" ON authorized_pickups FOR ALL USING (
  EXISTS (
    SELECT 1 FROM children c
    JOIN memberships m ON m.classroom_id = c.classroom_id
    WHERE c.id = authorized_pickups.child_id
      AND m.profile_id = auth.uid()
      AND m.role = 'classroom_admin'
      AND m.approved = true
  )
);

CREATE POLICY "parent_manage_pickups" ON authorized_pickups FOR ALL USING (
  EXISTS (
    SELECT 1 FROM family_members
    WHERE profile_id = auth.uid() AND child_id = authorized_pickups.child_id
  )
);
