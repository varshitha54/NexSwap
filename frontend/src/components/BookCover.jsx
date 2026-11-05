import { useEffect, useState } from 'react'
import CategoryIcon from './CategoryIcon'
import { categoryLabel } from '../utils/constants'
import { mediaUrl } from '../utils/media'

const TONES = {
  COMPUTER_SCIENCE: 0,
  ENGINEERING: 1,
  BUSINESS: 2,
  SCIENCE: 3,
  MATHEMATICS: 4,
  LITERATURE: 5,
  ARTS_DESIGN: 6,
  COMPETITIVE_EXAMS: 7,
  OTHER: 8,
}

export default function BookCover({ book, className = '', showMeta = true }) {
  const [broken, setBroken] = useState(false)
  const image = mediaUrl(book?.imageUrl)

  useEffect(() => {
    setBroken(false)
  }, [book?.imageUrl])

  const tone = TONES[book?.category] ?? 8
  const hasImage = image && !broken

  return (
    <div className={`book-cover book-cover--${tone} ${className}`}>
      {hasImage ? (
        <img
          src={image}
          alt={`${book.title} by ${book.author}`}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="book-cover__fallback">
          <div className="book-cover__fallback-top">
            <span>{categoryLabel(book?.category)}</span>
            <CategoryIcon category={book?.category} size={19} />
          </div>
          <div className="book-cover__fallback-title">
            <strong>{book?.title || 'Your next read'}</strong>
            {showMeta && <small>{book?.author || 'NexSwap'}</small>}
          </div>
          <span className="book-cover__fallback-brand">NexSwap</span>
        </div>
      )}
    </div>
  )
}
