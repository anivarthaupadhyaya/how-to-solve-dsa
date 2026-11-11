import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Brain,
  BarChart3,
  BookOpen,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      await login(email, password)
      toast.success('Welcome back!', {
        description: 'Successfully signed in to your account.',
      })
      navigate(from, { replace: true })
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 401) {
        setErrors({
          password: 'The email or password you entered is incorrect.',
        })
        toast.error('Authentication failed', {
          description: 'Invalid email or password.',
        })
      } else if (status === 429) {
        toast.error('Too many requests', {
          description: 'Rate limit exceeded. Please wait a minute before trying again.',
        })
      } else {
        toast.error('Sign in failed', {
          description: detail || 'An unexpected error occurred. Please try again.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoFill = () => {
    setEmail('demo@example.com')
    setPassword('demopass123')
    setErrors({})
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Panel (Left side on desktop) */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden">
        {/* Subtle decorative glow overlay */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-soft">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">
              how-to-solve
            </span>
            <span className="text-xs text-indigo-200">
              Spaced Repetition for Technical Mastery
            </span>
          </div>
        </div>

        {/* Middle hero value propositions */}
        <div className="relative z-10 my-12 lg:my-0 max-w-lg space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 backdrop-blur-sm border border-white/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              SM-2 Active Recall Engine
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Master technical interviews. Never blank out again.
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Retain Data Structures, Algorithms, OS, Computer Networks, and DBMS
              concepts permanently with mathematically optimized review intervals.
            </p>
          </div>

          {/* Value feature list */}
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-semibold text-white">
                  SuperMemo SM-2 Scheduling
                </h2>
                <p className="text-xs text-indigo-200 leading-normal">
                  Reviews are timed exactly at your memory decay point so recall becomes second nature.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-semibold text-white">
                  Per-Tag Weakness Analytics
                </h2>
                <p className="text-xs text-indigo-200 leading-normal">
                  Real-time retention rates surface weak tags like Dynamic Programming or Virtual Memory first.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-semibold text-white">
                  Curated Decks & CSV Bulk Import
                </h2>
                <p className="text-xs text-indigo-200 leading-normal">
                  Import your personal study decks or start immediately with pre-loaded CS questions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative z-10 text-xs text-indigo-200/90 pt-4 border-t border-white/10 flex items-center justify-between">
          <span>Consistency beats cramming every single time.</span>
          <span className="font-mono text-[11px] opacity-75">v0.1.0</span>
        </div>
      </div>

      {/* Form Panel (Right side) */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Top bar controls */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your credentials to continue your daily review streak.
              </p>
            </div>

            {/* Demo quick fill banner */}
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300 block">
                  Quick Demo Login
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  demo@example.com / demopass123
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDemoFill}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                Auto-fill
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={Mail}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                icon={Lock}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
                icon={ArrowRight}
              >
                Sign in to Account
              </Button>
            </form>

            {/* Register redirection */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                Create an account
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom spacing / footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-600">
          Built for software engineers aiming for top technical standards.
        </div>
      </div>
    </div>
  )
}
