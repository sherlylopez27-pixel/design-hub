'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Project, DesignVersion } from '@/lib/types/database'
import { isProjectLive, formatDeadline, CHART_COLORS, calcPercentages, findWinner, isValidEmail } from '@/lib/utils'
import ImageLightbox from '@/components/ui/ImageLightbox'
import ResultsChart from '@/components/ui/ResultsChart'

interface Props {
  project: Project
  versions: DesignVersion[]
}

type Step = 'vote' | 'form' | 'submitted' | 'already-voted'

export default function VotingClient({ project, versions }: Props) {
  const isLive = isProjectLive(project.status, project.deadline)
  const storageKey = `voted:${project.id}`

  const [step, setStep] = useState<Step>('vote')
  const [selected, setSelected] = useState<DesignVersion | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [voteCounts, setVoteCounts] = useState<{ version_id: string; vote_count: number }[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [myVoteVersionId, setMyVoteVersionId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const { versionId } = JSON.parse(stored)
      setMyVoteVersionId(versionId)
      setStep('already-voted')
    }
  }, [storageKey])

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/vote/results?projectId=${project.id}`)
      if (res.ok) {
        const data = await res.json()
        setVoteCounts(data.counts ?? [])
        setTotalVotes(data.total ?? 0)
      }
    } catch {
      // ignore
    }
  }, [project.id])

  useEffect(() => {
    if (step === 'submitted' || step === 'already-voted') {
      fetchResults()
    }
  }, [step, fetchResults])

  const handleSelect = (version: DesignVersion) => {
    setSelected(version)
    setStep('form')
  }

  const isFormValid =
    formData.name.trim().length > 0 &&
    isValidEmail(formData.email) &&
    formData.reason.trim().length > 0

  const formHint = !formData.name.trim()
    ? 'Enter your name'
    : !isValidEmail(formData.email)
    ? 'Enter a valid work email'
    : !formData.reason.trim()
    ? 'Tell us why'
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !isFormValid) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          selected_version_id: selected.id,
          voter_name: formData.name.trim(),
          voter_email: formData.email.toLowerCase().trim(),
          reason: formData.reason.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          localStorage.setItem(storageKey, JSON.stringify({ versionId: selected.id }))
          setMyVoteVersionId(selected.id)
          setStep('already-voted')
        } else {
          setError(data.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      localStorage.setItem(storageKey, JSON.stringify({ versionId: selected.id }))
      setMyVoteVersionId(selected.id)
      setStep('submitted')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const effectivelyClosed = !isLive
  const showResults =
    step === 'submitted' || step === 'already-voted'
      ? project.results_mode === 'after_vote' ||
        (project.results_mode === 'after_close' && effectivelyClosed)
      : false

  const percentages = calcPercentages(voteCounts, totalVotes)
  const winnerId = effectivelyClosed ? findWinner(voteCounts) : null

  // Lightbox images
  const lightboxImages = versions.filter((v) => v.image_url)

  if (effectivelyClosed && step === 'vote') {
    return (
      <PageShell project={project}>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">This vote has closed</h2>
          <p className="text-slate-500 mb-6">Thanks for your interest — voting is no longer open.</p>
          <Link href="/open" className="btn-primary">See other open votes</Link>
        </div>
      </PageShell>
    )
  }

  if (step === 'submitted' || step === 'already-voted') {
    const myVersion = versions.find((v) => v.id === myVoteVersionId)
    return (
      <PageShell project={project}>
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center mb-6 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {step === 'submitted' ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-2">That's your one vote — it's locked in.</h2>
                <p className="text-slate-500">
                  You chose <strong style={{ color: CHART_COLORS[versions.findIndex(v => v.id === myVoteVersionId)] } }>{myVersion?.title}</strong>.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-2">You've already voted.</h2>
                <p className="text-slate-500">
                  You chose <strong style={{ color: CHART_COLORS[versions.findIndex(v => v.id === myVoteVersionId)] }}>{myVersion?.title}</strong>.
                </p>
              </>
            )}
          </div>

          {showResults ? (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">Results so far</h3>
              <ResultsChart
                versions={versions}
                voteCounts={voteCounts}
                totalVotes={totalVotes}
                myVoteVersionId={myVoteVersionId}
                winnerId={winnerId}
                compact
              />
            </div>
          ) : project.results_mode === 'never' ? null : (
            <div className="card p-6 mb-6 text-center">
              <p className="text-sm text-slate-500">
                Results will be revealed when voting closes.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link href="/open" className="btn-secondary">See other open votes</Link>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell project={project}>
      {step === 'vote' && (
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-2">
            Which one do you prefer?
          </h1>
          {project.description && (
            <p className="text-slate-500 text-center mb-8 max-w-xl mx-auto">{project.description}</p>
          )}

          <div className={`grid gap-5 ${versions.length === 2 ? 'sm:grid-cols-2' : versions.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {versions.map((version, idx) => {
              const color = CHART_COLORS[idx % CHART_COLORS.length]
              const posLabel = versions.length === 2 ? (idx === 0 ? 'Left' : 'Right') : null
              return (
                <div
                  key={version.id}
                  className="card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                  style={{ borderTop: `3px solid ${color}` }}
                >
                  {/* Image */}
                  <div
                    className="aspect-video bg-slate-100 flex items-center justify-center cursor-zoom-in overflow-hidden relative"
                    onClick={() => {
                      const imgIdx = lightboxImages.findIndex((v) => v.id === version.id)
                      if (imgIdx >= 0) setLightboxIndex(imgIdx)
                    }}
                  >
                    {version.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={version.image_url}
                        alt={version.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 text-sm">No image</span>
                    )}
                    {posLabel && (
                      <span className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-xs font-semibold text-slate-600 rounded-full px-2 py-0.5">
                        {posLabel}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="font-semibold text-slate-900 mb-3" style={{ color }}>{version.title}</h2>

                    {(version.figma_link || version.xd_link || version.prototype_link) && (
                      <a
                        href={version.figma_link || version.xd_link || version.prototype_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 underline mb-3 block"
                      >
                        View full design ↗
                      </a>
                    )}

                    <button
                      onClick={() => handleSelect(version)}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: color }}
                    >
                      I prefer this
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {step === 'form' && selected && (
        <div className="max-w-lg mx-auto animate-slide-up">
          <button
            onClick={() => { setStep('vote'); setError('') }}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to options
          </button>

          <div
            className="card p-4 mb-6"
            style={{ borderLeft: `4px solid ${CHART_COLORS[versions.findIndex(v => v.id === selected.id) % CHART_COLORS.length]}` }}
          >
            <p className="text-xs text-slate-500 mb-0.5">Your choice</p>
            <p className="font-semibold text-slate-900">{selected.title}</p>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Almost there — tell us a bit about yourself</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="voter-name" className="label">Your name</label>
                <input
                  id="voter-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="voter-email" className="label">Work email</label>
                <input
                  id="voter-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="voter-reason" className="label">Why did you prefer this one?</label>
                <textarea
                  id="voter-reason"
                  required
                  rows={3}
                  placeholder="I liked the layout because…"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input resize-none"
                />
              </div>

              {formHint && !isFormValid && (
                <p className="text-xs text-slate-400">{formHint}</p>
              )}

              <p className="text-xs text-slate-400">
                Your name and email are shared with the team running this vote.
              </p>

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className="btn-primary w-full py-3"
              >
                {submitting ? 'Submitting…' : 'Submit vote'}
              </button>
            </form>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          versions={versions}
          onClose={() => setLightboxIndex(null)}
          onSelectVersion={handleSelect}
        />
      )}
    </PageShell>
  )
}

function PageShell({ project, children }: { project: Project; children: React.ReactNode }) {
  const deadlineLabel = formatDeadline(project.deadline)
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/open" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Design Hub</span>
          </Link>
          {deadlineLabel && deadlineLabel !== 'Closed' && (
            <span className="text-xs text-slate-400">{deadlineLabel}</span>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 text-center">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
            {project.title}
          </h2>
        </div>
        {children}
      </main>
    </div>
  )
}
