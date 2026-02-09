import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import type { Post } from '../../../types/database'
import Nav from '../../../components/Nav'
import { notFound } from 'next/navigation'

export const revalidate = 0

const validCategories = ['경제', '책', '영화', '세상'] as const

async function getPosts(category: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', category)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }
  
  return data as Post[]
}

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const category = decodeURIComponent(name)
  
  if (!validCategories.includes(category as any)) {
    notFound()
  }

  const posts = await getPosts(category)

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-8 py-20">
          <div className="flex gap-16">
            <div className="w-32 flex-shrink-0">
              <h1 className="text-lg font-semibold text-gray-900 sticky top-8">
                {category}
              </h1>
            </div>

            <div className="flex-1 space-y-16">
              {posts.length === 0 ? (
                <p className="text-gray-400 py-12">
                  아직 {category} 카테고리에 작성된 글이 없습니다.
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition">
                          {post.title}
                        </h2>
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