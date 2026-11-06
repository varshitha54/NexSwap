import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Repeat2,
  Tag,
  Trash2,
} from 'lucide-react'
import { bookApi } from '../api'
import { getApiError } from '../api/client'
import BookCover from '../components/BookCover'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { categoryLabel, conditionLabel } from '../utils/constants'
import { formatPrice, timeAgo } from '../utils/format'

const tabs = [
  { value: 'ALL', label: 'All listings' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'EXCHANGED', label: 'Exchanged' },
  { value: 'HIDDEN', label: 'Hidden' },
]

export default function MyListingsPage() {
  const toast = useToast()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('ALL')
  const [busyId, setBusyId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    bookApi
      .myListings()
      .then((data) => {
        if (active) setListings(data)
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
  }, [reloadKey])

  const counts = listings.reduce(
    (accumulator, listing) => {
      accumulator.ALL += 1
      accumulator[listing.status] = (accumulator[listing.status] || 0) + 1
      return accumulator
    },
    { ALL: 0 },
  )

  const visible = tab === 'ALL'
    ? listings
    : listings.filter((listing) => listing.status === tab)

  const toggleVisibility = async (listing) => {
    setBusyId(listing.id)
    try {
      const updated = await bookApi.updateStatus(
        listing.id,
        listing.status === 'HIDDEN' ? 'AVAILABLE' : 'HIDDEN',
      )
      setListings((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(updated.status === 'HIDDEN' ? 'Listing hidden.' : 'Listing is live again.')
    } catch (requestError) {
      toast.error(getApiError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  const deleteListing = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await bookApi.remove(deleteTarget.id)
      setListings((current) => current.filter((listing) => listing.id !== deleteTarget.id))
      toast.success('Listing removed from your shelf.')
      setDeleteTarget(null)
    } catch (requestError) {
      toast.error(getApiError(requestError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="page my-listings-page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Your shelf</span>
            <h1>My listings</h1>
            <p>Manage the books you have added and track what is still available.</p>
          </div>
          <Link to="/listings/new" className="btn btn--primary">
            <Plus size={17} /> Add a book
          </Link>
        </div>

        <div className="listing-summary">
          <div>
            <span>Total</span>
            <strong>{counts.ALL || 0}</strong>
          </div>
          <div>
            <span>Available</span>
            <strong>{counts.AVAILABLE || 0}</strong>
          </div>
          <div>
            <span>Reserved</span>
            <strong>{counts.RESERVED || 0}</strong>
          </div>
          <div>
            <span>Exchanged</span>
            <strong>{counts.EXCHANGED || 0}</strong>
          </div>
          <div>
            <span>Hidden</span>
            <strong>{counts.HIDDEN || 0}</strong>
          </div>
        </div>

        <div className="tab-row" role="tablist" aria-label="Filter listings">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={`tab ${tab === item.value ? 'is-active' : ''}`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              <span>{counts[item.value] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <Loader label="Loading your listings" />
        ) : error ? (
          <div className="error-panel">
            <h3>Your listings could not load</h3>
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={listings.length === 0 ? 'Your shelf is ready for its first book' : `No ${tab.toLowerCase()} listings`}
            description={
              listings.length === 0
                ? 'List a textbook, set your price or invite a swap, and reach students on your campus.'
                : 'Try another status tab or add a new book to your shelf.'
            }
            action={
              <Link to="/listings/new" className="btn btn--primary">
                <Plus size={16} /> Add a book
              </Link>
            }
          />
        ) : (
          <div className="listing-list">
            {visible.map((listing) => {
              const locked = ['RESERVED', 'EXCHANGED'].includes(listing.status)
              return (
                <article className="listing-row" key={listing.id}>
                  <Link to={`/books/${listing.id}`} className="listing-row__cover-wrap">
                    <BookCover book={listing} className="listing-row__cover" showMeta={false} />
                  </Link>

                  <div className="listing-row__main">
                    <div className="listing-row__heading">
                      <div>
                        <span className="eyebrow eyebrow--small">{categoryLabel(listing.category)}</span>
                        <Link to={`/books/${listing.id}`} className="listing-row__title">
                          {listing.title}
                        </Link>
                        <p>by {listing.author}</p>
                      </div>
                      <StatusBadge status={listing.status} />
                    </div>

                    <div className="listing-row__meta">
                      <span>{conditionLabel(listing.condition)}</span>
                      <span>{listing.listingType === 'EXCHANGE'
                        ? <><Repeat2 size={13} /> Exchange</>
                        : <><Tag size={13} /> {formatPrice(listing.price)}</>}
                      </span>
                      <span>Updated {timeAgo(listing.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="listing-row__actions">
                    <Link to={`/books/${listing.id}`} className="btn btn--ghost btn--sm">
                      View <ArrowRight size={14} />
                    </Link>
                    <Link
                      to={`/listings/${listing.id}/edit`}
                      className={`btn btn--ghost btn--sm ${locked ? 'is-disabled' : ''}`}
                      aria-disabled={locked}
                      onClick={(event) => locked && event.preventDefault()}
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    {(listing.status === 'AVAILABLE' || listing.status === 'HIDDEN') && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        disabled={busyId === listing.id}
                        onClick={() => toggleVisibility(listing)}
                      >
                        {listing.status === 'HIDDEN' ? <Eye size={14} /> : <EyeOff size={14} />}
                        {listing.status === 'HIDDEN' ? 'Show' : 'Hide'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--ghost-danger btn--sm"
                      onClick={() => setDeleteTarget(listing)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this listing?"
        message={deleteTarget
          ? `“${deleteTarget.title}” will be removed from the public catalogue. This cannot be undone from the shelf view.`
          : ''}
        confirmLabel="Delete listing"
        loading={deleting}
        onConfirm={deleteListing}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </main>
  )
}
