import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/LoginForm'
import PasteForm from '../components/PasteForm'
import PasteList from '../components/PasteList'
import PasteResult from '../components/PasteResult'

const HomePage = () => {
  const { user, loading } = useAuth()
  const [showResult, setShowResult] = useState(false)
  const [pasteResult, setPasteResult] = useState(null)
  const [refreshList, setRefreshList] = useState(0)

  const handlePasteCreated = (result) => {
    setPasteResult(result)
    setShowResult(true)
    setRefreshList(prev => prev + 1)
  }

  const handleBackToForm = () => {
    setShowResult(false)
    setPasteResult(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto mt-20"
      >
        <LoginForm />
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <PasteForm onPasteCreated={handlePasteCreated} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <PasteResult 
              result={pasteResult} 
              onBack={handleBackToForm}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {user && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <PasteList key={refreshList} />
        </motion.div>
      )}
    </div>
  )
}

export default HomePage
