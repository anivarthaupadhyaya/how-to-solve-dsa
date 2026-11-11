import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles } from 'lucide-react'

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-brand-glow animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin text-white/90" style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Checking authentication...
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
