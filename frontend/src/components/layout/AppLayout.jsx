import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuth } from '../../context/AuthContext'

export function AppLayout({ user: propUser, onLogout: propLogout, subjects }) {
  const location = useLocation()
  let authUser = null
  let authLogout = null
  try {
    const auth = useAuth()
    authUser = auth.user
    authLogout = auth.logout
  } catch {
    // Fallback if rendered outside AuthProvider
  }

  const user = propUser !== undefined ? propUser : authUser
  const onLogout = propLogout !== undefined ? propLogout : authLogout

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar (Desktop left, Mobile bottom) */}
      <Sidebar subjects={subjects} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} onLogout={onLogout} />

        {/* Page Container with Framer Motion Page Transition (fade + 8px slide) */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12 min-w-0"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
