'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const categories = [
  { name: '소개', href: '/about' },
  { name: '경제', href: '/category/경제' },
  { name: '책', href: '/category/책' },
  { name: '영화', href: '/category/영화' },
  { name: '세상', href: '/category/세상' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition">
            내 블로그
          </Link>
          
          <div className="flex gap-8">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className={`text-base transition ${
                  pathname === category.href
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}