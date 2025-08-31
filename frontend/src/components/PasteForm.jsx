import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Type, FileText, Send, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const PasteForm = ({ onPasteCreated }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('请输入粘贴内容')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), content: content.trim() })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const url = new URL(window.location)
        url.pathname = '/' + data.random_id
        url.search = ''
        
        onPasteCreated({
          ...data,
          url: url.toString()
        })
        
        setTitle('')
        setContent('')
        toast.success('粘贴创建成功！')
      } else {
        if (response.status === 401) {
          toast.error('请先登录')
        } else {
          toast.error(data.error || '创建粘贴失败')
        }
      }
    } catch (error) {
      toast.error('创建粘贴时发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          创建新粘贴
        </h2>
        <p className="text-gray-600 text-lg">
          分享代码、文本或任何内容
        </p>
      </div>

      {/* Form */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Type className="inline h-4 w-4 mr-2" />
              标题 (可选)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500 text-gray-800"
              placeholder="为您的粘贴添加一个标题..."
            />
          </motion.div>

          {/* Content Textarea */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <FileText className="inline h-4 w-4 mr-2" />
              内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500 text-gray-800 resize-none font-mono text-sm leading-relaxed"
              placeholder="在这里粘贴您的代码或文本内容..."
              required
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:scale-95"
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>创建粘贴</span>
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}

export default PasteForm
