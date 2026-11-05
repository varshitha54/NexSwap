import { BookOpen } from 'lucide-react'

export default function EmptyState({ icon: Icon = BookOpen, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
