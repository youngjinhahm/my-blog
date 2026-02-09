import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'

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
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            내 블로그
          </h1>
          <p className="text-gray-600">
            생각을 기록하는 공간
          </p>
        </header>

        <nav className="mb-12 pb-4 border-b border-gray-200">
          <div className="flex gap-6">
            <Link 
              href="/" 
              className="text-gray-900 font-medium hover:text-blue-600 transition"
            >
              홈
            </Link>
            <Link 
              href="/admin" 
              className="text-gray-600 hover:text-blue-600 transition"
            >
              관리자
            </Link>
          </div>
        </nav>

        <div className="space-y-12">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              아직 작성된 글이 없습니다.
            </p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="group">
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {new Date(post.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {post.excerpt && (
                    <p className="text-gray-700 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
