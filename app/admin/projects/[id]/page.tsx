import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Project, DesignVersion } from '@/lib/types/database'
import ProjectForm from '../ProjectForm'

interface Props {
  params: Promise<{ id: string }>
}

interface ProjectRow extends Project {
  design_versions: DesignVersion[]
}

export const metadata: Metadata = { title: 'Edit project' }

export default async function EditProjectPage({ params }: Props) {
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
  const { data: totalVotes } = await admin.rpc('get_total_votes', { p_project_id: id })

  const versions = project.design_versions.sort((a, b) => a.position - b.position)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit project</h1>
        {((totalVotes as number) ?? 0) > 0 && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <strong>This project has {totalVotes as number} votes.</strong> Editing options may affect result accuracy.
          </div>
        )}
      </div>
      <ProjectForm project={project} initialVersions={versions} />
    </div>
  )
}
