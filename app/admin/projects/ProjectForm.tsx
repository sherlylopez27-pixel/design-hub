'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, DesignVersion } from '@/lib/types/database'
import { generateSlug, generateShortId } from '@/lib/utils'
import { saveProject } from './actions'
import CopyButton from '@/components/ui/CopyButton'

interface VersionDraft {
  id?: string
  title: string
  image_url: string
  figma_link: string
  xd_link: string
  prototype_link: string
  position: number
  imageFile?: File | null
}

interface Props {
  project?: Project & { design_versions?: DesignVersion[] }
  initialVersions?: DesignVersion[]
}

export default function ProjectForm({ project, initialVersions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [savedProject, setSavedProject] = useState<{ slug: string; short_id: string } | null>(null)

  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<'draft' | 'active' | 'closed'>(project?.status ?? 'draft')
  const [deadline, setDeadline] = useState(project?.deadline ?? '')
  const [resultsMode, setResultsMode] = useState(project?.results_mode ?? 'after_close')

  const [versions, setVersions] = useState<VersionDraft[]>(
    (initialVersions ?? []).length >= 2
      ? (initialVersions ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          image_url: v.image_url,
          figma_link: v.figma_link,
          xd_link: v.xd_link,
          prototype_link: v.prototype_link,
          position: v.position,
        }))
      : [
          { title: '', image_url: '', figma_link: '', xd_link: '', prototype_link: '', position: 0 },
          { title: '', image_url: '', figma_link: '', xd_link: '', prototype_link: '', position: 1 },
        ]
  )

  const [uploading, setUploading] = useState<Record<number, boolean>>({})

  function updateVersion(idx: number, field: keyof VersionDraft, value: string | File | null) {
    setVersions((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  function addVersion() {
    setVersions((prev) => [
      ...prev,
      { title: '', image_url: '', figma_link: '', xd_link: '', prototype_link: '', position: prev.length },
    ])
  }

  function removeVersion(idx: number) {
    if (versions.length <= 2) return
    setVersions((prev) => prev.filter((_, i) => i !== idx).map((v, i) => ({ ...v, position: i })))
  }

  async function uploadImage(idx: number, file: File) {
    setUploading((prev) => ({ ...prev, [idx]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        updateVersion(idx, 'image_url', data.url)
      } else {
        setError(data.error ?? 'Upload failed')
      }
    } catch {
      setError('Upload failed. Check your connection.')
    } finally {
      setUploading((prev) => ({ ...prev, [idx]: false }))
    }
  }

  const canSubmit =
    title.trim().length > 0 &&
    versions.length >= 2 &&
    versions.every((v) => v.title.trim().length > 0) &&
    !Object.values(uploading).some(Boolean)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')

    const slug = project?.slug ?? generateSlug(title)
    const short_id = project?.short_id ?? generateShortId()

    startTransition(async () => {
      const result = await saveProject({
        id: project?.id,
        title: title.trim(),
        description: description.trim(),
        status,
        deadline: deadline || null,
        results_mode: resultsMode,
        slug,
        short_id,
        versions: versions.map((v, i) => ({ ...v, position: i })),
      })

      if (result.error) {
        setError(result.error)
      } else if (result.project) {
        setSavedProject(result.project)
      }
    })
  }

  if (savedProject) {
    const voteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/vote/${savedProject.slug}/${savedProject.short_id}`
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {project ? 'Project updated!' : 'Project created!'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">Share this link with your team to collect votes.</p>
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2 mb-4">
          <code className="text-sm text-slate-700 flex-1 truncate">{voteUrl}</code>
          <CopyButton text={voteUrl} label="Copy" className="btn-primary text-xs py-1.5 shrink-0" />
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Or send voters to <a href="/open" className="text-indigo-600 hover:underline">/open</a> for the full vote hub.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/admin')} className="btn-secondary">
            Back to dashboard
          </button>
          <a href={voteUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Preview vote ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core fields */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Project details</h2>
        <div>
          <label htmlFor="proj-title" className="label">Title <span className="text-red-500">*</span></label>
          <input
            id="proj-title"
            type="text"
            required
            placeholder="Homepage redesign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="proj-desc" className="label">Description</label>
          <textarea
            id="proj-desc"
            rows={2}
            placeholder="What are we deciding?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-status" className="label">Status</label>
            <select
              id="proj-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'closed')}
              className="input"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="proj-deadline" className="label">Deadline (optional)</label>
            <input
              id="proj-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div>
          <label htmlFor="proj-results" className="label">Results visibility</label>
          <select
            id="proj-results"
            value={resultsMode}
            onChange={(e) => setResultsMode(e.target.value as 'after_vote' | 'after_close' | 'never')}
            className="input"
          >
            <option value="after_close">After vote closes (recommended)</option>
            <option value="after_vote">Immediately after voting</option>
            <option value="never">Never (admin only)</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Controls when voters can see results. Admins always see live results.
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Options</h2>
          <button type="button" onClick={addVersion} className="btn-secondary text-xs py-1.5">
            + Add option
          </button>
        </div>
        <div className="space-y-5">
          {versions.map((v, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Option {idx + 1}</p>
                {versions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeVersion(idx)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label className="label">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Option A"
                  value={v.title}
                  onChange={(e) => updateVersion(idx, 'title', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Design image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadImage(idx, file)
                  }}
                  className="block text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-semibold hover:file:bg-indigo-100 cursor-pointer"
                />
                {uploading[idx] && <p className="text-xs text-slate-400 mt-1">Uploading…</p>}
                {v.image_url && !uploading[idx] && (
                  <div className="mt-2 relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image_url} alt="" className="h-20 rounded-lg object-cover border border-slate-200" />
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Or paste a URL:</p>
                <input
                  type="url"
                  placeholder="https://…"
                  value={v.image_url}
                  onChange={(e) => updateVersion(idx, 'image_url', e.target.value)}
                  className="input mt-1"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <label className="label">Figma link</label>
                  <input type="url" placeholder="https://figma.com/…" value={v.figma_link} onChange={(e) => updateVersion(idx, 'figma_link', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">XD link</label>
                  <input type="url" placeholder="https://xd.adobe.com/…" value={v.xd_link} onChange={(e) => updateVersion(idx, 'xd_link', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Prototype link</label>
                  <input type="url" placeholder="https://…" value={v.prototype_link} onChange={(e) => updateVersion(idx, 'prototype_link', e.target.value)} className="input" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {versions.length < 2 && (
          <p className="text-xs text-red-500 mt-2">At least two options are required.</p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push('/admin')} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit || isPending} className="btn-primary flex-1">
          {isPending ? 'Saving…' : project ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  )
}
