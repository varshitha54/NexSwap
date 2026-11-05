import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('NexSwap UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-page">
          <span className="eyebrow">Something went off the shelf</span>
          <h1>We couldn’t render this page.</h1>
          <p>Refresh the page to continue browsing the NexSwap catalogue.</p>
          <Link className="btn btn--primary" to="/" onClick={() => window.location.reload()}>
            Return home
          </Link>
        </main>
      )
    }
    return this.props.children
  }
}
