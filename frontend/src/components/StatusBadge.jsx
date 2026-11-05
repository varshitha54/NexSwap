import { statusLabel } from '../utils/constants'

export default function StatusBadge({ status, className = '' }) {
  const tone = String(status || '').toLowerCase()
  return (
    <span className={`status-badge status-badge--${tone} ${className}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}
