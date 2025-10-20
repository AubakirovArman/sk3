'use client'

import MarkdownRender from '@/components/markdown-render'

interface SummaryViewProps {
  summary: string
}

export function SummaryView({ summary }: SummaryViewProps) {
  const summaryText = summary ?? ''
  if (!summaryText.trim()) {
    return (
      <div className="rounded-2xl border-2 border-[#ebeefa] bg-[#fdfdff] px-6 py-5 shadow-sm text-center">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#9aa2ba] mb-2">Статус</div>
        <div className="text-sm text-slate-500">Данные отсутствуют</div>
      </div>
    )
  }

  const lines = summaryText.split('\n')
  const sectionRegex = /^\*\*(ПУНКТ ПОВЕСТКИ ДНЯ|РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД|КРАТКОЕ ЗАКЛЮЧЕНИЕ|ОБОСНОВАНИЕ):\*\*/

  const sections: Record<string, string[]> = {}
  let current: string | null = null

  for (const line of lines) {
    const match = line.match(sectionRegex)
    if (match) {
      current = match[1]
      sections[current] = []
      const remainder = line.replace(sectionRegex, '').trim()
      if (remainder) sections[current].push(remainder)
      continue
    }
    if (current) {
      sections[current].push(line)
    }
  }

  const getSection = (key: string) => (sections[key] || []).join('\n').trim()
  const blocks: JSX.Element[] = []

  const agenda = getSection('ПУНКТ ПОВЕСТКИ ДНЯ')
  if (agenda) {
    blocks.push(
      <div key="agenda" className="rounded-2xl border-2 border-[#d0dcff] bg-[#eef2ff] px-6 py-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#5b6cc8] mb-3">Пункт повестки дня</div>
        <p className="text-sm leading-relaxed text-[#3c4470] font-medium">{agenda}</p>
      </div>
    )
  }

  const decisionRaw = getSection('РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД')
  if (decisionRaw) {
    const decision = decisionRaw.split(/\s+/)[0]?.toUpperCase() || decisionRaw.toUpperCase()
    const isPositive = decision.includes('ЗА')
    blocks.push(
      <div
        key="decision"
        className={`rounded-2xl border-2 px-6 py-5 shadow-sm ${
          isPositive
            ? 'border-[#cde4d4] bg-[#f2fbf5] text-[#327a4f]'
            : 'border-[#f3d2d2] bg-[#fff5f5] text-[#c14a4a]'
        }`}
      >
        <div className="text-lg font-bold tracking-wide">
          РЕШЕНИЕ: {decision}
        </div>
      </div>
    )
  }



  const justification = getSection('ОБОСНОВАНИЕ')
  if (justification) {
    blocks.push(
      <div key="justification" className="rounded-2xl border-2 border-[#e2e5f2] bg-[#f8f9ff] px-6 py-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#7b84a7] mb-3">Обоснование</div>
        <MarkdownRender content={justification} className="text-[#4a5170] [&_.markdown-body]:text-[#4a5170] [&_.markdown-body]:text-sm [&_.markdown-body]:leading-relaxed" />
      </div>
    )
  }
  const shortSummary = getSection('КРАТКОЕ ЗАКЛЮЧЕНИЕ')
  if (shortSummary) {
    blocks.push(
      <div key="short-summary" className="rounded-2xl border-2 border-[#f2e4c7] bg-[#fff9ef] px-6 py-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#c28d2d] mb-3">Краткое заключение</div>
        <MarkdownRender content={shortSummary} className="text-[#5d5438] [&_.markdown-body]:text-[#5d5438] [&_.markdown-body]:text-sm [&_.markdown-body]:leading-relaxed" />
      </div>
    )
  }
  if (!blocks.length) {
    return (
      <div className="rounded-2xl border-2 border-[#ebeefa] bg-[#fdfdff] px-6 py-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-[#9aa2ba] mb-3">Общее заключение</div>
        <MarkdownRender content={summaryText} className="text-slate-600 [&_.markdown-body]:text-slate-600 [&_.markdown-body]:text-sm [&_.markdown-body]:leading-relaxed" />
      </div>
    )
  }

  return <div className="space-y-4">{blocks}</div>
}