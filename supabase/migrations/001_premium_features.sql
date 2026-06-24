-- school_settings
CREATE TABLE IF NOT EXISTS school_settings (
  id int PRIMARY KEY DEFAULT 1,
  stripe_customer_id text,
  subscription_status text DEFAULT 'free',
  subscription_id text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated can read settings" ON school_settings;
CREATE POLICY "authenticated can read settings" ON school_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- children
CREATE TABLE IF NOT EXISTS children (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated can read children" ON children;
DROP POLICY IF EXISTS "admins can manage children" ON children;
CREATE POLICY "authenticated can read children" ON children
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins can manage children" ON children
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- family_members
CREATE TABLE IF NOT EXISTS family_members (
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (child_id, profile_id)
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated can read family_members" ON family_members;
DROP POLICY IF EXISTS "admins can manage family_members" ON family_members;
CREATE POLICY "authenticated can read family_members" ON family_members
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins can manage family_members" ON family_members
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- progress_reports
CREATE TABLE IF NOT EXISTS progress_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family and admins can read reports" ON progress_reports;
DROP POLICY IF EXISTS "admins can insert reports" ON progress_reports;
DROP POLICY IF EXISTS "admins can delete reports" ON progress_reports;
CREATE POLICY "family and admins can read reports" ON progress_reports
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM family_members WHERE child_id = progress_reports.child_id AND profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "admins can insert reports" ON progress_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'classroom_admin'))
  );
CREATE POLICY "admins can delete reports" ON progress_reports
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
