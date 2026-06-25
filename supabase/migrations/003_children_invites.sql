-- Extend children with health info and photo
ALTER TABLE children ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE children ADD COLUMN IF NOT EXISTS medications text;
ALTER TABLE children ADD COLUMN IF NOT EXISTS allergies text;

-- Parents can update health info and photo for their own children
DROP POLICY IF EXISTS "parents can update their children" ON children;
CREATE POLICY "parents can update their children" ON children
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM family_members WHERE child_id = children.id AND profile_id = auth.uid())
  );

-- Pending parent invites
CREATE TABLE IF NOT EXISTS pending_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classroom admins can manage their invites" ON pending_invites;
CREATE POLICY "classroom admins can manage their invites" ON pending_invites
  FOR ALL USING (invited_by = auth.uid());

-- -----------------------------------------------------------------------
-- Child photos bucket (run these in Supabase SQL editor after creating
-- the 'child-photos' bucket in Storage → Buckets → New bucket → Private)
-- -----------------------------------------------------------------------
-- Parents can upload/update the photo for their own child
-- CREATE POLICY "parents can upload child photo" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'child-photos' AND
--     EXISTS (
--       SELECT 1 FROM public.family_members
--       WHERE profile_id = auth.uid()
--         AND child_id::text = (string_to_array(name, '/'))[1]
--     )
--   );
-- CREATE POLICY "parents can replace child photo" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'child-photos' AND
--     EXISTS (
--       SELECT 1 FROM public.family_members
--       WHERE profile_id = auth.uid()
--         AND child_id::text = (string_to_array(name, '/'))[1]
--     )
--   );
-- Parents and classroom teachers can view child photos (admins are NOT included)
-- CREATE POLICY "family and teachers can view child photos" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'child-photos' AND (
--       EXISTS (
--         SELECT 1 FROM public.family_members
--         WHERE profile_id = auth.uid()
--           AND child_id::text = (string_to_array(name, '/'))[1]
--       )
--       OR EXISTS (
--         SELECT 1 FROM public.children c
--         JOIN public.memberships m ON m.classroom_id = c.classroom_id
--         WHERE c.id::text = (string_to_array(name, '/'))[1]
--           AND m.profile_id = auth.uid()
--           AND m.role = 'classroom_admin'
--           AND m.approved = true
--       )
--     )
--   );
-- DELETE policy (parents and classroom teachers can remove)
-- CREATE POLICY "family and teachers can delete child photos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'child-photos' AND (
--       EXISTS (
--         SELECT 1 FROM public.family_members
--         WHERE profile_id = auth.uid()
--           AND child_id::text = (string_to_array(name, '/'))[1]
--       )
--       OR EXISTS (
--         SELECT 1 FROM public.children c
--         JOIN public.memberships m ON m.classroom_id = c.classroom_id
--         WHERE c.id::text = (string_to_array(name, '/'))[1]
--           AND m.profile_id = auth.uid()
--           AND m.role = 'classroom_admin'
--           AND m.approved = true
--       )
--     )
--   );
