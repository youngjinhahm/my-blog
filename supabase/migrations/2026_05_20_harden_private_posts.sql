-- 비밀글이 익명 사용자로부터 절대 못 새도록 RLS(Row Level Security) 강화
-- 이걸 적용하면 Supabase anon API 로도 비밀글을 가져올 수 없습니다.

-- 1) posts 테이블에 RLS 활성화 (이미 켜져있어도 안전)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2) 기존 SELECT 정책 제거 후 새로 작성
--    (정책 이름이 다를 수 있으니 안전하게 IF EXISTS 로 후보 다 제거)
DROP POLICY IF EXISTS "Public read posts" ON posts;
DROP POLICY IF EXISTS "Public read published posts" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Allow public read" ON posts;
DROP POLICY IF EXISTS "anon_read_public_posts" ON posts;

-- 3) 익명(anon) 사용자: 발행된 + 공개 글만 읽기 허용
CREATE POLICY "anon_read_public_posts"
  ON posts FOR SELECT
  TO anon
  USING (published = true AND is_private = false);

-- 4) 인증된 사용자(관리자): 본인 글은 모두 읽기 허용 (수정 페이지 등에서 필요)
DROP POLICY IF EXISTS "authenticated_read_own_posts" ON posts;
CREATE POLICY "authenticated_read_own_posts"
  ON posts FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- 5) 인증된 사용자: 본인 글 작성/수정/삭제 권한
DROP POLICY IF EXISTS "authenticated_write_own_posts" ON posts;
CREATE POLICY "authenticated_write_own_posts"
  ON posts FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
