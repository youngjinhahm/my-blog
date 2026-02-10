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
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-600 transition">
            Youngjin Hahm : Blog
          </Link>
          
          <div className="flex gap-8">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className={`text-sm transition ${
                  pathname === category.href || pathname.startsWith(category.href)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
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