export default function StatCard({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon">
          <Icon size={20} />
        </span>
        <span className="stat-card__label">{label}</span>
      </div>
      <strong className="stat-card__value">{value}</strong>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </article>
  )
}
