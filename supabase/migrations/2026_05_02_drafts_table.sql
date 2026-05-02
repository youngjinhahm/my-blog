-- 임시저장글 테이블: 여러 기기에서 동기화 가능하게
CREATE TABLE IF NOT EXISTS drafts (
  id text PRIMARY KEY,                                            -- 'd_xxx_yyy' 형식, 클라이언트에서 생성
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  is_private boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT '경제',
  editing_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,   -- 기존 글 수정중이면 그 글 id
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drafts_user_saved_at_idx
  ON drafts(user_id, saved_at DESC);

-- RLS: 사용자는 본인 임시저장만 읽고/쓰기 가능
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drafts_owner_all" ON drafts;
CREATE POLICY "drafts_owner_all" ON drafts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
