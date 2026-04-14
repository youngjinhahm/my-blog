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

// Word의 Table Styles 대응: 표에 스타일 프리셋 class 부여
const StyledTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'tbl-grid',
        parseHTML: element => element.getAttribute('class') || 'tbl-grid',
        renderHTML: attributes => {
          if (!attributes.class) return {}
          return { class: attributes.class }
        },
      },
    }
  },
})

// 셀 공통 속성 (배경색 + 4방향 개별 테두리)
const cellExtraAttrs = () => ({
  backgroundColor: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element as HTMLElement).style.backgroundColor || null,
    renderHTML: (attributes: any) => {
      if (!attributes.backgroundColor) return {}
      return { style: `background-color: ${attributes.backgroundColor}` }
    },
  },
  borderTop: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element as HTMLElement).style.borderTop || null,
    renderHTML: (attributes: any) => {
      if (!attributes.borderTop) return {}
      return { style: `border-top: ${attributes.borderTop}` }
    },
  },
  borderRight: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element as HTMLElement).style.borderRight || null,
    renderHTML: (attributes: any) => {
      if (!attributes.borderRight) return {}
      return { style: `border-right: ${attributes.borderRight}` }
    },
  },
  borderBottom: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element as HTMLElement).style.borderBottom || null,
    renderHTML: (attributes: any) => {
      if (!attributes.borderBottom) return {}
      return { style: `border-bottom: ${attributes.borderBottom}` }
    },
  },
  borderLeft: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element as HTMLElement).style.borderLeft || null,
    renderHTML: (attributes: any) => {
      if (!attributes.borderLeft) return {}
      return { style: `border-left: ${attributes.borderLeft}` }
    },
  },
})

const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellExtraAttrs(),
    }
  },
})

const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellExtraAttrs(),
    }
  },
})
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
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'tableDesign' | 'tableLayout'>('home')
  const [showInsertGrid, setShowInsertGrid] = useState(false)
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const [showShadingMenu, setShowShadingMenu] = useState(false)
  const [showBordersMenu, setShowBordersMenu] = useState(false)
  const [showLineWeightMenu, setShowLineWeightMenu] = useState(false)
  const [showLineStyleMenu, setShowLineStyleMenu] = useState(false)
  // Pen 상태 (선 굵기, 스타일, 색상)
  const [penWidth, setPenWidth] = useState('1pt')
  const [penStyle, setPenStyle] = useState<'solid'|'double'|'dashed'|'dotted'>('solid')
  const [penColor, setPenColor] = useState('#374151')

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
      StyledTable.configure({
        resizable: true,
      }),
      TableRow,
      StyledTableHeader,
      StyledTableCell,
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
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[26cm]',
      },
      handleKeyDown: (view, event) => {
        // 표 안에서는 기본 Enter 동작 유지 (셀 내부 줄바꿈)
        const { $from } = view.state.selection
        let inTable = false
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'table') { inTable = true; break }
        }
        if (inTable) return false

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

  // 현재 커서가 표 안에 있는지 감지 → 컨텍스트 탭 자동 활성화
  const isInTable = editor?.isActive('table') ?? false
  useEffect(() => {
    if (isInTable && activeTab !== 'tableDesign' && activeTab !== 'tableLayout') {
      setActiveTab('tableDesign')
    }
    if (!isInTable && (activeTab === 'tableDesign' || activeTab === 'tableLayout')) {
      setActiveTab('home')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInTable])

  // 표 클래스 토글 (스타일 옵션)
  const toggleTableClass = (cls: string) => {
    if (!editor) return
    const current: string = (editor.getAttributes('table').class as string) || 'tbl-grid'
    const parts = current.split(/\s+/).filter(Boolean)
    const idx = parts.indexOf(cls)
    if (idx >= 0) parts.splice(idx, 1)
    else parts.push(cls)
    editor.chain().focus().updateAttributes('table', { class: parts.join(' ') }).run()
  }

  const hasTableClass = (cls: string): boolean => {
    if (!editor) return false
    const current: string = (editor.getAttributes('table').class as string) || ''
    return current.split(/\s+/).includes(cls)
  }

  const setTableStyle = (preset: string) => {
    if (!editor) return
    const current: string = (editor.getAttributes('table').class as string) || ''
    const nonPreset = current.split(/\s+/).filter(c => c && !c.startsWith('tbl-'))
    editor.chain().focus().updateAttributes('table', { class: [preset, ...nonPreset].join(' ') }).run()
  }

  const setCellShading = (color: string | null) => {
    if (!editor) return
    editor.chain().focus()
      .updateAttributes('tableCell', { backgroundColor: color })
      .updateAttributes('tableHeader', { backgroundColor: color })
      .run()
    setShowShadingMenu(false)
  }

  // Pen 설정으로 CSS border 문자열 생성
  const buildBorderValue = (): string => {
    return `${penWidth} ${penStyle} ${penColor}`
  }

  // 선택된 표 전체에 per-edge 테두리 적용
  const applyBorderToTable = (
    target: 'all' | 'outside' | 'inside' | 'top' | 'bottom' | 'left' | 'right' | 'none'
  ) => {
    if (!editor) return
    const { state } = editor
    const { $from } = state.selection

    // 표 노드와 위치 찾기
    let tableNode: any = null
    let tablePos = -1
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'table') {
        tableNode = $from.node(d)
        tablePos = $from.before(d)
        break
      }
    }
    if (!tableNode) {
      alert('먼저 표 안을 클릭해주세요.')
      return
    }

    // 행/열 데이터 수집 (절대 위치 포함)
    const rows: Array<Array<{ pos: number; node: any }>> = []
    let rowAbs = tablePos + 1
    tableNode.forEach((rowNode: any) => {
      const cells: Array<{ pos: number; node: any }> = []
      let cellAbs = rowAbs + 1
      rowNode.forEach((cellNode: any) => {
        cells.push({ pos: cellAbs, node: cellNode })
        cellAbs += cellNode.nodeSize
      })
      rows.push(cells)
      rowAbs += rowNode.nodeSize
    })

    const totalRows = rows.length
    if (totalRows === 0) return

    const borderValue = target === 'none' ? null : buildBorderValue()

    const tr = state.tr
    rows.forEach((row, r) => {
      row.forEach((cell, c) => {
        const isTop = r === 0
        const isBottom = r === totalRows - 1
        const isLeft = c === 0
        const isRight = c === row.length - 1

        const attrs: any = { ...cell.node.attrs }
        const setAll = (v: string | null) => {
          attrs.borderTop = v; attrs.borderRight = v; attrs.borderBottom = v; attrs.borderLeft = v
        }

        if (target === 'all' || target === 'none') {
          setAll(borderValue)
        } else if (target === 'outside') {
          if (isTop) attrs.borderTop = borderValue
          if (isBottom) attrs.borderBottom = borderValue
          if (isLeft) attrs.borderLeft = borderValue
          if (isRight) attrs.borderRight = borderValue
        } else if (target === 'inside') {
          if (!isTop) attrs.borderTop = borderValue
          if (!isBottom) attrs.borderBottom = borderValue
          if (!isLeft) attrs.borderLeft = borderValue
          if (!isRight) attrs.borderRight = borderValue
        } else if (target === 'top' && isTop) {
          attrs.borderTop = borderValue
        } else if (target === 'bottom' && isBottom) {
          attrs.borderBottom = borderValue
        } else if (target === 'left' && isLeft) {
          attrs.borderLeft = borderValue
        } else if (target === 'right' && isRight) {
          attrs.borderRight = borderValue
        }

        tr.setNodeMarkup(cell.pos, undefined, attrs)
      })
    })

    editor.view.dispatch(tr)
    editor.commands.focus()
    setShowBordersMenu(false)
  }

  // 그리드 피커에서 표 삽입
  const insertTableFromGrid = (rows: number, cols: number) => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setShowInsertGrid(false)
    setHoverRow(0)
    setHoverCol(0)
  }

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

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value
    if (!editor || !size) return
    // @ts-ignore
    editor.chain().focus().setFontSize(size).run()
    // 즉시 포커스 복귀
    setTimeout(() => editor.commands.focus(), 0)
  }

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value
    if (!editor || !font) return
    editor.chain().focus().setFontFamily(font).run()
    // 즉시 포커스 복귀
    setTimeout(() => editor.commands.focus(), 0)
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
      {/* ===== Word 스타일 리본 ===== */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-300 shadow-sm">
        {/* 탭 바 */}
        <div className="flex items-center px-2 pt-1 border-b border-gray-200 bg-white">
          {[
            { id: 'home', label: '홈' },
            { id: 'insert', label: '삽입' },
            ...(isInTable ? [
              { id: 'tableDesign', label: '표 디자인', contextual: true },
              { id: 'tableLayout', label: '표 레이아웃', contextual: true },
            ] : []),
          ].map((tab: any) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-t transition border-b-2 ${
                activeTab === tab.id
                  ? (tab.contextual ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-blue-600 text-blue-700 bg-blue-50')
                  : (tab.contextual ? 'border-transparent text-orange-600 hover:bg-orange-50' : 'border-transparent text-gray-600 hover:bg-gray-100')
              }`}
            >
              {tab.contextual && <span className="text-[9px] block -mb-1 opacity-70">표 도구</span>}
              {tab.label}
            </button>
          ))}
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
            title="전체화면"
          >
            {isFullscreen ? '⊟ 창모드' : '⊠ 전체화면'}
          </button>
          <div className="px-2 py-1 text-[10px] text-gray-500">{wordCount} 단어</div>
        </div>

        {/* 리본 본문 */}
        <div className="px-2 py-2 overflow-x-auto">
          {/* ========== 홈 탭 ========== */}
          {activeTab === 'home' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 클립보드 그룹 */}
              <div className="flex flex-col items-center px-2 border-r border-gray-300">
                <div className="flex items-start gap-1 flex-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="px-2 py-1 text-lg hover:bg-blue-100 rounded disabled:opacity-30" title="실행 취소 (Ctrl+Z)">↶</button>
                    <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="px-2 py-1 text-lg hover:bg-blue-100 rounded disabled:opacity-30" title="다시 실행 (Ctrl+Y)">↷</button>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">실행</div>
              </div>

              {/* 글꼴 그룹 (Font) */}
              <div className="flex flex-col items-center px-2 border-r border-gray-300">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-1">
                    <select onChange={handleFontFamilyChange} className="px-1 py-0.5 text-xs border border-gray-300 rounded bg-white w-32" defaultValue="">
                      <option value="">본문 폰트</option>
                      <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                      <option value="'맑은 고딕'">맑은 고딕</option>
                      <option value="Arial">Arial</option>
                      <option value="'Times New Roman'">Times New Roman</option>
                      <option value="'Courier New'">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                    <select onChange={handleFontSizeChange} className="px-1 py-0.5 text-xs border border-gray-300 rounded bg-white w-14" defaultValue="">
                      <option value="" disabled>크기</option>
                      {[8,9,10,10.5,11,12,13,14,15,16,18,20,22,24,26,28,32,36,40,48,60,72].map(s => <option key={s} value={`${s}pt`}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().run()} className="px-1.5 py-0.5 text-xs hover:bg-blue-100 rounded" title="서식 지우기">✕ᴬ</button>
                  </div>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('bold') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="굵게"><strong>B</strong></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('italic') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="기울임"><em>I</em></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('underline') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="밑줄"><u>U</u></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('strike') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="취소선"><s>S</s></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={`w-7 h-7 text-xs rounded ${editor.isActive('subscript') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="아래 첨자">x₂</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`w-7 h-7 text-xs rounded ${editor.isActive('superscript') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="위 첨자">x²</button>
                    <label className="flex items-center cursor-pointer rounded hover:bg-blue-100 px-1 h-7" title="글자 색">
                      <span className="text-xs text-red-600 font-bold">A</span>
                      <input type="color" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} className="w-3 h-3 ml-0.5 cursor-pointer border-0" />
                    </label>
                    <label className="flex items-center cursor-pointer rounded hover:bg-blue-100 px-1 h-7" title="형광펜">
                      <span className="text-xs">🖍</span>
                      <input type="color" onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()} className="w-3 h-3 ml-0.5 cursor-pointer border-0" />
                    </label>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">글꼴</div>
              </div>

              {/* 단락 그룹 (Paragraph) */}
              <div className="flex flex-col items-center px-2 border-r border-gray-300">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('bulletList') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="글머리 기호">•≡</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-7 h-7 text-xs rounded ${editor.isActive('orderedList') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="번호 매기기">1.≡</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`w-7 h-7 text-sm rounded ${editor.isActive('blockquote') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="인용">❝</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`w-7 h-7 text-xs rounded ${editor.isActive('codeBlock') ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="코드 블록">{'<>'}</button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`w-7 h-7 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="왼쪽 정렬">⫷</button>
                    <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`w-7 h-7 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="가운데 정렬">≡</button>
                    <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`w-7 h-7 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="오른쪽 정렬">⫸</button>
                    <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`w-7 h-7 text-sm rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`} title="양쪽 정렬">☰</button>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">단락</div>
              </div>

              {/* 스타일 그룹 (Heading) */}
              <div className="flex flex-col items-center px-2">
                <div className="flex gap-1 flex-1 items-center">
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 1</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 2</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 3</button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">스타일</div>
              </div>
            </div>
          )}

          {/* ========== 삽입 탭 ========== */}
          {activeTab === 'insert' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 표 삽입 (그리드 피커) */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300 relative">
                <div className="flex items-start flex-1 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowInsertGrid(!showInsertGrid); editor.commands.focus() }}
                    className="flex flex-col items-center px-3 py-1 hover:bg-blue-100 rounded"
                    title="표 삽입"
                  >
                    <span className="text-3xl leading-none">⊞</span>
                    <span className="text-[10px] text-gray-700 mt-1">표 ▾</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">표</div>
                {showInsertGrid && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[260px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol} 표` : '표 크기를 선택하세요'}
                    </div>
                    <div
                      className="inline-block"
                      onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
                    >
                      {Array.from({ length: 8 }).map((_, r) => (
                        <div key={r} className="flex">
                          {Array.from({ length: 10 }).map((_, c) => {
                            const active = r < hoverRow && c < hoverCol
                            return (
                              <div
                                key={c}
                                onMouseEnter={() => { setHoverRow(r + 1); setHoverCol(c + 1) }}
                                onClick={() => insertTableFromGrid(r + 1, c + 1)}
                                className={`w-5 h-5 m-[1px] border cursor-pointer ${
                                  active ? 'bg-blue-400 border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400'
                                }`}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex gap-1">
                      <button
                        type="button"
                        onClick={() => insertTableFromGrid(3, 3)}
                        className="flex-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        3×3 기본 삽입
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowInsertGrid(false); setHoverRow(0); setHoverCol(0) }}
                        className="px-2 py-1 text-[10px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 그림/미디어 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={addImage} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="이미지">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-[10px] text-gray-700">그림</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="구분선">
                    <span className="text-2xl">―</span>
                    <span className="text-[10px] text-gray-700">구분선</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">일러스트</div>
              </div>

              {/* 링크 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="링크">
                    <span className="text-2xl">🔗</span>
                    <span className="text-[10px] text-gray-700">링크</span>
                  </button>
                  <button type="button" onClick={() => setShowLinkPreviewInput(!showLinkPreviewInput)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="링크 카드">
                    <span className="text-2xl">📎</span>
                    <span className="text-[10px] text-gray-700">링크 카드</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">링크</div>
              </div>
            </div>
          )}

          {/* ========== 표 디자인 탭 ========== */}
          {activeTab === 'tableDesign' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 표 스타일 옵션 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 flex-1">
                  {[
                    { cls: 'header-row', label: '머리글 행' },
                    { cls: 'first-column', label: '첫째 열' },
                    { cls: 'total-row', label: '요약 행' },
                    { cls: 'last-column', label: '마지막 열' },
                    { cls: 'banded-rows', label: '줄무늬 행' },
                    { cls: 'banded-columns', label: '줄무늬 열' },
                  ].map(opt => (
                    <label key={opt.cls} className="flex items-center gap-1 text-[11px] cursor-pointer hover:bg-blue-50 px-1 rounded">
                      <input type="checkbox" checked={hasTableClass(opt.cls)} onChange={() => toggleTableClass(opt.cls)} className="w-3 h-3" />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">표 스타일 옵션</div>
              </div>

              {/* 표 스타일 갤러리 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300 min-w-[340px]">
                <div className="flex-1 w-full overflow-x-auto">
                  <div className="flex gap-1.5">
                    {[
                      { cls: 'tbl-grid', label: '격자' },
                      { cls: 'tbl-plain', label: '단순' },
                      { cls: 'tbl-striped', label: '줄무늬' },
                      { cls: 'tbl-header', label: '머리글' },
                      { cls: 'tbl-colorful', label: '컬러' },
                      { cls: 'tbl-minimal', label: '미니멀' },
                      { cls: 'tbl-dark', label: '다크' },
                    ].map(s => (
                      <button
                        key={s.cls}
                        type="button"
                        onClick={() => setTableStyle(s.cls)}
                        className={`border rounded px-1 py-1 hover:ring-2 hover:ring-blue-400 ${hasTableClass(s.cls) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}`}
                        title={s.label}
                      >
                        <div className={`preview-table ${s.cls}`}>
                          <div className="pt-row pt-head"><div className="pt-cell"></div><div className="pt-cell"></div><div className="pt-cell"></div></div>
                          <div className="pt-row"><div className="pt-cell"></div><div className="pt-cell"></div><div className="pt-cell"></div></div>
                          <div className="pt-row"><div className="pt-cell"></div><div className="pt-cell"></div><div className="pt-cell"></div></div>
                        </div>
                        <div className="text-[9px] text-gray-600 text-center mt-0.5">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">표 스타일</div>
              </div>

              {/* 셀 음영 (Shading) */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300 relative">
                <div className="flex-1 flex items-start pt-1">
                  <button type="button" onClick={() => setShowShadingMenu(!showShadingMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="셀 음영">
                    <span className="text-2xl">🎨</span>
                    <span className="text-[10px] text-gray-700">음영 ▾</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">음영</div>
                {showShadingMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-56">
                    <div className="text-xs font-semibold text-gray-700 mb-1">표준 색</div>
                    <div className="grid grid-cols-8 gap-1">
                      {['#ffffff','#f3f4f6','#e5e7eb','#d1d5db','#9ca3af','#6b7280','#374151','#111827',
                        '#fee2e2','#fecaca','#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#7f1d1d',
                        '#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#78350f',
                        '#d1fae5','#a7f3d0','#6ee7b7','#34d399','#10b981','#059669','#047857','#064e3b',
                        '#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e3a8a',
                        '#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7c3aed','#6b21a8','#4c1d95'].map(c => (
                        <button key={c} type="button" onClick={() => setCellShading(c)} style={{ backgroundColor: c }} className="w-5 h-5 border border-gray-300 hover:scale-110 transition" title={c} />
                      ))}
                    </div>
                    <button type="button" onClick={() => setCellShading(null)} className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">음영 없음</button>
                  </div>
                )}
              </div>

              {/* 선 스타일 (Line Style) */}
              <div className="flex flex-col items-center px-2 border-r border-gray-300 relative">
                <div className="flex-1 flex flex-col items-stretch gap-1 pt-1 min-w-[110px]">
                  <button
                    type="button"
                    onClick={() => { setShowLineStyleMenu(!showLineStyleMenu); setShowLineWeightMenu(false) }}
                    className="flex items-center justify-between px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-blue-50"
                    title="선 스타일"
                  >
                    <span>
                      {penStyle === 'solid' && '───── 단일'}
                      {penStyle === 'double' && '═════ 이중'}
                      {penStyle === 'dashed' && '- - - 점선'}
                      {penStyle === 'dotted' && '····· 도트'}
                    </span>
                    <span>▾</span>
                  </button>
                  {showLineStyleMenu && (
                    <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-1 w-40">
                      {[
                        { v: 'solid', label: '───── 단일선' },
                        { v: 'double', label: '═════ 이중선' },
                        { v: 'dashed', label: '- - - - 파선' },
                        { v: 'dotted', label: '· · · · 점선' },
                      ].map(s => (
                        <button
                          key={s.v}
                          type="button"
                          onClick={() => { setPenStyle(s.v as any); setShowLineStyleMenu(false) }}
                          className={`w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded ${penStyle === s.v ? 'bg-blue-100' : ''}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowLineWeightMenu(!showLineWeightMenu); setShowLineStyleMenu(false) }}
                    className="flex items-center justify-between px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-blue-50"
                    title="선 굵기"
                  >
                    <span>굵기: {penWidth}</span>
                    <span>▾</span>
                  </button>
                  {showLineWeightMenu && (
                    <div className="absolute top-full left-0 mt-[52px] z-30 bg-white border border-gray-300 rounded shadow-lg p-1 w-40">
                      {['0.5pt', '0.75pt', '1pt', '1.5pt', '2.25pt', '3pt', '4.5pt', '6pt'].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => { setPenWidth(w); setShowLineWeightMenu(false) }}
                          className={`w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded ${penWidth === w ? 'bg-blue-100' : ''}`}
                        >
                          <div style={{ borderTop: `${w} solid #111` }} className="my-1"></div>
                          <span className="text-[10px] text-gray-600">{w}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center justify-between px-2 py-1 text-[10px] bg-white border border-gray-300 rounded cursor-pointer hover:bg-blue-50">
                    <span>펜 색</span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-4 h-4 border border-gray-400" style={{ backgroundColor: penColor }}></span>
                      <input
                        type="color"
                        value={penColor}
                        onChange={(e) => setPenColor(e.target.value)}
                        className="w-0 h-0 opacity-0"
                      />
                    </span>
                  </label>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">테두리 스타일</div>
              </div>

              {/* 테두리 (Borders) 드롭다운 */}
              <div className="flex flex-col items-center px-3 relative">
                <div className="flex-1 flex items-start pt-1">
                  <button type="button" onClick={() => setShowBordersMenu(!showBordersMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="테두리">
                    <span className="text-2xl">⊞</span>
                    <span className="text-[10px] text-gray-700">테두리 ▾</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">테두리</div>
                {showBordersMenu && (
                  <div className="absolute top-full right-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-52">
                    <div className="text-[10px] text-gray-500 mb-1 px-1">
                      현재 펜: {penWidth} {penStyle} <span className="inline-block w-3 h-3 align-middle border border-gray-400" style={{ backgroundColor: penColor }}></span>
                    </div>
                    {[
                      { mode: 'all', label: '⊞ 모든 테두리' },
                      { mode: 'outside', label: '▭ 바깥쪽 테두리' },
                      { mode: 'inside', label: '田 안쪽 테두리' },
                      { mode: 'top', label: '▔ 위쪽 테두리' },
                      { mode: 'bottom', label: '▁ 아래쪽 테두리' },
                      { mode: 'left', label: '▏ 왼쪽 테두리' },
                      { mode: 'right', label: '▕ 오른쪽 테두리' },
                      { mode: 'none', label: '∅ 테두리 없음' },
                    ].map(b => (
                      <button
                        key={b.mode}
                        type="button"
                        onClick={() => applyBorderToTable(b.mode as any)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== 표 레이아웃 탭 ========== */}
          {activeTab === 'tableLayout' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 삭제 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-1 flex-1">
                  <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="flex flex-col items-center px-2 py-1 hover:bg-red-50 rounded text-red-600" title="행 삭제">
                    <span className="text-lg">⊖</span>
                    <span className="text-[10px]">행 삭제</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="flex flex-col items-center px-2 py-1 hover:bg-red-50 rounded text-red-600" title="열 삭제">
                    <span className="text-lg">⊖</span>
                    <span className="text-[10px]">열 삭제</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="flex flex-col items-center px-2 py-1 hover:bg-red-50 rounded text-red-600" title="표 삭제">
                    <span className="text-lg">🗑</span>
                    <span className="text-[10px]">표 삭제</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">삭제</div>
              </div>

              {/* 행 및 열 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-1 flex-1">
                  <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⬆</span>
                    <span className="text-[10px]">위에 삽입</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⬇</span>
                    <span className="text-[10px]">아래 삽입</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⬅</span>
                    <span className="text-[10px]">왼쪽 삽입</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">➡</span>
                    <span className="text-[10px]">오른쪽 삽입</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">행 및 열</div>
              </div>

              {/* 병합 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-1 flex-1">
                  <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⊞</span>
                    <span className="text-[10px]">셀 병합</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⊟</span>
                    <span className="text-[10px]">셀 분할</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">병합</div>
              </div>

              {/* 머리글 토글 */}
              <div className="flex flex-col items-center px-3 border-r border-gray-300">
                <div className="flex items-start gap-1 flex-1">
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⊤</span>
                    <span className="text-[10px]">머리글 행</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderColumn().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⊣</span>
                    <span className="text-[10px]">머리글 열</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderCell().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⊞</span>
                    <span className="text-[10px]">머리글 셀</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">머리글</div>
              </div>

              {/* 맞춤 */}
              <div className="flex flex-col items-center px-3">
                <div className="flex items-start gap-1 flex-1">
                  <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⫷</span>
                    <span className="text-[10px]">왼쪽</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">≡</span>
                    <span className="text-[10px]">가운데</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded">
                    <span className="text-lg">⫸</span>
                    <span className="text-[10px]">오른쪽</span>
                  </button>
                </div>
                <div className="text-[9px] text-gray-500 pt-1 border-t border-gray-200 w-full text-center mt-1">맞춤</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 링크 입력 박스 */}
      {showLinkInput && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <div className="flex gap-2">
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => { if (e.key === 'Enter') setLink() }} />
            <button type="button" onClick={setLink} disabled={!linkUrl} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">삽입</button>
            <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl('') }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">취소</button>
          </div>
        </div>
      )}

      {/* 링크 프리뷰 입력 박스 */}
      {showLinkPreviewInput && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <div className="flex gap-2">
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com 또는 유튜브 링크" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => { if (e.key === 'Enter') fetchLinkPreview(linkUrl) }} />
            <button type="button" onClick={() => fetchLinkPreview(linkUrl)} disabled={!linkUrl || fetchingPreview} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">{fetchingPreview ? '생성 중...' : '삽입'}</button>
            <button type="button" onClick={() => { setShowLinkPreviewInput(false); setLinkUrl('') }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">취소</button>
          </div>
        </div>
      )}

      {/* 에디터 (A4 narrow margin 1.27cm 레이아웃) */}
      <div className={isFullscreen ? 'h-[calc(100vh-200px)] overflow-auto bg-gray-200 p-4' : 'bg-gray-200 p-4'}>
        <div
          className="mx-auto bg-white shadow-md"
          style={{
            width: '21cm',
            maxWidth: '100%',
            minHeight: '29.7cm',
            padding: '1.27cm',
            boxSizing: 'border-box',
          }}
        >
          <EditorContent editor={editor} />
        </div>
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
        /* 기본 표 스타일 */
        .ProseMirror table {
          border-collapse: collapse;
          margin: 16px 0;
          width: 100%;
          table-layout: fixed;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          padding: 8px 10px;
          min-width: 60px;
          vertical-align: top;
          position: relative;
        }
        .ProseMirror table .selectedCell::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(59, 130, 246, 0.15);
          pointer-events: none;
          z-index: 2;
        }
        .ProseMirror table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #3b82f6;
          pointer-events: none;
        }

        /* Word Table Styles 프리셋 */
        .ProseMirror table.tbl-grid td,
        .ProseMirror table.tbl-grid th {
          border: 1px solid #9ca3af;
        }
        .ProseMirror table.tbl-grid th {
          background-color: #f3f4f6;
          font-weight: 700;
        }

        .ProseMirror table.tbl-plain td,
        .ProseMirror table.tbl-plain th {
          border: 1px solid #e5e7eb;
        }
        .ProseMirror table.tbl-plain th {
          background-color: transparent;
          font-weight: 700;
          border-bottom: 2px solid #6b7280;
        }

        .ProseMirror table.tbl-striped td,
        .ProseMirror table.tbl-striped th {
          border: 1px solid #e5e7eb;
        }
        .ProseMirror table.tbl-striped th {
          background-color: #4b5563;
          color: #ffffff;
          font-weight: 700;
        }
        .ProseMirror table.tbl-striped tr:nth-child(even) td {
          background-color: #f9fafb;
        }

        .ProseMirror table.tbl-header td,
        .ProseMirror table.tbl-header th {
          border: 1px solid #d1d5db;
        }
        .ProseMirror table.tbl-header th {
          background-color: #1e40af;
          color: #ffffff;
          font-weight: 700;
          border: 1px solid #1e3a8a;
        }

        .ProseMirror table.tbl-colorful td,
        .ProseMirror table.tbl-colorful th {
          border: 1px solid #a78bfa;
        }
        .ProseMirror table.tbl-colorful th {
          background-color: #7c3aed;
          color: #ffffff;
          font-weight: 700;
        }
        .ProseMirror table.tbl-colorful tr:nth-child(even) td {
          background-color: #f5f3ff;
        }

        .ProseMirror table.tbl-minimal td,
        .ProseMirror table.tbl-minimal th {
          border: none;
          border-bottom: 1px solid #e5e7eb;
        }
        .ProseMirror table.tbl-minimal th {
          background-color: transparent;
          font-weight: 700;
          border-bottom: 2px solid #111827;
          text-align: left;
        }

        .ProseMirror table.tbl-dark td,
        .ProseMirror table.tbl-dark th {
          border: 1px solid #374151;
          background-color: #1f2937;
          color: #f3f4f6;
        }
        .ProseMirror table.tbl-dark th {
          background-color: #111827;
          color: #ffffff;
          font-weight: 700;
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

        /* ============ Word 스타일 옵션 (table style options) ============ */
        /* 머리글 행 — 첫 행 강조 */
        .ProseMirror table.header-row tr:first-child td,
        .ProseMirror table.header-row tr:first-child th {
          background-color: #1e40af;
          color: #ffffff;
          font-weight: 700;
        }
        /* 요약 행 — 마지막 행 강조 */
        .ProseMirror table.total-row tr:last-child td,
        .ProseMirror table.total-row tr:last-child th {
          border-top: 2px solid #1e3a8a;
          border-bottom: 2px solid #1e3a8a;
          font-weight: 700;
          background-color: #eff6ff;
        }
        /* 줄무늬 행 */
        .ProseMirror table.banded-rows tr:nth-child(even) td,
        .ProseMirror table.banded-rows tr:nth-child(even) th {
          background-color: #f3f4f6;
        }
        /* 첫째 열 강조 */
        .ProseMirror table.first-column td:first-child,
        .ProseMirror table.first-column th:first-child {
          font-weight: 700;
          background-color: #eff6ff;
        }
        /* 마지막 열 강조 */
        .ProseMirror table.last-column td:last-child,
        .ProseMirror table.last-column th:last-child {
          font-weight: 700;
          background-color: #eff6ff;
        }
        /* 줄무늬 열 */
        .ProseMirror table.banded-columns td:nth-child(even),
        .ProseMirror table.banded-columns th:nth-child(even) {
          background-color: #f9fafb;
        }

        /* 인라인 per-edge 테두리가 프리셋보다 우선 적용되도록 !important 제거 */

        /* ============ 미리보기 표 (갤러리 섬네일) ============ */
        .preview-table {
          width: 56px;
          display: block;
        }
        .preview-table .pt-row { display: flex; }
        .preview-table .pt-cell {
          width: 18px;
          height: 8px;
          border: 1px solid #9ca3af;
          background: #ffffff;
        }
        .preview-table.tbl-grid .pt-head .pt-cell { background: #f3f4f6; }
        .preview-table.tbl-plain .pt-cell { border-color: #e5e7eb; }
        .preview-table.tbl-plain .pt-head .pt-cell { border-bottom: 2px solid #6b7280; background: transparent; }
        .preview-table.tbl-striped .pt-head .pt-cell { background: #4b5563; border-color: #4b5563; }
        .preview-table.tbl-striped .pt-row:nth-child(2) .pt-cell { background: #f9fafb; }
        .preview-table.tbl-header .pt-head .pt-cell { background: #1e40af; border-color: #1e3a8a; }
        .preview-table.tbl-colorful .pt-head .pt-cell { background: #7c3aed; border-color: #a78bfa; }
        .preview-table.tbl-colorful .pt-row:nth-child(2) .pt-cell { background: #f5f3ff; }
        .preview-table.tbl-minimal .pt-cell { border: none; border-bottom: 1px solid #e5e7eb; }
        .preview-table.tbl-minimal .pt-head .pt-cell { border-bottom: 2px solid #111827; }
        .preview-table.tbl-dark .pt-cell { background: #1f2937; border-color: #374151; }
        .preview-table.tbl-dark .pt-head .pt-cell { background: #111827; }
      `}</style>
    </div>
  )
}