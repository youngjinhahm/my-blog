import { notFound } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import type { Post } from '../../../types/database'
import Nav from '../../../components/Nav'

export const revalidate = 0

async function getPost(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  // 조회수 증가
  await supabase
    .from('posts')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id)

  return data as Post
}

export default async function PostPage({
  params,
}: {
  params: { slug: string }
}) {
  const resolvedParams = await Promise.resolve(params)
  const post = await getPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        <article className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
          {/* 메타 정보 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              <span className="bg-gray-100 px-2 sm:px-3 py-1 rounded">
                {post.category}
              </span>
              <time>
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              {post.views && post.views > 0 && (
                <>
                  <span>•</span>
                  <span>{post.views} views</span>
                </>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>
          </div>

          {/* 본문 */}
          <div 
            className="prose prose-sm sm:prose-lg max-w-none
              prose-headings:font-bold
              prose-h1:text-2xl sm:prose-h1:text-4xl
              prose-h2:text-xl sm:prose-h2:text-3xl
              prose-h3:text-lg sm:prose-h3:text-2xl
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:mx-auto
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              break-words"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  )
}