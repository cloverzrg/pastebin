import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [oauth2Config, setOauth2Config] = useState({ enabled: false })

  useEffect(() => {
    checkAuthStatus()
    checkOAuth2Status()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.authenticated) {
        setUser({ authenticated: true })
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkOAuth2Status = async () => {
    try {
      const response = await fetch('/api/oauth2/status', {
        credentials: 'include'
      })
      const data = await response.json()
      setOauth2Config(data)
    } catch (error) {
      console.error('Error checking OAuth2 status:', error)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser({ authenticated: true })
        toast.success('登录成功！')
        return { success: true }
      } else {
        toast.error(data.error || '登录失败')
        return { success: false, error: data.error }
      }
    } catch (error) {
      toast.error('登录时发生错误')
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setUser(null)
        toast.success('已退出登录')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const loginWithOAuth2 = async () => {
    try {
      const response = await fetch('/api/oauth2/login', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        window.location.href = data.auth_url
      } else {
        toast.error(data.error || 'OAuth2 登录失败')
      }
    } catch (error) {
      toast.error('OAuth2 登录错误')
    }
  }

  const value = {
    user,
    loading,
    oauth2Config,
    login,
    logout,
    loginWithOAuth2,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
