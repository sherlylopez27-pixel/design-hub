'use client'

import { useState } from 'react'
import type { DesignVersion, Vote } from '@/lib/types/database'
import { CHART_COLORS } from '@/lib/utils'

interface VoteRow extends Vote {
  design_versions: { title: string } | null
}

interface Props {
  votes: VoteRow[]
  versions: DesignVersion[]
  projectTitle: string
}

export default function ResultsResponsesClient({ votes, versions, projectTitle }: Props) {
  const [filterVersionId, setFilterVersionId] = useState<string>('all')

  const filtered = filterVersionId === 'all'
    ? votes
    : votes.filter((v) => v.selected_version_id === filterVersionId)

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Chose', 'Reason', 'Date'],
      ...filtered.map((v) => [
        v.voter_name,
        v.voter_email,
        v.design_versions?.title ?? '',
        v.reason,
        new Date(v.created_at).toLocaleString(),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle}-votes.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-semibold text-slate-900">Responses</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterVersionId}
            onChange={(e) => setFilterVersionId(e.target.value)}
            className="input py-1.5 text-xs"
          >
            <option value="all">All options</option>
            {versions.map((v, idx) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
          <button onClick={exportCsv} className="btn-secondary text-xs py-1.5">
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No responses yet.</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.map((vote) => {
            const vIdx = versions.findIndex((v) => v.id === vote.selected_version_id)
            const color = CHART_COLORS[vIdx % CHART_COLORS.length] ?? '#4F46E5'
            return (
              <div key={vote.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{vote.voter_name}</p>
                    <a href={`mailto:${vote.voter_email}`} className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                      {vote.voter_email}
                    </a>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {vote.design_versions?.title ?? 'Unknown'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(vote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">"{vote.reason}"</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
