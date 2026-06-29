'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { projectSchema } from '@/lib/validations'
import { generateSlug, generateShortId } from '@/lib/utils'

interface VersionInput {
  id?: string
  title: string
  image_url: string
  figma_link: string
  xd_link: string
  prototype_link: string
  position: number
}

interface SaveProjectInput {
  id?: string
  title: string
  description: string
  status: 'draft' | 'active' | 'closed'
  deadline: string | null
  results_mode: 'after_vote' | 'after_close' | 'never'
  slug: string
  short_id: string
  versions: VersionInput[]
}

export async function saveProject(
  input: SaveProjectInput
): Promise<{ error?: string; project?: { slug: string; short_id: string } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const parse = projectSchema.safeParse({
    title: input.title,
    description: input.description,
    status: input.status,
    deadline: input.deadline,
    results_mode: input.results_mode,
  })
  if (!parse.success) {
    return { error: parse.error.issues[0].message }
  }

  if (input.versions.length < 2) {
    return { error: 'At least two options are required.' }
  }
  for (const v of input.versions) {
    if (!v.title.trim()) return { error: 'All options must have a name.' }
  }

  const admin = createAdminClient()
  let projectId = input.id
  const slug = input.slug || generateSlug(input.title)
  const short_id = input.short_id || generateShortId()

  if (projectId) {
    const { error } = await admin
      .from('projects')
      .update({
        title: input.title,
        description: input.description,
        status: input.status,
        deadline: input.deadline,
        results_mode: input.results_mode,
      })
      .eq('id', projectId)
      .eq('created_by', user.id)

    if (error) {
      console.error('Project update error:', error)
      return { error: 'Failed to update project.' }
    }
  } else {
    const { data: newProject, error } = await admin
      .from('projects')
      .insert({
        title: input.title,
        description: input.description,
        status: input.status,
        deadline: input.deadline,
        results_mode: input.results_mode,
        slug,
        short_id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error || !newProject) {
      console.error('Project create error:', error)
      if ((error as { code?: string })?.code === '23505') {
        return { error: 'A project with this title already exists. Try a different title.' }
      }
      return { error: 'Failed to create project.' }
    }
    projectId = (newProject as { id: string }).id
  }

  for (const v of input.versions) {
    if (v.id) {
      await admin
        .from('design_versions')
        .update({
          title: v.title,
          image_url: v.image_url,
          figma_link: v.figma_link,
          xd_link: v.xd_link,
          prototype_link: v.prototype_link,
          position: v.position,
        })
        .eq('id', v.id)
        .eq('project_id', projectId!)
    } else {
      await admin.from('design_versions').insert({
        project_id: projectId!,
        title: v.title,
        image_url: v.image_url,
        figma_link: v.figma_link,
        xd_link: v.xd_link,
        prototype_link: v.prototype_link,
        position: v.position,
      })
    }
  }

  if (input.id) {
    const keptIds = input.versions.filter((v) => v.id).map((v) => v.id!)
    if (keptIds.length > 0) {
      await admin
        .from('design_versions')
        .delete()
        .eq('project_id', projectId!)
        .not('id', 'in', `(${keptIds.map((id) => `'${id}'`).join(',')})`)
    }
  }

  return { project: { slug, short_id } }
}

export async function deleteProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin.from('projects').delete().eq('id', projectId).eq('created_by', user.id)
  if (error) return { error: 'Failed to delete project.' }
  return {}
}
