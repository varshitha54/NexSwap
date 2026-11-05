import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Handshake,
  Inbox,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { adminApi } from '../api'
import { getApiError } from '../api/client'
import Avatar from '../components/Avatar'
import Loader from '../components/Loader'
import StatCard from '../components/StatCard'
import { formatDate } from '../utils/format'

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([adminApi.stats(), adminApi.users()])
      .then(([statsData, usersData]) => {
        if (!active) return
        setStats(statsData)
        setUsers(usersData)
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [user.name, user.email, user.collegeName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    )
  }, [users, query])

  return (
    <main className="page admin-page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Platform administration</span>
            <h1>NexSwap overview</h1>
            <p>A live view of the students, listings and exchanges on the platform.</p>
          </div>
          <span className="admin-badge"><ShieldCheck size={15} /> Administrator</span>
        </div>

        {loading ? (
          <Loader label="Loading platform data" />
        ) : error ? (
          <div className="error-panel">
            <h3>Administration data could not load</h3>
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="stats-grid stats-grid--admin">
              <StatCard icon={Users} label="Students" value={stats.totalStudents} hint="Registered accounts" tone="indigo" />
              <StatCard icon={BookOpen} label="Books" value={stats.totalBooks} hint={`${stats.availableBooks} available now`} tone="mint" />
              <StatCard icon={Inbox} label="Pending requests" value={stats.pendingRequests} hint="Awaiting a response" tone="amber" />
              <StatCard icon={Handshake} label="Completed swaps" value={stats.completedExchanges} hint="Books given a second life" tone="rose" />
            </div>

            <section className="panel admin-table-panel">
              <div className="panel__heading panel__heading--row">
                <div className="panel__heading-group">
                  <span className="panel__icon"><Users size={19} /></span>
                  <div>
                    <h2>People on NexSwap</h2>
                    <p>{users.length} accounts in total.</p>
                  </div>
                </div>
                <div className="admin-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search name, email or college"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Search users"
                  />
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>College</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-person">
                            <Avatar name={user.name} size="sm" />
                            <div>
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.collegeName}</td>
                        <td>
                          <span className={`role-badge ${user.role === 'ADMIN' ? 'role-badge--admin' : ''}`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'Student'}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{user.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="dashboard-mini-empty">
                  <p>No accounts match “{query}”.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
