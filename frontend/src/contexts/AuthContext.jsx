import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

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

  // Fetch user profile with role
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null)
      return null
    }
    
    try {
      // Check if Supabase is properly configured
      if (!supabase) {
        console.warn('Supabase not configured, skipping profile fetch')
        setUserProfile(null)
        return null
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to avoid error if no rows
      
      if (error) {
        // PGRST116 = no rows returned (profile doesn't exist yet)
        // 42P01 = table doesn't exist
        // 406 = Not Acceptable (RLS or table issue)
        if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 406) {
          if (error.status === 406) {
            console.warn('⚠️ Profiles table may not exist or RLS is blocking access. Please run supabase_schema.sql in your Supabase SQL Editor.')
          } else {
            console.log('Profile not found for user, this is normal for new users')
          }
          setUserProfile(null)
          return null
        } else {
          console.error('Error fetching profile:', error)
          setUserProfile(null)
          return null
        }
      }
      
      setUserProfile(data || null)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      setUserProfile(null)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    
    // If Supabase is not configured, skip auth and just set loading to false
    if (!supabaseConfigured) {
      console.warn('Supabase not configured, skipping authentication')
      setLoading(false)
      return
    }
    
    // Get initial session with timeout
    const initAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: { message: 'Timeout' } }), 5000))
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch profile with timeout (don't wait for it to finish)
          fetchUserProfile(session.user.id).catch(err => {
            console.error('Error fetching profile:', err)
            // Continue even if profile fetch fails
          })
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes
    let subscription = null
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch profile but don't block on it
          fetchUserProfile(session.user.id).catch(err => {
            console.error('Error fetching profile on auth change:', err)
          })
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      })
      subscription = sub
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email, password, fullName, role = 'employee') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    
    // Create profile with role
    if (data.user) {
      // Determine role based on email domain or explicit role
      // Admin emails can be configured here
      const userRole = email.toLowerCase().includes('admin') || email.toLowerCase().includes('manager') 
        ? 'admin' 
        : role
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: userRole,
      })
      
      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        // Fetch the newly created profile
        await fetchUserProfile(data.user.id)
      }
    }
    
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Fetch user profile after sign in
    if (data.user) {
      await fetchUserProfile(data.user.id)
    }
    
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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

