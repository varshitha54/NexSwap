import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, Plus, UserRound, X } from 'lucide-react'
import Avatar from './Avatar'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/books', label: 'Browse books' },
]

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/listings', label: 'My listings' },
  { to: '/requests', label: 'Requests' },
]

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', open)
    return () => document.body.classList.remove('nav-open')
  }, [open])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />

        <nav className={`navbar__nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {publicLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated &&
            privateLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              Admin
            </NavLink>
          )}

          <div className="navbar__mobile-actions">
            {isAuthenticated ? (
              <>
                <Link to="/listings/new" className="btn btn--primary btn--sm">
                  <Plus size={16} /> List a book
                </Link>
                <Link to="/profile" className="btn btn--ghost btn--sm">
                  <UserRound size={16} /> {user?.name}
                </Link>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn--primary btn--sm">
                  Join NexSwap
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to="/listings/new" className="btn btn--primary btn--sm navbar__cta">
                <Plus size={16} />
                List a book
              </Link>
              <NavLink to="/profile" className="navbar__profile" title="Your profile">
                <Avatar name={user?.name} size="sm" />
                <span>
                  <strong>{user?.name?.split(' ')[0]}</strong>
                  <small>{isAdmin ? 'Administrator' : 'Student'}</small>
                </span>
              </NavLink>
              <button
                type="button"
                className="icon-button navbar__logout"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-link--login">
                Sign in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-button navbar__toggle"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}
