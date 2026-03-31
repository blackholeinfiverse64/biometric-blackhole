import { createContext, useContext, useEffect, useState } from 'react'
import config from '../config'
import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
  authHeaders,
} from '../lib/auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setUserProfile(null)
      return null
    }

    try {
      const res = await fetch(config.getApiUrl('/api/auth/me'), {
        headers: authHeaders(),
      })

      if (!res.ok) {
        clearAuth()
        setUser(null)
        setUserProfile(null)
        return null
      }

      const data = await res.json()
      const profile = data.user
      setUser(profile)
      setUserProfile(profile)
      setStoredUser(profile)
      return profile
    } catch (err) {
      console.error('Error fetching profile:', err)
      setUser(null)
      setUserProfile(null)
      return null
    }
  }

  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const stored = getStoredUser()
      if (stored) {
        setUser(stored)
        setUserProfile(stored)
      }

      await fetchProfile()
      setLoading(false)
    }

    init()
  }, [])

  const signUp = async (email, password, fullName, role = 'employee') => {
    const res = await fetch(config.getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')

    setToken(data.token)
    setUser(data.user)
    setUserProfile(data.user)
    setStoredUser(data.user)
    return data
  }

  const signIn = async (email, password) => {
    const res = await fetch(config.getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    setToken(data.token)
    setUser(data.user)
    setUserProfile(data.user)
    setStoredUser(data.user)
    return data
  }

  const signOut = async () => {
    clearAuth()
    setUser(null)
    setUserProfile(null)
  }

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
