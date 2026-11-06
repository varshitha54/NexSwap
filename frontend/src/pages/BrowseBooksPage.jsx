import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { bookApi } from '../api'
import { getApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import { CardSkeleton } from '../components/Loader'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  LISTING_TYPE_LABELS,
  SORT_OPTIONS,
} from '../utils/constants'

const PAGE_SIZE = 12

const filterKeys = ['q', 'category', 'listingType', 'condition', 'minPrice', 'maxPrice', 'sort', 'page']

export default function BrowseBooksPage() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ content: [], page: 0, totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [requestKey, setRequestKey] = useState(0)
  const debouncedQuery = useDebouncedValue(searchParams.toString(), 350)

  const current = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    listingType: searchParams.get('listingType') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 0),
  }

  const hasFilters = filterKeys
    .filter((key) => key !== 'sort' && key !== 'page')
    .some((key) => Boolean(current[key]))

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(debouncedQuery))
    params.size = PAGE_SIZE
    const controller = new AbortController()
    setLoading(true)
    setError('')

    bookApi
      .search(params, controller.signal)
      .then((result) => setData(result))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiError(requestError))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery, requestKey])

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    })
    if (!Object.keys(changes).includes('page')) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const updateParam = (key, value) => updateParams({ [key]: value })

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (current.sort !== 'newest') next.set('sort', current.sort)
    setSearchParams(next, { replace: true })
  }

  const changePage = (page) => {
    updateParam('page', page)
    document.getElementById('catalogue-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pages = buildPages(current.page, data.totalPages)

  return (
    <main className="page browse-page">
      <section className="catalogue-head">
        <div className="container">
          <div className="catalogue-head__copy">
            <span className="eyebrow">The NexSwap catalogue</span>
            <h1>Find a book worth keeping.</h1>
            <p>
              Search the campus collection by title, author or subject. Filter by budget
              and condition, then arrange a sale or a swap.
            </p>
          </div>
          <div className="catalogue-search">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={current.q}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Search by title, author or keyword…"
              aria-label="Search books"
            />
            {current.q && (
              <button
                type="button"
                className="catalogue-search__clear"
                onClick={() => updateParam('q', '')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <span className="catalogue-search__hint">Press to search</span>
          </div>
        </div>
      </section>

      <div className="container browse-layout" id="catalogue-results">
        <aside className={`filters ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filters__header">
            <div>
              <span className="filters__icon"><SlidersHorizontal size={17} /></span>
              <h2>Filters</h2>
            </div>
            <button
              type="button"
              className="icon-button filters__close"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              value={current.category}
              onChange={(event) => updateParam('category', event.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Listing type</span>
            <div className="choice-stack">
              <label className={`choice ${current.listingType === '' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="listingType"
                  checked={current.listingType === ''}
                  onChange={() => updateParam('listingType', '')}
                />
                Any listing
              </label>
              {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className={`choice ${current.listingType === value ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="listingType"
                    checked={current.listingType === value}
                    onChange={() => updateParam('listingType', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-condition">Condition</label>
            <select
              id="filter-condition"
              value={current.condition}
              onChange={(event) => updateParam('condition', event.target.value)}
            >
              <option value="">Any condition</option>
              {CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Price range</span>
            <div className="price-range">
              <label>
                <span>Min ₹</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                  value={current.minPrice}
                  onChange={(event) => updateParam('minPrice', event.target.value)}
                />
              </label>
              <span className="price-range__dash">—</span>
              <label>
                <span>Max ₹</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Any"
                  value={current.maxPrice}
                  onChange={(event) => updateParam('maxPrice', event.target.value)}
                />
              </label>
            </div>
          </div>

          <button type="button" className="btn btn--ghost filters__reset" onClick={clearFilters}>
            <RotateCcw size={15} /> Reset filters
          </button>
        </aside>

        <section className="catalogue-results">
          <div className="results-toolbar">
            <div className="results-toolbar__count">
              <button
                type="button"
                className="btn btn--outline btn--sm filters-toggle"
                onClick={() => setFiltersOpen(true)}
              >
                <Filter size={15} /> Filters
              </button>
              <span>
                <strong>{loading ? '…' : data.totalElements}</strong>{' '}
                {data.totalElements === 1 ? 'book' : 'books'} found
              </span>
            </div>
            <label className="sort-control">
              <span>Sort</span>
              <select
                value={current.sort}
                onChange={(event) => updateParam('sort', event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {hasFilters && (
            <div className="active-filters">
              {current.q && (
                <button type="button" onClick={() => updateParam('q', '')}>
                  “{current.q}” <X size={13} />
                </button>
              )}
              {current.category && (
                <button type="button" onClick={() => updateParam('category', '')}>
                  {CATEGORY_OPTIONS.find((option) => option.value === current.category)?.label}
                  <X size={13} />
                </button>
              )}
              {current.listingType && (
                <button type="button" onClick={() => updateParam('listingType', '')}>
                  {LISTING_TYPE_LABELS[current.listingType]} <X size={13} />
                </button>
              )}
              {current.condition && (
                <button type="button" onClick={() => updateParam('condition', '')}>
                  {CONDITION_OPTIONS.find((option) => option.value === current.condition)?.label}
                  <X size={13} />
                </button>
              )}
              {(current.minPrice || current.maxPrice) && (
                <button
                  type="button"
                  onClick={() => updateParams({ minPrice: '', maxPrice: '' })}
                >
                  ₹{current.minPrice || '0'} – ₹{current.maxPrice || 'any'} <X size={13} />
                </button>
              )}
              <button type="button" className="active-filters__clear" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}

          {error ? (
            <div className="error-panel">
              <h3>The catalogue could not load</h3>
              <p>{error}</p>
              <button type="button" className="btn btn--primary" onClick={() => setRequestKey((key) => key + 1)}>
                Try again
              </button>
            </div>
          ) : loading ? (
            <CardSkeleton count={6} />
          ) : data.content.length > 0 ? (
            <>
              <div className="book-grid">
                {data.content.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {data.totalPages > 1 && (
                <nav className="pagination" aria-label="Catalogue pages">
                  <button
                    type="button"
                    className="pagination__arrow"
                    onClick={() => changePage(current.page - 1)}
                    disabled={current.page <= 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {pages.map((page, index) =>
                    page === '…' ? (
                      <span className="pagination__ellipsis" key={`ellipsis-${index}`}>…</span>
                    ) : (
                      <button
                        type="button"
                        key={page}
                        className={`pagination__page ${page === current.page ? 'is-active' : ''}`}
                        onClick={() => changePage(page)}
                        aria-current={page === current.page ? 'page' : undefined}
                      >
                        {page + 1}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className="pagination__arrow"
                    onClick={() => changePage(current.page + 1)}
                    disabled={current.page >= data.totalPages - 1}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No books matched that search"
              description="Try a broader keyword, a different category, or reset the filters to see the whole catalogue."
              action={
                <button type="button" className="btn btn--primary" onClick={clearFilters}>
                  <RotateCcw size={15} /> Reset filters
                </button>
              }
            />
          )}

          {!loading && !error && data.content.length > 0 && (
            <p className="catalogue-footnote">
              {isAuthenticated ? (
                <>
                  Looking for something specific? <Link to="/requests">Check your exchange requests</Link> or list a
                  book to start a swap.
                </>
              ) : (
                <>Looking for something specific? <Link to="/login">Sign in</Link> to request an exchange or list a
                  book to start a swap.</>
              )}
            </p>
          )}
        </section>
      </div>

      {filtersOpen && (
        <button
          type="button"
          className="filters-backdrop"
          onClick={() => setFiltersOpen(false)}
          aria-label="Close filters"
        />
      )}
    </main>
  )
}

function buildPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index)
  }
  const pages = new Set([0, totalPages - 1, currentPage - 1, currentPage, currentPage + 1])
  const sorted = [...pages].filter((page) => page >= 0 && page < totalPages).sort((a, b) => a - b)
  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('…')
    result.push(page)
  })
  return result
}
