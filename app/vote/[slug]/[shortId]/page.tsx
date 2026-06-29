import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Project, DesignVersion } from '@/lib/types/database'
import VotingClient from './VotingClient'

interface Props {
  params: Promise<{ slug: string; shortId: string }>
}

interface ProjectRow extends Project {
  design_versions: DesignVersion[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, shortId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('title')
    .eq('slug', slug)
    .eq('short_id', shortId)
    .maybeSingle()
  const row = data as { title: string } | null
  return { title: row?.title ?? 'Vote' }
}

export default async function VotePage({ params }: Props) {
  const { slug, shortId } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('projects')
    .select('*, design_versions(*)')
    .eq('slug', slug)
    .eq('short_id', shortId)
    .maybeSingle()

  const project = data as ProjectRow | null
  if (!project) notFound()

  const versions = project.design_versions.sort((a, b) => a.position - b.position)

  return <VotingClient project={project} versions={versions} />
}
