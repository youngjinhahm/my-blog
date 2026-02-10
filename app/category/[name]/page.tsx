'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import type { Post } from '../../../types/database'
import Nav from '../../../components/Nav'
import { notFound } from 'next/navigation'

const validCategories = ['경제', '책', '영화', '세상'] as const

export default function CategoryPage({ 
  params 
}: { 
  params: { name: string }
}) {
  const [category, setCategory] = useState('')
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [popularPosts, setPopularPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  
  const postsPerPage = 5

  useEffect(() => {
    async function init() {
      const resolvedParams = await Promise.resolve(params)
      const decodedCategory = decodeURIComponent(resolvedParams.name)
      
      if (!validCategories.includes(decodedCategory as any)) {
        notFound()
      }
      
      setCategory(decodedCategory)
      await fetchPosts(decodedCategory)
    }
    
    init()
  }, [params])

  async function fetchPosts(cat: string) {
    // 최근 글
    const { data: recent, error: recentError } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .eq('category', cat)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 인기 글 (조회수 기준)
    const { data: popular, error: popularError } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .eq('category', cat)
      .order('views', { ascending: false })
      .limit(3)
    
    // 전체 글
    const { data: all, error: allError } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .eq('category', cat)
      .order('created_at', { ascending: false })
    
    if (!recentError && recent) setRecentPosts(recent)
    if (!popularError && popular) setPopularPosts(popular)
    if (!allError && all) setAllPosts(all)
    
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = allPosts.slice(indexOfFirstPost, indexOfLastPost)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Recent 섹션 */}
        <div className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-8 py-16">
            <div className="flex gap-12">
              <div className="w-28 flex-shrink-0">
                <h1 className="text-base font-semibold text-gray-900 sticky top-8">
                  Recent
                </h1>
              </div>

              {/* 구분선 추가 */}
              <div className="w-px bg-gray-200"></div>

              <div className="flex-1 space-y-12">
                {recentPosts.length === 0 ? (
                  <p className="text-gray-400 py-8 text-sm">
                    아직 {category} 카테고리에 작성된 글이 없습니다.
                  </p>
                ) : (
                  recentPosts.map((post) => (
                    <article key={post.id}>
                      <Link href={`/posts/${post.slug}`}>
                        <div className="group">
                          <time className="text-xs font-medium text-gray-500 block mb-2">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }).toUpperCase()}
                          </time>
                          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 leading-relaxed">
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
        </div>

        {/* Popular 섹션 */}
        {popularPosts.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-8 py-16">
              <div className="flex gap-12">
                <div className="w-28 flex-shrink-0">
                  <h2 className="text-base font-semibold text-gray-900 sticky top-8">
                    Popular
                  </h2>
                </div>

                {/* 구분선 추가 */}
                <div className="w-px bg-gray-200"></div>

                <div className="flex-1 space-y-12">
                  {popularPosts.map((post) => (
                    <article key={post.id}>
                      <Link href={`/posts/${post.slug}`}>
                        <div className="group">
                          <div className="flex items-center gap-2 mb-2">
                            <time className="text-xs font-medium text-gray-500">
                              {new Date(post.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }).toUpperCase()}
                            </time>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              {post.views || 0} views
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 전체 글 목록 */}
        {allPosts.length > 0 && (
          <div className="max-w-4xl mx-auto px-8 py-12">
            <h2 className="text-lg font-bold text-gray-900 mb-6">전체 글</h2>
            
            {/* 테이블 */}
            <div className="border-t border-gray-200">
              {currentPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <div className="border-b border-gray-200 py-3 hover:bg-gray-50 transition flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 hover:text-gray-600">
                        {post.title}
                      </h3>
                    </div>
                    <time className="text-xs text-gray-500 ml-4">
                      {new Date(post.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      currentPage === number
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}