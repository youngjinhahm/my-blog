import { notFound } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import type { Post } from '../../../types/database'
import Nav from '../../../components/Nav'
import CommentSection from '../../../components/CommentSection'

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

  // 비밀글 또는 미발행 글은 외부에서 조회 불가
  // (관리자는 /admin 페이지에서 직접 편집 가능; 별도 미리보기 라우트는 만들지 않음)
  if ((data as any).is_private || !data.published) {
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
      <main className="min-h-screen bg-gray-100 py-6 sm:py-10">
        {/* 글 읽기 영역 — 에디터의 A4 종이와 동일 (21cm × 2.54cm 마진) */}
        <article
          className="mx-auto bg-white shadow-md"
          style={{
            width: '21cm',
            maxWidth: '100%',
            minHeight: '29.7cm',
            padding: '2.54cm',
            boxSizing: 'border-box',
          }}
        >
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

          {/* 본문 — 에디터와 동일한 글꼴/크기/줄간격으로 렌더 */}
          <div
            className="post-content break-words"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <CommentSection postId={post.id} />
        </article>
      </main>
    </>
  )
}