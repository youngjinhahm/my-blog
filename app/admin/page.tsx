'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/RichTextEditor'

export default function AdminPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    published: false,
    is_private: false,
    category: '경제' as string
  })
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasStoredDraft, setHasStoredDraft] = useState(false)

  // === 임시 저장글 시스템 (v2: 여러 개 저장 가능) ===
  type DraftPayload = {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    published: boolean
    is_private: boolean
    category: string
    savedAt: string
    editingPostId?: string | null
  }
  const DRAFTS_KEY = 'blog-drafts-v2'
  const [drafts, setDrafts] = useState<Record<string, DraftPayload>>({})
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [showDraftList, setShowDraftList] = useState(false)

  // 구버전 단일 임시저장 키 호환용 (기존 글 수정 페이지에 한정)
  const getDraftKey = () => `blog-draft:${editingPost?.id || 'new'}`

  // 모든 임시저장글 로드
  const loadDrafts = (): Record<string, DraftPayload> => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(DRAFTS_KEY)
      if (!raw) return {}
      return JSON.parse(raw) as Record<string, DraftPayload>
    } catch {
      return {}
    }
  }
  const persistDrafts = (next: Record<string, DraftPayload>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(next))
    } catch (e) {
      console.warn('임시저장 저장 실패:', e)
    }
  }
  const newDraftId = () =>
    `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  useEffect(() => {
    checkUser()
  }, [])

  // 페이지 로드 시 임시저장글 목록 동기화 + 구버전 마이그레이션
  useEffect(() => {
    if (typeof window === 'undefined') return
    const list = loadDrafts()
    // 구버전 'blog-draft:new'을 v2 리스트로 마이그레이션
    const legacy = localStorage.getItem('blog-draft:new')
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy)
        const id = newDraftId()
        list[id] = {
          id,
          title: parsed.title || '',
          slug: parsed.slug || '',
          content: parsed.content || '',
          excerpt: parsed.excerpt || '',
          published: !!parsed.published,
          is_private: !!parsed.is_private,
          category: parsed.category || '경제',
          savedAt: parsed.savedAt || new Date().toISOString(),
          editingPostId: null,
        }
        persistDrafts(list)
        localStorage.removeItem('blog-draft:new')
      } catch {}
    }
    setDrafts(list)
    setHasStoredDraft(Object.keys(list).length > 0)
  }, [showForm])

  // 폼이 열려있는 동안 formData 를 임시저장 리스트에 자동 저장 (디바운스)
  useEffect(() => {
    if (!showForm) return
    if (typeof window === 'undefined') return
    const t = setTimeout(() => {
      // 자동저장은 빈 글까지 만들지 않음 — 제목/내용 둘 중 하나라도 있어야 저장
      const isEmpty = !formData.title && !formData.content
      if (isEmpty && !currentDraftId) return
      const id = currentDraftId || newDraftId()
      const payload: DraftPayload = {
        id,
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        published: formData.published,
        is_private: formData.is_private,
        category: formData.category,
        savedAt: new Date().toISOString(),
        editingPostId: editingPost?.id || null,
      }
      const next = { ...loadDrafts(), [id]: payload }
      persistDrafts(next)
      setDrafts(next)
      if (!currentDraftId) setCurrentDraftId(id)
      setLastSavedAt(new Date())
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, showForm, editingPost, currentDraftId])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    fetchPosts()
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error:', error)
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleExportPDF() {
    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }
    const title = formData.title || '제목 없음'
    const category = formData.category || ''
    const date = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    w.document.write(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 1.27cm; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    color: #1f2937;
    line-height: 1.7;
    font-size: 11pt;
  }
  .meta { color: #6b7280; font-size: 10pt; margin-bottom: 8px; }
  h1.post-title { font-size: 22pt; font-weight: 700; margin: 0 0 16px; color: #111827; }
  .excerpt { color: #6b7280; font-size: 12pt; margin: 0 0 16px; }
  hr.sep { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0 20px; }
  .content h1 { font-size: 18pt; margin: 18px 0 10px; }
  .content h2 { font-size: 15pt; margin: 16px 0 8px; }
  .content h3 { font-size: 13pt; margin: 14px 0 6px; }
  .content p { margin: 8px 0; }
  .content img { max-width: 100%; height: auto; }
  .content img[data-align="center"] { display: block; margin-left: auto; margin-right: auto; }
  .content img[data-align="left"] { display: block; margin-left: 0; margin-right: auto; }
  .content img[data-align="right"] { display: block; margin-left: auto; margin-right: 0; }
  /* 정렬을 가진 이미지가 부모 단락에 들어있을 경우에도 가운데/오른쪽 정렬이 작동하도록 보장 */
  .content p:has(> img[data-align="center"]) { text-align: center; }
  .content p:has(> img[data-align="right"]) { text-align: right; }
  .content p:has(> img[data-align="left"]) { text-align: left; }
  .content [data-align="center"] img { display: block; margin-left: auto; margin-right: auto; }
  .content [data-align="right"] img { display: block; margin-left: auto; margin-right: 0; }
  .content [data-align="left"] img { display: block; margin-left: 0; margin-right: auto; }
  .content table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  .content table td, .content table th { border: 1px solid #9ca3af; padding: 6px 8px; }
  .content table th { background: #f3f4f6; }
  .content blockquote { border-left: 4px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 12px 0; }
  .content pre { background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 6px; overflow: auto; font-size: 9pt; }
  .content code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
</style>
</head>
<body>
  <div class="meta">${category} · ${date}</div>
  <h1 class="post-title">${title}</h1>
  ${formData.excerpt ? `<p class="excerpt">${formData.excerpt}</p>` : ''}
  <hr class="sep" />
  <div class="content">${formData.content || ''}</div>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){ window.focus(); window.print(); }, 300);
    });
  </script>
</body>
</html>`)
    w.document.close()
  }

  // 새 글: 빈 임시저장 슬롯 시작
  function handleNewPost() {
    setEditingPost(null)
    setCurrentDraftId(null) // 첫 자동저장 시 새 ID 생성
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      published: false,
      is_private: false,
      category: '경제'
    })
    setShowForm(true)
  }

  // 임시저장 리스트에서 하나 열기
  function openDraft(d: DraftPayload) {
    setEditingPost(null)
    setCurrentDraftId(d.id)
    setFormData({
      title: d.title || '',
      slug: d.slug || '',
      content: d.content || '',
      excerpt: d.excerpt || '',
      published: !!d.published,
      is_private: !!d.is_private,
      category: d.category || '경제',
    })
    setShowDraftList(false)
    setShowForm(true)
  }

  // 임시저장 하나 삭제
  function deleteDraft(id: string) {
    if (!confirm('이 임시저장글을 삭제하시겠습니까?')) return
    const next = { ...loadDrafts() }
    delete next[id]
    persistDrafts(next)
    setDrafts(next)
    setHasStoredDraft(Object.keys(next).length > 0)
    if (currentDraftId === id) setCurrentDraftId(null)
  }

  // 모든 임시저장 비우기
  function clearAllDrafts() {
    if (!confirm('모든 임시저장글을 지우시겠습니까? 되돌릴 수 없습니다.')) return
    persistDrafts({})
    setDrafts({})
    setHasStoredDraft(false)
    setCurrentDraftId(null)
  }

  function handleEdit(post: Post) {
    setEditingPost(post)
    // 이 글의 이전 임시저장 확인 (DB 상태와 다르면 복구 제안)
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`blog-draft:${post.id}`) : null
    if (raw) {
      try {
        const draft = JSON.parse(raw)
        const differs =
          draft.title !== post.title ||
          draft.content !== post.content ||
          draft.excerpt !== (post.excerpt || '') ||
          draft.slug !== post.slug ||
          draft.category !== post.category
        if (differs) {
          const savedAt = draft.savedAt ? new Date(draft.savedAt).toLocaleString('ko-KR') : ''
          if (confirm(`이 글에 저장되지 않은 임시 수정본이 있습니다.\n저장 시각: ${savedAt}\n\n임시본을 불러오시겠습니까?\n(취소를 누르면 현재 DB 버전으로 편집합니다)`)) {
            setFormData({
              title: draft.title || post.title,
              slug: draft.slug || post.slug,
              content: draft.content || post.content,
              excerpt: draft.excerpt || post.excerpt || '',
              published: draft.published ?? post.published,
              is_private: draft.is_private ?? (post as any).is_private ?? false,
              category: draft.category || post.category,
            })
            setShowForm(true)
            return
          } else {
            localStorage.removeItem(`blog-draft:${post.id}`)
          }
        }
      } catch {}
    }
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      published: post.published,
      is_private: (post as any).is_private || false,
      category: post.category
    })
    setShowForm(true)
  }

  // 수동 임시 저장 (버튼 클릭) — 새 ID로 또는 현재 ID에 저장
  function handleSaveDraft() {
    if (typeof window === 'undefined') return
    try {
      const id = currentDraftId || newDraftId()
      const payload: DraftPayload = {
        id,
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        published: formData.published,
        is_private: formData.is_private,
        category: formData.category,
        savedAt: new Date().toISOString(),
        editingPostId: editingPost?.id || null,
      }
      const next = { ...loadDrafts(), [id]: payload }
      persistDrafts(next)
      setDrafts(next)
      if (!currentDraftId) setCurrentDraftId(id)
      setHasStoredDraft(true)
      setLastSavedAt(new Date())
      alert('임시 저장되었습니다. 임시저장글 목록에서 다시 열 수 있습니다.')
    } catch (e: any) {
      alert('임시 저장 실패: ' + (e?.message || e))
    }
  }


  function clearDraft() {
    if (typeof window === 'undefined') return
    // 폼이 닫힐 때(작성/수정 완료 또는 취소) 현재 작업 중이던 임시저장글 제거
    if (currentDraftId) {
      const next = { ...loadDrafts() }
      delete next[currentDraftId]
      persistDrafts(next)
      setDrafts(next)
      setHasStoredDraft(Object.keys(next).length > 0)
    }
    // 구버전 키 정리
    localStorage.removeItem(getDraftKey())
    setCurrentDraftId(null)
    setLastSavedAt(null)
  }

  function handleDiscardDraft() {
    if (!confirm('저장된 임시본을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blog-draft:new')
    }
    setHasStoredDraft(false)
    alert('임시 저장본을 삭제했습니다.')
  }

  // slug 중복일 때 사용 가능한 slug 찾기 (예: smoot-hawley -> smoot-hawley-2 -> -3 ...)
  async function findAvailableSlug(base: string, excludeId?: string): Promise<string> {
    const trimmed = (base || 'post').trim().replace(/\s+/g, '-').toLowerCase()
    let candidate = trimmed
    for (let i = 2; i < 100; i++) {
      const q = supabase.from('posts').select('id').eq('slug', candidate)
      const { data } = await q
      const taken = (data || []).filter((r: any) => r.id !== excludeId)
      if (taken.length === 0) return candidate
      candidate = `${trimmed}-${i}`
    }
    return `${trimmed}-${Date.now()}`
  }

  function isDuplicateSlugError(err: any): boolean {
    if (!err) return false
    const msg = (err.message || '').toLowerCase()
    return err.code === '23505' || msg.includes('posts_slug_key') || (msg.includes('duplicate') && msg.includes('slug'))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingPost) {
      const { error } = await supabase
        .from('posts')
        .update({
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          published: true,
          is_private: formData.is_private,
          category: formData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
      
      if (error) {
        if (isDuplicateSlugError(error)) {
          const fresh = await findAvailableSlug(formData.slug, editingPost.id)
          alert(`수정 실패: slug "${formData.slug}"가 이미 다른 글에 사용 중입니다.\n\n추천 slug: ${fresh}\n\nslug 칸을 수정한 뒤 다시 시도하세요.`)
          setFormData({ ...formData, slug: fresh })
        } else {
          alert('수정 실패: ' + error.message)
        }
      } else {
        alert('글이 수정되었습니다!')
        clearDraft()
        setShowForm(false)
        fetchPosts()
      }
    } else {
      // 새 글: slug가 비어있거나 충돌하면 자동으로 사용 가능한 slug 생성
      let slug = formData.slug.trim()
      if (!slug) slug = await findAvailableSlug(formData.title || 'post')
      else slug = await findAvailableSlug(slug)

      const { error } = await supabase
        .from('posts')
        .insert([{
          title: formData.title,
          slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          published: true,
          is_private: formData.is_private,
          category: formData.category,
          author_id: user.id
        }])

      if (error) {
        if (isDuplicateSlugError(error)) {
          alert(`작성 실패: slug "${slug}"가 이미 사용 중입니다. 다른 slug로 변경 후 다시 시도하세요.`)
        } else {
          alert('작성 실패: ' + error.message)
        }
      } else {
        if (slug !== formData.slug) {
          alert(`글이 작성되었습니다.\n(slug "${formData.slug}"가 중복이라 "${slug}"로 자동 변경되었습니다.)`)
        } else {
          alert('글이 작성되었습니다!')
        }
        clearDraft()
        setShowForm(false)
        fetchPosts()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      alert('삭제되었습니다!')
      fetchPosts()
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 페이지</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
              ← 블로그로 돌아가기
            </Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/about"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              소개 페이지 수정
            </Link>
            <Link
              href="/admin/settings"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              사이트 설정
            </Link>
            <button
              onClick={handleNewPost}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              새 글 작성
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              로그아웃
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingPost ? '글 수정' : '새 글 작성'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    슬러그 (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: my-first-post"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="경제">경제</option>
                  <option value="투자">투자</option>
                  <option value="책">책</option>
                  <option value="영화">영화</option>
                  <option value="세상">세상</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요약 (선택사항)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="글 목록에 표시될 짧은 요약을 작성하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({...formData, content: html})}
                />
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
                    className="mr-2 w-4 h-4 accent-amber-600"
                  />
                  <label htmlFor="is_private" className="text-sm font-medium text-gray-700">
                    🔒 비밀글 (관리자만 볼 수 있음)
                  </label>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap items-center">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingPost ? '수정 완료' : '작성 완료'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="bg-amber-500 text-white px-8 py-3 rounded-lg hover:bg-amber-600 transition font-medium"
                  title="임시 저장 (브라우저에 저장, 나중에 이어서 작성)"
                >
                  💾 임시 저장
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-medium"
                  title="A4 narrow margin(1.27cm)으로 PDF 저장"
                >
                  📄 PDF로 저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  취소
                </button>
                {lastSavedAt && (
                  <span className="text-sm text-gray-500 ml-2">
                    ✓ 자동 저장됨 {lastSavedAt.toLocaleTimeString('ko-KR')}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 임시저장글 목록 (폼이 닫혀있을 때만 표시) */}
        {!showForm && hasStoredDraft && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
            <div className="bg-amber-100 px-4 py-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-900">
                💾 임시저장글 ({Object.keys(drafts).length}개)
              </div>
              <button
                type="button"
                onClick={clearAllDrafts}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                전체 삭제
              </button>
            </div>
            <ul className="divide-y divide-amber-200">
              {Object.values(drafts)
                .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
                .map((d) => {
                  const preview = (d.content || '').replace(/<[^>]+>/g, '').slice(0, 60)
                  const dateStr = d.savedAt
                    ? new Date(d.savedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : ''
                  return (
                    <li key={d.id} className="px-4 py-3 flex items-center gap-3 hover:bg-amber-100/50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {d.title || <span className="text-gray-400">제목 없음</span>}
                        </div>
                        {preview && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{preview}</div>
                        )}
                        <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-white border border-amber-200 rounded">{d.category || '경제'}</span>
                          <span>저장 {dateStr}</span>
                          {d.editingPostId && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">기존 글 수정중</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openDraft(d)}
                          className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 text-sm font-medium"
                        >
                          이어쓰기
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDraft(d.id)}
                          className="bg-white text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    아직 작성된 글이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{post.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {(post as any).is_private ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                            🔒 비밀글
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            게시중
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}