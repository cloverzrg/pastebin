import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-yellow-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Modern Pastebin
              </h1>
            </motion.div>

            {/* User Actions */}
            {user && (
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 transition-all duration-300 group"
                >
                  <Settings className="h-5 w-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-red-50 border border-white/30 hover:border-red-200 transition-all duration-300 group"
                >
                  <LogOut className="h-5 w-5 text-gray-700 group-hover:text-red-600 transition-colors" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            Made with ❤️ using React & TailwindCSS
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
