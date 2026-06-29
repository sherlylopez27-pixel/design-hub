import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Project, DesignVersion, Vote } from '@/lib/types/database'
import { getEffectiveStatus, findWinner, calcPercentages, CHART_COLORS } from '@/lib/utils'
import ResultsChart from '@/components/ui/ResultsChart'
import StatusBadge from '@/components/ui/StatusBadge'
import ResultsResponsesClient from './ResultsResponsesClient'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Results' }

interface ProjectRow extends Project {
  design_versions: DesignVersion[]
}

interface VoteWithVersion extends Vote {
  design_versions: { title: string } | null
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('projects')
    .select('*, design_versions(*)')
    .eq('id', id)
    .eq('created_by', user.id)
    .maybeSingle()

  const project = data as ProjectRow | null
  if (!project) notFound()

  const admin = createAdminClient()
  const [countsRes, totalRes, votesRes] = await Promise.all([
    admin.rpc('get_vote_counts', { p_project_id: id }),
    admin.rpc('get_total_votes', { p_project_id: id }),
    admin.from('votes')
      .select('*, design_versions(title)')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
  ])

  const versions = project.design_versions.sort((a, b) => a.position - b.position)
  const counts = (countsRes.data ?? []) as { version_id: string; vote_count: number }[]
  const total = (totalRes.data ?? 0) as number
  const votes = (votesRes.data ?? []) as unknown as VoteWithVersion[]
  const effectiveStatus = getEffectiveStatus(project.status, project.deadline)
  const winnerId = effectiveStatus === 'closed' ? findWinner(counts) : null
  const winnerVersion = versions.find((v) => v.id === winnerId)
  const percentages = calcPercentages(counts, total)
  const winnerIdx = versions.findIndex((v) => v.id === winnerId)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
            <StatusBadge status={effectiveStatus} />
          </div>
          <p className="text-slate-500">{total} total vote{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/projects/${id}`} className="btn-secondary text-sm">Edit</Link>
          <Link href="/admin" className="btn-secondary text-sm">Dashboard</Link>
        </div>
      </div>

      {winnerVersion && (
        <div
          className="rounded-2xl p-5 mb-6 text-white"
          style={{ background: `linear-gradient(135deg, ${CHART_COLORS[winnerIdx % CHART_COLORS.length]}, #7C3AED)` }}
        >
          <p className="text-sm font-medium opacity-80 mb-1">Decision</p>
          <p className="text-2xl font-bold">{winnerVersion.title}</p>
          <p className="text-sm opacity-80 mt-1">{winnerId ? (percentages[winnerId] ?? 0) : 0}% of votes</p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Vote breakdown</h2>
          <ResultsChart
            versions={versions}
            voteCounts={counts}
            totalVotes={total}
            winnerId={winnerId}
          />
        </div>

        <div className="lg:col-span-3">
          <ResultsResponsesClient
            votes={votes}
            versions={versions}
            projectTitle={project.title}
          />
        </div>
      </div>
    </div>
  )
}
