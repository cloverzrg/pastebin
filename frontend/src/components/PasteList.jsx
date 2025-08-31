import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, FileText, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const PasteList = () => {
  const [pastes, setPastes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const pageSize = 10

  useEffect(() => {
    loadPastes(currentPage)
  }, [currentPage])

  const loadPastes = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pastes/paginated?page=${page}&page_size=${pageSize}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPastes(data.pastes || [])
        setCurrentPage(data.current_page)
        setTotalPages(data.total_pages)
      } else {
        toast.error('加载粘贴列表失败')
      }
    } catch (error) {
      toast.error('加载粘贴列表时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const deletePaste = async (randomId) => {
    if (!confirm('确定要删除这个粘贴吗？')) return
    
    setDeletingId(randomId)
    try {
      const response = await fetch(`/api/paste/${randomId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setPastes(prev => prev.filter(paste => paste.random_id !== randomId))
        toast.success('粘贴已删除')
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除时发生错误')
    } finally {
      setDeletingId(null)
    }
  }

  const formatRelativeTime = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return '刚刚'
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} 分钟前`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} 小时前`
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  if (loading && pastes.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">粘贴历史</h3>
            <p className="text-gray-600 text-sm">管理您创建的所有粘贴</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {pastes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">还没有任何粘贴</p>
            <p className="text-gray-500 text-sm mt-2">创建您的第一个粘贴吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {pastes.map((paste, index) => (
                <motion.div
                  key={paste.random_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-4 hover:bg-white/30 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <a
                          href={`/${paste.random_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200 truncate flex items-center space-x-2 group"
                        >
                          <span className="truncate">
                            {paste.title || '无标题'}
                          </span>
                          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatRelativeTime(paste.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => deletePaste(paste.random_id)}
                      disabled={deletingId === paste.random_id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {deletingId === paste.random_id ? (
                        <motion.div
                          className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-white/20"
              >
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>上一页</span>
                </button>
                
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-md bg-white/20 border border-white/30">
                  <span className="text-gray-700 font-medium">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default PasteList
