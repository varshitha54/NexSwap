import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { getApiError, getFieldErrors } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const initialForm = {
  name: '',
  email: '',
  collegeName: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const from = location.state?.from || '/dashboard'

  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Enter your full name.'
    if (!form.email.trim()) nextErrors.email = 'Enter your student email.'
    if (!form.collegeName.trim()) nextErrors.collegeName = 'Enter your college name.'
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError('Please check the highlighted fields.')
      return
    }

    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        collegeName: form.collegeName.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })
      toast.success(`Your NexSwap shelf is ready, ${user.name.split(' ')[0]}.`)
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
      setFieldErrors(getFieldErrors(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join the network"
      title="Create your student account"
      subtitle="List your first book in minutes and connect with readers on your campus."
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="register-name">Full name</label>
          <div className={`input-with-icon ${fieldErrors.name ? 'has-error' : ''}`}>
            <UserRound size={17} aria-hidden="true" />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={update('name')}
              autoFocus
            />
          </div>
          {fieldErrors.name && <small className="field__error">{fieldErrors.name}</small>}
        </div>

        <div className="field">
          <label htmlFor="register-email">Student email</label>
          <div className={`input-with-icon ${fieldErrors.email ? 'has-error' : ''}`}>
            <Mail size={17} aria-hidden="true" />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={update('email')}
            />
          </div>
          {fieldErrors.email && <small className="field__error">{fieldErrors.email}</small>}
        </div>

        <div className="field">
          <label htmlFor="register-college">College / university</label>
          <div className={`input-with-icon ${fieldErrors.collegeName ? 'has-error' : ''}`}>
            <Building2 size={17} aria-hidden="true" />
            <input
              id="register-college"
              type="text"
              autoComplete="organization"
              placeholder="Your campus"
              value={form.collegeName}
              onChange={update('collegeName')}
            />
          </div>
          {fieldErrors.collegeName && <small className="field__error">{fieldErrors.collegeName}</small>}
        </div>

        <div className="field">
          <label htmlFor="register-phone">Phone <span>(optional)</span></label>
          <div className={`input-with-icon ${fieldErrors.phone ? 'has-error' : ''}`}>
            <Phone size={17} aria-hidden="true" />
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={update('phone')}
            />
          </div>
          {fieldErrors.phone && <small className="field__error">{fieldErrors.phone}</small>}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <div className={`input-with-icon ${fieldErrors.password ? 'has-error' : ''}`}>
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={update('password')}
              />
              <button
                type="button"
                className="input-with-icon__action"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <small className="field__error">{fieldErrors.password}</small>}
          </div>

          <div className="field">
            <label htmlFor="register-confirm">Confirm</label>
            <div className={`input-with-icon ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
              />
            </div>
            {fieldErrors.confirmPassword && <small className="field__error">{fieldErrors.confirmPassword}</small>}
          </div>
        </div>

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
          {!submitting && <ArrowRight size={17} />}
        </button>

        <p className="auth-terms">
          By creating an account you agree to keep listings accurate and treat other
          students with respect.
        </p>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" state={{ from }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
