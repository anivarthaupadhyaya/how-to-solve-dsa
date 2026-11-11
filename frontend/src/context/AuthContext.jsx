import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch the currently authenticated user
  const fetchUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token')
    if (!currentToken) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      return response.data
    } catch (err) {
      console.warn('Failed to fetch current user:', err?.response?.data || err.message)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount or token changes, refresh user profile
  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [token, fetchUser])

  // Listen for global 401 unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setLoading(false)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  // Login with email and password
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { access_token } = response.data
    localStorage.setItem('token', access_token)
    setToken(access_token)

    // Fetch user details immediately
    try {
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      setUser(userRes.data)
      return userRes.data
    } catch {
      return null
    }
  }

  // Register a new user, then log them in
  const register = async (email, password) => {
    await api.post('/auth/register', { email, password })
    return await login(email, password)
  }

  // Logout user and clear stored token
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    fetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
