'use client'

import { useState, useTransition } from 'react'
import { sendMagicLink } from './actions'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await sendMagicLink(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="font-bold text-slate-900 text-lg mb-2">Check your email</h2>
        <p className="text-sm text-slate-500">
          We sent a sign-in link to <strong>{email}</strong>. Click the link to access the admin area.
        </p>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-6 text-sm text-indigo-600 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Work email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !email}
          className="btn-primary w-full py-3"
        >
          {isPending ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        Only authorised team members can sign in.
      </p>
    </div>
  )
}
