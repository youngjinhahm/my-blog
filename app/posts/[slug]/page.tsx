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
        <article className="max-w-5xl mx-auto px-4 sm:px-12 py-6 sm:py-10">
          {/* 메타 정보 */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-3">
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
            
            {/* 제목 */}
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {post.title}
            </h1>

            {/* 요약 (있으면) */}
            {post.excerpt && (
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* 본문 */}
          <div 
            className="prose prose-base sm:prose-lg max-w-none
              prose-headings:font-bold
              prose-h1:text-xl sm:prose-h1:text-3xl
              prose-h2:text-lg sm:prose-h2:text-2xl
              prose-h3:text-base sm:prose-h3:text-xl
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:mx-auto prose-img:my-4
              prose-pre:bg-gray-900 prose-pre:text-gray-100
              prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-ul:my-4 prose-ol:my-4
              prose-li:my-1
              break-words"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  )
}