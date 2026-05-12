-- ====================================================================
-- 글 수정 히스토리 (Post Revisions)
-- 글이 UPDATE 될 때마다 이전 버전을 자동으로 별도 테이블에 저장.
-- 사고로 덮어써도 어드민에서 클릭으로 복원 가능.
-- ====================================================================

CREATE TABLE IF NOT EXISTS post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title text,
  slug text,
  content text,
  excerpt text,
  category text,
  is_private boolean,
  featured_image_url text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  saved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS post_revisions_post_id_saved_at_idx
  ON post_revisions(post_id, saved_at DESC);

-- RLS: 본인 글의 revisions 만 조회 가능
ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_revisions" ON post_revisions;
CREATE POLICY "owner_read_revisions"
  ON post_revisions FOR SELECT TO authenticated
  USING (
    post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
    OR saved_by = auth.uid()
  );

-- 트리거 함수: UPDATE 직전 이전 버전을 revisions 에 저장
CREATE OR REPLACE FUNCTION save_post_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 실제 콘텐츠가 바뀐 경우만 저장 (메타데이터만 바뀌면 스킵)
  IF (OLD.title IS DISTINCT FROM NEW.title
      OR OLD.content IS DISTINCT FROM NEW.content
      OR OLD.excerpt IS DISTINCT FROM NEW.excerpt
      OR OLD.slug IS DISTINCT FROM NEW.slug) THEN
    INSERT INTO post_revisions (
      post_id, title, slug, content, excerpt, category,
      is_private, featured_image_url, saved_by
    )
    VALUES (
      OLD.id, OLD.title, OLD.slug, OLD.content, OLD.excerpt, OLD.category,
      OLD.is_private, OLD.featured_image_url, OLD.author_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_revision_trigger ON posts;
CREATE TRIGGER post_revision_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION save_post_revision();
