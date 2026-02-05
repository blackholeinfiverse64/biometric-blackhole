import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Upload from './pages/Upload'
import Reports from './pages/Reports'
import Auth from './pages/Auth'
import { supabaseConfigured } from './lib/supabase'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/auth" />
}

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user, userProfile, loading } = useAuth()
  
  // Add timeout to prevent infinite loading
  const [redirectTimeout, setRedirectTimeout] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirectTimeout(true)
    }, 5000) // 5 second timeout
    
    return () => clearTimeout(timer)
  }, [])
  
  // If loading takes too long, redirect anyway
  if (loading && !redirectTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If no user after timeout, go to auth
  if (!user) {
    return <Navigate to="/auth" />
  }
  
  // Determine dashboard route based on user role or email
  const getDashboardRoute = () => {
    const email = user?.email || ''
    const emailLower = email.toLowerCase()
    
    // Priority 1: Check if profile has role
    if (userProfile?.role) {
      if (userProfile.role === 'admin' || userProfile.role === 'administrator') {
        return '/reports' // Admin dashboard - full access
      } else if (userProfile.role === 'employee' || userProfile.role === 'staff') {
        return '/reports' // Employee dashboard
      } else if (userProfile.role === 'manager') {
        return '/reports' // Manager dashboard
      }
    }
    
    // Priority 2: Route based on email keywords
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
    
    // Default route
    return '/reports'
  }
  
  return <Navigate to={getDashboardRoute()} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Layout>
              <Upload />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RoleBasedRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
