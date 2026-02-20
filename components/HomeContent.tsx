'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Post, SiteSettings } from '@/types/database'

gsap.registerPlugin(ScrollTrigger)

interface HomeContentProps {
  posts: Post[]
  settings: SiteSettings
}

export default function HomeContent({ posts, settings }: HomeContentProps) {
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubRef = useRef<HTMLDivElement>(null)
  const recentLabelRef = useRef<HTMLHeadingElement>(null)
  const articlesRef = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 히어로 타이틀 — 페이지 열릴 때 부드럽게 등장
      gsap.fromTo(
        heroTitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.15, ease: 'power2.out' }
      )

      // 히어로 설명문 — 타이틀 바로 뒤에 등장
      gsap.fromTo(
        heroSubRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.3, ease: 'power2.out' }
      )

      // "Recent" 라벨 — 스크롤해서 보일 때 등장
      gsap.fromTo(
        recentLabelRef.current,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: recentLabelRef.current,
            start: 'top 90%',
          },
        }
      )

      // 글 목록 — 스크롤 시 하나씩 부드럽게 등장
      articlesRef.current.forEach((el) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* 히어로 섹션 */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-32">
          <h1
            ref={heroTitleRef}
            className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight opacity-0"
          >
            {settings.hero_title}
          </h1>
          <div
            ref={heroSubRef}
            className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl prose prose-lg opacity-0"
            dangerouslySetInnerHTML={{ __html: settings.hero_subtitle }}
          />
        </div>
      </div>

      {/* 최근 글 섹션 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
          {/* 왼쪽 라벨 */}
          <div className="sm:w-32 flex-shrink-0">
            <h2
              ref={recentLabelRef}
              className="text-base sm:text-lg font-semibold text-gray-900 sm:sticky sm:top-8 opacity-0"
            >
              Recent
            </h2>
          </div>

          {/* 구분선 (데스크탑만) */}
          <div className="hidden sm:block w-px bg-gray-200"></div>

          {/* 오른쪽 글 목록 */}
          <div className="flex-1 space-y-8 sm:space-y-16">
            {posts.length === 0 ? (
              <p className="text-gray-400 py-8 sm:py-12 text-sm">
                아직 작성된 글이 없습니다.
              </p>
            ) : (
              posts.map((post, i) => (
                <article
                  key={post.id}
                  ref={(el) => {
                    articlesRef.current[i] = el
                  }}
                  className="opacity-0"
                >
                  <Link href={`/posts/${post.slug}`}>
                    <div className="group">
                      <time className="text-xs sm:text-sm font-medium text-gray-500 block mb-2 sm:mb-3">
                        {new Date(post.created_at)
                          .toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          .toUpperCase()}
                      </time>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gray-600 transition">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
  )
}