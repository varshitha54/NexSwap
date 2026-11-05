export default function Loader({ label = 'Loading', full = false }) {
  return (
    <div className={`loader ${full ? 'loader--full' : ''}`} role="status">
      <span className="loader__spinner" aria-hidden="true" />
      <span className="loader__label">{label}</span>
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="book-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton--cover" />
          <div className="skeleton-card__body">
            <span className="skeleton skeleton--line skeleton--short" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--medium" />
          </div>
        </div>
      ))}
    </div>
  )
}
