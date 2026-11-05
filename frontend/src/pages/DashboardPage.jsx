import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  Handshake,
  Inbox,
  LibraryBig,
  Plus,
  Repeat2,
  Search,
  Sparkles,
} from 'lucide-react'
import { dashboardApi, exchangeApi } from '../api'
import { getApiError } from '../api/client'
import BookCover from '../components/BookCover'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ExchangeCard from '../components/ExchangeCard'
import Loader from '../components/Loader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { timeAgo } from '../utils/format'

const actionConfig = {
  accept: {
    title: 'Accept this exchange request?',
    message: 'Accepting reserves the requested book and any offered book, and politely closes the other pending requests for this listing.',
    label: 'Accept request',
    tone: 'primary',
  },
  reject: {
    title: 'Reject this request?',
    message: 'The requester will see that this exchange was declined. The book will stay available.',
    label: 'Reject request',
    tone: 'danger',
  },
  cancel: {
    title: 'Cancel your request?',
    message: 'This exchange request will be withdrawn. You can send a new request later if the book is still available.',
    label: 'Cancel request',
    tone: 'danger',
  },
  complete: {
    title: 'Mark this exchange as complete?',
    message: 'Both books will be marked as exchanged and this exchange will count toward your completed swaps.',
    label: 'Mark completed',
    tone: 'primary',
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionBusyId, setActionBusyId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    dashboardApi
      .stats()
      .then((data) => {
        if (active) setStats(data)
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

  const greeting = getGreeting()
  const firstName = user?.name?.split(' ')[0] || 'student'

  const runAction = async () => {
    if (!pendingAction) return
    const { action, request } = pendingAction
    setActionBusyId(request.id)
    try {
      await exchangeApi[action](request.id)
      const messages = {
        accept: 'Exchange accepted. Both books are now reserved.',
        reject: 'Request rejected.',
        cancel: 'Request cancelled.',
        complete: 'Exchange completed. Both books are now marked as exchanged.',
      }
      toast.success(messages[action])
      setPendingAction(null)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      toast.error(getApiError(requestError))
    } finally {
      setActionBusyId(null)
    }
  }

  const askAction = (action, request) => setPendingAction({ action, request })
  const config = pendingAction ? actionConfig[pendingAction.action] : null

  return (
    <main className="page dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{greeting}</span>
            <h1>Welcome back, {firstName}.</h1>
            <p>Here is what is happening across your shelf and exchange requests.</p>
          </div>
          <div className="dashboard-heading__actions">
            <Link to="/books" className="btn btn--outline">
              <Search size={16} /> Find a book
            </Link>
            <Link to="/listings/new" className="btn btn--primary">
              <Plus size={16} /> List a book
            </Link>
          </div>
        </div>

        {loading ? (
          <Loader label="Preparing your dashboard" />
        ) : error ? (
          <div className="error-panel">
            <h3>Your dashboard could not load</h3>
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                icon={LibraryBig}
                label="Books listed"
                value={stats.totalBooksListed}
                hint="Across your shelf"
                tone="indigo"
              />
              <StatCard
                icon={BookCheck}
                label="Active listings"
                value={stats.activeListings}
                hint="Available right now"
                tone="mint"
              />
              <StatCard
                icon={Inbox}
                label="Pending requests"
                value={stats.pendingIncomingRequests}
                hint={`${stats.sentPendingRequests} sent and waiting`}
                tone="amber"
              />
              <StatCard
                icon={Handshake}
                label="Completed exchanges"
                value={stats.completedExchanges}
                hint={`${stats.exchangedBooks} books passed on`}
                tone="rose"
              />
            </div>

            {stats.pendingIncomingRequests > 0 && (
              <div className="dashboard-callout">
                <span className="dashboard-callout__icon"><Sparkles size={19} /></span>
                <div>
                  <strong>
                    {stats.pendingIncomingRequests} {stats.pendingIncomingRequests === 1 ? 'student is' : 'students are'} waiting for your reply.
                  </strong>
                  <span>Review their offers to keep the exchange moving.</span>
                </div>
                <Link to="/requests" className="btn btn--ghost btn--sm">
                  Review requests <ArrowRight size={15} />
                </Link>
              </div>
            )}

            <div className="dashboard-layout">
              <div className="dashboard-main">
                <section className="panel">
                  <div className="panel__heading panel__heading--row">
                    <div className="panel__heading-group">
                      <span className="panel__icon"><Inbox size={19} /></span>
                      <div>
                        <h2>Requests received</h2>
                        <p>The latest exchange offers for your books.</p>
                      </div>
                    </div>
                    <Link to="/requests" className="text-link">
                      View all <ArrowRight size={15} />
                    </Link>
                  </div>

                  {stats.recentReceivedRequests.length > 0 ? (
                    <div className="exchange-stack">
                      {stats.recentReceivedRequests.slice(0, 3).map((request) => (
                        <ExchangeCard
                          key={request.id}
                          request={request}
                          mode="received"
                          onAction={askAction}
                          busy={actionBusyId === request.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Inbox}
                      title="No incoming requests yet"
                      description="When someone wants to swap for one of your books, their request will appear here."
                      action={
                        <Link to="/books" className="btn btn--ghost btn--sm">
                          Browse the catalogue
                        </Link>
                      }
                    />
                  )}
                </section>

                <section className="panel">
                  <div className="panel__heading panel__heading--row">
                    <div className="panel__heading-group">
                      <span className="panel__icon panel__icon--violet"><Repeat2 size={19} /></span>
                      <div>
                        <h2>Requests you have sent</h2>
                        <p>Track the offers you are waiting on.</p>
                      </div>
                    </div>
                    <Link to="/requests?tab=sent" className="text-link">
                      View all <ArrowRight size={15} />
                    </Link>
                  </div>

                  {stats.recentSentRequests.length > 0 ? (
                    <div className="exchange-stack">
                      {stats.recentSentRequests.slice(0, 2).map((request) => (
                        <ExchangeCard
                          key={request.id}
                          request={request}
                          mode="sent"
                          onAction={askAction}
                          busy={actionBusyId === request.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Search}
                      title="You haven’t sent any requests"
                      description="Find a book you need and send its owner an exchange or purchase request."
                      action={
                        <Link to="/books" className="btn btn--ghost btn--sm">
                          Find a book
                        </Link>
                      }
                    />
                  )}
                </section>
              </div>

              <aside className="dashboard-side">
                <section className="panel">
                  <div className="panel__heading panel__heading--row">
                    <div className="panel__heading-group">
                      <span className="panel__icon panel__icon--amber"><BookOpen size={19} /></span>
                      <div>
                        <h2>Recent listings</h2>
                      </div>
                    </div>
                  </div>

                  {stats.recentListings.length > 0 ? (
                    <div className="mini-listing-list">
                      {stats.recentListings.slice(0, 4).map((listing) => (
                        <Link to={`/books/${listing.id}`} className="mini-listing" key={listing.id}>
                          <BookCover book={listing} className="mini-listing__cover" showMeta={false} />
                          <div>
                            <strong>{listing.title}</strong>
                            <span>{listing.author}</span>
                            <small>{timeAgo(listing.createdAt)}</small>
                          </div>
                          <StatusBadge status={listing.status} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="dashboard-mini-empty">
                      <p>No books on your shelf yet.</p>
                      <Link to="/listings/new" className="btn btn--ghost btn--sm">
                        <Plus size={14} /> Add your first book
                      </Link>
                    </div>
                  )}

                  <Link to="/listings" className="panel__footer-link">
                    Manage my listings <ArrowRight size={15} />
                  </Link>
                </section>

                <section className="quick-actions">
                  <span className="eyebrow eyebrow--light">Quick actions</span>
                  <Link to="/listings/new">
                    <span><Plus size={17} /></span>
                    <div>
                      <strong>Add a listing</strong>
                      <small>Put a book back in circulation</small>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/books">
                    <span><Search size={17} /></span>
                    <div>
                      <strong>Browse books</strong>
                      <small>Find your next course read</small>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/requests">
                    <span><Repeat2 size={17} /></span>
                    <div>
                      <strong>Exchange requests</strong>
                      <small>Accept, reject or complete swaps</small>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={config?.title || ''}
        message={config?.message || ''}
        confirmLabel={config?.label || 'Confirm'}
        tone={config?.tone || 'primary'}
        loading={Boolean(actionBusyId)}
        onConfirm={runAction}
        onCancel={() => !actionBusyId && setPendingAction(null)}
      />
    </main>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
