import { Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import AdminPage from './pages/AdminPage'
import BookDetailsPage from './pages/BookDetailsPage'
import BrowseBooksPage from './pages/BrowseBooksPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import ListingFormPage from './pages/ListingFormPage'
import LoginPage from './pages/LoginPage'
import MyListingsPage from './pages/MyListingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import RequestsPage from './pages/RequestsPage'

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BrowseBooksPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings"
            element={
              <ProtectedRoute>
                <MyListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/new"
            element={
              <ProtectedRoute>
                <ListingFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute>
                <ListingFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
      <Footer />
    </div>
  )
}
