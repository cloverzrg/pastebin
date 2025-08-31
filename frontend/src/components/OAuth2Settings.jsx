import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Save, TestTube, Github, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const OAuth2Settings = () => {
  const [config, setConfig] = useState({
    enabled: false,
    name: '',
    client_id: '',
    client_secret: '',
    auth_url: '',
    token_url: '',
    user_info_url: '',
    redirect_url: '',
    scopes: ''
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/oauth2', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      toast.error('加载OAuth2配置失败')
    }
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config/oauth2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(config)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success('OAuth2配置保存成功')
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      toast.error('保存配置时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const testConfiguration = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/oauth2/status', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (response.ok) {
        if (result.oauth2_enabled) {
          toast.success('OAuth2配置有效')
        } else {
          toast.error('OAuth2配置未启用')
        }
      } else {
        toast.error(result.error || '测试失败')
      }
    } catch (error) {
      toast.error('测试配置时发生错误')
    } finally {
      setTesting(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const presetConfigs = {
    github: {
      name: 'GitHub',
      auth_url: 'https://github.com/login/oauth/authorize',
      token_url: 'https://github.com/login/oauth/access_token',
      user_info_url: 'https://api.github.com/user',
      scopes: 'read:user'
    },
    google: {
      name: 'Google',
      auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_url: 'https://oauth2.googleapis.com/token',
      user_info_url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: 'openid email profile'
    }
  }

  const applyPreset = (preset) => {
    setConfig(prev => ({ ...prev, ...presetConfigs[preset] }))
    toast.success(`已应用 ${presetConfigs[preset].name} 预设配置`)
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">OAuth2 登录设置</h2>
            <p className="text-gray-600 mt-1">配置第三方OAuth2认证服务</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Enable Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between p-4 rounded-xl backdrop-blur-md bg-white/20 border border-white/30"
        >
          <div>
            <h3 className="font-semibold text-gray-800">启用 OAuth2 登录</h3>
            <p className="text-gray-600 text-sm mt-1">允许用户使用第三方账号登录</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.enabled}
              onChange={(e) => updateConfig('enabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </motion.div>

        {/* Preset Configurations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            快速配置
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => applyPreset('github')}
              className="p-4 rounded-xl backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 transition-all duration-300 flex items-center space-x-3 text-left"
            >
              <Github className="h-8 w-8 text-gray-700" />
              <div>
                <div className="font-medium text-gray-800">GitHub</div>
                <div className="text-sm text-gray-600">使用 GitHub OAuth2</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('google')}
              className="p-4 rounded-xl backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 transition-all duration-300 flex items-center space-x-3 text-left"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                G
              </div>
              <div>
                <div className="font-medium text-gray-800">Google</div>
                <div className="text-sm text-gray-600">使用 Google OAuth2</div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Provider Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            提供商名称
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig('name', e.target.value)}
            className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
            placeholder="GitHub"
          />
          <p className="text-xs text-gray-500 mt-1">在登录页面显示的OAuth2提供商名称</p>
        </motion.div>

        {/* Client Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={config.client_id}
              onChange={(e) => updateConfig('client_id', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="您的应用 Client ID"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              value={config.client_secret}
              onChange={(e) => updateConfig('client_secret', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="您的应用 Client Secret"
            />
          </motion.div>
        </div>

        {/* URLs */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Authorization URL
            </label>
            <input
              type="url"
              value={config.auth_url}
              onChange={(e) => updateConfig('auth_url', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="https://github.com/login/oauth/authorize"
            />
            <p className="text-xs text-gray-500 mt-1">OAuth2 授权端点</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Token URL
            </label>
            <input
              type="url"
              value={config.token_url}
              onChange={(e) => updateConfig('token_url', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="https://github.com/login/oauth/access_token"
            />
            <p className="text-xs text-gray-500 mt-1">OAuth2 令牌端点</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User Info URL
            </label>
            <input
              type="url"
              value={config.user_info_url}
              onChange={(e) => updateConfig('user_info_url', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="https://api.github.com/user"
            />
            <p className="text-xs text-gray-500 mt-1">获取用户信息的 API 端点</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Redirect URL
            </label>
            <input
              type="url"
              value={config.redirect_url}
              onChange={(e) => updateConfig('redirect_url', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="http://localhost:8080/api/oauth2/callback"
            />
            <p className="text-xs text-gray-500 mt-1">在 OAuth2 应用设置中配置的回调地址</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scopes
            </label>
            <input
              type="text"
              value={config.scopes}
              onChange={(e) => updateConfig('scopes', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="read:user"
            />
            <p className="text-xs text-gray-500 mt-1">请求的权限范围，多个权限用空格分隔</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/20"
        >
          <button
            onClick={testConfiguration}
            disabled={testing}
            className="flex-1 px-6 py-3 backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg"
          >
            {testing ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>测试中...</span>
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                <span>测试配置</span>
              </>
            )}
          </button>
          
          <button
            onClick={saveConfig}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>保存设置</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default OAuth2Settings
