'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import FontFamily from '@tiptap/extension-font-family'
import { Mark, Node } from '@tiptap/core'
import { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 커스텀 FontSize Mark
const FontSize = Mark.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {}
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('fontSize', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().unsetMark('fontSize').run()
      },
    }
  },
})

// 커스텀 LinkPreview Extension
const LinkPreview = Node.create({
  name: 'linkPreview',
  
  group: 'block',
  
  addAttributes() {
    return {
      url: {
        default: null,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      siteName: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-preview]',
      },
    ]
  },

  renderHTML({ node }) {
    const { url, title, description, image, siteName } = node.attrs
    
    return [
      'div',
      {
        'data-link-preview': '',
        class: 'link-preview-card',
        style: 'border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 16px 0; cursor: pointer;',
      },
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: 'display: flex; text-decoration: none; color: inherit;',
        },
        [
          'div',
          { style: 'flex: 1; padding: 16px;' },
          [
            'div',
            { style: 'font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px;' },
            title || url,
          ],
          description && [
            'div',
            { style: 'font-size: 12px; color: #6b7280; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;' },
            description,
          ],
          [
            'div',
            { style: 'font-size: 11px; color: #9ca3af;' },
            siteName || new URL(url).hostname,
          ],
        ].filter(Boolean),
        image && [
          'div',
          { style: 'width: 120px; height: 120px; flex-shrink: 0;' },
          [
            'img',
            {
              src: image,
              alt: title || '',
              style: 'width: 100%; height: 100%; object-fit: cover;',
            },
          ],
        ],
      ].filter(Boolean),
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const container = document.createElement('div')
      container.className = 'link-preview-card'
      container.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 16px 0; cursor: pointer; transition: box-shadow 0.2s;'
      
      container.addEventListener('mouseenter', () => {
        container.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      })
      
      container.addEventListener('mouseleave', () => {
        container.style.boxShadow = 'none'
      })
      
      const link = document.createElement('a')
      link.href = node.attrs.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.cssText = 'display: flex; text-decoration: none; color: inherit;'
      
      const content = document.createElement('div')
      content.style.cssText = 'flex: 1; padding: 16px;'
      
      const title = document.createElement('div')
      title.style.cssText = 'font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px;'
      title.textContent = node.attrs.title || node.attrs.url
      content.appendChild(title)
      
      if (node.attrs.description) {
        const desc = document.createElement('div')
        desc.style.cssText = 'font-size: 12px; color: #6b7280; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;'
        desc.textContent = node.attrs.description
        content.appendChild(desc)
      }
      
      const siteName = document.createElement('div')
      siteName.style.cssText = 'font-size: 11px; color: #9ca3af;'
      siteName.textContent = node.attrs.siteName || new URL(node.attrs.url).hostname
      content.appendChild(siteName)
      
      link.appendChild(content)
      
      if (node.attrs.image) {
        const imageContainer = document.createElement('div')
        imageContainer.style.cssText = 'width: 120px; height: 120px; flex-shrink: 0;'
        
        const img = document.createElement('img')
        img.src = node.attrs.image
        img.alt = node.attrs.title || ''
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'
        
        imageContainer.appendChild(img)
        link.appendChild(imageContainer)
      }
      
      container.appendChild(link)
      
      return {
        dom: container,
      }
    }
  },
})

// 커스텀 이미지 Extension
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
    }
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div')
      container.className = 'image-resizer'
      container.style.position = 'relative'
      container.style.display = 'inline-block'
      container.style.maxWidth = '100%'
      container.style.margin = '0'

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      img.style.margin = '0'
      
      if (node.attrs.width) {
        img.style.width = node.attrs.width + 'px'
      }

      const handle = document.createElement('div')
      handle.style.position = 'absolute'
      handle.style.right = '0'
      handle.style.bottom = '0'
      handle.style.width = '20px'
      handle.style.height = '20px'
      handle.style.background = '#3b82f6'
      handle.style.cursor = 'se-resize'
      handle.style.borderRadius = '0 0 4px 0'
      handle.style.zIndex = '10'

      container.appendChild(img)
      container.appendChild(handle)

      let isResizing = false
      let startX = 0
      let startWidth = 0

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        isResizing = true
        startX = e.clientX
        startWidth = img.offsetWidth

        const resize = (e: MouseEvent) => {
          if (!isResizing) return
          
          const deltaX = e.clientX - startX
          const newWidth = Math.max(100, Math.min(startWidth + deltaX, 1000))
          img.style.width = newWidth + 'px'
        }

        const stopResize = () => {
          if (isResizing) {
            isResizing = false
            const finalWidth = img.offsetWidth
            
            if (typeof getPos === 'function') {
              editor.commands.updateAttributes('image', { width: finalWidth })
            }
          }
          
          document.removeEventListener('mousemove', resize)
          document.removeEventListener('mouseup', stopResize)
        }

        document.addEventListener('mousemove', resize)
        document.addEventListener('mouseup', stopResize)
      })

      return {
        dom: container,
      }
    }
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showLinkPreviewInput, setShowLinkPreviewInput] = useState(false)
  const [fetchingPreview, setFetchingPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        hardBreak: {
          keepMarks: false,
        },
        paragraph: {
          HTMLAttributes: {
            class: 'my-0',
          },
        },
      }),
      Underline,
      FontSize,
      Color,
      TextStyle,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      LinkPreview,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: '글 내용을 작성하세요...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      
      // 단어 수 계산
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(word => word.length > 0)
      setWordCount(words.length)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] px-4 py-2',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state, dispatch } = view
          const { schema } = state
          
          const br = schema.nodes.hardBreak.create()
          const tr = state.tr.replaceSelectionWith(br).scrollIntoView()
          dispatch(tr)
          
          return true
        }
        
        if (event.key === 'Enter' && event.shiftKey) {
          return false
        }
        
        return false
      },
      handleDrop: function(view, event, slice, moved) {
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
      handlePaste: function(view, event) {
        const items = event.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              event.preventDefault()
              const file = items[i].getAsFile()
              if (file) {
                uploadImage(file)
              }
              return true
            }
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor) {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(word => word.length > 0)
      setWordCount(words.length)
    }
  }, [editor])

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file)

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    if (editor) {
      editor.chain().focus().setImage({ src: publicUrl }).run()
    }
  }

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const handleFontSizeChange = (size: string) => {
    if (!editor || !size) return
    // @ts-ignore
    editor.chain().focus().setFontSize(size).run()
  }

  const handleFontFamilyChange = (font: string) => {
    if (!editor || !font) return
    editor.chain().focus().setFontFamily(font).run()
  }

  const setLink = () => {
    if (!editor || !linkUrl) return
    
    editor.chain().focus().setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const fetchLinkPreview = async (url: string) => {
    if (!editor) return
    
    setFetchingPreview(true)
    
    try {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      const youtubeMatch = url.match(youtubeRegex)
      
      if (youtubeMatch) {
        const videoId = youtubeMatch[1]
        
        editor.commands.insertContent({
          type: 'linkPreview',
          attrs: {
            url: url,
            title: '유튜브 동영상',
            description: '클릭하여 시청하기',
            image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            siteName: 'YouTube',
          },
        })
      } else {
        editor.commands.insertContent({
          type: 'linkPreview',
          attrs: {
            url: url,
            title: '링크',
            description: '클릭하여 방문하기',
            image: null,
            siteName: new URL(url).hostname,
          },
        })
      }
      
      setLinkUrl('')
      setShowLinkPreviewInput(false)
    } catch (error) {
      console.error('링크 프리뷰 생성 실패:', error)
      alert('유효한 URL을 입력하세요')
    } finally {
      setFetchingPreview(false)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* 툴바 - 다중 줄 */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 overflow-auto">
        {/* 첫 번째 줄: 실행 취소, 글꼴, 크기 */}
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
          {/* 되돌리기/다시실행 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30"
            title="실행 취소 (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30"
            title="다시 실행 (Ctrl+Y)"
          >
            ↷
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 폰트 종류 */}
          <select
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
            defaultValue=""
          >
            <option value="">기본 폰트</option>
            <option value="'Noto Sans KR', sans-serif">Noto Sans</option>
            <option value="Arial">Arial</option>
            <option value="'Times New Roman'">Times New Roman</option>
            <option value="'Courier New'">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="'Comic Sans MS'">Comic Sans MS</option>
          </select>

          {/* 폰트 크기 - 짝수와 홀수 모두 */}
          <select
            onChange={(e) => handleFontSizeChange(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>크기</option>
            <option value="8pt">8</option>
            <option value="9pt">9</option>
            <option value="10pt">10</option>
            <option value="11pt">11</option>
            <option value="12pt">12</option>
            <option value="13pt">13</option>
            <option value="14pt">14</option>
            <option value="15pt">15</option>
            <option value="16pt">16</option>
            <option value="17pt">17</option>
            <option value="18pt">18</option>
            <option value="19pt">19</option>
            <option value="20pt">20</option>
            <option value="21pt">21</option>
            <option value="22pt">22</option>
            <option value="24pt">24</option>
            <option value="26pt">26</option>
            <option value="28pt">28</option>
            <option value="30pt">30</option>
            <option value="32pt">32</option>
            <option value="36pt">36</option>
            <option value="40pt">40</option>
            <option value="48pt">48</option>
            <option value="60pt">60</option>
            <option value="72pt">72</option>
          </select>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 전체화면 */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
            title="전체화면"
          >
            {isFullscreen ? '⊟' : '⊠'}
          </button>

          {/* 단어 수 */}
          <div className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded bg-white">
            {wordCount} 단어
          </div>
        </div>

        {/* 두 번째 줄: 기본 서식 */}
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="굵게 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="기울임꼴 (Ctrl+I)"
          >
            <em>I</em>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded ${editor.isActive('underline') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="밑줄 (Ctrl+U)"
          >
            <u>U</u>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1 rounded ${editor.isActive('strike') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="취소선"
          >
            <s>S</s>
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 위 첨자/아래 첨자 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`px-2 py-1 text-sm rounded ${editor.isActive('superscript') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="위 첨자"
          >
            x²
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`px-2 py-1 text-sm rounded ${editor.isActive('subscript') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="아래 첨자"
          >
            x₂
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 텍스트 색상 */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">A</span>
            <input
              type="color"
              onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              title="텍스트 색상"
            />
          </div>

          {/* 형광펜 */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">🖍️</span>
            <input
              type="color"
              onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              title="형광펜"
            />
          </div>

          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            title="서식 지우기"
          >
            ✕ 서식
          </button>
        </div>

        {/* 세 번째 줄: 헤딩, 정렬 */}
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
          >
            H1
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
          >
            H3
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="왼쪽 정렬"
          >
            ≡
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="가운데 정렬"
          >
            ≣
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="오른쪽 정렬"
          >
            ≡
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`px-3 py-1 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="양쪽 정렬"
          >
            ≣
          </button>
        </div>

        {/* 네 번째 줄: 목록, 인용, 코드, 표, 이미지, 링크 */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="글머리 기호"
          >
            • 목록
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${editor.isActive('orderedList') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="번호 매기기"
          >
            1. 목록
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded ${editor.isActive('blockquote') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="인용구"
          >
            " 인용
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1 rounded ${editor.isActive('codeBlock') ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'}`}
            title="코드 블록"
          >
            {'<>'} 코드
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1 rounded hover:bg-gray-100 border border-transparent"
            title="수평선"
          >
            ― 구분선
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 표 - 1x1 기본값 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 1, cols: 1, withHeaderRow: false }).run()}
            className="px-3 py-1 rounded hover:bg-gray-100 border border-transparent"
            title="표 삽입 (1x1)"
          >
            ⊞ 표
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* 이미지 */}
          <button
            type="button"
            onClick={addImage}
            className="px-3 py-1 rounded hover:bg-gray-100 border border-transparent"
            title="이미지"
          >
            🖼️ 이미지
          </button>

          {/* 링크 */}
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="px-3 py-1 rounded hover:bg-gray-100 border border-transparent"
            title="하이퍼링크"
          >
            🔗 링크
          </button>

          {/* 링크 프리뷰 카드 */}
          <button
            type="button"
            onClick={() => setShowLinkPreviewInput(!showLinkPreviewInput)}
            className="px-3 py-1 rounded hover:bg-gray-100 bg-blue-50 border border-transparent"
            title="링크 썸네일 카드"
          >
            📎 링크 카드
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 링크 입력 박스 */}
      {showLinkInput && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <div className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink()
                }
              }}
            />
            <button
              type="button"
              onClick={setLink}
              disabled={!linkUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              삽입
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false)
                setLinkUrl('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 일반 하이퍼링크 (클릭 가능한 텍스트)
          </p>
        </div>
      )}

      {/* 링크 프리뷰 입력 박스 */}
      {showLinkPreviewInput && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <div className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com 또는 유튜브 링크"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchLinkPreview(linkUrl)
                }
              }}
            />
            <button
              type="button"
              onClick={() => fetchLinkPreview(linkUrl)}
              disabled={!linkUrl || fetchingPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {fetchingPreview ? '생성 중...' : '삽입'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkPreviewInput(false)
                setLinkUrl('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 유튜브, 기사, 블로그 링크를 입력하면 썸네일 카드가 생성됩니다. 링크를 지워도 카드는 남아있습니다.
          </p>
        </div>
      )}

      {/* 에디터 */}
      <div className={isFullscreen ? 'h-[calc(100vh-200px)] overflow-auto' : ''}>
        <EditorContent editor={editor} />
      </div>
      
      {/* 사용 안내 */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
        💡 팁: Ctrl+Z 되돌리기, Ctrl+B 굵게, Ctrl+I 기울임, Ctrl+U 밑줄 | 🔗 링크 = 텍스트 링크, 📎 링크 카드 = 썸네일
      </div>

      {/* CSS */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror .image-resizer {
          margin: 0;
          line-height: 0;
        }
        .ProseMirror .image-resizer img {
          display: block;
          margin: 0;
        }
        .ProseMirror p:has(.image-resizer) {
          margin: 0;
          padding: 0;
          line-height: 0;
        }
        .ProseMirror p.my-0 {
          margin: 0;
        }
        .ProseMirror br {
          content: "";
          display: block;
          margin: 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 16px 0;
          width: 100%;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #d1d5db;
          padding: 8px;
          min-width: 100px;
        }
        .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        .ProseMirror pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #d1d5db;
          margin: 24px 0;
        }
        .link-preview-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}