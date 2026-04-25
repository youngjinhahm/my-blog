-- 비밀글 컬럼 추가
-- Supabase 대시보드 > SQL Editor 에서 한 번만 실행하면 됩니다.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- (선택) 비밀글은 익명 사용자가 SELECT 못 하도록 RLS 정책 추가
-- 이미 RLS가 켜져 있고 anon SELECT 정책이 있는 경우, 그 정책을 다음과 같이 갱신하세요:
-- DROP POLICY IF EXISTS "Public read posts" ON posts;
-- CREATE POLICY "Public read posts" ON posts
--   FOR SELECT TO anon
--   USING (published = true AND is_private = false);
