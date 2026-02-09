import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

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
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Link 
            href={`/category/${post.category}`}
            className="text-gray-600 hover:text-gray-900 mb-8 inline-block transition"
          >
            ← {post.category}로 돌아가기
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-500">
                {post.category}
              </span>
              <time className="text-sm text-gray-400">
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>
          </header>

          <article 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>
    </>
  )
}