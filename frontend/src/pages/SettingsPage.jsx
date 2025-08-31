import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Shield, Save, TestTube } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import AISettings from '../components/AISettings'
import OAuth2Settings from '../components/OAuth2Settings'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('ai')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  const tabs = [
    {
      id: 'ai',
      name: 'AI 设置',
      icon: Sparkles,
      description: 'AI 自动生成标题配置'
    },
    {
      id: 'oauth2',
      name: 'OAuth2 设置',
      icon: Shield,
      description: '第三方登录配置'
    }
  ]

  if (!user) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              系统设置
            </h1>
            <p className="text-gray-600 mt-1">配置您的 Pastebin 系统</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sticky top-6">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <tab.icon className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{tab.name}</div>
                      <div className={`text-xs mt-1 ${
                        activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AISettings />
              </motion.div>
            )}
            {activeTab === 'oauth2' && (
              <motion.div
                key="oauth2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OAuth2Settings />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingsPage
