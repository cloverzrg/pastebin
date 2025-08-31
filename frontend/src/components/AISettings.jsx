import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Save, TestTube, Download, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const AISettings = () => {
  const [config, setConfig] = useState({
    enabled: false,
    base_url: '',
    api_key: '',
    model: 'gpt-3.5-turbo',
    prompt: '基于以下代码/文本内容，生成一个简洁且有描述性的中文标题（不超过50字符）：\n\n{content}',
    max_tokens: 50,
    temperature: 0.7
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState([])

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/ai', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      toast.error('加载AI配置失败')
    }
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config/ai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(config)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success('AI配置保存成功')
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      toast.error('保存配置时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const testContent = "console.log('Hello World');"
      const response = await fetch('/api/test/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: testContent })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`测试成功！生成的标题：${result.title}`)
      } else {
        toast.error(result.error || '测试失败')
      }
    } catch (error) {
      toast.error('测试连接时发生错误')
    } finally {
      setTesting(false)
    }
  }

  const fetchModels = async () => {
    setFetchingModels(true)
    try {
      const response = await fetch('/api/models', {
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (response.ok && result.models) {
        setAvailableModels(result.models)
        toast.success(`获取到 ${result.models.length} 个可用模型`)
      } else {
        toast.error(result.error || '获取模型列表失败')
      }
    } catch (error) {
      toast.error('获取模型列表时发生错误')
    } finally {
      setFetchingModels(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const commonModels = [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-haiku',
    'claude-3-sonnet',
    'claude-3-opus'
  ]

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">AI 自动生成标题</h2>
            <p className="text-gray-600 mt-1">配置AI服务来自动为用户的粘贴生成标题</p>
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
            <h3 className="font-semibold text-gray-800">启用 AI 自动生成标题</h3>
            <p className="text-gray-600 text-sm mt-1">当用户未提供标题时，使用AI自动生成</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.enabled}
              onChange={(e) => updateConfig('enabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </motion.div>

        {/* API Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Base URL
            </label>
            <input
              type="url"
              value={config.base_url}
              onChange={(e) => updateConfig('base_url', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-gray-500 mt-1">支持 OpenAI 兼容的 API 接口</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.api_key}
              onChange={(e) => updateConfig('api_key', e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500 mt-1">请妥善保管您的 API Key</p>
          </motion.div>
        </div>

        {/* Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            模型
          </label>
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                list="models"
                value={config.model}
                onChange={(e) => updateConfig('model', e.target.value)}
                className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500"
                placeholder="输入或选择模型名称"
              />
              <datalist id="models">
                {commonModels.map(model => (
                  <option key={model} value={model} />
                ))}
                {availableModels.map(model => (
                  <option key={model.id} value={model.id} />
                ))}
              </datalist>
            </div>
            <button
              onClick={fetchModels}
              disabled={fetchingModels}
              className="px-4 py-3 backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              {fetchingModels ? (
                <motion.div
                  className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">获取模型</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">支持手动输入模型名称或从列表中选择</p>
        </motion.div>

        {/* Prompt Template */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            提示词模板
          </label>
          <textarea
            value={config.prompt}
            onChange={(e) => updateConfig('prompt', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500 resize-none"
            placeholder="请为以下代码/文本内容生成一个简洁的标题：&#10;&#10;{content}"
          />
          <p className="text-xs text-gray-500 mt-1">使用 {'{content}'} 作为内容占位符</p>
        </motion.div>

        {/* Advanced Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              最大 Token 数
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={config.max_tokens}
              onChange={(e) => updateConfig('max_tokens', parseInt(e.target.value) || 50)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              创造性 (Temperature)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => updateConfig('temperature', parseFloat(e.target.value) || 0.7)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/20"
        >
          <button
            onClick={testConnection}
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
                <span>测试连接</span>
              </>
            )}
          </button>
          
          <button
            onClick={saveConfig}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 disabled:opacity-50"
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

export default AISettings
