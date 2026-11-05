import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, BookOpen, Compass } from 'lucide-react'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <main className="not-found-page">
      <div className="not-found-page__inner">
        <span className="not-found-page__code">404</span>
        <span className="not-found-page__icon">
          <Compass size={28} />
        </span>
        <h1>This shelf doesn’t exist.</h1>
        <p>
          We couldn’t find <code>{location.pathname}</code>. The page may have moved,
          or the link may have taken a wrong turn.
        </p>
        <div className="not-found-page__actions">
          <Link to="/" className="btn btn--primary">
            <ArrowLeft size={16} /> Back home
          </Link>
          <Link to="/books" className="btn btn--outline">
            <BookOpen size={16} /> Browse books
          </Link>
        </div>
      </div>
    </main>
  )
}
