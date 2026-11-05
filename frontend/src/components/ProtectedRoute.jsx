import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isInitializing, isAdmin } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <Loader full label="Checking your session" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
