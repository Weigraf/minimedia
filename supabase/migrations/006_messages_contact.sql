-- Messages table (classroom direct messages between teachers and parents)
CREATE TABLE IF NOT EXISTS messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid        NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  sender_id    uuid        NOT NULL REFERENCES profiles(id),
  recipient_id uuid        REFERENCES profiles(id),
  body         text,
  file_url     text,
  file_name    text,
  file_size    bigint,
  created_at   timestamptz NOT NULL DEFAULT now(),
  read_at      timestamptz
);

CREATE INDEX IF NOT EXISTS messages_classroom_id_idx ON messages(classroom_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages where they are sender, recipient, or it's a broadcast
CREATE POLICY "Read own messages" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid() OR recipient_id IS NULL
);

-- Teachers and admins insert via API (admin client bypasses this, but policy kept for direct access)
CREATE POLICY "Teachers send messages" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) OR (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM memberships
      WHERE profile_id = auth.uid() AND role = 'classroom_admin' AND approved = true
    )
  )
);

-- Parents can reply directly to a teacher in their classroom
CREATE POLICY "Parents reply to teachers" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent') AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = auth.uid() AND classroom_id = messages.classroom_id AND approved = true
  ) AND
  recipient_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE profile_id = recipient_id AND classroom_id = messages.classroom_id
      AND role = 'classroom_admin' AND approved = true
  )
);

-- Recipients can mark messages as read
CREATE POLICY "Mark read" ON messages FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Contact form submissions (public, no auth required)
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text,
  message    text        NOT NULL,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Public insert (unauthenticated contact form)
CREATE POLICY "Public submit contact" ON contact_inquiries FOR INSERT WITH CHECK (true);

-- Only site admins can read or update
CREATE POLICY "Admin read contact" ON contact_inquiries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin update contact" ON contact_inquiries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
