'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 로고 */}
          <Link href="/" className="text-base sm:text-lg font-bold text-gray-900 hover:text-gray-600 transition flex-shrink-0">
            Youngjin Hahm : Blog
          </Link>
          
          {/* 메뉴 */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              href="/about"
              className={`text-xs sm:text-sm font-medium transition ${
                pathname === '/about' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              소개
            </Link>
            
            <Link 
              href="/category/경제"
              className={`text-xs sm:text-sm font-medium transition ${
                pathname.includes('/category/경제') 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              경제
            </Link>
            
            <Link 
              href="/category/책"
              className={`text-xs sm:text-sm font-medium transition ${
                pathname.includes('/category/책') 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              책
            </Link>
            
            <Link 
              href="/category/영화"
              className={`text-xs sm:text-sm font-medium transition ${
                pathname.includes('/category/영화') 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              영화
            </Link>
            
            <Link 
              href="/category/세상"
              className={`text-xs sm:text-sm font-medium transition ${
                pathname.includes('/category/세상') 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              세상
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}