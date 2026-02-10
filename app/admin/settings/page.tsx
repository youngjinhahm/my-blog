'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setProfileImageUrl(data.profile_image_url || '')
    }
    setLoading(false)
  }

  async function uploadProfileImage(file: File) {
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `profile.${fileExt}`
    const filePath = `${fileName}`

    // 기존 프로필 이미지 삭제
    await supabase.storage
      .from('blog-images')
      .remove([filePath])

    // 새 이미지 업로드
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    setProfileImageUrl(publicUrl)
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadProfileImage(file)
    }
  }

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase
      .from('site_settings')
      .update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        profile_image_url: profileImageUrl,
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
            {/* 프로필 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로필 이미지
              </label>
              <div className="flex items-center gap-4">
                {profileImageUrl && (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 font-medium"
                  >
                    {uploading ? '업로드 중...' : profileImageUrl ? '이미지 변경' : '이미지 업로드'}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    정사각형 이미지 권장 (예: 400x400px)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="border-t pt-6"></div>

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