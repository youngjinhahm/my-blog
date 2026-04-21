'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Chart as ChartJS, registerables } from 'chart.js'

let chartRegistered = false
function ensureChartRegistered() {
  if (!chartRegistered && typeof window !== 'undefined') {
    ChartJS.register(...registerables)
    chartRegistered = true
  }
}

interface ChartDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (imageUrl: string) => void
  supabaseUpload: (file: File) => Promise<string | null>
}

type ChartType = 'column' | 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'combo'
type ChartSubType =
  | 'clustered' | 'stacked' | '100-stacked'
  | 'line' | 'line-markers' | 'smooth-line'
  | 'pie' | 'doughnut'
  | 'area' | 'stacked-area'
  | 'scatter' | 'scatter-lines'
  | 'radar' | 'filled-radar'
  | 'column-line'

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: (number | null)[] | any[]
    borderColor?: string
    backgroundColor?: string | string[]
    fill?: boolean
    type?: string
  }[]
}

const CHART_TYPES: {
  type: ChartType
  label: string
  subtypes: { value: ChartSubType; label: string }[]
}[] = [
  {
    type: 'column',
    label: '세로 막대',
    subtypes: [
      { value: 'clustered', label: '클러스터형' },
      { value: 'stacked', label: '누적형' },
      { value: '100-stacked', label: '백분율 누적형' },
    ],
  },
  {
    type: 'bar',
    label: '가로 막대',
    subtypes: [
      { value: 'clustered', label: '클러스터형' },
      { value: 'stacked', label: '누적형' },
      { value: '100-stacked', label: '백분율 누적형' },
    ],
  },
  {
    type: 'line',
    label: '선',
    subtypes: [
      { value: 'line', label: '선' },
      { value: 'line-markers', label: '표식이 있는 선' },
      { value: 'smooth-line', label: '매끄러운 선' },
    ],
  },
  {
    type: 'pie',
    label: '원형',
    subtypes: [
      { value: 'pie', label: '원형' },
      { value: 'doughnut', label: '도넛형' },
    ],
  },
  {
    type: 'area',
    label: '영역',
    subtypes: [
      { value: 'area', label: '영역' },
      { value: 'stacked-area', label: '누적 영역' },
    ],
  },
  {
    type: 'scatter',
    label: '분산형',
    subtypes: [
      { value: 'scatter', label: '분산형' },
      { value: 'scatter-lines', label: '선이 있는 분산형' },
    ],
  },
  {
    type: 'radar',
    label: '레이더',
    subtypes: [
      { value: 'radar', label: '레이더' },
      { value: 'filled-radar', label: '채워진 레이더' },
    ],
  },
  {
    type: 'combo',
    label: '혼합',
    subtypes: [{ value: 'column-line', label: '세로 막대 + 선' }],
  },
]

const COLOR_THEMES: Record<string, string[]> = {
  colorful1: ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'],
  colorful2: ['#264478', '#9DC3E6', '#F7931D', '#70AD47', '#FFC000', '#5B9BD5'],
  colorful3: ['#636B75', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'],
  monoBlue: ['#1F4E79', '#2E75B6', '#5B9BD5', '#9DC3E6', '#BDD7EE', '#DEEBF7'],
  monoOrange: ['#843C0C', '#C55A11', '#ED7D31', '#F4B183', '#F8CBAD', '#FBE5D6'],
  monoGreen: ['#375623', '#548235', '#70AD47', '#A9D18E', '#C5E0B4', '#E2EFDA'],
}

const DEFAULT_DATA: Record<string, ChartData> = {
  column: {
    labels: ['1월', '2월', '3월', '4월', '5월'],
    datasets: [
      { label: '시리즈 1', data: [30, 50, 45, 60, 40], backgroundColor: '#4472C4' },
      { label: '시리즈 2', data: [25, 35, 30, 45, 35], backgroundColor: '#ED7D31' },
    ],
  },
  bar: {
    labels: ['항목 A', '항목 B', '항목 C', '항목 D'],
    datasets: [
      { label: '데이터 1', data: [45, 38, 52, 41], backgroundColor: '#4472C4' },
      { label: '데이터 2', data: [35, 48, 38, 55], backgroundColor: '#ED7D31' },
    ],
  },
  line: {
    labels: ['1월', '2월', '3월', '4월', '5월'],
    datasets: [
      {
        label: '트렌드 A',
        data: [20, 35, 30, 45, 50],
        borderColor: '#4472C4',
        backgroundColor: 'rgba(68, 114, 196, 0.1)',
        fill: false,
      },
      {
        label: '트렌드 B',
        data: [25, 30, 40, 35, 45],
        borderColor: '#ED7D31',
        backgroundColor: 'rgba(237, 125, 49, 0.1)',
        fill: false,
      },
    ],
  },
  pie: {
    labels: ['카테고리 A', '카테고리 B', '카테고리 C', '카테고리 D'],
    datasets: [
      {
        label: '비율',
        data: [30, 25, 20, 25],
        backgroundColor: ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000'],
      },
    ],
  },
  area: {
    labels: ['1월', '2월', '3월', '4월', '5월'],
    datasets: [
      {
        label: '영역 A',
        data: [20, 35, 30, 45, 50],
        borderColor: '#4472C4',
        backgroundColor: 'rgba(68, 114, 196, 0.3)',
        fill: true,
      },
      {
        label: '영역 B',
        data: [25, 30, 40, 35, 45],
        borderColor: '#ED7D31',
        backgroundColor: 'rgba(237, 125, 49, 0.3)',
        fill: true,
      },
    ],
  },
  scatter: {
    labels: ['X축'],
    datasets: [
      {
        label: '포인트 A',
        data: [
          { x: 10, y: 20 },
          { x: 15, y: 35 },
          { x: 20, y: 30 },
          { x: 25, y: 45 },
        ] as any,
        backgroundColor: '#4472C4',
      },
    ],
  },
  radar: {
    labels: ['범주 A', '범주 B', '범주 C', '범주 D', '범주 E'],
    datasets: [
      {
        label: '데이터 세트',
        data: [65, 59, 90, 81, 56],
        borderColor: '#4472C4',
        backgroundColor: 'rgba(68, 114, 196, 0.2)',
      },
    ],
  },
  combo: {
    labels: ['1월', '2월', '3월', '4월', '5월'],
    datasets: [
      {
        label: '막대',
        data: [30, 50, 45, 60, 40],
        backgroundColor: '#4472C4',
        type: 'bar' as any,
      },
      {
        label: '선',
        data: [25, 35, 30, 45, 35],
        borderColor: '#ED7D31',
        backgroundColor: 'rgba(237, 125, 49, 0.1)',
        fill: false,
        type: 'line' as any,
      },
    ],
  },
}

export default function ChartDialog({
  isOpen,
  onClose,
  onInsert,
  supabaseUpload,
}: ChartDialogProps) {
  const [chartType, setChartType] = useState<ChartType>('column')
  const [chartSubType, setChartSubType] = useState<ChartSubType>('clustered')
  const [data, setData] = useState<ChartData>(DEFAULT_DATA.column)
  const [chartTitle, setChartTitle] = useState('차트 제목')
  const [showTitle, setShowTitle] = useState(true)
  const [legendPosition, setLegendPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>('bottom')
  const [showDataLabels, setShowDataLabels] = useState(false)
  const [showGridlines, setShowGridlines] = useState(true)
  const [colorTheme, setColorTheme] = useState('colorful1')
  const [xAxisTitle, setXAxisTitle] = useState('X축')
  const [yAxisTitle, setYAxisTitle] = useState('Y축')
  const [showXAxisTitle, setShowXAxisTitle] = useState(false)
  const [showYAxisTitle, setShowYAxisTitle] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  const currentChartConfig = CHART_TYPES.find(t => t.type === chartType)
  const defaultSubType = currentChartConfig?.subtypes[0].value || 'clustered'

  useEffect(() => {
    setData(JSON.parse(JSON.stringify(DEFAULT_DATA[chartType] || DEFAULT_DATA.column)))
    setChartSubType(defaultSubType as ChartSubType)
  }, [chartType, defaultSubType])

  // 색상 테마 적용
  const applyColorTheme = (themeKey: string, chartData: ChartData): ChartData => {
    const colors = COLOR_THEMES[themeKey]
    if (!colors) return chartData
    const newData = JSON.parse(JSON.stringify(chartData))
    newData.datasets.forEach((ds: any, idx: number) => {
      const color = colors[idx % colors.length]
      if (newData.datasets.length === 1 && chartType === 'pie') {
        ds.backgroundColor = colors
      } else {
        ds.backgroundColor = color
        ds.borderColor = color
      }
    })
    return newData
  }

  // 차트 렌더링
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return
    ensureChartRegistered()

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // 기존 차트 파괴
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const themeData = applyColorTheme(colorTheme, data)

    // Chart.js 타입 매핑 (column→bar, bar→bar+indexAxis:y, area→line)
    const chartJsType = (() => {
      if (chartType === 'column' || chartType === 'combo' || chartType === 'bar') return 'bar'
      if (chartType === 'area') return 'line'
      return chartType
    })()

    // 차트 타입별 설정
    let chartConfig: any = {
      type: chartJsType,
      data: { ...themeData },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: showTitle,
            text: chartTitle,
            font: { size: 14, weight: 'bold' },
            padding: { bottom: 10 },
          },
          legend: {
            display: legendPosition !== 'none',
            position: legendPosition !== 'none' ? legendPosition : undefined,
            labels: {
              usePointStyle: true,
              padding: 15,
            },
          },
          filler: {
            propagate: true,
          },
        },
      },
    }

    // 차트별 맞춤 옵션
    if (chartType === 'column' || chartType === 'bar') {
      // 가로 막대 = indexAxis 'y'
      if (chartType === 'bar') {
        chartConfig.options.indexAxis = 'y'
      }
      chartConfig.options.scales = {
        x: {
          title: { display: showXAxisTitle, text: xAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
        y: {
          title: { display: showYAxisTitle, text: yAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
      }

      if (chartSubType === 'stacked') {
        chartConfig.options.scales.x.stacked = true
        chartConfig.options.scales.y.stacked = true
      } else if (chartSubType === '100-stacked') {
        chartConfig.options.scales.x.stacked = true
        chartConfig.options.scales.y.stacked = 'percent'
      }
    }

    if (chartType === 'line' || chartType === 'area') {
      chartConfig.options.scales = {
        x: {
          title: { display: showXAxisTitle, text: xAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
        y: {
          title: { display: showYAxisTitle, text: yAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
      }

      if (chartSubType === 'line-markers') {
        chartConfig.data.datasets.forEach((ds: any) => {
          ds.pointRadius = 5
          ds.pointHoverRadius = 7
        })
      } else if (chartSubType === 'smooth-line') {
        chartConfig.options.tension = 0.4
      }

      if (chartType === 'area') {
        chartConfig.data.datasets.forEach((ds: any) => {
          ds.fill = true
        })
        if (chartSubType === 'stacked-area') {
          chartConfig.options.scales.y.stacked = true
        }
      }
    }

    if (chartType === 'scatter') {
      chartConfig.options.scales = {
        x: {
          title: { display: showXAxisTitle, text: xAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
        y: {
          title: { display: showYAxisTitle, text: yAxisTitle, font: { weight: 'bold' } },
          grid: { display: showGridlines },
        },
      }
      if (chartSubType === 'scatter-lines') {
        chartConfig.data.datasets.forEach((ds: any) => {
          ds.showLine = true
          ds.borderColor = ds.backgroundColor
          ds.borderWidth = 2
        })
      }
    }

    if (chartType === 'radar') {
      chartConfig.options.scales = {
        r: {
          grid: { display: showGridlines },
        },
      }
      if (chartSubType === 'filled-radar') {
        chartConfig.data.datasets.forEach((ds: any) => {
          ds.fill = true
        })
      }
    }

    if (chartType === 'pie') {
      chartConfig.type = chartSubType === 'doughnut' ? 'doughnut' : 'pie'
      chartConfig.options.plugins.datalabels = {
        display: showDataLabels,
      }
    }

    // 데이터 라벨 설정
    if (showDataLabels && chartType !== 'scatter') {
      chartConfig.options.plugins.datalabels = {
        display: true,
        anchor: 'center',
        align: 'center',
        color: '#000',
      }
    }

    chartRef.current = new ChartJS(ctx, chartConfig)
  }, [isOpen, chartType, chartSubType, data, chartTitle, showTitle, legendPosition, showDataLabels, showGridlines, colorTheme, xAxisTitle, yAxisTitle, showXAxisTitle, showYAxisTitle])

  const handleDataCellChange = (datasetIdx: number, labelIdx: number, value: string) => {
    const newData = JSON.parse(JSON.stringify(data))
    const numValue = value === '' ? null : parseFloat(value) || 0
    newData.datasets[datasetIdx].data[labelIdx] = numValue
    setData(newData)
  }

  const handleLabelChange = (labelIdx: number, value: string) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData.labels[labelIdx] = value
    setData(newData)
  }

  const handleDatasetLabelChange = (datasetIdx: number, value: string) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData.datasets[datasetIdx].label = value
    setData(newData)
  }

  const addRow = () => {
    const newData = JSON.parse(JSON.stringify(data))
    newData.labels.push(`항목 ${newData.labels.length + 1}`)
    newData.datasets.forEach((ds: any) => {
      ds.data.push(0)
    })
    setData(newData)
  }

  const addColumn = () => {
    const newData = JSON.parse(JSON.stringify(data))
    newData.datasets.push({
      label: `시리즈 ${newData.datasets.length + 1}`,
      data: Array(newData.labels.length).fill(0),
      backgroundColor: COLOR_THEMES[colorTheme][newData.datasets.length % 6],
    })
    setData(newData)
  }

  const handleInsert = async () => {
    if (!canvasRef.current || !chartRef.current) return

    setIsUploading(true)
    try {
      // Canvas를 이미지로 변환
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          alert('차트 이미지 변환 실패')
          setIsUploading(false)
          return
        }

        const file = new File([blob], `chart-${Date.now()}.png`, { type: 'image/png' })
        const url = await supabaseUpload(file)

        if (url) {
          onInsert(url)
          onClose()
        } else {
          alert('차트 업로드 실패')
        }
        setIsUploading(false)
      }, 'image/png')
    } catch (error) {
      alert('차트 삽입 중 오류 발생: ' + (error as Error).message)
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">차트 삽입</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: 차트 종류 선택 */}
          <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">차트 종류</h3>
            <div className="space-y-2">
              {CHART_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    setChartType(type)
                    setChartSubType(defaultSubType as ChartSubType)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                    chartType === type
                      ? 'bg-blue-500 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {currentChartConfig && (
              <>
                <h3 className="text-sm font-bold text-gray-900 mt-6 mb-2">
                  {currentChartConfig.label}
                </h3>
                <div className="space-y-1">
                  {currentChartConfig.subtypes.map(sub => (
                    <button
                      key={sub.value}
                      onClick={() => setChartSubType(sub.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition ${
                        chartSubType === sub.value
                          ? 'bg-blue-300 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 중앙: 데이터 편집 및 미리보기 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 데이터 편집 영역 */}
            <div className="flex-1 border-b border-gray-200 overflow-auto p-4 bg-white">
              <h3 className="text-sm font-bold text-gray-900 mb-3">데이터 편집</h3>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-700 w-24">
                        카테고리
                      </th>
                      {data.datasets.map((ds, idx) => (
                        <th
                          key={idx}
                          className="border border-gray-300 bg-gray-100 px-2 py-1 text-center font-semibold text-gray-700 min-w-[80px]"
                        >
                          <input
                            type="text"
                            value={ds.label}
                            onChange={e => handleDatasetLabelChange(idx, e.target.value)}
                            className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-xs"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.labels.map((label, labelIdx) => (
                      <tr key={labelIdx}>
                        <td className="border border-gray-300 bg-gray-50 px-2 py-1">
                          <input
                            type="text"
                            value={label}
                            onChange={e => handleLabelChange(labelIdx, e.target.value)}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          />
                        </td>
                        {data.datasets.map((ds, dsIdx) => (
                          <td
                            key={dsIdx}
                            className="border border-gray-300 px-2 py-1 text-center"
                          >
                            <input
                              type="number"
                              value={ds.data[labelIdx] ?? ''}
                              onChange={e =>
                                handleDataCellChange(dsIdx, labelIdx, e.target.value)
                              }
                              className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={addRow}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  행 추가
                </button>
                <button
                  onClick={addColumn}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  열 추가
                </button>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="flex-1 border-t border-gray-200 p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[300px]">
              <canvas
                ref={canvasRef}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          </div>

          {/* 오른쪽: 차트 옵션 */}
          <div className="w-56 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">차트 옵션</h3>

            {/* 제목 */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                제목
              </label>
              <input
                type="text"
                value={chartTitle}
                onChange={e => setChartTitle(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              />
              <label className="text-xs flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={e => setShowTitle(e.target.checked)}
                  className="w-3 h-3 mr-1"
                />
                표시
              </label>
            </div>

            {/* 범례 위치 */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                범례
              </label>
              <select
                value={legendPosition}
                onChange={e =>
                  setLegendPosition(
                    e.target.value as 'top' | 'bottom' | 'left' | 'right' | 'none'
                  )
                }
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="top">위쪽</option>
                <option value="bottom">아래쪽</option>
                <option value="left">왼쪽</option>
                <option value="right">오른쪽</option>
                <option value="none">없음</option>
              </select>
            </div>

            {/* 데이터 라벨 */}
            <div className="mb-4">
              <label className="text-xs flex items-center">
                <input
                  type="checkbox"
                  checked={showDataLabels}
                  onChange={e => setShowDataLabels(e.target.checked)}
                  className="w-3 h-3 mr-1"
                />
                <span className="font-semibold text-gray-700">데이터 라벨</span>
              </label>
            </div>

            {/* 눈금선 */}
            <div className="mb-4">
              <label className="text-xs flex items-center">
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={e => setShowGridlines(e.target.checked)}
                  className="w-3 h-3 mr-1"
                />
                <span className="font-semibold text-gray-700">눈금선</span>
              </label>
            </div>

            {/* 축 제목 */}
            {(chartType === 'column' ||
              chartType === 'bar' ||
              chartType === 'line' ||
              chartType === 'area' ||
              chartType === 'scatter') && (
              <>
                <div className="mb-3">
                  <label className="text-xs flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={showXAxisTitle}
                      onChange={e => setShowXAxisTitle(e.target.checked)}
                      className="w-3 h-3 mr-1"
                    />
                    <span className="font-semibold text-gray-700">X축 제목</span>
                  </label>
                  <input
                    type="text"
                    value={xAxisTitle}
                    onChange={e => setXAxisTitle(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={showYAxisTitle}
                      onChange={e => setShowYAxisTitle(e.target.checked)}
                      className="w-3 h-3 mr-1"
                    />
                    <span className="font-semibold text-gray-700">Y축 제목</span>
                  </label>
                  <input
                    type="text"
                    value={yAxisTitle}
                    onChange={e => setYAxisTitle(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </>
            )}

            {/* 색상 테마 */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                색상 테마
              </label>
              <div className="space-y-1">
                {[
                  { key: 'colorful1', label: '컬러풀 1' },
                  { key: 'colorful2', label: '컬러풀 2' },
                  { key: 'colorful3', label: '컬러풀 3' },
                  { key: 'monoBlue', label: '파랑' },
                  { key: 'monoOrange', label: '주황' },
                  { key: 'monoGreen', label: '초록' },
                ].map(theme => (
                  <button
                    key={theme.key}
                    onClick={() => setColorTheme(theme.key)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                      colorTheme === theme.key
                        ? 'bg-blue-500 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleInsert}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUploading ? '업로드 중...' : '삽입'}
          </button>
        </div>
      </div>
    </div>
  )
}
