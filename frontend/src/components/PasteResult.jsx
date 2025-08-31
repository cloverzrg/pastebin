import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, ArrowLeft, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const PasteResult = ({ result, onBack }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      toast.success('链接已复制到剪贴板！')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleVisit = () => {
    window.open(result.url, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Success Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            创建成功！
          </h2>
          <p className="text-gray-600 text-lg">
            您的粘贴已经创建完成，可以分享给其他人了
          </p>
        </motion.div>

        {/* Link Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            分享链接
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={result.url}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 text-gray-800 font-mono text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
            >
              <Copy className={`h-4 w-4 ${copied ? 'text-green-200' : ''}`} />
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>
        </motion.div>

        {/* Paste Info */}
        {result.title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6"
          >
            <div className="p-4 rounded-xl backdrop-blur-md bg-white/20 border border-white/30">
              <h3 className="font-semibold text-gray-800 mb-1">标题</h3>
              <p className="text-gray-600">{result.title}</p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>创建新的粘贴</span>
          </button>
          <button
            onClick={handleVisit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
          >
            <ExternalLink className="h-4 w-4" />
            <span>查看粘贴</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PasteResult
