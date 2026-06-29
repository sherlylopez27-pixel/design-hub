import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { voteSchema } from '@/lib/validations'
import { isProjectLive } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { voteNotificationHtml, voteNotificationText } from '@/emails/vote-notification'
import { thankYouHtml, thankYouText } from '@/emails/thank-you'
import type { Project, DesignVersion } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const ipCheck = checkRateLimit(`ip:${ip}`)
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((ipCheck.retryAfterMs ?? 60000) / 1000)) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parse = voteSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 })
  }

  const { project_id, selected_version_id, voter_name, voter_email, reason } = parse.data

  const emailCheck = checkRateLimit(`email:${voter_email}`)
  if (!emailCheck.ok) {
    return NextResponse.json({ error: 'Too many votes from this email address.' }, { status: 429 })
  }

  const admin = createAdminClient()

  const { data: projectData } = await admin
    .from('projects')
    .select('*, profiles(name, email)')
    .eq('id', project_id)
    .maybeSingle()

  const project = projectData as (Project & { profiles: { name: string; email: string } | null }) | null

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  if (!isProjectLive(project.status, project.deadline)) {
    return NextResponse.json({ error: 'This vote is not open.' }, { status: 422 })
  }

  const { data: versionData } = await admin
    .from('design_versions')
    .select('id, title')
    .eq('id', selected_version_id)
    .eq('project_id', project_id)
    .maybeSingle()

  const version = versionData as Pick<DesignVersion, 'id' | 'title'> | null

  if (!version) {
    return NextResponse.json({ error: 'Invalid option selected.' }, { status: 400 })
  }

  const { error: insertError } = await admin.from('votes').insert({
    project_id,
    selected_version_id,
    voter_name: voter_name.trim(),
    voter_email,
    reason: reason.trim(),
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'You have already voted on this project.' }, { status: 409 })
    }
    console.error('Vote insert error:', insertError)
    return NextResponse.json({ error: 'Failed to record vote.' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const projectUrl = `${siteUrl}/admin/projects/${project_id}/results`
  const openVotesUrl = `${siteUrl}/open`

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.EMAIL_FROM ?? 'Design Hub <noreply@designhub.app>'

    if (project.profiles?.email) {
      resend.emails.send({
        from,
        to: project.profiles.email,
        subject: `New vote on "${project.title}"`,
        html: voteNotificationHtml({
          projectTitle: project.title,
          voterName: voter_name,
          voterEmail: voter_email,
          optionTitle: version.title,
          reason,
          adminName: project.profiles.name ?? 'there',
          projectUrl,
        }),
        text: voteNotificationText({
          projectTitle: project.title,
          voterName: voter_name,
          voterEmail: voter_email,
          optionTitle: version.title,
          reason,
          adminName: project.profiles.name ?? 'there',
          projectUrl,
        }),
      }).catch(console.error)
    }

    resend.emails.send({
      from,
      to: voter_email,
      subject: `Thanks for voting on "${project.title}"`,
      html: thankYouHtml({ voterName: voter_name, projectTitle: project.title, optionTitle: version.title, openVotesUrl }),
      text: thankYouText({ voterName: voter_name, projectTitle: project.title, optionTitle: version.title, openVotesUrl }),
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
