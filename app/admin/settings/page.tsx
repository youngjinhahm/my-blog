'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
    loadSettings()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (data) {
      setHeroTitle(data.hero_title)
      setHeroSubtitle(data.hero_subtitle)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase
      .from('site_settings')
      .update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('site_settings').select('id').single()).data?.id)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('저장되었습니다!')
      router.push('/admin')
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">
            ← 관리자 페이지로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">사이트 설정</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                히어로 제목
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Long Journey"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                히어로 부제 (HTML 사용 가능)
              </label>
              <RichTextEditor
                content={heroSubtitle}
                onChange={(html) => setHeroSubtitle(html)}
              />
              <p className="text-sm text-gray-500 mt-2">
                폰트 크기, 줄바꿈, 굵기 등을 자유롭게 조정하세요.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <Link
                href="/admin"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium inline-block"
              >
                취소
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}