import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, signUp, userProfile, user } = useAuth()
  const navigate = useNavigate()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')

  // Determine dashboard route based on user role or email
  const getDashboardRoute = (profile, email) => {
    const emailLower = (email || '').toLowerCase()
    
    // Priority 1: Check if profile has role
    if (profile?.role) {
      if (profile.role === 'admin' || profile.role === 'administrator') {
        return '/reports' // Admin dashboard - full access
      } else if (profile.role === 'employee' || profile.role === 'staff') {
        return '/reports' // Employee dashboard - can be customized
      } else if (profile.role === 'manager') {
        return '/reports' // Manager dashboard
      }
    }
    
    // Priority 2: Route based on email domain or keywords
    if (emailLower.includes('admin') || emailLower.includes('administrator')) {
      return '/reports' // Admin dashboard
    } else if (emailLower.includes('manager') || emailLower.includes('mgr')) {
      return '/reports' // Manager dashboard
    } else if (emailLower.includes('employee') || emailLower.includes('staff') || emailLower.includes('emp')) {
      return '/reports' // Employee dashboard
    }
    
    // Priority 3: Route based on email domain
    const domain = emailLower.split('@')[1] || ''
    if (domain.includes('admin') || domain.includes('management')) {
      return '/reports' // Admin dashboard
    }
    
    // Default route - can be customized per user
    // You can add more specific routing logic here
    return '/reports'
  }

  // Handle redirect after profile loads
  useEffect(() => {
    if (shouldRedirect && user && loginEmail) {
      const route = getDashboardRoute(userProfile, loginEmail)
      navigate(route)
      setShouldRedirect(false)
      setLoginEmail('')
    }
  }, [userProfile, user, shouldRedirect, loginEmail, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        setLoginEmail(email)
        setShouldRedirect(true)
      } else {
        if (!fullName) {
          setError('Full name is required')
          setLoading(false)
          return
        }
        await signUp(email, password, fullName)
        setLoginEmail(email)
        setShouldRedirect(true)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      setShouldRedirect(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 input-field"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 input-field"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-primary-600 hover:text-primary-500"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

