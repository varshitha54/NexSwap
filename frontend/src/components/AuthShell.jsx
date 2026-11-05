import { ArrowUpRight, BookOpen, Repeat2, ShieldCheck } from 'lucide-react'

export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <main className="auth-page">
      <div className="container auth-shell">
        <aside className="auth-showcase">
          <span className="auth-showcase__eyebrow">
            <BookOpen size={15} /> The campus book network
          </span>
          <h1>
            Every book deserves
            <br />a <em>second chapter.</em>
          </h1>
          <p>
            Join students across campus to pass on the books you have finished and
            find the ones you need next.
          </p>

          <div className="auth-showcase__stack" aria-hidden="true">
            <span className="auth-spine auth-spine--one">ECONOMICS</span>
            <span className="auth-spine auth-spine--two">DESIGN</span>
            <span className="auth-spine auth-spine--three">ALGORITHMS</span>
            <span className="auth-spine auth-spine--four">LITERATURE</span>
            <span className="auth-showcase__seal">
              <Repeat2 size={22} /> Swap
            </span>
          </div>

          <div className="auth-showcase__points">
            <span><ShieldCheck size={16} /> Student-only community</span>
            <span><ArrowUpRight size={16} /> Zero listing fees</span>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-panel__heading">
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}
