-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site admins manage schools" ON schools FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "school members view their school" ON schools FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM school_memberships
    WHERE school_id = schools.id AND profile_id = auth.uid()
  ));

-- Link classrooms to a school
ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

-- School memberships — school_admin or teacher
CREATE TABLE IF NOT EXISTS school_memberships (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('school_admin', 'teacher')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, profile_id)
);
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site admins manage school_memberships" ON school_memberships FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "school admins manage their school_memberships" ON school_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM school_memberships sa
    WHERE sa.school_id = school_memberships.school_id
      AND sa.profile_id = auth.uid()
      AND sa.role = 'school_admin'
  ));

CREATE POLICY "members view their own memberships" ON school_memberships FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "school members view all in their school" ON school_memberships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM school_memberships sm
    WHERE sm.school_id = school_memberships.school_id
      AND sm.profile_id = auth.uid()
  ));

-- Pending teacher invites
CREATE TABLE IF NOT EXISTS teacher_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email       text NOT NULL,
  invited_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(school_id, email)
);
ALTER TABLE teacher_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site admins manage teacher_invites" ON teacher_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "school admins manage their teacher_invites" ON teacher_invites FOR ALL
  USING (EXISTS (
    SELECT 1 FROM school_memberships
    WHERE school_id = teacher_invites.school_id
      AND profile_id = auth.uid()
      AND role = 'school_admin'
  ));
