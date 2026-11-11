import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Repeat,
  Layers,
  TrendingUp,
  Flame,
  AlertCircle,
  ArrowRight,
  Filter,
  BarChart3,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import api from '../api/client'
import { useSubjects } from '../context/SubjectsContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

// Animated Count-Up component
function CountUp({ value, duration = 0.8, suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const end = Number(value) || 0
    if (end === 0) {
      setDisplayValue(0)
      return
    }

    const stepTime = 16
    const totalSteps = Math.max(1, Math.floor((duration * 1000) / stepTime))
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      // easeOutExpo
      const progress = 1 - Math.pow(2, -10 * (currentStep / totalSteps))
      const current = end * progress

      if (currentStep >= totalSteps) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value, duration])

  return (
    <span>
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}
      {suffix}
    </span>
  )
}

// Custom Tooltip for Recharts
function CustomTagTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-soft-lg text-xs space-y-1">
        <p className="font-bold text-slate-900 dark:text-slate-100">
          #{data.tag_name}
        </p>
        <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
          <span>Success Rate:</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {data.rate_percent}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
          <span>Reviews:</span>
          <span className="font-mono">
            {data.successful_reviews} / {data.total_reviews}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { subjects } = useSubjects()

  // Subject selector for tag chart & summary
  const [selectedSubject, setSelectedSubject] = useState('')

  // Analytics states
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState(null)
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch summary, activity streak, and weak tags
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedSubject) {
        params.subject_id = selectedSubject
      }

      const [sumRes, actRes, tagRes] = await Promise.all([
        api.get('/analytics/summary', { params }),
        api.get('/analytics/activity'),
        api.get('/analytics/tags', { params }),
      ])

      setSummary(sumRes.data)
      setActivity(actRes.data)
      setTags(tagRes.data || [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      toast.error('Failed to load analytics', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedSubject])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Prepare chart data (top 8 weakest tags with at least 1 review)
  const chartData = useMemo(() => {
    return tags
      .filter((t) => t.total_reviews > 0)
      .slice(0, 8)
      .map((t) => ({
        tag_name: t.tag_name,
        rate_percent: Math.round((t.success_rate || 0) * 100),
        total_reviews: t.total_reviews,
        successful_reviews: t.successful_reviews,
      }))
  }, [tags])

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-brand-glow">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Overview Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track your SM-2 retention rate, review streaks, and weakest technical topics.
          </p>
        </div>

        {/* Global subject filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Stat Cards with Count-Up Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Due Today */}
        <Card hoverLift padding="p-5" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Due Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CountUp value={summary?.due_today ?? 0} />
              )}
            </div>
            {summary?.due_today > 0 && (
              <Link to="/review" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                Start <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cards scheduled for review</p>
        </Card>

        {/* 2. Total Items */}
        <Card hoverLift padding="p-5" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CountUp value={summary?.total_items ?? 0} />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all your study decks</p>
        </Card>

        {/* 3. Retention Rate */}
        <Card hoverLift padding="p-5" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Retention Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CountUp
                value={Math.round((summary?.retention_rate ?? 0) * 100)}
                suffix="%"
              />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.total_reviews ?? 0} all-time reviews
          </p>
        </Card>

        {/* 4. Active Streak */}
        <Card hoverLift padding="p-5" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Daily Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CountUp value={activity?.current_streak ?? 0} suffix=" days" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Best streak: {activity?.longest_streak ?? 0} days
          </p>
        </Card>
      </div>

      {/* Weakest Tags Section with Recharts Horizontal Bar Chart */}
      <Card padding="p-6" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Targeted Weakness Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tags with the lowest recall success rate (ranked weakest first). Focus on these topics.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No tag reviews recorded yet"
            description="Complete daily reviews on your cards to calculate retention rates and uncover knowledge gaps."
            action={
              <Link to="/review">
                <Button variant="primary" size="sm" icon={Repeat}>
                  Start Today's Review
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                {/* SVG linear gradient definitions */}
                <defs>
                  <linearGradient id="weakBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                  <linearGradient id="roseBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F43F5E" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                  <linearGradient id="amberBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="tag_name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTagTooltip />} />
                <Bar
                  dataKey="rate_percent"
                  radius={[0, 8, 8, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => {
                    const fill =
                      entry.rate_percent < 50
                        ? 'url(#roseBarGradient)'
                        : entry.rate_percent < 75
                        ? 'url(#amberBarGradient)'
                        : 'url(#weakBarGradient)'
                    return <Cell key={`cell-${index}`} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
