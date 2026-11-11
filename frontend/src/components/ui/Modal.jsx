import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
            className={`relative w-full ${maxWidth} rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-soft-lg border border-slate-200 dark:border-slate-800 z-10 max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                {title && (
                  <h3
                    id="modal-title"
                    className="text-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
