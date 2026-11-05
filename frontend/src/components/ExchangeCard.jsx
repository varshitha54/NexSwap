import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCheck,
  Mail,
  MessageSquareQuote,
  Phone,
  Repeat2,
  X,
} from 'lucide-react'
import Avatar from './Avatar'
import BookCover from './BookCover'
import StatusBadge from './StatusBadge'
import { formatDateTime, timeAgo } from '../utils/format'

export default function ExchangeCard({ request, mode = 'received', onAction, busy = false }) {
  const counterpart = mode === 'received' ? request.requester : request.owner
  const canReview = mode === 'received' && request.status === 'PENDING'
  const canCancel = mode === 'sent' && request.status === 'PENDING'
  const canComplete = request.status === 'ACCEPTED'

  return (
    <article className="exchange-card">
      <div className="exchange-card__header">
        <div className="exchange-card__person">
          <Avatar name={counterpart?.name} size="sm" />
          <div>
            <strong>{counterpart?.name}</strong>
            <span>{counterpart?.collegeName}</span>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="exchange-card__books">
        <div className="exchange-card__book">
          <BookCover book={request.book} className="exchange-card__cover" showMeta={false} />
          <div>
            <span className="exchange-card__label">{mode === 'received' ? 'Requested' : 'You requested'}</span>
            <Link to={`/books/${request.book?.id}`}>{request.book?.title}</Link>
            <small>{request.book?.author}</small>
          </div>
        </div>

        {request.offeredBook && (
          <>
            <span className="exchange-card__arrow" aria-hidden="true">
              <Repeat2 size={17} />
            </span>
            <div className="exchange-card__book">
              <BookCover book={request.offeredBook} className="exchange-card__cover" showMeta={false} />
              <div>
                <span className="exchange-card__label">Offered in return</span>
                <Link to={`/books/${request.offeredBook.id}`}>{request.offeredBook.title}</Link>
                <small>{request.offeredBook.author}</small>
              </div>
            </div>
          </>
        )}
      </div>

      {request.message && (
        <div className="exchange-card__message">
          <MessageSquareQuote size={16} />
          <p>{request.message}</p>
        </div>
      )}

      <div className="exchange-card__contact">
        <a href={`mailto:${counterpart?.email}`}>
          <Mail size={14} /> {counterpart?.email}
        </a>
        {counterpart?.phone && (
          <a href={`tel:${counterpart.phone}`}>
            <Phone size={14} /> {counterpart.phone}
          </a>
        )}
      </div>

      <div className="exchange-card__footer">
        <span className="exchange-card__time" title={formatDateTime(request.createdAt)}>
          Requested {timeAgo(request.createdAt)}
        </span>
        <div className="exchange-card__actions">
          {canReview && (
            <>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={busy}
                onClick={() => onAction?.('reject', request)}
              >
                <X size={15} /> Reject
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={busy}
                onClick={() => onAction?.('accept', request)}
              >
                <Check size={15} /> Accept
              </button>
            </>
          )}
          {canCancel && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={busy}
              onClick={() => onAction?.('cancel', request)}
            >
              <X size={15} /> Cancel request
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="btn btn--success btn--sm"
              disabled={busy}
              onClick={() => onAction?.('complete', request)}
            >
              <CheckCheck size={15} /> Mark completed
            </button>
          )}
          {request.status === 'COMPLETED' && (
            <Link to={`/books/${request.book?.id}`} className="btn btn--ghost btn--sm">
              View book <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
