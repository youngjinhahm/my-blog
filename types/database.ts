export interface Post {
  id: string
  created_at: string
  updated_at: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  is_private: boolean  // 비밀글: true면 외부 조회 불가, 관리자만 볼 수 있음
  author_id: string | null
  category: string
  views: number  // 이 줄 추가
}

export interface Comment {
  id: string
  created_at: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  approved: boolean
  password?: string
}

export interface About {
  id: string
  updated_at: string
  content: string
}

export interface SiteSettings {
  id: string
  hero_title: string
  hero_subtitle: string
  profile_image_url: string | null  // 이 줄 추가
  updated_at: string
}