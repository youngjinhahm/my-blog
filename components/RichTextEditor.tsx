'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,  // 이 줄 추가!
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: '글 내용을 작성하세요...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            uploadImage(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile()
              if (file) {
                event.preventDefault()
                uploadImage(file)
                return true
              }
            }
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  async function uploadImage(file: File) {
    if (!editor) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath)

      editor.chain().focus().setImage({ src: publicUrl }).run()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 실패: ' + (error as Error).message)
    }
  }

  function handleImageButtonClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadImage(file)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* 툴바 */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="굵게"
        >
          <strong>B</strong>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="기울임"
        >
          <em>I</em>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('underline') ? 'bg-gray-300' : ''
          }`}
          title="밑줄"
        >
          <u>U</u>
        </button>

        <div className="w-px bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
          }`}
          title="제목 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="제목 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
          title="제목 3"
        >
          H3
        </button>

        <div className="w-px bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="글머리 기호"
        >
          • 목록
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="번호 매기기"
        >
          1. 목록
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="인용"
        >
          " 인용
        </button>

        <div className="w-px bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={handleImageButtonClick}
          className="px-3 py-1.5 rounded hover:bg-gray-200 transition"
          title="이미지 업로드"
        >
          🖼️ 이미지
        </button>

        <div className="w-px bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
          }`}
          title="왼쪽 정렬"
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
          }`}
          title="가운데 정렬"
        >
          ↔
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
          }`}
          title="오른쪽 정렬"
        >
          →
        </button>

        <div className="w-px bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('링크 URL을 입력하세요:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`px-3 py-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          title="링크"
        >
          🔗
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="px-3 py-1.5 rounded hover:bg-gray-200 transition disabled:opacity-30"
          title="링크 제거"
        >
          🔗✗
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}