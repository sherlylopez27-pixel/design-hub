interface Props {
  status: 'draft' | 'active' | 'closed'
}

export default function StatusBadge({ status }: Props) {
  if (status === 'active') {
    return (
      <span className="badge-active">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Active
      </span>
    )
  }
  if (status === 'closed') {
    return <span className="badge-closed">Closed</span>
  }
  return <span className="badge-draft">Draft</span>
}
