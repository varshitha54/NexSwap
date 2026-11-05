import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { getApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const from = location.state?.from || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to NexSwap"
      subtitle="Pick up where you left off and keep your books moving."
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="login-email">Student email</label>
          <div className="input-with-icon">
            <Mail size={17} aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={update('email')}
              autoFocus
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="input-with-icon">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={update('password')}
            />
            <button
              type="button"
              className="input-with-icon__action"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
          {!submitting && <ArrowRight size={17} />}
        </button>

        <p className="auth-switch">
          New to NexSwap?{' '}
          <Link to="/register" state={{ from }}>Create a student account</Link>
        </p>
      </form>

      <div className="auth-assurance">
        <span>Secure JWT session</span>
        <span>Passwords are encrypted</span>
        <span>Student-only marketplace</span>
      </div>
    </AuthShell>
  )
}
