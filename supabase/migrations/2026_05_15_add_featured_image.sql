-- 대표 이미지 (글 목록 카드/SNS 공유용 커버 이미지)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS featured_image_url text;
