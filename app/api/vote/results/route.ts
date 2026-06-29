import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [countsResult, totalResult] = await Promise.all([
    admin.rpc('get_vote_counts', { p_project_id: projectId }),
    admin.rpc('get_total_votes', { p_project_id: projectId }),
  ])

  return NextResponse.json({
    counts: (countsResult.data ?? []) as { version_id: string; vote_count: number }[],
    total: (totalResult.data ?? 0) as number,
  })
}
