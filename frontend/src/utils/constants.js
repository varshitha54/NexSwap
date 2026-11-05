export const CATEGORY_LABELS = {
  COMPUTER_SCIENCE: 'Computer Science',
  ENGINEERING: 'Engineering',
  BUSINESS: 'Business',
  SCIENCE: 'Science',
  MATHEMATICS: 'Mathematics',
  LITERATURE: 'Literature',
  ARTS_DESIGN: 'Arts & Design',
  COMPETITIVE_EXAMS: 'Competitive Exams',
  OTHER: 'Other',
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const CONDITION_LABELS = {
  NEW: 'New',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}

export const CONDITION_OPTIONS = Object.entries(CONDITION_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const LISTING_TYPE_LABELS = {
  SELL: 'For sale',
  EXCHANGE: 'For exchange',
}

export const BOOK_STATUS_LABELS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  EXCHANGED: 'Exchanged',
  HIDDEN: 'Hidden',
  DELETED: 'Deleted',
}

export const EXCHANGE_STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
}

export const STATUS_LABELS = {
  ...BOOK_STATUS_LABELS,
  ...EXCHANGE_STATUS_LABELS,
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title_asc', label: 'Title: A to Z' },
  { value: 'oldest', label: 'Oldest first' },
]

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || 'Other'
}

export function conditionLabel(value) {
  return CONDITION_LABELS[value] || value
}

export function statusLabel(value) {
  return STATUS_LABELS[value] || value
}
