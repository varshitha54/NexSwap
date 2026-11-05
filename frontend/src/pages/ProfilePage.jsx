import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Handshake,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { dashboardApi, userApi } from '../api'
import { getApiError, getFieldErrors } from '../api/client'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/format'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name: user?.name || '',
    collegeName: user?.collegeName || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const [stats, setStats] = useState(null)

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(() => {})
  }, [])

  const updateProfileField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setProfileErrors((current) => ({ ...current, [field]: undefined }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.collegeName.trim()) {
      setProfileErrors({
        name: form.name.trim() ? undefined : 'Name is required.',
        collegeName: form.collegeName.trim() ? undefined : 'College name is required.',
      })
      return
    }
    setSavingProfile(true)
    setProfileErrors({})
    try {
      const updated = await userApi.updateProfile({
        name: form.name.trim(),
        collegeName: form.collegeName.trim(),
        phone: form.phone.trim(),
      })
      updateUser(updated)
      toast.success('Profile updated.')
    } catch (requestError) {
      toast.error(getApiError(requestError))
      setProfileErrors(getFieldErrors(requestError))
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Complete all password fields.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully.')
    } catch (requestError) {
      setPasswordError(getApiError(requestError))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className="page profile-page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Your account</span>
            <h1>Profile settings</h1>
            <p>Keep your campus details current so buyers and sellers can reach you.</p>
          </div>
          <Link to="/listings/new" className="btn btn--primary">
            List a book <ArrowRight size={16} />
          </Link>
        </div>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-summary">
              <Avatar name={user?.name} size="xl" />
              <h2>{user?.name}</h2>
              <span className="profile-summary__role">
                <ShieldCheck size={14} /> {user?.role === 'ADMIN' ? 'Administrator' : 'Student member'}
              </span>
              <span className="profile-summary__college">
                <Building2 size={14} /> {user?.collegeName}
              </span>
              <div className="profile-summary__divider" />
              <span className="profile-summary__joined">
                <CalendarDays size={14} /> Joined {formatDate(user?.createdAt)}
              </span>
            </div>

            <div className="profile-snapshot">
              <span className="eyebrow eyebrow--small">At a glance</span>
              <div>
                <span><BookOpen size={15} /> Listings</span>
                <strong>{stats?.totalBooksListed ?? '—'}</strong>
              </div>
              <div>
                <span><CheckCircle2 size={15} /> Active</span>
                <strong>{stats?.activeListings ?? '—'}</strong>
              </div>
              <div>
                <span><Handshake size={15} /> Completed</span>
                <strong>{stats?.completedExchanges ?? '—'}</strong>
              </div>
            </div>
          </aside>

          <div className="profile-main">
            <section className="panel">
              <div className="panel__heading">
                <span className="panel__icon"><UserRound size={19} /></span>
                <div>
                  <h2>Personal information</h2>
                  <p>This is how you appear to other students on NexSwap.</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="stack-form">
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="profile-name">Full name</label>
                    <div className={`input-with-icon ${profileErrors.name ? 'has-error' : ''}`}>
                      <UserRound size={17} />
                      <input
                        id="profile-name"
                        value={form.name}
                        onChange={updateProfileField('name')}
                      />
                    </div>
                    {profileErrors.name && <small className="field__error">{profileErrors.name}</small>}
                  </div>

                  <div className="field">
                    <label htmlFor="profile-email">Email address</label>
                    <div className="input-with-icon is-readonly">
                      <Mail size={17} />
                      <input id="profile-email" value={user?.email || ''} readOnly />
                      <LockKeyhole size={14} className="input-with-icon__trailing" />
                    </div>
                    <small className="field__hint">Your sign-in email cannot be changed here.</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="profile-college">College / university</label>
                    <div className={`input-with-icon ${profileErrors.collegeName ? 'has-error' : ''}`}>
                      <Building2 size={17} />
                      <input
                        id="profile-college"
                        value={form.collegeName}
                        onChange={updateProfileField('collegeName')}
                      />
                    </div>
                    {profileErrors.collegeName && (
                      <small className="field__error">{profileErrors.collegeName}</small>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="profile-phone">Phone <span>(optional)</span></label>
                    <div className={`input-with-icon ${profileErrors.phone ? 'has-error' : ''}`}>
                      <Phone size={17} />
                      <input
                        id="profile-phone"
                        type="tel"
                        placeholder="Add a contact number"
                        value={form.phone}
                        onChange={updateProfileField('phone')}
                      />
                    </div>
                    {profileErrors.phone && <small className="field__error">{profileErrors.phone}</small>}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn--primary" disabled={savingProfile}>
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel__heading">
                <span className="panel__icon"><KeyRound size={19} /></span>
                <div>
                  <h2>Password & security</h2>
                  <p>Use at least eight characters and keep it unique to NexSwap.</p>
                </div>
              </div>

              <form onSubmit={savePassword} className="stack-form">
                {passwordError && <div className="form-error" role="alert">{passwordError}</div>}

                <div className="field">
                  <label htmlFor="current-password">Current password</label>
                  <div className="input-with-icon">
                    <LockKeyhole size={17} />
                    <input
                      id="current-password"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="new-password">New password</label>
                    <div className="input-with-icon">
                      <KeyRound size={17} />
                      <input
                        id="new-password"
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="confirm-new-password">Confirm new password</label>
                    <div className="input-with-icon">
                      <KeyRound size={17} />
                      <input
                        id="confirm-new-password"
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={(event) => setShowPasswords(event.target.checked)}
                  />
                  Show passwords
                </label>

                <div className="form-actions">
                  <button type="submit" className="btn btn--primary" disabled={savingPassword}>
                    {savingPassword ? 'Updating…' : 'Change password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
