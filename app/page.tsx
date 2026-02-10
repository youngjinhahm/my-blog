import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post, SiteSettings } from '@/types/database'
import Nav from '@/components/Nav'

export const revalidate = 0

async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }
  
  return data as Post[]
}

async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .single()
  
  if (error || !data) {
    return {
      hero_title: '생각을 기록하는 공간',
      hero_subtitle: '경제, 책, 영화, 그리고 세상에 대한 이야기를 나눕니다.'
    }
  }
  
  return data as SiteSettings
}

export default async function Home() {
  const posts = await getPosts()
  const settings = await getSiteSettings()

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* 히어로 섹션 */}
        <div className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-8 py-32">
            <h1 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">
              {settings.hero_title}
            </h1>
            <div 
              className="text-xl text-gray-500 leading-relaxed max-w-2xl prose prose-lg"
              style={{  lineHeight: '1'}}
              dangerouslySetInnerHTML={{ __html: settings.hero_subtitle }}
            />
          </div>
        </div>

        {/* 최근 글 섹션 */}
        <div className="max-w-4xl mx-auto px-8 py-20">
          <div className="flex gap-16">
            {/* 왼쪽 라벨 */}
            <div className="w-32 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 sticky top-8">
                Recent
              </h2>
            </div>

            {/* 오른쪽 글 목록 */}
            <div className="flex-1 space-y-16">
              {posts.length === 0 ? (
                <p className="text-gray-400 py-12">
                  아직 작성된 글이 없습니다.
                </p>
              ) : (
                posts.map((post) => (
                  <article key={post.id}>
                    <Link href={`/posts/${post.slug}`}>
                      <div className="group">
                        <time className="text-sm font-medium text-gray-500 block mb-3">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }).toUpperCase()}
                        </time>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-base text-gray-600 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}