import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Handshake,
  LibraryBig,
  PlusCircle,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { bookApi, publicApi } from '../api'
import BookCard from '../components/BookCard'
import BookCover from '../components/BookCover'
import CategoryIcon from '../components/CategoryIcon'
import EmptyState from '../components/EmptyState'
import { CardSkeleton } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_LABELS, categoryLabel } from '../utils/constants'
import { formatPrice } from '../utils/format'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Find your next book',
    text: 'Search by title, author or subject and filter for the edition, condition and price that suit you.',
  },
  {
    icon: Handshake,
    number: '02',
    title: 'Make a swap',
    text: 'Send an exchange request with one of your own books, or arrange a direct purchase with the seller.',
  },
  {
    icon: Repeat2,
    number: '03',
    title: 'Keep stories moving',
    text: 'Meet on campus, complete the exchange and give both books a productive next semester.',
  },
]

const values = [
  {
    icon: ShieldCheck,
    title: 'Built around students',
    text: 'A focused campus marketplace with verified student profiles and no anonymous listings.',
  },
  {
    icon: BadgeCheck,
    title: 'Clear, honest listings',
    text: 'Every book includes its condition, category and estimated value so there are no surprises.',
  },
  {
    icon: Users,
    title: 'Better for your budget',
    text: 'Exchange the books you have finished for the ones on next semester’s reading list.',
  },
]

const decorativeBooks = [
  {
    title: 'Design & Ideas',
    author: 'Studio Collection',
    category: 'ARTS_DESIGN',
  },
  {
    title: 'Data Structures',
    author: 'Campus Edition',
    category: 'COMPUTER_SCIENCE',
  },
  {
    title: 'Modern Fiction',
    author: 'Reading Circle',
    category: 'LITERATURE',
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ availableBooks: 0, registeredStudents: 0, completedExchanges: 0 })
  const [loading, setLoading] = useState(true)
  const [apiIssue, setApiIssue] = useState(false)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      bookApi.featured(8),
      bookApi.categories(),
      publicApi.stats(),
    ]).then(([featuredResult, categoriesResult, statsResult]) => {
      if (!active) return
      if (featuredResult.status === 'fulfilled') setFeatured(featuredResult.value)
      if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value)
      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      setApiIssue(
        featuredResult.status === 'rejected'
        || categoriesResult.status === 'rejected'
        || statsResult.status === 'rejected',
      )
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const heroBooks = featured.length >= 3 ? featured.slice(0, 3) : decorativeBooks
  const topCategories = categories.filter((category) => category.category !== 'OTHER').slice(0, 8)

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero__noise" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__pill">
              <Sparkles size={15} /> The student-to-student book marketplace
            </span>
            <h1>
              Textbooks find their <em>next chapter.</em>
            </h1>
            <p className="hero__lead">
              Buy, sell and swap course books with students on your campus.
              Keep good books in circulation and keep more of your semester budget.
            </p>

            <div className="hero__actions">
              <Link to="/books" className="btn btn--primary btn--lg">
                Explore the shelves <ArrowRight size={17} />
              </Link>
              <Link
                to={isAuthenticated ? '/listings/new' : '/register'}
                className="btn btn--outline btn--lg"
              >
                <PlusCircle size={17} /> {isAuthenticated ? 'List a book' : 'Join NexSwap'}
              </Link>
            </div>

            <div className="hero__metrics">
              <div>
                <strong>{loading ? '—' : stats.availableBooks}</strong>
                <span>books available</span>
              </div>
              <span className="hero__metric-divider" />
              <div>
                <strong>{loading ? '—' : stats.registeredStudents}</strong>
                <span>students joined</span>
              </div>
              <span className="hero__metric-divider" />
              <div>
                <strong>{loading ? '—' : stats.completedExchanges}</strong>
                <span>books rehomed</span>
              </div>
            </div>
          </div>

          <div className="hero__showcase" aria-label="Books available to exchange on NexSwap">
            <div className="hero__halo" aria-hidden="true" />
            <div className="hero-stack">
              <div className="hero-book hero-book--back">
                <BookCover book={heroBooks[2]} />
              </div>
              <div className="hero-book hero-book--middle">
                <BookCover book={heroBooks[1]} />
              </div>
              <div className="hero-book hero-book--front">
                <BookCover book={heroBooks[0]} />
              </div>
              <div className="hero-float hero-float--match">
                <span className="hero-float__icon"><Repeat2 size={16} /></span>
                <span>
                  <strong>Exchange matched</strong>
                  <small>{categoryLabel(heroBooks[0]?.category)} · campus pickup</small>
                </span>
              </div>
              <div className="hero-float hero-float--price">
                <span>From</span>
                <strong>{formatPrice(heroBooks[0]?.price || 249)}</strong>
              </div>
            </div>
            <span className="hero__stamp" aria-hidden="true">
              <BookOpen size={18} /> Campus reads
            </span>
          </div>
        </div>
      </section>

      {apiIssue && (
        <div className="container">
          <div className="inline-notice">
            <LibraryBig size={18} />
            <span>
              The live catalogue is taking a moment to load. Make sure the NexSwap API and
              MySQL are running, then refresh.
            </span>
          </div>
        </div>
      )}

      <section className="section section--featured">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Fresh on the shelf</span>
              <h2>Books looking for a new reader</h2>
            </div>
            <Link to="/books" className="text-link">
              Browse all books <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <CardSkeleton count={4} />
          ) : featured.length > 0 ? (
            <div className="book-grid book-grid--home">
              {featured.slice(0, 8).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="The shelves are waiting for their first book"
              description="Be the student who starts the collection. List a textbook you have finished with."
              action={
                <Link to={isAuthenticated ? '/listings/new' : '/register'} className="btn btn--primary">
                  <PlusCircle size={16} /> List the first book
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="section section--categories">
        <div className="container">
          <div className="section-heading section-heading--center">
            <div>
              <span className="eyebrow">Browse by subject</span>
              <h2>Find the right shelf, fast</h2>
              <p>From first-year foundations to final-year specialisations.</p>
            </div>
          </div>

          <div className="category-grid">
            {topCategories.map((category) => (
              <Link
                key={category.category}
                to={`/books?category=${category.category}`}
                className="category-tile"
              >
                <span className="category-tile__icon">
                  <CategoryIcon category={category.category} size={23} />
                </span>
                <span className="category-tile__body">
                  <strong>{CATEGORY_LABELS[category.category]}</strong>
                  <small>{category.count} {category.count === 1 ? 'book' : 'books'}</small>
                </span>
                <ArrowRight size={16} className="category-tile__arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--steps" id="how-it-works">
        <div className="container">
          <div className="steps-panel">
            <div className="steps-panel__intro">
              <span className="eyebrow eyebrow--light">Simple by design</span>
              <h2>From shelf to student in three steps.</h2>
              <p>
                NexSwap keeps the exchange clear: discover a book, agree with its owner,
                and close the loop when you meet.
              </p>
              <Link to="/books" className="btn btn--accent">
                Start browsing <ArrowRight size={16} />
              </Link>
            </div>

            <div className="steps-list">
              {steps.map(({ icon: Icon, number, title, text }) => (
                <div className="step" key={number}>
                  <span className="step__number">{number}</span>
                  <span className="step__icon"><Icon size={20} /></span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--values">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Why NexSwap</span>
              <h2>A marketplace that belongs on campus</h2>
            </div>
          </div>
          <div className="value-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <article className="value-card" key={title}>
                <span className="value-card__icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cta">
        <div className="container">
          <div className="cta-panel">
            <div className="cta-panel__art" aria-hidden="true">
              <span className="cta-book cta-book--one" />
              <span className="cta-book cta-book--two" />
              <span className="cta-book cta-book--three" />
            </div>
            <div className="cta-panel__copy">
              <span className="eyebrow eyebrow--light">Your books have more to give</span>
              <h2>Give your shelf a second semester.</h2>
              <p>
                Turn the books you have outgrown into someone else’s next great idea.
              </p>
              <div className="cta-panel__actions">
                <Link
                  to={isAuthenticated ? '/listings/new' : '/register'}
                  className="btn btn--accent btn--lg"
                >
                  List a book <ArrowRight size={17} />
                </Link>
                <Link to="/books" className="btn btn--ghost-light btn--lg">
                  Explore listings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
