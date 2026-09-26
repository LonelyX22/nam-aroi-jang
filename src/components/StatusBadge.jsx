import { STATUS_LABELS } from '../lib/constants'

export default function StatusBadge({ status, language = 'th' }) {
  const label = STATUS_LABELS[status]?.[language] || status
  return <span className={`status-badge status-${status}`}>{label}</span>
}
