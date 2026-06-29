'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DesignVersion } from '@/lib/types/database'
import { CHART_COLORS, calcPercentages } from '@/lib/utils'

interface Props {
  versions: DesignVersion[]
  voteCounts: { version_id: string; vote_count: number }[]
  totalVotes: number
  myVoteVersionId?: string | null
  winnerId?: string | null
  compact?: boolean
}

export default function ResultsChart({
  versions,
  voteCounts,
  totalVotes,
  myVoteVersionId,
  winnerId,
  compact = false,
}: Props) {
  const percentages = calcPercentages(voteCounts, totalVotes)

  const pieData = versions.map((v, idx) => ({
    name: v.title,
    value: voteCounts.find((c) => c.version_id === v.id)?.vote_count ?? 0,
    color: CHART_COLORS[idx % CHART_COLORS.length],
    id: v.id,
  }))

  if (totalVotes === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">No votes yet</p>
    )
  }

  return (
    <div>
      {!compact && (
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={entry.id} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} vote${value !== 1 ? 's' : ''}`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-3">
        {versions.map((v, idx) => {
          const color = CHART_COLORS[idx % CHART_COLORS.length]
          const pct = percentages[v.id] ?? 0
          const voteCount = voteCounts.find((c) => c.version_id === v.id)?.vote_count ?? 0
          const isWinner = winnerId === v.id
          const isMyVote = myVoteVersionId === v.id

          return (
            <div key={v.id} className={`rounded-xl p-3 ${isMyVote ? 'ring-2 ring-offset-1' : ''}`} style={isMyVote ? { outline: `2px solid ${color}` } : {}}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-slate-800 truncate">{v.title}</span>
                  {isWinner && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                      Winner
                    </span>
                  )}
                  {isMyVote && (
                    <span className="text-xs text-slate-400 shrink-0">your vote</span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900 shrink-0 ml-2">{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{voteCount} vote{voteCount !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-4">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  )
}
