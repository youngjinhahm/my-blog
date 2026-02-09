'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
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
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
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