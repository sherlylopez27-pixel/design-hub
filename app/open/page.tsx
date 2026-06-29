import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDeadline, CHART_COLORS } from '@/lib/utils'
import type { Project, DesignVersion } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Open votes' }
export const revalidate = 60

interface ProjectRow extends Project {
  design_versions: DesignVersion[]
}

export default async function OpenVotesPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('projects')
    .select('*, design_versions(*)')
    .eq('status', 'active')
    .or(`deadline.is.null,deadline.gte.${today}`)
    .order('created_at', { ascending: false })

  const liveProjects = (data ?? []) as ProjectRow[]
  const admin = createAdminClient()

  const voteCounts = await Promise.all(
    liveProjects.map(async (p) => {
      const { data: total } = await admin.rpc('get_total_votes', { p_project_id: p.id })
      return { id: p.id, total: (total ?? 0) as number }
    })
  )
  const voteCountMap = Object.fromEntries(voteCounts.map((v) => [v.id, v.total]))

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-sm">Design Hub</span>
          </Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Admin sign in
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Open votes</h1>
          <p className="mt-1 text-slate-500">Pick your favourite for each design question.</p>
        </div>

        {liveProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 15h6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">No open votes right now</h2>
            <p className="text-sm text-slate-400">Check back later when new design questions are posted.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveProjects.map((project) => {
              const versions = project.design_versions.sort((a, b) => a.position - b.position)
              const deadlineLabel = formatDeadline(project.deadline)
              const totalVotes = voteCountMap[project.id] ?? 0

              return (
                <Link
                  key={project.id}
                  href={`/vote/${project.slug}/${project.short_id}`}
                  className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group block"
                >
                  <div className="flex gap-2 mb-4">
                    {versions.slice(0, 2).map((v, i) => (
                      <div
                        key={v.id}
                        className="flex-1 aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative"
                        style={{ borderBottom: `3px solid ${CHART_COLORS[i]}` }}
                      >
                        {v.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.image_url} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">{v.title}</span>
                        )}
                      </div>
                    ))}
                    {versions.length > 2 && (
                      <div className="w-10 aspect-video rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-semibold">
                        +{versions.length - 2}
                      </div>
                    )}
                  </div>

                  <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {project.title}
                  </h2>
                  {project.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{project.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{totalVotes === 1 ? '1 vote' : `${totalVotes} votes`}</span>
                    {deadlineLabel && (
                      <span className={deadlineLabel === 'Closes today' ? 'text-amber-600 font-semibold' : ''}>
                        {deadlineLabel}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
