import { createContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { ROLE_PERMISSIONS } from '../utils/constants'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const data = await authAPI.login({ email, password })
      const normalizedUser = data?.user || {}
      const userId = normalizedUser._id || normalizedUser.id

      const userData = {
        _id: userId,
        id: userId,
        name: normalizedUser.name,
        email: normalizedUser.email,
        role: normalizedUser.role
      }

      if (!data?.token || !userData._id || !userData.email) {
        throw new Error('Invalid login response from server')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(userData))

      setToken(data.token)
      setUser(userData)
      setIsAuthenticated(true)

      return { success: true, user: userData }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Login failed'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const hasPermission = (permission) => {
    if (!user) return false
    const userPermissions = ROLE_PERMISSIONS[user.role] || []
    return userPermissions.includes('all') || userPermissions.includes(permission)
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
