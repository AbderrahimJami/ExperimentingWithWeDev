import { createContext, useContext, useEffect, useState } from 'react'
import {
  getAvatarUrl,
  getCurrentUser,
  getUserProfile,
  signOut as serviceSignOut,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      if (isMounted) {
        setUser(currentUser)
        setIsInitializing(false)
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user) {
        setProfile(null)
        setAvatarUrl('')
        return
      }

      try {
        const data = await getUserProfile()
        if (!isMounted) {
          return
        }
        setProfile(data)
        const url = await getAvatarUrl(data.picture)
        if (isMounted) {
          setAvatarUrl(url)
        }
      } catch (error) {
        if (isMounted) {
          setProfile(null)
          setAvatarUrl('')
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setAvatarUrl('')
      return null
    }

    const data = await getUserProfile()
    setProfile(data)
    const url = await getAvatarUrl(data.picture)
    setAvatarUrl(url)
    return data
  }

  const signOut = async () => {
    await serviceSignOut()
    setUser(null)
    setProfile(null)
    setAvatarUrl('')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        signOut,
        isInitializing,
        profile,
        avatarUrl,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
