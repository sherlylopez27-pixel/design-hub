import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Design Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/open" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Open votes
            </Link>
            <Link href="/login" className="btn-primary text-sm">
              Admin sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/20 mb-6">
            Internal design tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Which design do <span className="text-indigo-600">you</span> prefer?
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            A simple way to collect design feedback from your team. No accounts needed to vote.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/open" className="btn-primary px-6 py-3 text-base w-full sm:w-auto">
              See open votes
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base w-full sm:w-auto">
              Admin sign in
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-sm text-slate-400">Design Hub — keep it simple</p>
      </footer>
    </main>
  )
}
