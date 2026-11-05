import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Repeat2,
  Tag,
  Trash2,
  UserRound,
} from 'lucide-react'
import { bookApi, exchangeApi } from '../api'
import { getApiError } from '../api/client'
import Avatar from '../components/Avatar'
import BookCard from '../components/BookCard'
import BookCover from '../components/BookCover'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  categoryLabel,
  conditionLabel,
  LISTING_TYPE_LABELS,
} from '../utils/constants'
import { formatDate, formatPrice } from '../utils/format'

export default function BookDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const toast = useToast()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contact, setContact] = useState(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [myListings, setMyListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [form, setForm] = useState({ offeredBookId: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setBook(null)
    setContact(null)
    setRelated([])
    setRequestOpen(false)
    setContactOpen(false)
    bookApi
      .get(id)
      .then((data) => {
        if (active) setBook(data)
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!book) return undefined
    let active = true
    bookApi
      .search({ category: book.category, size: 5, sort: 'newest' })
      .then((result) => {
        if (active) setRelated(result.content.filter((item) => item.id !== book.id).slice(0, 4))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [book])

  if (loading) {
    return (
      <main className="page">
        <Loader full label="Opening the book details" />
      </main>
    )
  }

  if (error || !book) {
    return (
      <main className="page">
        <div className="container">
          <EmptyState
            icon={BookOpen}
            title="This book is not on the shelf"
            description={error || 'The listing may have been removed or is no longer public.'}
            action={<Link to="/books" className="btn btn--primary">Back to the catalogue</Link>}
          />
        </div>
      </main>
    )
  }

  const isOwner = user?.id === book.seller.id
  const canManage = isOwner || isAdmin
  const canRequest = !isOwner && book.status === 'AVAILABLE'
  const isExchange = book.listingType === 'EXCHANGE'

  const openRequest = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/books/${book.id}` } })
      return
    }
    setRequestOpen(true)
    setForm({ offeredBookId: '', message: '' })
    if (isExchange) {
      setListingsLoading(true)
      bookApi
        .myListings()
        .then((listings) => {
          setMyListings(
            listings.filter((listing) => listing.status === 'AVAILABLE' && listing.id !== book.id),
          )
        })
        .catch((requestError) => toast.error(getApiError(requestError)))
        .finally(() => setListingsLoading(false))
    }
  }

  const openContact = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/books/${book.id}` } })
      return
    }
    setContactOpen(true)
    if (!contact) {
      setContactLoading(true)
      bookApi
        .contact(book.id)
        .then(setContact)
        .catch((requestError) => toast.error(getApiError(requestError)))
        .finally(() => setContactLoading(false))
    }
  }

  const submitRequest = async (event) => {
    event.preventDefault()
    if (isExchange && !form.offeredBookId) {
      toast.error('Choose a book to offer in exchange.')
      return
    }
    setSubmitting(true)
    try {
      await exchangeApi.create({
        bookId: book.id,
        offeredBookId: form.offeredBookId ? Number(form.offeredBookId) : null,
        message: form.message || null,
      })
      toast.success('Request sent. The owner can now review your offer.')
      setRequestOpen(false)
    } catch (requestError) {
      toast.error(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleVisibility = async () => {
    setStatusBusy(true)
    try {
      const updated = await bookApi.updateStatus(
        book.id,
        book.status === 'HIDDEN' ? 'AVAILABLE' : 'HIDDEN',
      )
      setBook(updated)
      toast.success(updated.status === 'HIDDEN' ? 'Listing hidden from the catalogue.' : 'Listing is live again.')
    } catch (requestError) {
      toast.error(getApiError(requestError))
    } finally {
      setStatusBusy(false)
    }
  }

  const deleteListing = async () => {
    setDeleting(true)
    try {
      await bookApi.remove(book.id)
      toast.success('Listing removed.')
      navigate('/listings')
    } catch (requestError) {
      toast.error(getApiError(requestError))
      setDeleting(false)
    }
  }

  return (
    <main className="page book-detail-page">
      <div className="container">
        <Link to="/books" className="back-link">
          <ArrowLeft size={16} /> Back to the catalogue
        </Link>

        <div className="book-detail">
          <section className="book-detail__visual">
            <BookCover book={book} className="book-detail__cover" />
            <div className="book-detail__visual-badges">
              <span className={`book-card__type ${isExchange ? 'is-exchange' : 'is-sale'}`}>
                {isExchange ? <Repeat2 size={14} /> : <Tag size={14} />}
                {LISTING_TYPE_LABELS[book.listingType]}
              </span>
              <StatusBadge status={book.status} />
            </div>
            <div className="book-detail__quickfacts">
              <span><BookOpen size={15} /> {conditionLabel(book.condition)}</span>
              <span><MapPin size={15} /> {book.seller.collegeName}</span>
            </div>
          </section>

          <section className="book-detail__info">
            <div className="book-detail__heading">
              <span className="eyebrow">{categoryLabel(book.category)}</span>
              <h1>{book.title}</h1>
              <p className="book-detail__author">by {book.author}</p>
            </div>

            <div className="book-detail__price-row">
              <div>
                <span className="book-detail__price-label">
                  {isExchange ? 'Estimated value' : 'Asking price'}
                </span>
                <strong>{formatPrice(book.price)}</strong>
                {isExchange && <small>Open to a book swap of similar value</small>}
              </div>
              <span className="book-detail__condition">{conditionLabel(book.condition)}</span>
            </div>

            {canRequest ? (
              <div className="book-detail__actions">
                <button type="button" className="btn btn--primary btn--lg" onClick={openRequest}>
                  {isExchange ? <Repeat2 size={18} /> : <Tag size={18} />}
                  {isExchange ? 'Request an exchange' : 'Request to buy'}
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={openContact}>
                  <MessageCircle size={18} /> Contact seller
                </button>
              </div>
            ) : (
              <div className="availability-note">
                {isOwner ? (
                  <>
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>This is your listing.</strong>
                      <span>Manage its details, visibility and requests from your dashboard.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
                    <div>
                      <strong>This book is {book.status.toLowerCase()}.</strong>
                      <span>It is not accepting new requests right now.</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {canManage && (
              <div className="owner-toolbar">
                <Link to={`/listings/${book.id}/edit`} className="btn btn--ghost btn--sm">
                  <Pencil size={15} /> Edit listing
                </Link>
                {(book.status === 'AVAILABLE' || book.status === 'HIDDEN') && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={toggleVisibility}
                    disabled={statusBusy}
                  >
                    {book.status === 'HIDDEN' ? <Eye size={15} /> : <EyeOff size={15} />}
                    {book.status === 'HIDDEN' ? 'Show listing' : 'Hide listing'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--ghost-danger btn--sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}

            <div className="book-detail__description">
              <h2>About this book</h2>
              <p>{book.description}</p>
            </div>

            <dl className="detail-grid">
              <div>
                <dt>Category</dt>
                <dd>{categoryLabel(book.category)}</dd>
              </div>
              <div>
                <dt>Condition</dt>
                <dd>{conditionLabel(book.condition)}</dd>
              </div>
              <div>
                <dt>Listing type</dt>
                <dd>{LISTING_TYPE_LABELS[book.listingType]}</dd>
              </div>
              <div>
                <dt>Listed on</dt>
                <dd>{formatDate(book.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <aside className="seller-card">
            <span className="eyebrow">Listed by</span>
            <div className="seller-card__person">
              <Avatar name={book.seller.name} size="lg" />
              <div>
                <strong>{book.seller.name}</strong>
                <span><MapPin size={14} /> {book.seller.collegeName}</span>
              </div>
            </div>
            <div className="seller-card__divider" />
            <div className="seller-card__meta">
              <span><CalendarDays size={15} /> Listed {formatDate(book.createdAt)}</span>
              <span><UserRound size={15} /> Student seller</span>
            </div>
            {!isOwner && (
              <button type="button" className="btn btn--outline btn--block" onClick={openContact}>
                <Mail size={16} /> Contact seller
              </button>
            )}
            <p className="seller-card__note">
              Keep conversations on campus and inspect the book before completing any exchange.
            </p>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="section related-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Same shelf</span>
                <h2>More in {categoryLabel(book.category)}</h2>
              </div>
              <Link to={`/books?category=${book.category}`} className="text-link">
                See all <ArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
              </Link>
            </div>
            <div className="book-grid">
              {related.map((item) => <BookCard key={item.id} book={item} />)}
            </div>
          </section>
        )}
      </div>

      <Modal
        open={requestOpen}
        onClose={() => !submitting && setRequestOpen(false)}
        eyebrow={isExchange ? 'Make a swap' : 'Purchase request'}
        title={isExchange ? 'Offer a book in exchange' : 'Request this book'}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setRequestOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="exchange-request-form"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          </>
        }
      >
        <div className="request-book-preview">
          <BookCover book={book} className="request-book-preview__cover" showMeta={false} />
          <div>
            <strong>{book.title}</strong>
            <span>{book.author}</span>
            <small>{formatPrice(book.price)} · {conditionLabel(book.condition)}</small>
          </div>
        </div>

        <form id="exchange-request-form" onSubmit={submitRequest} className="stack-form">
          {isExchange && (
            <div className="field">
              <label htmlFor="offeredBookId">Your book to offer</label>
              {listingsLoading ? (
                <Loader label="Loading your books" />
              ) : myListings.length > 0 ? (
                <select
                  id="offeredBookId"
                  value={form.offeredBookId}
                  onChange={(event) => setForm((current) => ({ ...current, offeredBookId: event.target.value }))}
                  required
                >
                  <option value="">Choose an available listing…</option>
                  {myListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title} — {conditionLabel(listing.condition)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="inline-form-note">
                  <Repeat2 size={17} />
                  <p>
                    You need an available book to offer before requesting an exchange.
                    <button type="button" onClick={() => navigate('/listings/new')}>
                      List a book first
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {!isExchange && (
            <div className="inline-form-note">
              <Tag size={17} />
              <p>
                This will let {book.seller.name.split(' ')[0]} know you are interested in buying.
                Agree on payment and pickup directly with the seller.
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="exchange-message">Message <span>(optional)</span></label>
            <textarea
              id="exchange-message"
              rows="4"
              maxLength="1000"
              placeholder="Introduce yourself, mention a pickup spot or ask about the book…"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
            <small className="field__hint">{form.message.length}/1000</small>
          </div>
        </form>
      </Modal>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        eyebrow="Seller details"
        title="Contact the seller"
        size="sm"
      >
        {contactLoading ? (
          <Loader label="Loading contact details" />
        ) : contact ? (
          <div className="contact-card">
            <div className="contact-card__person">
              <Avatar name={contact.name} size="lg" />
              <div>
                <strong>{contact.name}</strong>
                <span>{contact.collegeName}</span>
              </div>
            </div>
            <a href={`mailto:${contact.email}`} className="contact-card__row">
              <Mail size={17} />
              <span>
                <small>Email</small>
                {contact.email}
              </span>
            </a>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="contact-card__row">
                <Phone size={17} />
                <span>
                  <small>Phone</small>
                  {contact.phone}
                </span>
              </a>
            )}
            <p className="contact-card__hint">
              Mention the book title when you reach out. For exchanges, send a request so the
              agreement is tracked in NexSwap.
            </p>
            <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`NexSwap: ${book.title}`)}`} className="btn btn--primary btn--block">
              <Mail size={16} /> Send an email
            </a>
          </div>
        ) : (
          <p className="modal-copy">Contact details are not available right now.</p>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Remove this listing?"
        message="The listing will disappear from your shelf and the public catalogue. Existing exchange history is preserved, but open requests will be closed."
        confirmLabel="Delete listing"
        loading={deleting}
        onConfirm={deleteListing}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  )
}
