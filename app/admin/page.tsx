import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveStatus, CHART_COLORS, calcPercentages } from '@/lib/utils'
import type { Project, DesignVersion } from '@/lib/types/database'
import StatusBadge from '@/components/ui/StatusBadge'
import CopyButton from '@/components/ui/CopyButton'

export const metadata: Metadata = { title: 'Dashboard' }

interface ProjectRow extends Project {
  design_versions: DesignVersion[]
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('projects')
    .select('*, design_versions(*)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const allProjects = (data ?? []) as ProjectRow[]
  const admin = createAdminClient()

  const voteData = await Promise.all(
    allProjects.map(async (p) => {
      const [countsRes, totalRes] = await Promise.all([
        admin.rpc('get_vote_counts', { p_project_id: p.id }),
        admin.rpc('get_total_votes', { p_project_id: p.id }),
      ])
      return {
        id: p.id,
        counts: (countsRes.data ?? []) as { version_id: string; vote_count: number }[],
        total: (totalRes.data ?? 0) as number,
      }
    })
  )
  const voteMap = Object.fromEntries(voteData.map((v) => [v.id, v]))

  const activeCount = allProjects.filter(
    (p) => getEffectiveStatus(p.status, p.deadline) === 'active'
  ).length
  const totalResponses = voteData.reduce((sum, v) => sum + v.total, 0)

  let mostPreferred: string | null = null
  let mostPreferredCount = 0
  for (const p of allProjects) {
    const vd = voteMap[p.id]
    if (!vd?.counts.length) continue
    const top = [...vd.counts].sort((a, b) => b.vote_count - a.vote_count)[0]
    if (top.vote_count > mostPreferredCount) {
      mostPreferredCount = top.vote_count
      const version = p.design_versions.find((v) => v.id === top.version_id)
      mostPreferred = version?.title ?? null
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total projects', value: allProjects.length },
          { label: 'Active votes', value: activeCount },
          { label: 'Total responses', value: totalResponses },
          { label: 'Most preferred', value: mostPreferred ?? '—', small: true },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-1">{stat.label}</p>
            <p className={`font-bold text-slate-900 truncate ${stat.small ? 'text-lg' : 'text-3xl'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Your projects</h2>
        <Link href="/admin/projects/new" className="btn-primary text-sm">
          + New project
        </Link>
      </div>

      {allProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first project and share the link with your team to start collecting feedback.
          </p>
          <Link href="/admin/projects/new" className="btn-primary">Create first project</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allProjects.map((project) => {
            const effectiveStatus = getEffectiveStatus(project.status, project.deadline)
            const vd = voteMap[project.id]
            const versions = project.design_versions.sort((a, b) => a.position - b.position)
            const percentages = calcPercentages(vd.counts, vd.total)
            const winnerVersionId = effectiveStatus === 'closed'
              ? [...vd.counts].sort((a, b) => b.vote_count - a.vote_count)[0]?.version_id
              : null
            const winnerVersion = versions.find((v) => v.id === winnerVersionId)
            const winnerPct = winnerVersionId ? percentages[winnerVersionId] : null

            return (
              <div key={project.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{project.title}</h3>
                      <StatusBadge status={effectiveStatus} />
                    </div>
                    {winnerVersion && winnerPct !== null && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        Decision: <strong className="text-indigo-600">{winnerVersion.title}</strong> — {winnerPct}%
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 shrink-0">{vd.total} vote{vd.total !== 1 ? 's' : ''}</p>
                </div>

                {versions.length > 0 && vd.total > 0 && (
                  <div className="flex rounded-full overflow-hidden h-2 mb-3 bg-slate-100">
                    {versions.map((v, idx) => {
                      const pct = percentages[v.id] ?? 0
                      return pct > 0 ? (
                        <div
                          key={v.id}
                          style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          title={`${v.title}: ${pct}%`}
                        />
                      ) : null
                    })}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/vote/${project.slug}/${project.short_id}`}
                    target="_blank"
                    className="btn-secondary text-xs py-1.5"
                  >
                    Open vote ↗
                  </Link>
                  <CopyButton text={`${siteUrl}/vote/${project.slug}/${project.short_id}`} />
                  <Link href={`/admin/projects/${project.id}/results`} className="btn-secondary text-xs py-1.5">
                    Results
                  </Link>
                  <Link href={`/admin/projects/${project.id}`} className="btn-secondary text-xs py-1.5">
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
