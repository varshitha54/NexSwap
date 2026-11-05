import { Link } from 'react-router-dom'
import { ArrowUpRight, Repeat2, Tag } from 'lucide-react'
import Avatar from './Avatar'
import BookCover from './BookCover'
import { categoryLabel, conditionLabel } from '../utils/constants'
import { formatPrice } from '../utils/format'

export default function BookCard({ book, className = '' }) {
  const isExchange = book.listingType === 'EXCHANGE'

  return (
    <Link to={`/books/${book.id}`} className={`book-card ${className}`}>
      <div className="book-card__visual">
        <BookCover book={book} className="book-card__cover" />
        <span className={`book-card__type ${isExchange ? 'is-exchange' : 'is-sale'}`}>
          {isExchange ? <Repeat2 size={13} /> : <Tag size={13} />}
          {isExchange ? 'Exchange' : 'For sale'}
        </span>
        <span className="book-card__condition">{conditionLabel(book.condition)}</span>
      </div>

      <div className="book-card__body">
        <span className="eyebrow eyebrow--small">{categoryLabel(book.category)}</span>
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__author">by {book.author}</p>

        <div className="book-card__footer">
          <div className="book-card__seller">
            <Avatar name={book.seller?.name} size="xs" />
            <span>
              <strong>{book.seller?.name}</strong>
              <small>{book.seller?.collegeName}</small>
            </span>
          </div>
          <div className="book-card__price">
            {isExchange ? (
              <>
                <strong>Swap</strong>
                <small>Est. {formatPrice(book.price)}</small>
              </>
            ) : (
              <strong>{formatPrice(book.price)}</strong>
            )}
          </div>
        </div>
      </div>
      <span className="book-card__arrow" aria-hidden="true">
        <ArrowUpRight size={16} />
      </span>
    </Link>
  )
}
