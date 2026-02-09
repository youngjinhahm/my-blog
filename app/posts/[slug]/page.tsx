import { notFound } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import type { Post } from '../../../types/database'
import Link from 'next/link'
import Nav from '../../../components/Nav'

export const revalidate = 0
export const dynamicParams = true

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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  // 카테고리별 돌아갈 링크 결정
  const backLink = `/category/${post.category}`
  const backText = `← ${post.category}로 돌아가기`

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* 헤더 섹션 - 제목과 요약 */}
        <div className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-8 py-20">
            <Link 
              href={backLink}
              className="text-sm text-gray-600 hover:text-gray-900 mb-8 inline-block font-medium"
            >
              {backText}
            </Link>

            <header className="mt-8">
              <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-8">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-2xl text-gray-600 leading-relaxed mb-8">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <time className="font-medium text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }).toUpperCase()}
                </time>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 uppercase text-xs tracking-wide">
                  {post.category}
                </span>
              </div>
            </header>
          </div>
        </div>

        {/* 본문 섹션 */}
        <div className="max-w-3xl mx-auto px-8 py-16">
          <article 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </main>
    </>
  )
}