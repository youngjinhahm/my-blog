-- 1) 오타 난 기존 check constraint 제거 (이름이 실제로 'valud_category'면)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS valud_category;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS valid_category;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- 2) 새로 정확하게 만들기 (폼 드롭다운과 1:1 매칭)
ALTER TABLE posts
  ADD CONSTRAINT valid_category
  CHECK (category IN ('경제', '투자', '책', '영화', '세상'));
