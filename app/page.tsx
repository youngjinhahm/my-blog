import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'
import Navigation from '@/components/Navigation'

export const revalidate = 0

async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }
  
  return data as Post[]
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <header className="mb-20">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              내 블로그
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              생각을 기록하는 공간
            </p>
          </header>

          <div className="space-y-16">
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-20">
                아직 작성된 글이 없습니다.
              </p>
            ) : (
              posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/posts/${post.slug}`}>
                    <div className="group">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-gray-500">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition leading-tight">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-lg text-gray-600 leading-relaxed">
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
      </main>
    </>
  )
}