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
import { Mark, Node, Extension } from '@tiptap/core'
import { CellSelection, TableMap } from '@tiptap/pm/tables'

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
import dynamic from 'next/dynamic'
const ChartDialog = dynamic(() => import('./ChartDialog'), { ssr: false })

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

// 줄 간격 (Line Spacing) Extension — paragraph / heading 에 lineHeight 적용
const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: null as string | null,
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
            renderHTML: (attributes: any) => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    const types = this.options.types
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) => {
        return types.every((type: string) =>
          commands.updateAttributes(type, { lineHeight })
        )
      },
      unsetLineHeight: () => ({ commands }: any) => {
        return types.every((type: string) =>
          commands.resetAttributes(type, 'lineHeight')
        )
      },
    } as any
  },
})

// 단락 들여쓰기 / 단락 간격 Extension (Word Indent + Spacing Before/After + Right Indent)
const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      step: 24,
      max: 480,
    }
  },
  addGlobalAttributes() {
    const buildStyle = (attrs: any) => {
      const parts: string[] = []
      if (attrs.indent) parts.push(`margin-left: ${attrs.indent}px`)
      if (attrs.indentRight) parts.push(`margin-right: ${attrs.indentRight}px`)
      if (attrs.spaceBefore) parts.push(`margin-top: ${attrs.spaceBefore}px`)
      if (attrs.spaceAfter) parts.push(`margin-bottom: ${attrs.spaceAfter}px`)
      return parts.join('; ')
    }
    const parseCss = (el: HTMLElement, key: string) => {
      const v = (el.style as any)[key]
      if (!v) return 0
      const n = parseInt(v, 10)
      return isNaN(n) ? 0 : n
    }
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el: HTMLElement) => parseCss(el, 'marginLeft'),
            renderHTML: () => ({}),
          },
          indentRight: {
            default: 0,
            parseHTML: (el: HTMLElement) => parseCss(el, 'marginRight'),
            renderHTML: () => ({}),
          },
          spaceBefore: {
            default: 0,
            parseHTML: (el: HTMLElement) => parseCss(el, 'marginTop'),
            renderHTML: () => ({}),
          },
          spaceAfter: {
            default: 0,
            parseHTML: (el: HTMLElement) => parseCss(el, 'marginBottom'),
            renderHTML: () => ({}),
          },
          _indentStyle: {
            default: null,
            parseHTML: () => null,
            renderHTML: (attributes: any) => {
              const s = buildStyle(attributes)
              return s ? { style: s } : {}
            },
          },
        },
      },
    ]
  },
  addCommands() {
    const { step, max, types } = this.options
    const updateIfPara = (key: string, value: number) => ({ state, commands }: any) => {
      const { selection } = state
      const node = selection.$from.node(selection.$from.depth)
      if (!node || !types.includes(node.type.name)) return false
      return commands.updateAttributes(node.type.name, { [key]: value })
    }
    return {
      indent: () => ({ state, commands }: any) => {
        const { selection } = state
        const node = selection.$from.node(selection.$from.depth)
        if (!node || !types.includes(node.type.name)) return false
        const next = Math.min((node.attrs.indent || 0) + step, max)
        return commands.updateAttributes(node.type.name, { indent: next })
      },
      outdent: () => ({ state, commands }: any) => {
        const { selection } = state
        const node = selection.$from.node(selection.$from.depth)
        if (!node || !types.includes(node.type.name)) return false
        const next = Math.max((node.attrs.indent || 0) - step, 0)
        return commands.updateAttributes(node.type.name, { indent: next })
      },
      setIndent: (px: number) => updateIfPara('indent', px),
      setIndentRight: (px: number) => updateIfPara('indentRight', px),
      setSpaceBefore: (px: number) => updateIfPara('spaceBefore', px),
      setSpaceAfter: (px: number) => updateIfPara('spaceAfter', px),
    } as any
  },
})

// Page Break Node
const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { kind: { default: 'page' } }
  },
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },
  renderHTML({ node }) {
    const kind = node.attrs.kind || 'page'
    const label = kind === 'column' ? '단 나누기' : '페이지 나누기'
    return ['div', { 'data-page-break': '', class: 'page-break', style: 'margin: 12px 0; padding: 8px 0; text-align: center; border-top: 1px dashed #cbd5e0;' }, ['span', { style: 'font-size: 11px; color: #a0aec0;' }, label]]
  },
  addCommands() {
    return {
      insertPageBreak: () => ({ commands }: any) => commands.insertContent({ type: this.name, attrs: { kind: 'page' } }),
      insertColumnBreak: () => ({ commands }: any) => commands.insertContent({ type: this.name, attrs: { kind: 'column' } }),
    } as any
  },
})

// Bookmark Node
const Bookmark = Node.create({
  name: 'bookmark',
  group: 'inline',
  atom: true,
  inline: true,
  selectable: true,
  addAttributes() {
    return { id: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'a[data-bookmark]' }]
  },
  renderHTML({ node }) {
    return ['a', { id: node.attrs.id, 'data-bookmark': node.attrs.id, class: 'bookmark', href: '#' + node.attrs.id }, '🔖']
  },
  addCommands() {
    return {
      setBookmark: (id: string) => ({ commands }: any) => commands.insertContent({ type: this.name, attrs: { id } }),
    } as any
  },
})

// TextBox Node
const TextBox = Node.create({
  name: 'textBox',
  group: 'block',
  content: 'paragraph+',
  draggable: true,
  parseHTML() {
    return [{ tag: 'div[data-text-box]' }]
  },
  renderHTML() {
    return ['div', { 'data-text-box': '', class: 'text-box', style: 'border: 1px solid #cbd5e0; padding: 12px; background: rgba(255, 251, 230, 0.5);' }, ['div', {}, 0]]
  },
  addCommands() {
    return {
      insertTextBox: () => ({ commands }: any) => commands.insertContent({ type: this.name, content: [{ type: 'paragraph' }] }),
    } as any
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
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout' | 'tableDesign' | 'tableLayout'>('home')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [painterMode, setPainterMode] = useState(false)
  const [painterLocked, setPainterLocked] = useState(false)
  const [painterMarks, setPainterMarks] = useState<any>(null)
  const [pageHeaderText, setPageHeaderText] = useState('')
  const [pageFooterText, setPageFooterText] = useState('')
  const [editingHeaderFooter, setEditingHeaderFooter] = useState<'header' | 'footer' | null>(null)
  const [headerFooterInput, setHeaderFooterInput] = useState('')
  const [pageMargins, setPageMargins] = useState({ top: '1.27cm', right: '1.27cm', bottom: '1.27cm', left: '1.27cm' })
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal' | 'A3' | 'A5'>('A4')
  const [pageColumns, setPageColumns] = useState<1 | 2 | 3>(1)
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)
  const [showEquationDialog, setShowEquationDialog] = useState(false)
  const [equationLatex, setEquationLatex] = useState('')
  const [showStylesGallery, setShowStylesGallery] = useState(false)
  const [showMultilevelMenu, setShowMultilevelMenu] = useState(false)
  const [showShapesMenu, setShowShapesMenu] = useState(false)
  const [showSmartArtMenu, setShowSmartArtMenu] = useState(false)
  const [showWordArtMenu, setShowWordArtMenu] = useState(false)
  const [showPageNumberMenu, setShowPageNumberMenu] = useState(false)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [bookmarkInput, setBookmarkInput] = useState('')
  const [showHyperlinkDialog, setShowHyperlinkDialog] = useState(false)
  const [hyperlinkText, setHyperlinkText] = useState('')
  const [hyperlinkHref, setHyperlinkHref] = useState('')
  const [hyperlinkNewTab, setHyperlinkNewTab] = useState(true)
  const [showMarginsMenu, setShowMarginsMenu] = useState(false)
  const [showCustomMargins, setShowCustomMargins] = useState(false)
  const [showOrientationMenu, setShowOrientationMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showColumnsMenu, setShowColumnsMenu] = useState(false)
  const [showBreaksMenu, setShowBreaksMenu] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [charCount, setCharCount] = useState(0)

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
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false)
  const [showCaseMenu, setShowCaseMenu] = useState(false)
  const [showChartDialog, setShowChartDialog] = useState(false)
  const [showImageToolbar, setShowImageToolbar] = useState(false)
  const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 })
  const replaceImageRef = useRef<HTMLInputElement>(null)

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
      LineHeight,
      Indent,
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
      PageBreak,
      Bookmark,
      TextBox,
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
      setCharCount(text.length)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[26cm]',
      },
      handleKeyDown: (view, event) => {
        // Ctrl+F = Find
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
          event.preventDefault()
          setShowFindReplace(!showFindReplace)
          return true
        }
        // Ctrl+Enter = Page Break
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault()
          editor && (editor as any).chain().focus().insertPageBreak().run()
          return true
        }
        // Escape = Clear painter mode
        if (event.key === 'Escape') {
          if (painterMode) {
            setPainterMode(false)
            setPainterMarks(null)
            return true
          }
          if (showFindReplace) {
            setShowFindReplace(false)
            return true
          }
        }

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
        const cd = event.clipboardData
        if (!cd) return false

        const html = cd.getData('text/html') || ''
        const text = cd.getData('text/plain') || ''

        // 1) Excel/스프레드시트/Word 에서 표를 복사: HTML에 <table>이 있으면
        //    tiptap 기본 파서에 맡긴다 (썸네일 이미지 먼저 잡히는 것 방지)
        if (/<table[\s>]/i.test(html)) {
          return false
        }

        // 2) 순수 탭-구분 텍스트 (예: 구글 시트 → plain text): 표로 변환
        if (!html && text && text.includes('\t') && /\r?\n/.test(text)) {
          const rows = text
            .replace(/\r/g, '')
            .split('\n')
            .filter(r => r.length > 0)
            .map(r => r.split('\t'))
          if (rows.length >= 1 && rows[0].length >= 2) {
            const content = {
              type: 'table',
              attrs: { class: 'tbl-grid' },
              content: rows.map((cells, idx) => ({
                type: 'tableRow',
                content: cells.map(c => ({
                  type: idx === 0 ? 'tableHeader' : 'tableCell',
                  content: [{
                    type: 'paragraph',
                    content: c ? [{ type: 'text', text: c }] : [],
                  }],
                })),
              })),
            }
            event.preventDefault()
            editor?.chain().focus().insertContent(content).run()
            return true
          }
        }

        // 3) Excel 차트 등: HTML에 <table>은 없지만 <img> 가 있는 경우
        //    (Excel 차트 복사 시 text/html에 <img> + image/png 동시 제공)
        if (html && !/<table[\s>]/i.test(html) && /<img[\s>]/i.test(html)) {
          const items = cd.items
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault()
                const file = items[i].getAsFile()
                if (file) uploadImage(file)
                return true
              }
            }
          }
          // <img> HTML은 있지만 image item이 없으면 기본 파서에 맡김
          return false
        }

        // 4) 순수 이미지 (스크린샷 등 HTML/text 대안 없음)
        const items = cd.items
        if (items && !html && !text) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              event.preventDefault()
              const file = items[i].getAsFile()
              if (file) uploadImage(file)
              return true
            }
          }
        }

        // 5) Excel 차트: HTML도 text도 없고 image만 있는 경우 (일부 Excel 버전)
        if (items) {
          const hasText = html || text
          if (!hasText) return false
          // HTML은 있는데 table/img 아닌 경우 — image item 체크
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              // HTML이 의미없는 래퍼만 포함하면 이미지로 처리
              const stripped = html.replace(/<\/?[^>]+(>|$)/g, '').trim()
              if (!stripped || stripped.length < 10) {
                event.preventDefault()
                const file = items[i].getAsFile()
                if (file) uploadImage(file)
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
    if (editor) {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(word => word.length > 0)
      setWordCount(words.length)
      setCharCount(text.length)
    }
  }, [editor])

  // 이미지 선택 감지 → 플로팅 툴바 표시
  const isImageSelected = editor?.isActive('resizableImage') ?? false
  useEffect(() => {
    if (!editor || !isImageSelected) {
      setShowImageToolbar(false)
      return
    }
    // 선택된 이미지 DOM 위치 찾기
    const { node } = editor.state.selection as any
    if (!node) { setShowImageToolbar(false); return }
    const dom = editor.view.nodeDOM(editor.state.selection.from) as HTMLElement
    if (!dom) { setShowImageToolbar(false); return }
    const img = dom.tagName === 'IMG' ? dom : dom.querySelector('img')
    if (!img) { setShowImageToolbar(false); return }
    const rect = img.getBoundingClientRect()
    const editorRect = editor.view.dom.closest('.bg-white')?.getBoundingClientRect()
    if (editorRect) {
      setImageToolbarPos({
        top: rect.top - editorRect.top - 44,
        left: rect.left - editorRect.left + rect.width / 2,
      })
    }
    setShowImageToolbar(true)
  }, [isImageSelected, editor?.state.selection])

  // 이미지 편집 함수들
  const setImageSize = (widthPercent: number) => {
    if (!editor) return
    const { node } = editor.state.selection as any
    if (!node) return
    const editorWidth = editor.view.dom.clientWidth
    const newWidth = Math.round(editorWidth * widthPercent / 100)
    editor.chain().focus().updateAttributes('resizableImage', { width: newWidth }).run()
  }

  const setImageAlign = (align: string) => {
    if (!editor) return
    editor.chain().focus().updateAttributes('resizableImage', { align }).run()
  }

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const url = await uploadImageAndGetUrl(file)
    if (url) {
      editor.chain().focus().updateAttributes('resizableImage', { src: url }).run()
    }
    e.target.value = ''
  }

  const deleteSelectedImage = () => {
    if (!editor) return
    editor.chain().focus().deleteSelection().run()
  }

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

  // 페이지 수 계산 (A4 기준, 여백 제외)
  useEffect(() => {
    if (!editor) return
    const calcPages = () => {
      const editorEl = editor.view.dom as HTMLElement
      if (!editorEl) return
      const contentHeight = editorEl.scrollHeight
      const [pw, ph] = pageSizeDims[pageSize]
      const pageHeightCm = pageOrientation === 'landscape' ? pw : ph
      // cm 을 px 로 변환 (96dpi 기준 1cm = 37.795px)
      const parseCm = (v: string) => {
        const n = parseFloat(v)
        if (v.includes('cm')) return n * 37.795
        if (v.includes('mm')) return n * 3.7795
        if (v.includes('in')) return n * 96
        return n
      }
      const marginTop = parseCm(pageMargins.top)
      const marginBottom = parseCm(pageMargins.bottom)
      const contentAreaHeightPx = (pageHeightCm * 37.795) - marginTop - marginBottom
      const pages = Math.max(1, Math.ceil(contentHeight / contentAreaHeightPx))
      setTotalPages(pages)
      // 현재 커서 위치 기반 현재 페이지
      try {
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        const editorRect = editorEl.getBoundingClientRect()
        const cursorOffsetTop = coords.top - editorRect.top
        const curPage = Math.max(1, Math.min(pages, Math.ceil((cursorOffsetTop + 20) / contentAreaHeightPx)))
        setCurrentPage(curPage)
      } catch {
        setCurrentPage(1)
      }
    }
    calcPages()
    const unsub = editor.on('update', calcPages)
    const unsub2 = editor.on('selectionUpdate', calcPages)
    return () => { try { (unsub as any)?.(); (unsub2 as any)?.() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, pageSize, pageOrientation, pageMargins])


  // 현재 선택이 속한 표 노드와 위치를 찾음
  const findEnclosingTable = (): { node: any; pos: number } | null => {
    if (!editor) return null
    const { $from } = editor.state.selection
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'table') {
        return { node: $from.node(d), pos: $from.before(d) }
      }
    }
    return null
  }

  // 표 노드의 class 속성을 직접 변경 (setNodeMarkup 사용, 포커스 손실 대비)
  const updateTableClass = (mutator: (current: string) => string) => {
    if (!editor) return
    const found = findEnclosingTable()
    if (!found) return
    const current: string = (found.node.attrs.class as string) || ''
    const newClass = mutator(current).trim()
    const tr = editor.state.tr.setNodeMarkup(found.pos, undefined, {
      ...found.node.attrs,
      class: newClass,
    })
    editor.view.dispatch(tr)
    editor.commands.focus()
  }

  // 표 스타일 옵션 토글 (머리글 행/줄무늬 등)
  const toggleTableClass = (cls: string) => {
    updateTableClass(current => {
      const parts = current.split(/\s+/).filter(Boolean)
      const idx = parts.indexOf(cls)
      if (idx >= 0) parts.splice(idx, 1)
      else parts.push(cls)
      return parts.join(' ')
    })
  }

  const hasTableClass = (cls: string): boolean => {
    const found = findEnclosingTable()
    if (!found) return false
    const current: string = (found.node.attrs.class as string) || ''
    return current.split(/\s+/).includes(cls)
  }

  // 표 스타일 갤러리: tbl-* 프리셋 교체 (여러 번 변경 가능)
  const setTableStyle = (preset: string) => {
    updateTableClass(current => {
      const nonPreset = current.split(/\s+/).filter(c => c && !c.startsWith('tbl-'))
      return [preset, ...nonPreset].join(' ')
    })
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
  // - pt -> px 변환 (브라우저 렌더링 안정성)
  // - double 선은 3px 미만이면 단일선으로 보이므로 최소 3px 보장
  const buildBorderValue = (): string => {
    const pt = parseFloat(penWidth) || 1
    let px = Math.max(1, Math.round(pt * 1.333 * 100) / 100)
    if (penStyle === 'double' && px < 3) px = 3
    return `${px}px ${penStyle} ${penColor}`
  }

  // 선택된 셀(단일/병합/다중 선택)에 per-edge 테두리 적용
  // target: all/outside/inside/top/bottom/left/right/none
  const applyBorderToSelection = (
    target: 'all' | 'outside' | 'inside' | 'top' | 'bottom' | 'left' | 'right' | 'none'
  ) => {
    if (!editor) return
    const { state } = editor
    const { selection } = state

    const found = findEnclosingTable()
    if (!found) {
      alert('먼저 표 안을 클릭해주세요.')
      return
    }
    const tableNode = found.node
    const tablePos = found.pos
    const tableStart = tablePos + 1

    let map: any
    try {
      map = TableMap.get(tableNode)
    } catch {
      return
    }

    // 선택 영역 rect 계산 (top,left,right,bottom은 grid index, right/bottom은 exclusive)
    let rectTop = 0, rectLeft = 0, rectRight = map.width, rectBottom = map.height

    if (selection instanceof CellSelection) {
      const anchor = (selection as any).$anchorCell.pos - tableStart
      const head = (selection as any).$headCell.pos - tableStart
      const rect = map.rectBetween(anchor, head)
      rectTop = rect.top
      rectLeft = rect.left
      rectRight = rect.right
      rectBottom = rect.bottom
    } else {
      // 단일 셀: 커서가 속한 셀 찾기
      const { $from } = selection
      let cellRelPos = -1
      for (let d = $from.depth; d > 0; d--) {
        const n = $from.node(d)
        if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
          cellRelPos = $from.before(d) - tableStart
          break
        }
      }
      if (cellRelPos < 0) return
      // map.map에서 이 셀이 차지하는 grid 영역 계산
      let minR = map.height, maxR = -1, minC = map.width, maxC = -1
      for (let i = 0; i < map.map.length; i++) {
        if (map.map[i] === cellRelPos) {
          const r = Math.floor(i / map.width)
          const c = i % map.width
          if (r < minR) minR = r
          if (r > maxR) maxR = r
          if (c < minC) minC = c
          if (c > maxC) maxC = c
        }
      }
      if (maxR < 0) return
      rectTop = minR
      rectLeft = minC
      rectRight = maxC + 1
      rectBottom = maxR + 1
    }

    // rect 내부의 고유 셀 position 수집
    const cellRelPositions = new Set<number>()
    for (let r = rectTop; r < rectBottom; r++) {
      for (let c = rectLeft; c < rectRight; c++) {
        cellRelPositions.add(map.map[r * map.width + c])
      }
    }

    const borderValue = target === 'none' ? null : buildBorderValue()
    const tr = state.tr

    cellRelPositions.forEach(cellRelPos => {
      const cellNode = tableNode.nodeAt(cellRelPos)
      if (!cellNode) return
      const absPos = tableStart + cellRelPos

      // 이 셀이 차지하는 grid 범위
      let cMinR = map.height, cMaxR = -1, cMinC = map.width, cMaxC = -1
      for (let i = 0; i < map.map.length; i++) {
        if (map.map[i] === cellRelPos) {
          const r = Math.floor(i / map.width)
          const c = i % map.width
          if (r < cMinR) cMinR = r
          if (r > cMaxR) cMaxR = r
          if (c < cMinC) cMinC = c
          if (c > cMaxC) cMaxC = c
        }
      }

      // rect 경계와 비교
      const isTop = cMinR === rectTop
      const isBottom = cMaxR === rectBottom - 1
      const isLeft = cMinC === rectLeft
      const isRight = cMaxC === rectRight - 1

      const attrs: any = { ...cellNode.attrs }

      if (target === 'all' || target === 'none') {
        attrs.borderTop = borderValue
        attrs.borderRight = borderValue
        attrs.borderBottom = borderValue
        attrs.borderLeft = borderValue
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

      tr.setNodeMarkup(absPos, undefined, attrs)
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

  const uploadImageAndGetUrl = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file)

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleChartInsert = async (imageUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
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

  // 글자 크기 증가/감소 (현재 선택된 범위의 fontSize mark 를 pt 기준으로 조절)
  const FONT_SIZE_STEPS = [8,9,10,10.5,11,12,13,14,15,16,18,20,22,24,26,28,32,36,40,48,60,72]
  const stepFontSize = (dir: 1 | -1) => {
    if (!editor) return
    const attrs: any = editor.getAttributes('fontSize') || {}
    const cur = parseFloat((attrs.fontSize || '11pt').replace('pt', '')) || 11
    let idx = FONT_SIZE_STEPS.findIndex(s => s >= cur)
    if (idx === -1) idx = FONT_SIZE_STEPS.length - 1
    const next = FONT_SIZE_STEPS[Math.min(FONT_SIZE_STEPS.length - 1, Math.max(0, idx + dir))]
    // @ts-ignore
    editor.chain().focus().setFontSize(`${next}pt`).run()
  }

    const applyPainterMarks = () => {
    if (!editor || !painterMarks || editor.state.selection.empty) return
    const chain = editor.chain().focus()
    if (painterMarks.bold) chain.setBold()
    if (painterMarks.italic) chain.setItalic()
    if (painterMarks.underline) chain.setUnderline()
    if (painterMarks.strike) chain.setStrike()
    if (painterMarks.color) chain.setColor(painterMarks.color)
    chain.run()
    if (!painterLocked) {
      setPainterMode(false)
      setPainterMarks(null)
    }
  }

  const findMatches = (): Array<{ from: number; to: number }> => {
    if (!editor || !findText) return []
    const matches: Array<{ from: number; to: number }> = []
    const text = editor.state.doc.textContent
    const searchStr = matchCase ? findText : findText.toLowerCase()
    const docStr = matchCase ? text : text.toLowerCase()
    let index = 0
    while ((index = docStr.indexOf(searchStr, index)) !== -1) {
      matches.push({ from: index, to: index + searchStr.length })
      index += 1
    }
    return matches
  }

  const insertEquation = () => {
    if (!editor || !equationLatex) return
    const url = 'https://latex.codecogs.com/svg.image?' + encodeURIComponent(equationLatex)
    editor.chain().focus().setImage({ src: url }).run()
    setEquationLatex('')
    setShowEquationDialog(false)
  }

  const insertSymbol = (symbol: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(symbol).run()
    setShowSymbolPicker(false)
  }

  const pageSizeDims: Record<string, [number, number]> = {
    'A4': [21, 29.7], 'A3': [29.7, 42], 'A5': [14.8, 21], 'Letter': [21.59, 27.94], 'Legal': [21.59, 35.56],
  }

  const getPageDims = () => {
    const [w, h] = pageSizeDims[pageSize]
    if (pageOrientation === 'landscape') return { width: h, height: w }
    return { width: w, height: h }
  }

// 대/소문자 변환 (선택 텍스트)
  const changeCase = (mode: 'upper' | 'lower' | 'title' | 'sentence' | 'toggle') => {
    if (!editor) return
    const { from, to, empty } = editor.state.selection
    if (empty) return
    const text = editor.state.doc.textBetween(from, to, '\n')
    let out = text
    if (mode === 'upper') out = text.toUpperCase()
    else if (mode === 'lower') out = text.toLowerCase()
    else if (mode === 'title') out = text.replace(/\b([a-z])/g, (m) => m.toUpperCase())
    else if (mode === 'sentence') {
      out = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase())
    } else if (mode === 'toggle') {
      out = text.split('').map(ch => ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()).join('')
    }
    editor.chain().focus().insertContentAt({ from, to }, out).setTextSelection({ from, to: from + out.length }).run()
    setShowCaseMenu(false)
  }


  // === MS Word 스타일 헬퍼 ===
  const applyStyle = (style: string) => {
    if (!editor) return
    const chain: any = editor.chain().focus()
    // 모든 기존 스타일 마크/블록 초기화 후 적용
    if (style === 'normal') {
      chain.setParagraph().unsetAllMarks().unsetColor().run()
    } else if (style === 'h1') {
      chain.setHeading({ level: 1 }).run()
    } else if (style === 'h2') {
      chain.setHeading({ level: 2 }).run()
    } else if (style === 'h3') {
      chain.setHeading({ level: 3 }).run()
    } else if (style === 'h4') {
      chain.setHeading({ level: 4 }).run()
    } else if (style === 'title') {
      chain.setHeading({ level: 1 }).setColor('#1f2937').run()
    } else if (style === 'subtitle') {
      chain.setHeading({ level: 2 }).setColor('#6b7280').run()
    } else if (style === 'quote') {
      chain.setBlockquote().run()
    } else if (style === 'code') {
      chain.toggleCodeBlock().run()
    } else if (style === 'emphasis') {
      chain.toggleItalic().run()
    } else if (style === 'strong') {
      chain.toggleBold().run()
    }
    setShowStylesGallery(false)
  }

  const applyMultilevel = (kind: string) => {
    if (!editor) return
    if (kind === 'ordered') {
      editor.chain().focus().toggleOrderedList().run()
    } else if (kind === 'bullet') {
      editor.chain().focus().toggleBulletList().run()
    } else if (kind === 'decimal') {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { _listStyle: 'decimal' }).run()
    } else if (kind === 'alpha') {
      editor.chain().focus().toggleOrderedList().run()
      setTimeout(() => editor.chain().focus().updateAttributes('orderedList', { _listStyle: 'lower-alpha' }).run(), 0)
    } else if (kind === 'roman') {
      editor.chain().focus().toggleOrderedList().run()
      setTimeout(() => editor.chain().focus().updateAttributes('orderedList', { _listStyle: 'lower-roman' }).run(), 0)
    }
    setShowMultilevelMenu(false)
  }

  const insertShape = (shape: string) => {
    if (!editor) return
    const color = penColor || '#2563eb'
    const shapes: Record<string, string> = {
      rect: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect x="4" y="4" width="112" height="72" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      circle: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      triangle: `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="100" viewBox="0 0 110 100"><polygon points="55,6 104,94 6,94" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="50" viewBox="0 0 140 50"><path d="M4 25 L110 25 M90 10 L115 25 L90 40" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      star: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,6 62,38 96,38 68,58 78,92 50,72 22,92 32,58 4,38 38,38" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      diamond: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,6 94,50 50,94 6,50" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      pentagon: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50,6 94,40 78,94 22,94 6,40" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      hexagon: `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="100" viewBox="0 0 110 100"><polygon points="30,6 80,6 104,50 80,94 30,94 6,50" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      line: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20" viewBox="0 0 140 20"><line x1="4" y1="10" x2="136" y2="10" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`,
      callout: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><path d="M8 8 H152 V64 H52 L32 92 L40 64 H8 Z" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/></svg>`,
      heart: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="90" viewBox="0 0 100 90"><path d="M50 82 C50 82 8 56 8 30 C8 18 18 8 30 8 C38 8 46 12 50 20 C54 12 62 8 70 8 C82 8 92 18 92 30 C92 56 50 82 50 82 Z" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
      cloud: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" viewBox="0 0 140 80"><path d="M40 60 Q20 60 20 44 Q20 28 38 28 Q40 12 58 12 Q76 12 80 26 Q96 22 104 34 Q124 36 124 50 Q124 64 108 66 L40 60 Z" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/></svg>`,
    }
    const svg = shapes[shape] || shapes.rect
    const dataUri = 'data:image/svg+xml;base64,' + (typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64'))
    editor.chain().focus().setImage({ src: dataUri }).run()
    setShowShapesMenu(false)
  }

  const insertSmartArt = (kind: string) => {
    if (!editor) return
    let html = ''
    if (kind === 'process') {
      html = '<div class="smartart smartart-process" data-smartart="process"><div class="sa-box">1단계</div><div class="sa-arrow">▶</div><div class="sa-box">2단계</div><div class="sa-arrow">▶</div><div class="sa-box">3단계</div></div><p></p>'
    } else if (kind === 'hierarchy') {
      html = '<div class="smartart smartart-hier" data-smartart="hierarchy"><div class="sa-top">조직장</div><div class="sa-row"><div class="sa-box">팀 A</div><div class="sa-box">팀 B</div><div class="sa-box">팀 C</div></div></div><p></p>'
    } else if (kind === 'cycle') {
      html = '<div class="smartart smartart-cycle" data-smartart="cycle"><div class="sa-cbox">계획</div><div class="sa-carrow">⤻</div><div class="sa-cbox">실행</div><div class="sa-carrow">⤻</div><div class="sa-cbox">검토</div><div class="sa-carrow">⤻</div><div class="sa-cbox">개선</div></div><p></p>'
    } else if (kind === 'list') {
      html = '<div class="smartart smartart-list" data-smartart="list"><div class="sa-litem"><span class="sa-idx">1</span> 항목 하나</div><div class="sa-litem"><span class="sa-idx">2</span> 항목 둘</div><div class="sa-litem"><span class="sa-idx">3</span> 항목 셋</div></div><p></p>'
    } else if (kind === 'relation') {
      html = '<div class="smartart smartart-rel" data-smartart="relation"><div class="sa-rbox">A</div><div class="sa-rbox">B</div><div class="sa-rbox">C</div></div><p></p>'
    } else if (kind === 'pyramid') {
      html = '<div class="smartart smartart-pyr" data-smartart="pyramid"><div class="sa-pyr sa-pyr1">최상위</div><div class="sa-pyr sa-pyr2">중간층</div><div class="sa-pyr sa-pyr3">기초 계층</div></div><p></p>'
    }
    editor.chain().focus().insertContent(html).run()
    setShowSmartArtMenu(false)
  }

  const insertWordArt = (style: string) => {
    if (!editor) return
    const text = window.prompt('WordArt 텍스트를 입력하세요', '제목')
    if (!text) return
    const cls = 'wordart wordart-' + style
    editor.chain().focus().insertContent(`<span class="${cls}">${text}</span>`).run()
    setShowWordArtMenu(false)
  }

  const setPageNumber = (pos: string) => {
    if (!editor) return
    const marker = pos === 'top' ? '페이지 상단' : pos === 'bottom' ? '페이지 하단' : '현재 위치'
    // Word의 페이지 번호는 인쇄시 CSS counter 로 처리되므로 헤더/푸터 텍스트에 적용
    if (pos === 'top') {
      setPageHeaderText((p) => (p ? p + ' - ' : '') + '- {페이지} -')
    } else if (pos === 'bottom') {
      setPageFooterText((p) => (p ? p + ' - ' : '') + '- {페이지} -')
    } else {
      editor.chain().focus().insertContent('<span class="page-number" data-pn="inline">1</span>').run()
    }
    setShowPageNumberMenu(false)
  }

  const insertBookmarkNow = () => {
    if (!editor) return
    const id = bookmarkInput.trim()
    if (!id) return
    ;(editor.chain().focus() as any).insertContent({ type: 'bookmark', attrs: { id } }).run()
    setBookmarkInput('')
    setShowBookmarkDialog(false)
  }

  const openHyperlinkDialog = () => {
    if (!editor) return
    const { from, to, empty } = editor.state.selection
    const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ')
    const existing = editor.getAttributes('link')?.href || ''
    setHyperlinkText(selectedText)
    setHyperlinkHref(existing)
    setShowHyperlinkDialog(true)
  }

  const applyHyperlink = () => {
    if (!editor) return
    const href = hyperlinkHref.trim()
    if (!href) { setShowHyperlinkDialog(false); return }
    const target = hyperlinkNewTab ? '_blank' : '_self'
    const { from, to, empty } = editor.state.selection
    if (empty && hyperlinkText.trim()) {
      editor.chain().focus()
        .insertContent(`<a href="${href}" target="${target}" rel="${hyperlinkNewTab ? 'noopener noreferrer' : ''}">${hyperlinkText}</a>`)
        .run()
    } else if (!empty) {
      editor.chain().focus().extendMarkRange('link').setLink({ href, target } as any).run()
      if (hyperlinkText.trim() && hyperlinkText !== editor.state.doc.textBetween(from, to, ' ')) {
        editor.chain().focus().insertContentAt({ from, to }, hyperlinkText).run()
      }
    }
    setShowHyperlinkDialog(false)
  }

  const applyMarginsPreset = (preset: string) => {
    if (preset === 'normal') setPageMargins({ top: '2.54cm', right: '2.54cm', bottom: '2.54cm', left: '2.54cm' })
    else if (preset === 'narrow') setPageMargins({ top: '1.27cm', right: '1.27cm', bottom: '1.27cm', left: '1.27cm' })
    else if (preset === 'moderate') setPageMargins({ top: '2.54cm', right: '1.91cm', bottom: '2.54cm', left: '1.91cm' })
    else if (preset === 'wide') setPageMargins({ top: '2.54cm', right: '5.08cm', bottom: '2.54cm', left: '5.08cm' })
    else if (preset === 'mirrored') setPageMargins({ top: '2.54cm', right: '2.54cm', bottom: '2.54cm', left: '3.18cm' })
    setShowMarginsMenu(false)
  }

  const setParaIndentLeft = (px: number) => {
    if (!editor) return
    ;(editor.chain().focus() as any).setIndent(px).run()
  }
  const setParaIndentRight = (px: number) => {
    if (!editor) return
    ;(editor.chain().focus() as any).setIndentRight(px).run()
  }
  const setParaSpaceBefore = (px: number) => {
    if (!editor) return
    ;(editor.chain().focus() as any).setSpaceBefore(px).run()
  }
  const setParaSpaceAfter = (px: number) => {
    if (!editor) return
    ;(editor.chain().focus() as any).setSpaceAfter(px).run()
  }

  const insertPageBreakNow = () => {
    if (!editor) return
    ;(editor.chain().focus() as any).insertContent({ type: 'pageBreak' }).run()
    setShowBreaksMenu(false)
  }

  const insertColumnBreakNow = () => {
    if (!editor) return
    editor.chain().focus().insertContent('<div class="column-break"></div><p></p>').run()
    setShowBreaksMenu(false)
  }

  if (!editor) {
    return null
  }

  return (
    <div className={`word-app ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-md overflow-hidden border border-[#c1c3c7]'}`}>
      {/* ===== MS Word 365 스타일 타이틀 바 + QAT + 리본 ===== */}
      <div className="sticky top-0 z-20 word-chrome">

        {/* === Title Bar (진한 블루) === */}
        <div className="word-titlebar flex items-center px-2 h-9 select-none">
          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-0.5 mr-3">
            <span className="inline-flex items-center justify-center w-6 h-6 mr-1 rounded-sm" title="Word 문서">
              <svg width="16" height="16" viewBox="0 0 32 32"><path fill="#fff" d="M4 4h18l6 6v18a0 0 0 0 1 0 0H4z" opacity=".3"/><path d="M4 4h18l6 6v18H4z" stroke="#fff" strokeWidth="1.4" fill="none"/><text x="10" y="22" fontFamily="Arial" fontSize="12" fontWeight="900" fill="#fff">W</text></svg>
            </span>
            <button type="button" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} className="word-qat-btn" title="실행 취소 (Ctrl+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M4 9h11a5 5 0 015 5v0a5 5 0 01-5 5h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} className="word-qat-btn" title="다시 실행 (Ctrl+Y)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 14l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M20 9H9a5 5 0 00-5 5v0a5 5 0 005 5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="flex-1 text-center text-[12px] text-white/95 font-normal tracking-wide truncate">문서 1 — Word</div>

          <div className="flex items-center gap-1 ml-3">
            <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="word-titlebar-btn" title={isFullscreen ? '창 모드' : '전체화면'}>
              {isFullscreen ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 14h6v6M20 10h-6V4M4 14L10 8M20 10l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v2H6v4H4V4zM14 4h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zM18 14h2v6h-6v-2h4v-4z" fill="currentColor"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* === 탭 바 (File + 홈/삽입/레이아웃/...) === */}
        <div className="word-tabbar flex items-stretch">
          <button type="button" className="word-file-tab" title="파일">파일</button>
          {[
            { id: 'home', label: '홈' },
            { id: 'insert', label: '삽입' },
            { id: 'layout', label: '레이아웃' },
            ...(isInTable ? [
              { id: 'tableDesign', label: '표 디자인', contextual: true },
              { id: 'tableLayout', label: '표 레이아웃', contextual: true },
            ] : []),
          ].map((tab: any) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`word-tab ${activeTab === tab.id ? 'active' : ''} ${tab.contextual ? 'contextual' : ''}`}
            >
              {tab.contextual && <span className="word-tab-context">표 도구</span>}
              <span className="word-tab-label">{tab.label}</span>
            </button>
          ))}
          <div className="flex-1"></div>
        </div>

        {/* === 리본 본문 === */}
        <div className="word-ribbon-body px-2 pt-2 pb-1" style={{ overflow: 'visible' }}>
          {/* ========== 홈 탭 ========== */}
          {activeTab === 'home' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 클립보드 그룹 */}
              <div className="word-group flex flex-col items-center px-2">
                <div className="flex items-start gap-1 flex-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="px-2 py-1 text-lg hover:bg-blue-100 rounded disabled:opacity-30" title="실행 취소 (Ctrl+Z)">↶</button>
                    <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="px-2 py-1 text-lg hover:bg-blue-100 rounded disabled:opacity-30" title="다시 실행 (Ctrl+Y)">↷</button>
                  </div>
                </div>
                <div className="word-group-label">실행</div>
              </div>

              {/* 글꼴 그룹 (Font) */}
              <div className="word-group flex flex-col items-center px-2">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-1">
                    <select onChange={handleFontFamilyChange} className="px-2 py-1 text-xs border border-gray-300 rounded bg-white w-40 font-select" defaultValue="">
                      <option value="">본문 폰트</option>
                      <optgroup label="최근 사용">
                        <option value="'Times New Roman', Times, serif" style={{ fontFamily: "'Times New Roman', serif" }}>Times New Roman</option>
                        <option value="'맑은 고딕', 'Malgun Gothic', sans-serif" style={{ fontFamily: "'Malgun Gothic'" }}>맑은 고딕</option>
                        <option value="'Noto Sans KR', sans-serif" style={{ fontFamily: "'Noto Sans KR'" }}>Noto Sans KR</option>
                      </optgroup>
                      <optgroup label="한글 글꼴">
                        <option value="'Noto Sans KR', sans-serif" style={{ fontFamily: "'Noto Sans KR'" }}>Noto Sans KR</option>
                        <option value="'Noto Serif KR', serif" style={{ fontFamily: "'Noto Serif KR'" }}>Noto Serif KR</option>
                        <option value="'Nanum Gothic', sans-serif" style={{ fontFamily: "'Nanum Gothic'" }}>나눔고딕</option>
                        <option value="'Nanum Myeongjo', serif" style={{ fontFamily: "'Nanum Myeongjo'" }}>나눔명조</option>
                        <option value="'Nanum Pen Script', cursive" style={{ fontFamily: "'Nanum Pen Script'" }}>나눔손글씨 펜</option>
                        <option value="'Nanum Brush Script', cursive" style={{ fontFamily: "'Nanum Brush Script'" }}>나눔손글씨 붓</option>
                        <option value="'Gowun Dodum', sans-serif" style={{ fontFamily: "'Gowun Dodum'" }}>고운돋움</option>
                        <option value="'Gowun Batang', serif" style={{ fontFamily: "'Gowun Batang'" }}>고운바탕</option>
                        <option value="'Gaegu', cursive" style={{ fontFamily: "'Gaegu'" }}>개구쟁이</option>
                        <option value="'Jua', sans-serif" style={{ fontFamily: "'Jua'" }}>주아체</option>
                        <option value="'Do Hyeon', sans-serif" style={{ fontFamily: "'Do Hyeon'" }}>도현체</option>
                        <option value="'Black Han Sans', sans-serif" style={{ fontFamily: "'Black Han Sans'" }}>블랙한산스</option>
                        <option value="'맑은 고딕', 'Malgun Gothic', sans-serif" style={{ fontFamily: "'Malgun Gothic'" }}>맑은 고딕</option>
                        <option value="'바탕', Batang, serif" style={{ fontFamily: "Batang, '바탕'" }}>바탕</option>
                        <option value="'굴림', Gulim, sans-serif" style={{ fontFamily: "Gulim, '굴림'" }}>굴림</option>
                        <option value="'돋움', Dotum, sans-serif" style={{ fontFamily: "Dotum, '돋움'" }}>돋움</option>
                        <option value="'궁서', Gungsuh, serif" style={{ fontFamily: "Gungsuh, '궁서'" }}>궁서</option>
                      </optgroup>
                      <optgroup label="영문 Serif">
                        <option value="'Times New Roman', Times, serif" style={{ fontFamily: "'Times New Roman', serif" }}>Times New Roman</option>
                        <option value="Georgia, serif" style={{ fontFamily: "Georgia" }}>Georgia</option>
                        <option value="'Cambria', Georgia, serif" style={{ fontFamily: "Cambria, Georgia" }}>Cambria</option>
                        <option value="Garamond, 'Times New Roman', serif" style={{ fontFamily: "Garamond" }}>Garamond</option>
                        <option value="'Book Antiqua', 'Palatino Linotype', serif" style={{ fontFamily: "'Palatino Linotype'" }}>Palatino Linotype</option>
                        <option value="'Baskerville', 'Baskerville Old Face', serif" style={{ fontFamily: "Baskerville" }}>Baskerville</option>
                        <option value="'Courier New', Courier, monospace" style={{ fontFamily: "'Courier New'" }}>Courier New</option>
                        <option value="'Lucida Bright', Georgia, serif" style={{ fontFamily: "'Lucida Bright'" }}>Lucida Bright</option>
                        <option value="'Playfair Display', serif" style={{ fontFamily: "'Playfair Display'" }}>Playfair Display</option>
                        <option value="'Merriweather', serif" style={{ fontFamily: "'Merriweather'" }}>Merriweather</option>
                        <option value="'Lora', serif" style={{ fontFamily: "'Lora'" }}>Lora</option>
                        <option value="'PT Serif', serif" style={{ fontFamily: "'PT Serif'" }}>PT Serif</option>
                      </optgroup>
                      <optgroup label="영문 Sans-serif">
                        <option value="Arial, Helvetica, sans-serif" style={{ fontFamily: "Arial" }}>Arial</option>
                        <option value="'Arial Black', Arial, sans-serif" style={{ fontFamily: "'Arial Black'" }}>Arial Black</option>
                        <option value="'Arial Narrow', Arial, sans-serif" style={{ fontFamily: "'Arial Narrow'" }}>Arial Narrow</option>
                        <option value="Helvetica, Arial, sans-serif" style={{ fontFamily: "Helvetica" }}>Helvetica</option>
                        <option value="Calibri, 'Segoe UI', sans-serif" style={{ fontFamily: "Calibri" }}>Calibri</option>
                        <option value="'Segoe UI', Tahoma, sans-serif" style={{ fontFamily: "'Segoe UI'" }}>Segoe UI</option>
                        <option value="Tahoma, Verdana, sans-serif" style={{ fontFamily: "Tahoma" }}>Tahoma</option>
                        <option value="Verdana, Geneva, sans-serif" style={{ fontFamily: "Verdana" }}>Verdana</option>
                        <option value="'Trebuchet MS', sans-serif" style={{ fontFamily: "'Trebuchet MS'" }}>Trebuchet MS</option>
                        <option value="'Century Gothic', sans-serif" style={{ fontFamily: "'Century Gothic'" }}>Century Gothic</option>
                        <option value="'Franklin Gothic Medium', sans-serif" style={{ fontFamily: "'Franklin Gothic Medium'" }}>Franklin Gothic</option>
                        <option value="'Gill Sans', 'Gill Sans MT', sans-serif" style={{ fontFamily: "'Gill Sans'" }}>Gill Sans</option>
                        <option value="'Roboto', sans-serif" style={{ fontFamily: "'Roboto'" }}>Roboto</option>
                        <option value="'Open Sans', sans-serif" style={{ fontFamily: "'Open Sans'" }}>Open Sans</option>
                        <option value="'Lato', sans-serif" style={{ fontFamily: "'Lato'" }}>Lato</option>
                        <option value="'Montserrat', sans-serif" style={{ fontFamily: "'Montserrat'" }}>Montserrat</option>
                        <option value="'Inter', sans-serif" style={{ fontFamily: "'Inter'" }}>Inter</option>
                        <option value="'Poppins', sans-serif" style={{ fontFamily: "'Poppins'" }}>Poppins</option>
                      </optgroup>
                      <optgroup label="모노스페이스">
                        <option value="'Courier New', Courier, monospace" style={{ fontFamily: "'Courier New'" }}>Courier New</option>
                        <option value="Consolas, 'Courier New', monospace" style={{ fontFamily: "Consolas" }}>Consolas</option>
                        <option value="'Lucida Console', Monaco, monospace" style={{ fontFamily: "'Lucida Console'" }}>Lucida Console</option>
                        <option value="Monaco, Menlo, monospace" style={{ fontFamily: "Monaco" }}>Monaco</option>
                        <option value="Menlo, Consolas, monospace" style={{ fontFamily: "Menlo" }}>Menlo</option>
                        <option value="'JetBrains Mono', monospace" style={{ fontFamily: "'JetBrains Mono'" }}>JetBrains Mono</option>
                        <option value="'Fira Code', monospace" style={{ fontFamily: "'Fira Code'" }}>Fira Code</option>
                        <option value="'Source Code Pro', monospace" style={{ fontFamily: "'Source Code Pro'" }}>Source Code Pro</option>
                      </optgroup>
                      <optgroup label="장식/표시">
                        <option value="Impact, 'Arial Black', sans-serif" style={{ fontFamily: "Impact" }}>Impact</option>
                        <option value="'Comic Sans MS', 'Marker Felt', cursive" style={{ fontFamily: "'Comic Sans MS'" }}>Comic Sans MS</option>
                        <option value="'Brush Script MT', cursive" style={{ fontFamily: "'Brush Script MT'" }}>Brush Script</option>
                        <option value="'Copperplate', 'Copperplate Gothic Light', fantasy" style={{ fontFamily: "Copperplate" }}>Copperplate</option>
                        <option value="'Papyrus', fantasy" style={{ fontFamily: "Papyrus" }}>Papyrus</option>
                      </optgroup>
                    </select>
                    <select onChange={handleFontSizeChange} className="px-1 py-0.5 text-xs border border-gray-300 rounded bg-white w-14" defaultValue="">
                      <option value="" disabled>크기</option>
                      {[8,9,10,10.5,11,12,13,14,15,16,18,20,22,24,26,28,32,36,40,48,60,72].map(s => <option key={s} value={`${s}pt`}>{s}</option>)}
                    </select>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => stepFontSize(1)} className="w-6 h-6 text-xs hover:bg-blue-100 rounded" title="글자 크기 크게">A˄</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => stepFontSize(-1)} className="w-6 h-6 text-xs hover:bg-blue-100 rounded" title="글자 크기 작게">A˅</button>
                    <div className="relative">
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowCaseMenu(!showCaseMenu); setShowLineSpacingMenu(false) }} className="w-8 h-6 text-xs hover:bg-blue-100 rounded" title="대/소문자 바꾸기">Aa▾</button>
                      {showCaseMenu && (
                        <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 shadow-lg rounded mt-1 w-44 py-1 text-xs">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => changeCase('sentence')} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">문장의 첫 글자만 대문자</button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => changeCase('lower')} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">소문자로 (lowercase)</button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => changeCase('upper')} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">대문자로 (UPPERCASE)</button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => changeCase('title')} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">단어 첫 글자 대문자</button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => changeCase('toggle')} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">대/소문자 전환</button>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="px-1.5 py-0.5 text-xs hover:bg-blue-100 rounded" title="서식 지우기">✕ᴬ</button>
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
                <div className="word-group-label">글꼴</div>
              </div>

              {/* 단락 그룹 (Paragraph) */}
              <div className="word-group flex flex-col items-center px-2">
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
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => (editor.chain().focus() as any).outdent().run()} className="w-7 h-7 text-sm hover:bg-blue-100 rounded" title="내어쓰기">⇤</button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => (editor.chain().focus() as any).indent().run()} className="w-7 h-7 text-sm hover:bg-blue-100 rounded" title="들여쓰기">⇥</button>
                    <div className="relative">
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowLineSpacingMenu(!showLineSpacingMenu); setShowCaseMenu(false) }} className="w-8 h-7 text-xs hover:bg-blue-100 rounded" title="줄 간격">↕≡</button>
                      {showLineSpacingMenu && (
                        <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 shadow-lg rounded mt-1 w-32 py-1 text-xs">
                          {['1.0','1.15','1.5','2.0','2.5','3.0'].map(v => (
                            <button key={v} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { (editor.chain().focus() as any).setLineHeight(v).run(); setShowLineSpacingMenu(false) }} className="w-full text-left px-3 py-1.5 hover:bg-blue-50">{v}</button>
                          ))}
                          <div className="border-t border-gray-200 my-1"></div>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { (editor.chain().focus() as any).unsetLineHeight().run(); setShowLineSpacingMenu(false) }} className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-600">기본값</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="word-group-label">단락</div>
              </div>

              {/* 다단계 목록 그룹 */}
              <div className="word-group flex flex-col items-center px-2 relative">
                <div className="flex gap-1 flex-1 items-start">
                  <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded ${editor.isActive('bulletList') ? 'bg-blue-200' : ''}`} title="글머리 기호">
                    <span className="text-lg leading-none">•≡</span>
                    <span className="text-[10px] mt-0.5">글머리</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded ${editor.isActive('orderedList') ? 'bg-blue-200' : ''}`} title="번호 매기기">
                    <span className="text-lg leading-none">1≡</span>
                    <span className="text-[10px] mt-0.5">번호</span>
                  </button>
                  <button type="button" onClick={() => setShowMultilevelMenu(!showMultilevelMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="다단계 목록">
                    <span className="text-lg leading-none">≡▾</span>
                    <span className="text-[10px] mt-0.5">다단계</span>
                  </button>
                </div>
                <div className="word-group-label">목록</div>
                {showMultilevelMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[240px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2 px-1">다단계 목록 스타일</div>
                    <button type="button" onClick={() => applyMultilevel('decimal')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">1. 2. 3. (숫자)</button>
                    <button type="button" onClick={() => applyMultilevel('alpha')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">a. b. c. (영문 소문자)</button>
                    <button type="button" onClick={() => applyMultilevel('roman')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">i. ii. iii. (로마자)</button>
                    <button type="button" onClick={() => applyMultilevel('bullet')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">• 글머리 기호</button>
                    <button type="button" onClick={() => applyMultilevel('ordered')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">번호 매기기 (기본)</button>
                  </div>
                )}
              </div>

              {/* 스타일 그룹 (Heading + Gallery) */}
              <div className="flex flex-col items-center px-2 relative">
                <div className="flex gap-1 flex-1 items-center">
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 1</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 2</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>제목 3</button>
                  <button type="button" onClick={() => setShowStylesGallery(!showStylesGallery)} className="px-1.5 py-1 text-sm rounded hover:bg-blue-100" title="스타일 갤러리">▾</button>
                </div>
                <div className="word-group-label">스타일</div>
                {showStylesGallery && (
                  <div className="absolute top-full right-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[420px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2">스타일 갤러리</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={() => applyStyle('normal')} className="px-2 py-2 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">본문</button>
                      <button type="button" onClick={() => applyStyle('title')} className="px-2 py-2 text-xl font-bold border border-gray-200 rounded hover:bg-blue-50 text-left">큰 제목</button>
                      <button type="button" onClick={() => applyStyle('subtitle')} className="px-2 py-2 text-base italic text-gray-500 border border-gray-200 rounded hover:bg-blue-50 text-left">부제목</button>
                      <button type="button" onClick={() => applyStyle('h1')} className="px-2 py-2 text-lg font-bold border border-gray-200 rounded hover:bg-blue-50 text-left">제목 1</button>
                      <button type="button" onClick={() => applyStyle('h2')} className="px-2 py-2 text-base font-semibold border border-gray-200 rounded hover:bg-blue-50 text-left">제목 2</button>
                      <button type="button" onClick={() => applyStyle('h3')} className="px-2 py-2 text-sm font-semibold border border-gray-200 rounded hover:bg-blue-50 text-left">제목 3</button>
                      <button type="button" onClick={() => applyStyle('h4')} className="px-2 py-2 text-xs font-semibold border border-gray-200 rounded hover:bg-blue-50 text-left">제목 4</button>
                      <button type="button" onClick={() => applyStyle('strong')} className="px-2 py-2 text-xs font-bold border border-gray-200 rounded hover:bg-blue-50 text-left">강조</button>
                      <button type="button" onClick={() => applyStyle('emphasis')} className="px-2 py-2 text-xs italic border border-gray-200 rounded hover:bg-blue-50 text-left">기울임</button>
                      <button type="button" onClick={() => applyStyle('quote')} className="px-2 py-2 text-xs italic text-gray-600 border border-gray-200 rounded hover:bg-blue-50 text-left">인용</button>
                      <button type="button" onClick={() => applyStyle('code')} className="px-2 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 text-left">코드</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== 삽입 탭 ========== */}
          {activeTab === 'insert' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 표 삽입 (그리드 피커) */}
              <div className="word-group flex flex-col items-center px-3 relative">
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
                <div className="word-group-label">표</div>
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
              <div className="word-group flex flex-col items-center px-3">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={addImage} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="이미지">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-[10px] text-gray-700">그림</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => setShowChartDialog(true)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="차트">
                    <span className="text-2xl">📊</span>
                    <span className="text-[10px] text-gray-700">차트</span>
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="구분선">
                    <span className="text-2xl">―</span>
                    <span className="text-[10px] text-gray-700">구분선</span>
                  </button>
                </div>
                <div className="word-group-label">일러스트</div>
              </div>

              {/* 링크 */}
              <div className="word-group flex flex-col items-center px-3">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={openHyperlinkDialog} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="하이퍼링크 (Ctrl+K)">
                    <span className="text-2xl">🔗</span>
                    <span className="text-[10px] text-gray-700">링크</span>
                  </button>
                  <button type="button" onClick={() => setShowBookmarkDialog(true)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="책갈피">
                    <span className="text-2xl">🔖</span>
                    <span className="text-[10px] text-gray-700">책갈피</span>
                  </button>
                  <button type="button" onClick={() => setShowLinkPreviewInput(!showLinkPreviewInput)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="링크 카드">
                    <span className="text-2xl">📎</span>
                    <span className="text-[10px] text-gray-700">링크 카드</span>
                  </button>
                </div>
                <div className="word-group-label">링크</div>
              </div>

              {/* 머리글/바닥글 */}
              <div className="word-group flex flex-col items-center px-3 relative">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={() => setEditingHeaderFooter(editingHeaderFooter === 'header' ? null : 'header')} className={`flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded ${editingHeaderFooter === 'header' ? 'bg-blue-200' : ''}`} title="머리글">
                    <span className="text-2xl">▭</span>
                    <span className="text-[10px] text-gray-700">머리글</span>
                  </button>
                  <button type="button" onClick={() => setEditingHeaderFooter(editingHeaderFooter === 'footer' ? null : 'footer')} className={`flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded ${editingHeaderFooter === 'footer' ? 'bg-blue-200' : ''}`} title="바닥글">
                    <span className="text-2xl">▬</span>
                    <span className="text-[10px] text-gray-700">바닥글</span>
                  </button>
                  <button type="button" onClick={() => setShowPageNumberMenu(!showPageNumberMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="페이지 번호">
                    <span className="text-2xl">#</span>
                    <span className="text-[10px] text-gray-700">페이지</span>
                  </button>
                </div>
                <div className="word-group-label">머리글/바닥글</div>
                {showPageNumberMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[200px]">
                    <button type="button" onClick={() => setPageNumber('top')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">▲ 페이지 위쪽</button>
                    <button type="button" onClick={() => setPageNumber('bottom')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">▼ 페이지 아래쪽</button>
                    <button type="button" onClick={() => setPageNumber('inline')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">◎ 현재 위치</button>
                  </div>
                )}
              </div>

              {/* 도형 / SmartArt / WordArt */}
              <div className="word-group flex flex-col items-center px-3 relative">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={() => setShowShapesMenu(!showShapesMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="도형">
                    <span className="text-2xl">◆</span>
                    <span className="text-[10px] text-gray-700">도형</span>
                  </button>
                  <button type="button" onClick={() => setShowSmartArtMenu(!showSmartArtMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="SmartArt">
                    <span className="text-2xl">⚙</span>
                    <span className="text-[10px] text-gray-700">SmartArt</span>
                  </button>
                  <button type="button" onClick={() => setShowWordArtMenu(!showWordArtMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="WordArt">
                    <span className="text-2xl font-bold" style={{ background: 'linear-gradient(45deg,#2563eb,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A</span>
                    <span className="text-[10px] text-gray-700">WordArt</span>
                  </button>
                </div>
                <div className="word-group-label">일러스트</div>
                {showShapesMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[320px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2">도형</div>
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        { k: 'rect', s: '▭' }, { k: 'circle', s: '◯' }, { k: 'triangle', s: '△' },
                        { k: 'diamond', s: '◇' }, { k: 'pentagon', s: '⬠' }, { k: 'hexagon', s: '⬡' },
                        { k: 'arrow', s: '→' }, { k: 'line', s: '─' }, { k: 'star', s: '☆' },
                        { k: 'callout', s: '💬' }, { k: 'heart', s: '♡' }, { k: 'cloud', s: '☁' },
                      ].map(it => (
                        <button key={it.k} type="button" onClick={() => insertShape(it.k)} className="p-2 text-xl hover:bg-blue-100 rounded border border-gray-200">{it.s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {showSmartArtMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[280px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2">SmartArt 레이아웃</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => insertSmartArt('list')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">📋 목록형</button>
                      <button type="button" onClick={() => insertSmartArt('process')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">➡ 프로세스형</button>
                      <button type="button" onClick={() => insertSmartArt('cycle')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">🔄 주기형</button>
                      <button type="button" onClick={() => insertSmartArt('hierarchy')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">🏢 계층 구조형</button>
                      <button type="button" onClick={() => insertSmartArt('relation')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">⚛ 관계형</button>
                      <button type="button" onClick={() => insertSmartArt('pyramid')} className="px-2 py-3 text-xs border border-gray-200 rounded hover:bg-blue-50 text-left">△ 피라미드형</button>
                    </div>
                  </div>
                )}
                {showWordArtMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[300px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2">WordArt 스타일</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['gradient', 'outline', 'shadow', 'neon', 'emboss', 'rainbow'].map(s => (
                        <button key={s} type="button" onClick={() => insertWordArt(s)} className={`px-2 py-3 text-base font-bold wordart-sample wordart-${s} border border-gray-200 rounded hover:bg-blue-50`}>가나</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 기호 / 수식 / 페이지 나누기 */}
              <div className="word-group flex flex-col items-center px-3 relative">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={() => setShowSymbolPicker(!showSymbolPicker)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="기호">
                    <span className="text-2xl">Ω</span>
                    <span className="text-[10px] text-gray-700">기호</span>
                  </button>
                  <button type="button" onClick={() => setShowEquationDialog(true)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="수식">
                    <span className="text-2xl">∑</span>
                    <span className="text-[10px] text-gray-700">수식</span>
                  </button>
                  <button type="button" onClick={insertPageBreakNow} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="페이지 나누기 (Ctrl+Enter)">
                    <span className="text-2xl">⇅</span>
                    <span className="text-[10px] text-gray-700">페이지 나눔</span>
                  </button>
                </div>
                <div className="word-group-label">기호</div>
                {showSymbolPicker && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-3 w-[380px] max-h-[260px] overflow-auto">
                    <div className="text-xs font-semibold text-gray-700 mb-2">기호 삽입</div>
                    <div className="grid grid-cols-10 gap-1">
                      {['©','®','™','§','¶','†','‡','•','·','…','«','»','€','£','¥','¢','°','±','×','÷','≠','≤','≥','≈','∞','∑','∏','√','∫','∂','∇','∈','∉','∋','⊂','⊃','∪','∩','∅','Α','Β','Γ','Δ','Ε','Ζ','Η','Θ','Ι','Κ','Λ','Μ','Ν','Ξ','Ο','Π','Ρ','Σ','Τ','Υ','Φ','Χ','Ψ','Ω','α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ψ','ω','←','↑','→','↓','↔','↕','⇐','⇑','⇒','⇓','⇔','★','☆','♠','♣','♥','♦','♪','♫','☎','✓','✗','✉','❤','✦'].map((s, i) => (
                        <button key={i} type="button" onClick={() => insertSymbol(s)} className="p-1 text-base hover:bg-blue-100 rounded border border-gray-100">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== 레이아웃 탭 ========== */}
          {activeTab === 'layout' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 페이지 설정 */}
              <div className="word-group flex flex-col items-center px-3 relative">
                <div className="flex items-start gap-2 flex-1">
                  <button type="button" onClick={() => setShowMarginsMenu(!showMarginsMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="여백">
                    <span className="text-2xl">▤</span>
                    <span className="text-[10px] text-gray-700">여백</span>
                  </button>
                  <button type="button" onClick={() => setShowOrientationMenu(!showOrientationMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="용지 방향">
                    <span className="text-2xl">{pageOrientation === 'portrait' ? '▯' : '▭'}</span>
                    <span className="text-[10px] text-gray-700">방향</span>
                  </button>
                  <button type="button" onClick={() => setShowSizeMenu(!showSizeMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="용지 크기">
                    <span className="text-2xl">📄</span>
                    <span className="text-[10px] text-gray-700">크기</span>
                  </button>
                  <button type="button" onClick={() => setShowColumnsMenu(!showColumnsMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="단 나누기">
                    <span className="text-2xl">▥</span>
                    <span className="text-[10px] text-gray-700">단</span>
                  </button>
                  <button type="button" onClick={() => setShowBreaksMenu(!showBreaksMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="나누기">
                    <span className="text-2xl">⇥</span>
                    <span className="text-[10px] text-gray-700">나누기</span>
                  </button>
                </div>
                <div className="word-group-label">페이지 설정</div>

                {showMarginsMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[260px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2 px-1">여백</div>
                    <button type="button" onClick={() => applyMarginsPreset('normal')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">보통 (위/아래/좌/우 2.54cm)</button>
                    <button type="button" onClick={() => applyMarginsPreset('narrow')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">좁게 (1.27cm)</button>
                    <button type="button" onClick={() => applyMarginsPreset('moderate')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">중간 (2.54 / 1.91cm)</button>
                    <button type="button" onClick={() => applyMarginsPreset('wide')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">넓게 (2.54 / 5.08cm)</button>
                    <button type="button" onClick={() => applyMarginsPreset('mirrored')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">대칭 (안쪽 3.18cm)</button>
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button type="button" onClick={() => { setShowMarginsMenu(false); setShowCustomMargins(true) }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">사용자 지정 여백...</button>
                    </div>
                  </div>
                )}

                {showOrientationMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[180px]">
                    <button type="button" onClick={() => { setPageOrientation('portrait'); setShowOrientationMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageOrientation === 'portrait' ? 'bg-blue-100' : ''}`}>▯ 세로</button>
                    <button type="button" onClick={() => { setPageOrientation('landscape'); setShowOrientationMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageOrientation === 'landscape' ? 'bg-blue-100' : ''}`}>▭ 가로</button>
                  </div>
                )}

                {showSizeMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[220px]">
                    {(['A4','A3','A5','Letter','Legal'] as const).map(sz => (
                      <button key={sz} type="button" onClick={() => { setPageSize(sz); setShowSizeMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageSize === sz ? 'bg-blue-100' : ''}`}>
                        {sz} ({pageSizeDims[sz][0]} × {pageSizeDims[sz][1]} cm)
                      </button>
                    ))}
                  </div>
                )}

                {showColumnsMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[180px]">
                    <button type="button" onClick={() => { setPageColumns(1); setShowColumnsMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageColumns === 1 ? 'bg-blue-100' : ''}`}>▯ 하나</button>
                    <button type="button" onClick={() => { setPageColumns(2); setShowColumnsMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageColumns === 2 ? 'bg-blue-100' : ''}`}>▯▯ 둘</button>
                    <button type="button" onClick={() => { setPageColumns(3); setShowColumnsMenu(false) }} className={`w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded ${pageColumns === 3 ? 'bg-blue-100' : ''}`}>▯▯▯ 셋</button>
                  </div>
                )}

                {showBreaksMenu && (
                  <div className="absolute top-full left-0 z-30 bg-white border border-gray-300 rounded shadow-lg p-2 w-[220px]">
                    <button type="button" onClick={insertPageBreakNow} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">⇅ 페이지 나누기</button>
                    <button type="button" onClick={insertColumnBreakNow} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">▥ 단 나누기</button>
                    <button type="button" onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowBreaksMenu(false) }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-100 rounded">― 구분선</button>
                  </div>
                )}
              </div>

              {/* 단락 - 들여쓰기/간격 */}
              <div className="word-group flex flex-col items-center px-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-1 text-[11px] text-gray-700">
                  <label className="flex items-center gap-1">왼쪽:
                    <input type="number" min="0" max="480" step="8" defaultValue="0" onChange={(e) => setParaIndentLeft(Number(e.target.value))} className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs" />
                    <span className="text-[9px]">px</span>
                  </label>
                  <label className="flex items-center gap-1">오른쪽:
                    <input type="number" min="0" max="480" step="8" defaultValue="0" onChange={(e) => setParaIndentRight(Number(e.target.value))} className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs" />
                    <span className="text-[9px]">px</span>
                  </label>
                  <label className="flex items-center gap-1">단락 앞:
                    <input type="number" min="0" max="96" step="2" defaultValue="0" onChange={(e) => setParaSpaceBefore(Number(e.target.value))} className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs" />
                    <span className="text-[9px]">px</span>
                  </label>
                  <label className="flex items-center gap-1">단락 뒤:
                    <input type="number" min="0" max="96" step="2" defaultValue="0" onChange={(e) => setParaSpaceAfter(Number(e.target.value))} className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs" />
                    <span className="text-[9px]">px</span>
                  </label>
                </div>
                <div className="word-group-label">단락</div>
              </div>

              {/* 현재 설정 표시 */}
              <div className="word-group flex flex-col items-center px-3">
                <div className="flex flex-col gap-1 flex-1 text-[11px] text-gray-600">
                  <div>용지: <b>{pageSize}</b> {pageOrientation === 'portrait' ? '세로' : '가로'}</div>
                  <div>여백: {pageMargins.top} / {pageMargins.right} / {pageMargins.bottom} / {pageMargins.left}</div>
                  <div>단: {pageColumns}개</div>
                </div>
                <div className="word-group-label">현재 상태</div>
              </div>
            </div>
          )}

          {/* ========== 표 디자인 탭 ========== */}
          {activeTab === 'tableDesign' && (
            <div className="flex items-stretch gap-0 min-h-[92px]">
              {/* 표 스타일 옵션 */}
              <div className="word-group flex flex-col items-center px-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 flex-1">
                  {[
                    { cls: 'header-row', label: '머리글 행' },
                    { cls: 'first-column', label: '첫째 열' },
                    { cls: 'total-row', label: '요약 행' },
                    { cls: 'last-column', label: '마지막 열' },
                    { cls: 'banded-rows', label: '줄무늬 행' },
                    { cls: 'banded-columns', label: '줄무늬 열' },
                  ].map(opt => (
                    <label
                      key={opt.cls}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center gap-1 text-[11px] cursor-pointer hover:bg-blue-50 px-1 rounded"
                    >
                      <input type="checkbox" checked={hasTableClass(opt.cls)} onChange={() => toggleTableClass(opt.cls)} className="w-3 h-3" />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="word-group-label">표 스타일 옵션</div>
              </div>

              {/* 표 스타일 갤러리 */}
              <div className="word-group flex flex-col items-center px-3 min-w-[340px]">
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
                        onMouseDown={(e) => e.preventDefault()}
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
                <div className="word-group-label">표 스타일</div>
              </div>

              {/* 셀 음영 (Shading) */}
              <div className="word-group flex flex-col items-center px-3 relative">
                <div className="flex-1 flex items-start pt-1">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowShadingMenu(!showShadingMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="셀 음영">
                    <span className="text-2xl">🎨</span>
                    <span className="text-[10px] text-gray-700">음영 ▾</span>
                  </button>
                </div>
                <div className="word-group-label">음영</div>
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
                        <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setCellShading(c)} style={{ backgroundColor: c }} className="w-5 h-5 border border-gray-300 hover:scale-110 transition" title={c} />
                      ))}
                    </div>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setCellShading(null)} className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100">음영 없음</button>
                  </div>
                )}
              </div>

              {/* 선 스타일 (Line Style) */}
              <div className="word-group flex flex-col items-center px-2 relative">
                <div className="flex-1 flex flex-col items-stretch gap-1 pt-1 min-w-[110px]">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
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
                          onMouseDown={(e) => e.preventDefault()}
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
                    onMouseDown={(e) => e.preventDefault()}
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
                          onMouseDown={(e) => e.preventDefault()}
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
                <div className="word-group-label">테두리 스타일</div>
              </div>

              {/* 테두리 (Borders) 드롭다운 */}
              <div className="flex flex-col items-center px-3 relative">
                <div className="flex-1 flex items-start pt-1">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowBordersMenu(!showBordersMenu)} className="flex flex-col items-center px-2 py-1 hover:bg-blue-100 rounded" title="테두리">
                    <span className="text-2xl">⊞</span>
                    <span className="text-[10px] text-gray-700">테두리 ▾</span>
                  </button>
                </div>
                <div className="word-group-label">테두리</div>
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
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyBorderToSelection(b.mode as any)}
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
              <div className="word-group flex flex-col items-center px-3">
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
                <div className="word-group-label">삭제</div>
              </div>

              {/* 행 및 열 */}
              <div className="word-group flex flex-col items-center px-3">
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
                <div className="word-group-label">행 및 열</div>
              </div>

              {/* 병합 */}
              <div className="word-group flex flex-col items-center px-3">
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
                <div className="word-group-label">병합</div>
              </div>

              {/* 머리글 토글 */}
              <div className="word-group flex flex-col items-center px-3">
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
                <div className="word-group-label">머리글</div>
              </div>

              {/* 맞춤 */}
              <div className="word-group flex flex-col items-center px-3">
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
                <div className="word-group-label">맞춤</div>
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

      {/* === 하이퍼링크 다이얼로그 === */}
      {showHyperlinkDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowHyperlinkDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-[460px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-gray-800 mb-3">하이퍼링크 삽입</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">표시할 텍스트</label>
                <input type="text" value={hyperlinkText} onChange={(e) => setHyperlinkText(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="예: 자세히 보기" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">주소 (URL)</label>
                <input type="url" value={hyperlinkHref} onChange={(e) => setHyperlinkHref(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="https://..." autoFocus />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={hyperlinkNewTab} onChange={(e) => setHyperlinkNewTab(e.target.checked)} />
                새 탭에서 열기
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowHyperlinkDialog(false)} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button>
              <button type="button" onClick={applyHyperlink} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* === 책갈피 다이얼로그 === */}
      {showBookmarkDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowBookmarkDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-[420px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-gray-800 mb-3">책갈피 삽입</div>
            <input type="text" value={bookmarkInput} onChange={(e) => setBookmarkInput(e.target.value.replace(/\s+/g, '-'))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="책갈피 이름 (공백 없이)" autoFocus />
            <div className="text-xs text-gray-500 mt-2">이 위치로 이동할 수 있는 앵커가 만들어집니다. 하이퍼링크 주소에 #책갈피이름 을 쓰면 연결됩니다.</div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowBookmarkDialog(false)} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button>
              <button type="button" onClick={insertBookmarkNow} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">삽입</button>
            </div>
          </div>
        </div>
      )}

      {/* === 사용자 지정 여백 다이얼로그 === */}
      {showCustomMargins && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCustomMargins(false)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-[480px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-gray-800 mb-3">사용자 지정 여백</div>
            <div className="grid grid-cols-2 gap-3">
              {(['top','right','bottom','left'] as const).map(side => (
                <label key={side} className="text-xs text-gray-600 block">
                  {side === 'top' ? '위' : side === 'right' ? '오른쪽' : side === 'bottom' ? '아래' : '왼쪽'}
                  <input
                    type="text"
                    value={pageMargins[side]}
                    onChange={(e) => setPageMargins({ ...pageMargins, [side]: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm mt-1"
                    placeholder="예: 2.54cm"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowCustomMargins(false)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* === 수식(LaTeX) 다이얼로그 === */}
      {showEquationDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowEquationDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-[560px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-gray-800 mb-3">수식 삽입 (LaTeX)</div>
            <textarea value={equationLatex} onChange={(e) => setEquationLatex(e.target.value)} className="w-full h-28 px-2 py-1.5 border border-gray-300 rounded text-sm font-mono" placeholder="예: E = mc^2  또는  \frac{a}{b}" autoFocus />
            <div className="text-xs text-gray-500 mt-2">미리보기:</div>
            {equationLatex && (
              <div className="mt-1 p-2 border border-gray-200 rounded bg-gray-50 flex items-center justify-center min-h-[60px]">
                <img alt="equation preview" src={`https://latex.codecogs.com/svg.image?${encodeURIComponent(equationLatex)}`} />
              </div>
            )}
            <div className="flex justify-between gap-2 mt-4">
              <div className="flex gap-1 flex-wrap">
                {['\\frac{a}{b}','\\sqrt{x}','\\sum_{i=1}^{n}','\\int_a^b','x^2','\\alpha','\\beta','\\pi'].map(ex => (
                  <button key={ex} type="button" onClick={() => setEquationLatex(equationLatex + ex)} className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-blue-100 rounded border border-gray-200">{ex}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEquationDialog(false)} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">취소</button>
                <button type="button" onClick={() => { if (!equationLatex.trim()) return; const src = `https://latex.codecogs.com/svg.image?${encodeURIComponent(equationLatex)}`; editor?.chain().focus().setImage({ src }).run(); setEquationLatex(''); setShowEquationDialog(false) }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">삽입</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에디터 (A4 페이지 레이아웃 + 줌 + 페이지 구분) */}
      <div className={isFullscreen ? 'h-[calc(100vh-240px)] overflow-auto editor-canvas' : 'editor-canvas'}>
        <div
          className="editor-zoom-wrapper"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            width: `${100 * 100 / zoomLevel}%`,
          }}
        >
        <div
          className="mx-auto bg-white shadow-lg relative editor-page"
          style={{
            width: getPageDims().width + 'cm',
            maxWidth: 'none',
            minHeight: getPageDims().height + 'cm',
            padding: pageMargins.top + ' ' + pageMargins.right + ' ' + pageMargins.bottom + ' ' + pageMargins.left,
            boxSizing: 'border-box',
            columnCount: pageColumns,
            columnGap: '1cm',
            backgroundImage: totalPages > 1 ? `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${getPageDims().height}cm - ${pageMargins.top} - ${pageMargins.bottom} - 1px), #d1d5db calc(${getPageDims().height}cm - ${pageMargins.top} - ${pageMargins.bottom} - 1px), #d1d5db calc(${getPageDims().height}cm - ${pageMargins.top} - ${pageMargins.bottom}))` : undefined,
            backgroundPosition: `0 0`,
            backgroundSize: `100% calc(${getPageDims().height}cm - ${pageMargins.top} - ${pageMargins.bottom})`,
          }}
        >
          <EditorContent editor={editor} />
          {/* 이미지 선택 시 플로팅 툴바 */}
          {showImageToolbar && isImageSelected && (
            <div
              className="absolute z-30 flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg px-2 py-1"
              style={{ top: `${imageToolbarPos.top}px`, left: `${imageToolbarPos.left}px`, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <button type="button" onClick={() => setImageSize(25)} className="px-1.5 py-0.5 text-[10px] hover:bg-blue-100 rounded" title="25%">25%</button>
              <button type="button" onClick={() => setImageSize(50)} className="px-1.5 py-0.5 text-[10px] hover:bg-blue-100 rounded" title="50%">50%</button>
              <button type="button" onClick={() => setImageSize(75)} className="px-1.5 py-0.5 text-[10px] hover:bg-blue-100 rounded" title="75%">75%</button>
              <button type="button" onClick={() => setImageSize(100)} className="px-1.5 py-0.5 text-[10px] hover:bg-blue-100 rounded" title="100%">100%</button>
              <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
              <button type="button" onClick={() => setImageAlign('left')} className="px-1.5 py-0.5 text-xs hover:bg-blue-100 rounded" title="왼쪽 정렬">⫷</button>
              <button type="button" onClick={() => setImageAlign('center')} className="px-1.5 py-0.5 text-xs hover:bg-blue-100 rounded" title="가운데">≡</button>
              <button type="button" onClick={() => setImageAlign('right')} className="px-1.5 py-0.5 text-xs hover:bg-blue-100 rounded" title="오른쪽 정렬">⫸</button>
              <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
              <button type="button" onClick={() => replaceImageRef.current?.click()} className="px-1.5 py-0.5 text-[10px] hover:bg-blue-100 rounded" title="이미지 교체">교체</button>
              <button type="button" onClick={deleteSelectedImage} className="px-1.5 py-0.5 text-[10px] hover:bg-red-100 text-red-600 rounded" title="삭제">삭제</button>
              <input ref={replaceImageRef} type="file" accept="image/*" onChange={handleReplaceImage} className="hidden" />
            </div>
          )}
        </div>
        </div>
      </div>

      {/* === Word 스타일 하단 상태바 (Status Bar) === */}
      <div className="word-statusbar flex items-center gap-3 px-4 py-1 text-[11px] border-t">
        <div className="flex items-center gap-1">
          <span className="font-semibold">📄 페이지</span>
          <span className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-800 font-medium tabular-nums">{currentPage} / {totalPages}</span>
        </div>
        <div className="word-statusbar-sep"></div>
        <div className="flex items-center gap-1">
          <span>단어: <b className="tabular-nums">{wordCount.toLocaleString()}</b></span>
        </div>
        <div className="word-statusbar-sep"></div>
        <div className="flex items-center gap-1">
          <span>글자: <b className="tabular-nums">{charCount.toLocaleString()}</b></span>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">💡 Ctrl+Z/B/I/U, Ctrl+K 링크</span>
        </div>
        <div className="word-statusbar-sep"></div>
        {/* Zoom 컨트롤 */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoomLevel(Math.max(25, zoomLevel - 10))} className="w-6 h-5 flex items-center justify-center hover:bg-blue-200 rounded text-sm font-bold" title="축소">−</button>
          <input
            type="range"
            min="25"
            max="300"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-32 h-1 accent-blue-600"
            title="확대/축소"
          />
          <button type="button" onClick={() => setZoomLevel(Math.min(300, zoomLevel + 10))} className="w-6 h-5 flex items-center justify-center hover:bg-blue-200 rounded text-sm font-bold" title="확대">+</button>
          <button type="button" onClick={() => setZoomLevel(100)} className="min-w-[48px] px-2 h-5 text-[11px] hover:bg-blue-200 rounded tabular-nums font-semibold text-gray-800" title="100%로 복원">{zoomLevel}%</button>
        </div>
      </div>

      {/* 차트 삽입 다이얼로그 */}
      <ChartDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        onInsert={handleChartInsert}
        supabaseUpload={uploadImageAndGetUrl}
      />

      {/* CSS */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          font-family: 'Calibri', '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1f2937;
        }

        /* ============================================
           MS Word 365 정확 재현 - 전체 셸
           ============================================ */
        .word-app {
          background: #f3f2f1;
          font-family: 'Segoe UI', 'Malgun Gothic', '맑은 고딕', -apple-system, sans-serif;
          font-size: 12px;
          color: #242424;
        }

        /* === Title Bar (Word 블루) === */
        .word-titlebar {
          background: #2b579a;
          color: #fff;
          border-bottom: 1px solid #1e4178;
        }
        .word-qat-btn {
          width: 24px; height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 3px;
          transition: background 0.08s;
        }
        .word-qat-btn:hover:not(:disabled) { background: rgba(255,255,255,0.18); }
        .word-qat-btn:disabled { opacity: 0.4; }
        .word-titlebar-btn {
          width: 28px; height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-radius: 2px;
          transition: background 0.08s;
        }
        .word-titlebar-btn:hover { background: rgba(255,255,255,0.15); }

        /* === Tab Bar === */
        .word-tabbar {
          background: #f3f2f1;
          border-bottom: 1px solid #e1dfdd;
          padding-left: 0;
        }
        .word-file-tab {
          background: #2b579a;
          color: #fff;
          padding: 7px 18px;
          font-size: 12px;
          font-weight: 400;
          border-top-right-radius: 0;
          transition: background 0.08s;
        }
        .word-file-tab:hover { background: #1e4178; }
        .word-tab {
          position: relative;
          padding: 7px 14px;
          font-size: 12px;
          color: #242424;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: background 0.08s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.1;
        }
        .word-tab:hover:not(.active) { background: #e5e4e2; }
        .word-tab.active {
          background: #ffffff;
          border-bottom: 2px solid #2b579a;
          color: #2b579a;
          font-weight: 500;
        }
        .word-tab.contextual { color: #c05100; }
        .word-tab.contextual.active { background: #fff4ec; border-bottom-color: #c05100; color: #c05100; }
        .word-tab-context {
          font-size: 9px;
          opacity: 0.7;
          margin-bottom: -2px;
          white-space: nowrap;
        }
        .word-tab-label { font-size: 12px; }

        /* === 리본 본문 === */
        .word-ribbon-body {
          background: #ffffff;
          border-bottom: 1px solid #d2d0ce;
          min-height: 94px;
        }

        /* === 그룹 (Ribbon Group) === */
        .word-group {
          padding-top: 2px;
          padding-bottom: 0;
          position: relative;
          border-right: 1px solid #e1dfdd;
        }
        .word-group:last-child { border-right: none; }
        .word-group-label {
          font-size: 10px;
          color: #605e5c;
          width: 100%;
          text-align: center;
          padding-top: 2px;
          margin-top: 2px;
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        /* === 리본 버튼 hover/active === */
        .word-ribbon-body button:hover:not(:disabled):not([class*="bg-blue-"]) {
          background-color: #e7e6e5 !important;
          border-radius: 2px;
        }
        .word-ribbon-body button[class*="bg-blue-200"] {
          background-color: #c7e0f4 !important;
          box-shadow: inset 0 0 0 1px #0078d4;
          border-radius: 2px;
        }

        /* === 하단 상태바 (Word 블루) === */
        .word-statusbar {
          background: #2b579a;
          color: #ffffff;
          border-color: #1e4178;
        }
        .word-statusbar b { color: #ffffff; font-weight: 600; }
        .word-statusbar-sep {
          width: 1px; height: 14px;
          background: rgba(255,255,255,0.3);
        }
        .word-statusbar button {
          color: #ffffff;
        }
        .word-statusbar button:hover {
          background: rgba(255,255,255,0.18) !important;
        }
        .word-statusbar span.bg-white,
        .word-statusbar .bg-white {
          background: rgba(255,255,255,0.18) !important;
          color: #ffffff !important;
          border-color: rgba(255,255,255,0.35) !important;
        }
        .word-statusbar input[type="range"] { accent-color: #ffffff; }

        /* === 인풋/셀렉트 스타일 === */
        .word-ribbon-body select,
        .word-ribbon-body input[type="text"],
        .word-ribbon-body input[type="number"],
        .word-ribbon-body input[type="url"] {
          background: #ffffff;
          border: 1px solid #8a8886;
          border-radius: 2px;
          font-size: 11px;
          color: #242424;
          transition: border-color 0.08s, box-shadow 0.08s;
        }
        .word-ribbon-body select:hover,
        .word-ribbon-body input:hover { border-color: #323130; }
        .word-ribbon-body select:focus,
        .word-ribbon-body input:focus {
          border-color: #0078d4;
          box-shadow: 0 0 0 1px #0078d4;
          outline: none;
        }


          font-size: 11pt;
          line-height: 1.5;
          color: #1f2937;
        }

        /* === Word 스타일 캔버스 === */
        .editor-canvas {
          background: #f3f2f1;
          padding: 24px 4px 32px 4px;
          overflow-x: auto;
          overflow-y: auto;
        }
        .editor-page {
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
          border: 1px solid #d2d0ce;
        }
        .editor-page.editor-page { background: #ffffff; }

        .editor-zoom-wrapper {
          transition: transform 0.15s ease-out;
          margin: 0 auto;
        }
        .editor-page {
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
          position: relative;
        }
        .editor-page::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px dashed transparent;
          border-radius: 0;
        }

        /* Font dropdown options: preview each font in its actual typeface */
        .font-select option { padding: 4px 8px; }

        /* Word-like scrollbar */
        .editor-canvas::-webkit-scrollbar { width: 14px; height: 14px; }
        .editor-canvas::-webkit-scrollbar-track { background: #e5e7eb; }
        .editor-canvas::-webkit-scrollbar-thumb { background: #9ca3af; border: 3px solid #e5e7eb; border-radius: 7px; }
        .editor-canvas::-webkit-scrollbar-thumb:hover { background: #6b7280; }

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

        /* === SmartArt === */
        .smartart { display: flex; gap: 8px; align-items: center; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 8px 0; flex-wrap: wrap; }
        .smartart .sa-box { padding: 8px 14px; background: linear-gradient(180deg, #3b82f6, #1d4ed8); color: #fff; border-radius: 4px; font-weight: 600; font-size: 13px; min-width: 80px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
        .smartart .sa-arrow { color: #64748b; font-size: 18px; font-weight: bold; }
        .smartart-hier { flex-direction: column; gap: 12px; align-items: center; }
        .smartart-hier .sa-top { padding: 10px 18px; background: linear-gradient(180deg, #0ea5e9, #0369a1); color: #fff; border-radius: 4px; font-weight: 700; }
        .smartart-hier .sa-row { display: flex; gap: 12px; }
        .smartart-cycle { justify-content: center; }
        .smartart-cycle .sa-cbox { padding: 10px 14px; background: linear-gradient(180deg, #10b981, #047857); color: #fff; border-radius: 999px; font-weight: 600; font-size: 12px; }
        .smartart-cycle .sa-carrow { color: #047857; font-size: 20px; }
        .smartart-list { flex-direction: column; align-items: stretch; gap: 6px; }
        .smartart-list .sa-litem { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border-left: 4px solid #6366f1; border-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
        .smartart-list .sa-idx { width: 28px; height: 28px; border-radius: 50%; background: #6366f1; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
        .smartart-rel { justify-content: center; }
        .smartart-rel .sa-rbox { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; margin: 0 -6px; opacity: .92; }
        .smartart-pyr { flex-direction: column; align-items: center; gap: 3px; }
        .smartart-pyr .sa-pyr { color: #fff; padding: 8px 14px; font-weight: 600; font-size: 12px; }
        .smartart-pyr .sa-pyr1 { background: linear-gradient(180deg,#7c3aed,#5b21b6); width: 40%; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
        .smartart-pyr .sa-pyr2 { background: linear-gradient(180deg,#a78bfa,#7c3aed); width: 60%; clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%); }
        .smartart-pyr .sa-pyr3 { background: linear-gradient(180deg,#c4b5fd,#a78bfa); width: 80%; clip-path: polygon(10% 0, 90% 0, 100% 100%, 0 100%); }

        /* === WordArt === */
        .wordart { display: inline-block; font-weight: 900; padding: 0 2px; }
        .wordart-gradient { background: linear-gradient(90deg, #2563eb, #ec4899, #f59e0b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-size: 1.8em; }
        .wordart-outline { color: transparent; -webkit-text-stroke: 1.5px #1f2937; font-size: 1.8em; }
        .wordart-shadow { color: #1f2937; text-shadow: 3px 3px 0 #9ca3af, 6px 6px 0 #d1d5db; font-size: 1.8em; }
        .wordart-neon { color: #fff; text-shadow: 0 0 4px #22d3ee, 0 0 8px #06b6d4, 0 0 12px #0891b2; background: #0f172a; padding: 2px 8px; border-radius: 4px; font-size: 1.8em; }
        .wordart-emboss { color: #e5e7eb; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #6b7280; font-size: 1.8em; }
        .wordart-rainbow { background: linear-gradient(90deg, #ef4444, #f59e0b, #eab308, #10b981, #3b82f6, #8b5cf6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; font-size: 1.8em; font-style: italic; }
        .wordart-sample { font-size: 1em !important; }

        /* === Page Number / Bookmark === */
        .page-number { display: inline-block; padding: 0 4px; color: #2563eb; font-variant-numeric: tabular-nums; }
        .bookmark { display: inline-block; color: #f59e0b; text-decoration: none; margin: 0 2px; }
        .bookmark::before { content: '🔖'; font-size: 0.85em; }

        /* === Column break / Text Box === */
        .column-break { break-after: column; page-break-after: always; height: 0; display: block; }
        .text-box { display: inline-block; padding: 8px 12px; border: 2px dashed #3b82f6; border-radius: 4px; background: #eff6ff; margin: 4px; min-width: 120px; min-height: 40px; }

        /* === List styles === */
        .ProseMirror ol[data-list-style="decimal"] { list-style-type: decimal; }
        .ProseMirror ol[data-list-style="lower-alpha"] { list-style-type: lower-alpha; }
        .ProseMirror ol[data-list-style="lower-roman"] { list-style-type: lower-roman; }
            `}</style>
    </div>
  )
}