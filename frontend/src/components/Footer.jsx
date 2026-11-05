import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Heart, Mail } from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>
            The campus-first marketplace where textbooks find a second student,
            not a second shelf.
          </p>
          <a className="footer__mail" href="mailto:hello@nexswap.local">
            <Mail size={16} /> hello@nexswap.local
          </a>
        </div>

        <div className="footer__column">
          <h3>Explore</h3>
          <Link to="/books">Browse books</Link>
          <Link to="/books?listingType=EXCHANGE">Exchange books</Link>
          <Link to="/books?listingType=SELL">Books for sale</Link>
          <Link to="/listings/new">List a book</Link>
        </div>

        <div className="footer__column">
          <h3>Your account</h3>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/listings">My listings</Link>
          <Link to="/requests">Exchange requests</Link>
          <Link to="/profile">Profile settings</Link>
        </div>

        <div className="footer__column">
          <h3>Good to know</h3>
          <Link to="/login">Student sign in</Link>
          <Link to="/register">Create an account</Link>
          <a href="mailto:hello@nexswap.local">Contact the team</a>
          <span className="footer__note">
            <BookOpen size={15} /> Campus verified listings
          </span>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} NexSwap. Built for students.</span>
        <span className="footer__built">
          Made with <Heart size={13} /> for the next chapter
        </span>
        <Link className="footer__top" to="/">
          Back to top <ArrowUpRight size={14} />
        </Link>
      </div>
    </footer>
  )
}
