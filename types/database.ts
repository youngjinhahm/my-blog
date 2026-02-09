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