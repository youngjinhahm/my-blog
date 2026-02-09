'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

export default function AdminAboutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [aboutId, setAboutId] = useState('')

  useEffect(() => {
    checkUserAndFetch()
  }, [])

  async function checkUserAndFetch() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('about')
      .select('*')
      .single()

    if (data) {
      setContent(data.content)
      setAboutId(data.id)
    }
    
    setLoading(false)
  }

  async function handleSave() {
    const { error } = await supabase
      .from('about')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', aboutId)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('소개 페이지가 저장되었습니다!')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← 관리자 페이지로
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">소개 페이지 편집</h1>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소개 내용
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              저장
            </button>
            <Link
              href="/about"
              target="_blank"
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition font-medium inline-block"
            >
              미리보기
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}