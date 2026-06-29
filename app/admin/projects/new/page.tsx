import type { Metadata } from 'next'
import ProjectForm from '../ProjectForm'

export const metadata: Metadata = { title: 'New project' }

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New project</h1>
        <p className="text-sm text-slate-500 mt-1">Set up a new design vote for your team.</p>
      </div>
      <ProjectForm />
    </div>
  )
}
