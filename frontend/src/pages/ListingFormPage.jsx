import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ImagePlus,
  Info,
  Repeat2,
  Tag,
  UploadCloud,
  X,
} from 'lucide-react'
import { bookApi } from '../api'
import { getApiError, getFieldErrors } from '../api/client'
import BookCover from '../components/BookCover'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  LISTING_TYPE_LABELS,
} from '../utils/constants'
import { formatPrice } from '../utils/format'

const initialForm = {
  title: '',
  author: '',
  description: '',
  category: '',
  price: '',
  condition: 'GOOD',
  listingType: 'SELL',
}

export default function ListingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(initialForm)
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isEdit) return undefined
    let active = true
    setLoading(true)
    bookApi
      .get(id)
      .then((data) => {
        if (!active) return
        if (data.seller.id !== user?.id && !isAdmin) {
          setLoadError('You can only edit your own listings.')
          return
        }
        setBook(data)
        setForm({
          title: data.title,
          author: data.author,
          description: data.description,
          category: data.category,
          price: String(data.price),
          condition: data.condition,
          listingType: data.listingType,
        })
      })
      .catch((requestError) => {
        if (active) setLoadError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, isEdit, isAdmin, user?.id])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const previewBook = useMemo(
    () => ({
      ...form,
      imageUrl: previewUrl || book?.imageUrl,
      seller: book?.seller,
    }),
    [form, previewUrl, book],
  )

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const chooseImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, WEBP or GIF image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('The cover image must be 5 MB or smaller.')
      return
    }
    setImageFile(file)
  }

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Enter the book title.'
    if (!form.author.trim()) next.author = 'Enter the author.'
    if (!form.category) next.category = 'Choose a category.'
    if (!form.condition) next.condition = 'Choose a condition.'
    if (!form.description.trim()) next.description = 'Add a short description.'
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      next.price = 'Enter a valid price of zero or more.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      toast.error('Please check the highlighted fields.')
      return
    }

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      condition: form.condition,
      listingType: form.listingType,
    }

    try {
      const saved = isEdit
        ? await bookApi.update(id, payload)
        : await bookApi.create(payload)
      let coverFailed = false
      if (imageFile) {
        try {
          await bookApi.uploadImage(saved.id, imageFile)
        } catch (uploadError) {
          coverFailed = true
          toast.error(`Listing saved, but the cover could not be uploaded: ${getApiError(uploadError)}`)
        }
      }
      if (!coverFailed) {
        toast.success(isEdit ? 'Listing updated.' : 'Your book is now on the shelf.')
      }
      navigate('/listings')
    } catch (requestError) {
      toast.error(getApiError(requestError))
      setErrors(getFieldErrors(requestError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <Loader full label="Loading your listing" />
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="page">
        <div className="container">
          <div className="error-panel">
            <h1>Listing unavailable</h1>
            <p>{loadError}</p>
            <Link to="/listings" className="btn btn--primary">Back to my listings</Link>
          </div>
        </div>
      </main>
    )
  }

  const isLocked = book && ['RESERVED', 'EXCHANGED'].includes(book.status)

  return (
    <main className="page listing-form-page">
      <div className="container">
        <Link to="/listings" className="back-link">
          <ArrowLeft size={16} /> Back to my listings
        </Link>

        <div className="page-heading">
          <div>
            <span className="eyebrow">{isEdit ? 'Update your shelf' : 'Add to the shelf'}</span>
            <h1>{isEdit ? 'Edit your listing' : 'List a book'}</h1>
            <p>
              Give other students the details they need to decide if this book belongs
              in their next semester.
            </p>
          </div>
        </div>

        {isLocked && (
          <div className="inline-notice">
            <Info size={18} />
            <span>
              This listing is {book.status.toLowerCase()} because of an active exchange.
              It cannot be edited until the exchange is complete.
            </span>
          </div>
        )}

        <div className="listing-form-layout">
          <form className="panel listing-form" onSubmit={submit} noValidate>
            <div className="panel__heading">
              <span className="panel__icon"><BookOpen size={19} /></span>
              <div>
                <h2>Book details</h2>
                <p>Accurate details help the right reader find your listing.</p>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="book-title">Book title</label>
                <input
                  id="book-title"
                  className={errors.title ? 'has-error' : ''}
                  placeholder="e.g. Introduction to Algorithms"
                  maxLength="160"
                  value={form.title}
                  onChange={update('title')}
                />
                {errors.title && <small className="field__error">{errors.title}</small>}
              </div>
              <div className="field">
                <label htmlFor="book-author">Author</label>
                <input
                  id="book-author"
                  className={errors.author ? 'has-error' : ''}
                  placeholder="e.g. Thomas H. Cormen"
                  maxLength="120"
                  value={form.author}
                  onChange={update('author')}
                />
                {errors.author && <small className="field__error">{errors.author}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="book-category">Category</label>
                <select
                  id="book-category"
                  className={errors.category ? 'has-error' : ''}
                  value={form.category}
                  onChange={update('category')}
                >
                  <option value="">Choose a subject</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.category && <small className="field__error">{errors.category}</small>}
              </div>
              <div className="field">
                <label htmlFor="book-condition">Condition</label>
                <select
                  id="book-condition"
                  className={errors.condition ? 'has-error' : ''}
                  value={form.condition}
                  onChange={update('condition')}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.condition && <small className="field__error">{errors.condition}</small>}
              </div>
            </div>

            <div className="field">
              <span className="filter-label">How would you like to pass it on?</span>
              <div className="listing-type-options">
                {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className={`listing-type-card ${form.listingType === value ? 'is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="listingType"
                      value={value}
                      checked={form.listingType === value}
                      onChange={update('listingType')}
                    />
                    <span className="listing-type-card__icon">
                      {value === 'SELL' ? <Tag size={20} /> : <Repeat2 size={20} />}
                    </span>
                    <span>
                      <strong>{label}</strong>
                      <small>
                        {value === 'SELL'
                          ? 'Set a price and arrange a direct sale.'
                          : 'Invite another student to offer a book in return.'}
                      </small>
                    </span>
                    {form.listingType === value && <Check size={17} className="listing-type-card__check" />}
                  </label>
                ))}
              </div>
              {errors.listingType && <small className="field__error">{errors.listingType}</small>}
            </div>

            <div className="field">
              <label htmlFor="book-price">
                {form.listingType === 'EXCHANGE' ? 'Estimated value (₹)' : 'Asking price (₹)'}
              </label>
              <input
                id="book-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className={errors.price ? 'has-error' : ''}
                placeholder="0.00"
                value={form.price}
                onChange={update('price')}
              />
              <small className="field__hint">
                {form.listingType === 'EXCHANGE'
                  ? 'Used to suggest books of a similar value for a swap.'
                  : 'A fair price helps your book find a new home quickly.'}
              </small>
              {errors.price && <small className="field__error">{errors.price}</small>}
            </div>

            <div className="field">
              <label htmlFor="book-description">Description</label>
              <textarea
                id="book-description"
                rows="6"
                maxLength="5000"
                className={errors.description ? 'has-error' : ''}
                placeholder="Mention the edition, highlights, notes, binding and why you recommend it…"
                value={form.description}
                onChange={update('description')}
              />
              <small className="field__hint">{form.description.length}/5000</small>
              {errors.description && <small className="field__error">{errors.description}</small>}
            </div>

            <div className="field">
              <label>Cover image <span>(optional, up to 5 MB)</span></label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={chooseImage}
                hidden
              />
              {imageFile ? (
                <div className="image-selected">
                  <img src={previewUrl} alt="Selected book cover preview" />
                  <div>
                    <strong>{imageFile.name}</strong>
                    <small>{Math.round(imageFile.size / 1024)} KB</small>
                    <button type="button" onClick={() => setImageFile(null)}>
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="image-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span><UploadCloud size={22} /></span>
                  <strong>{book?.imageUrl ? 'Replace the cover image' : 'Upload a cover image'}</strong>
                  <small>JPG, PNG, WEBP or GIF · maximum 5 MB</small>
                </button>
              )}
            </div>

            <div className="form-actions">
              <Link to="/listings" className="btn btn--ghost">Cancel</Link>
              <button type="submit" className="btn btn--primary btn--lg" disabled={saving || isLocked}>
                {saving ? 'Saving listing…' : isEdit ? 'Save changes' : 'Publish listing'}
              </button>
            </div>
          </form>

          <aside className="listing-preview">
            <div className="listing-preview__card">
              <span className="eyebrow eyebrow--small">Live preview</span>
              <BookCover book={previewBook} className="listing-preview__cover" />
              <div className="listing-preview__body">
                <span className={`mini-pill ${form.listingType === 'EXCHANGE' ? 'is-exchange' : ''}`}>
                  {form.listingType === 'EXCHANGE' ? <Repeat2 size={12} /> : <Tag size={12} />}
                  {LISTING_TYPE_LABELS[form.listingType]}
                </span>
                <h3>{form.title || 'Your book title'}</h3>
                <p>by {form.author || 'Author name'}</p>
                <strong>{form.price ? formatPrice(form.price) : '₹0'}</strong>
              </div>
            </div>

            <div className="listing-tips">
              <span><ImagePlus size={17} /> A clear cover helps your listing stand out.</span>
              <span><Info size={17} /> Mention any notes or highlighting in the description.</span>
              <span><Repeat2 size={17} /> Exchange listings need an available book to offer.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
