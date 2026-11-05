import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Logo({ to = '/', light = false }) {
  return (
    <Link className={`logo ${light ? 'logo--light' : ''}`} to={to} aria-label="NexSwap home">
      <span className="logo__mark">
        <BookOpen size={20} strokeWidth={2.4} aria-hidden="true" />
        <span className="logo__spark" />
      </span>
      <span className="logo__word">
        Nex<span>Swap</span>
      </span>
    </Link>
  )
}
