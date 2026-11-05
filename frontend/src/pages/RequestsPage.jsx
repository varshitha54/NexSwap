import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Inbox, Repeat2, Send, ShieldCheck } from 'lucide-react'
import { exchangeApi } from '../api'
import { getApiError } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ExchangeCard from '../components/ExchangeCard'
import Loader from '../components/Loader'
import { useToast } from '../context/ToastContext'

const actionConfig = {
  accept: {
    title: 'Accept this exchange request?',
    message: 'Both books will be reserved and other pending offers for this listing will be closed.',
    label: 'Accept request',
    tone: 'primary',
  },
  reject: {
    title: 'Reject this request?',
    message: 'The requester will be notified through their request history. The book stays available.',
    label: 'Reject request',
    tone: 'danger',
  },
  cancel: {
    title: 'Cancel your request?',
    message: 'Withdraw this pending request. You can request the book again later if it is still available.',
    label: 'Cancel request',
    tone: 'danger',
  },
  complete: {
    title: 'Mark the exchange complete?',
    message: 'This closes the exchange and marks both books as exchanged.',
    label: 'Mark completed',
    tone: 'primary',
  },
}

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'sent' ? 'sent' : 'received'
  const [tab, setTab] = useState(initialTab)
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionBusyId, setActionBusyId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([exchangeApi.received(), exchangeApi.sent()])
      .then(([receivedData, sentData]) => {
        if (!active) return
        setReceived(receivedData)
        setSent(sentData)
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

  const switchTab = (nextTab) => {
    setTab(nextTab)
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'received') next.delete('tab')
    else next.set('tab', nextTab)
    setSearchParams(next, { replace: true })
  }

  const runAction = async () => {
    if (!pendingAction) return
    const { action, request } = pendingAction
    setActionBusyId(request.id)
    try {
      await exchangeApi[action](request.id)
      const messages = {
        accept: 'Request accepted. Both books are now reserved.',
        reject: 'Request rejected.',
        cancel: 'Request cancelled.',
        complete: 'Exchange completed.',
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

  const config = pendingAction ? actionConfig[pendingAction.action] : null
  const items = tab === 'received' ? received : sent
  const pendingReceived = received.filter((request) => request.status === 'PENDING').length
  const pendingSent = sent.filter((request) => request.status === 'PENDING').length

  return (
    <main className="page requests-page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Exchange desk</span>
            <h1>Your requests</h1>
            <p>Review incoming offers and follow every swap you have started.</p>
          </div>
          <Link to="/books" className="btn btn--primary">
            Find another book <ArrowRight size={16} />
          </Link>
        </div>

        <div className="request-guide">
          <span className="request-guide__icon"><ShieldCheck size={19} /></span>
          <div>
            <strong>How an exchange progresses</strong>
            <p>
              A request is <b>pending</b> until the owner accepts or rejects it. Accepted
              exchanges reserve both books. Once you meet and swap, either student can mark
              the exchange <b>completed</b>.
            </p>
          </div>
        </div>

        <div className="request-tabs">
          <button
            type="button"
            className={`request-tab ${tab === 'received' ? 'is-active' : ''}`}
            onClick={() => switchTab('received')}
          >
            <span className="request-tab__icon"><Inbox size={19} /></span>
            <div>
              <strong>Received</strong>
              <span>Requests for your books</span>
            </div>
            {pendingReceived > 0 && <span className="request-tab__badge">{pendingReceived}</span>}
          </button>
          <button
            type="button"
            className={`request-tab ${tab === 'sent' ? 'is-active' : ''}`}
            onClick={() => switchTab('sent')}
          >
            <span className="request-tab__icon"><Send size={19} /></span>
            <div>
              <strong>Sent</strong>
              <span>Books you have requested</span>
            </div>
            {pendingSent > 0 && <span className="request-tab__badge">{pendingSent}</span>}
          </button>
        </div>

        {loading ? (
          <Loader label="Loading exchange requests" />
        ) : error ? (
          <div className="error-panel">
            <h3>Your requests could not load</h3>
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={tab === 'received' ? Inbox : Repeat2}
            title={tab === 'received' ? 'No requests received yet' : 'No requests sent yet'}
            description={
              tab === 'received'
                ? 'Once another student asks for one of your books, you can review their offer here.'
                : 'Explore the catalogue and send an exchange or purchase request to a fellow student.'
            }
            action={<Link to="/books" className="btn btn--primary">Browse the catalogue</Link>}
          />
        ) : (
          <div className="exchange-list">
            {items.map((request) => (
              <ExchangeCard
                key={request.id}
                request={request}
                mode={tab}
                onAction={(action, selected) => setPendingAction({ action, request: selected })}
                busy={actionBusyId === request.id}
              />
            ))}
          </div>
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
