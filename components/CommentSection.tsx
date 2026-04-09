'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Comment } from '../types/database'

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // 관리자 로그인 상태
  const [isAdmin, setIsAdmin] = useState(false)

  // 삭제 관련 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchComments()
    checkAdmin()
  }, [postId])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAdmin(!!session)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('approved', true)
      .order('created_at', { ascending: true })
    if (data) setComments(data as Comment[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      setError('비밀번호는 숫자 4자리로 입력해주세요.')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('comments').insert({
      post_id: postId,
      author_name: name.trim(),
      author_email: email.trim(),
      content: content.trim(),
      password: password,
    })

    setSubmitting(false)

    if (insertError) {
      setError('댓글 등록에 실패했습니다. 다시 시도해주세요.')
      return
    }

    setSubmitted(true)
    setName('')
    setEmail('')
    setContent('')
    setPassword('')
    fetchComments()
  }

  // 관리자 삭제 (바로 삭제)
  async function handleAdminDelete(commentId: string) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      alert('삭제에 실패했습니다.')
      return
    }
    fetchComments()
  }

  // 작성자 삭제 (비밀번호 확인 후 삭제)
  async function handleAuthorDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!deleteTargetId) return

    setDeleteError('')
    setDeleting(true)

    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', deleteTargetId)
      .eq('password', deletePassword)
      .select()

    setDeleting(false)

    if (error) {
      setDeleteError('삭제에 실패했습니다.')
      return
    }

    if (!data || data.length === 0) {
      setDeleteError('비밀번호가 일치하지 않습니다.')
      return
    }

    setDeleteTargetId(null)
    setDeletePassword('')
    setDeleteError('')
    fetchComments()
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        댓글 {comments.length > 0 && <span className="text-gray-400 font-normal text-base">({comments.length})</span>}
      </h2>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm mb-8">첫 번째 댓글을 남겨보세요.</p>
      ) : (
        <ul className="space-y-5 mb-10">
          {comments.map((c) => (
            <li key={c.id} className="bg-gray-50 rounded-lg px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{c.author_name}</span>
                  <span className="text-gray-300">·</span>
                  <time className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <button
                      onClick={() => handleAdminDelete(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDeleteTargetId(deleteTargetId === c.id ? null : c.id)
                        setDeletePassword('')
                        setDeleteError('')
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {deleteTargetId === c.id ? '취소' : '삭제'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>

              {/* 비밀번호 확인 폼 */}
              {deleteTargetId === c.id && !isAdmin && (
                <form onSubmit={handleAuthorDelete} className="mt-3 flex items-center gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="비밀번호 4자리"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-32 border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={deleting || deletePassword.length !== 4}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                  {deleteError && <span className="text-red-500 text-xs ml-1">{deleteError}</span>}
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 입력 폼 */}
      <div className="bg-gray-50 rounded-lg p-5 sm:p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">댓글 쓰기</h3>
        {submitted ? (
          <div className="text-sm text-green-600 py-2">
            댓글이 등록되었습니다. 감사합니다!{' '}
            <button
              className="underline text-green-700"
              onClick={() => setSubmitted(false)}
            >
              댓글 더 남기기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="이름"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              />
              <input
                type="email"
                placeholder="이메일 (공개되지 않음)"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              />
            </div>
            <textarea
              placeholder="댓글을 입력하세요"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white resize-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="비밀번호 (숫자 4자리)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-48 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              />
              <span className="text-xs text-gray-400">삭제 시 필요합니다</span>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 text-white text-sm px-5 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
