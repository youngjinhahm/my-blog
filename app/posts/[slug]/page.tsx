import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

export const revalidate = 0

async function getPost(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as Post
}

export default async function PostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-700 mb-8 inline-block"
        >
          ← 목록으로
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <time className="text-gray-600">
            {new Date(post.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
        </header>

        <article className="prose prose-lg max-w-none">
          <ReactMarkdown>
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  )
}