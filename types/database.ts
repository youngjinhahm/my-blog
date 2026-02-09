export interface Post {
  id: string
  created_at: string
  updated_at: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  author_id: string | null
  category: '경제' | '책' | '영화' | '세상'
}

export interface Comment {
  id: string
  created_at: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  approved: boolean
}

export interface About {
  id: string
  updated_at: string
  content: string
}

export interface Post {
  id: string
  created_at: string
  updated_at: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  author_id: string | null
  category: string
}

export interface Comment {
  id: string
  created_at: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  approved: boolean
}

export interface About {
  id: string
  updated_at: string
  content: string
}

// 아래 추가
export interface SiteSettings {
  id: string
  hero_title: string
  hero_subtitle: string
  updated_at: string
}