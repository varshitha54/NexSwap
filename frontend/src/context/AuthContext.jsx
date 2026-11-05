import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, userApi } from '../api'
import { TOKEN_KEY } from '../api/client'

const USER_KEY = 'nexswap_user'
const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setInitializing(false)
  }, [])

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('nexswap:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('nexswap:unauthorized', handleUnauthorized)
  }, [clearSession])

  useEffect(() => {
    let active = true
    const currentToken = localStorage.getItem(TOKEN_KEY)
    if (!currentToken) {
      setInitializing(false)
      return undefined
    }

    setInitializing(true)
    userApi
      .me()
      .then((profile) => {
        if (!active) return
        localStorage.setItem(USER_KEY, JSON.stringify(profile))
        setUser(profile)
      })
      .catch((error) => {
        if (active && (error?.response?.status === 401 || error?.response?.status === 403)) {
          clearSession()
        }
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    return () => {
      active = false
    }
  }, [clearSession])

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)
      persistSession(data.token, data.user)
      setInitializing(false)
      return data.user
    },
    [persistSession],
  )

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload)
      persistSession(data.token, data.user)
      setInitializing(false)
      return data.user
    },
    [persistSession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // A stateless JWT logout still succeeds locally if the API is unavailable.
    }
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isInitializing: initializing,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      updateUser,
    }),
    [token, user, initializing, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
