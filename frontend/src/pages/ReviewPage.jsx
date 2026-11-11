import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Repeat,
  Clock,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Code2,
  HelpCircle,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../api/client'
import { useSubjects } from '../context/SubjectsContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, TagChip } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export default function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { subjects, refreshData: refreshGlobalData } = useSubjects()

  // Subject filter
  const initialSubject = searchParams.get('subject_id') || ''
  const [selectedSubject, setSelectedSubject] = useState(initialSubject)

  // Review Queue state
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)

  // Running timer per card
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Session review stats
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    forgot: 0,
    shaky: 0,
    easy: 0,
    totalSeconds: 0,
  })
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Fetch due cards today
  const fetchDueReviews = useCallback(async () => {
    setLoading(true)
    setIsFlipped(false)
    setCurrentIndex(0)
    setSessionCompleted(false)
    try {
      const params = {}
      if (selectedSubject) {
        params.subject_id = selectedSubject
      }
      const res = await api.get('/reviews/today', { params })
      const dueCards = res.data || []
      setQueue(dueCards)
    } catch (err) {
      toast.error('Failed to load review queue', {
        description: err.response?.data?.detail || err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedSubject])

  useEffect(() => {
    fetchDueReviews()
  }, [fetchDueReviews])

  // Sync URL search params
  useEffect(() => {
    const sId = searchParams.get('subject_id')
    if (sId !== null && sId !== selectedSubject) {
      setSelectedSubject(sId)
    }
  }, [searchParams])

  // Running timer
  useEffect(() => {
    if (loading || sessionCompleted || queue.length === 0) return

    setTimerSeconds(0)
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, loading, sessionCompleted, queue.length])

  // Current active card
  const currentCard = queue[currentIndex] || null

  // Submit SM-2 Rating for current card
  const handleRate = useCallback(
    async (rating) => {
      if (!currentCard || submittingRating) return

      setSubmittingRating(true)
      const timeTaken = Math.max(1, timerSeconds)

      try {
        await api.post(`/reviews/${currentCard.user_item_id}`, {
          rating,
          time_taken_seconds: timeTaken,
        })

        // Update session summary statistics
        setSessionStats((prev) => ({
          ...prev,
          reviewed: prev.reviewed + 1,
          [rating]: prev[rating] + 1,
          totalSeconds: prev.totalSeconds + timeTaken,
        }))

        // Move to next card or complete session
        if (currentIndex + 1 < queue.length) {
          setIsFlipped(false)
          setCurrentIndex((prev) => prev + 1)
        } else {
          setSessionCompleted(true)
          refreshGlobalData()
        }
      } catch (err) {
        toast.error('Failed to submit review', {
          description: err.response?.data?.detail || err.message,
        })
      } finally {
        setSubmittingRating(false)
      }
    },
    [currentCard, submittingRating, timerSeconds, currentIndex, queue.length, refreshGlobalData]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keystrokes if typing inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (!sessionCompleted && queue.length > 0) {
          setIsFlipped((prev) => !prev)
        }
      } else if (isFlipped && !submittingRating && !sessionCompleted) {
        if (e.key === '1') {
          e.preventDefault()
          handleRate('forgot')
        } else if (e.key === '2') {
          e.preventDefault()
          handleRate('shaky')
        } else if (e.key === '3') {
          e.preventDefault()
          handleRate('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlipped, submittingRating, sessionCompleted, queue.length, handleRate])

  // Format seconds to mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60)
      .toString()
      .padStart(2, '0')
    const secs = (timerSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }, [timerSeconds])

  // Restart practice session
  const handleRestart = () => {
    setSessionStats({
      reviewed: 0,
      forgot: 0,
      shaky: 0,
      easy: 0,
      totalSeconds: 0,
    })
    fetchDueReviews()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header & Subject Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-brand-glow">
              <Repeat className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Daily Review
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active recall calibrated by SuperMemo SM-2. Test your recall before flipping.
          </p>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              if (e.target.value) {
                setSearchParams({ subject_id: e.target.value })
              } else {
                setSearchParams({})
              }
            }}
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

      {/* Main Review Content */}
      {loading ? (
        <Card padding="p-8" className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="py-12 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ) : sessionCompleted || queue.length === 0 ? (
        /* Celebratory Finished State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card padding="p-8 sm:p-10" className="text-center space-y-6 relative overflow-hidden">
            {/* Top celebratory glow banner */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-indigo-500 to-violet-500" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-soft-lg">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {sessionStats.reviewed > 0
                  ? 'Great Job! Queue Completed'
                  : 'All Caught Up!'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {sessionStats.reviewed > 0
                  ? 'Your SM-2 memory intervals have been updated. Consistent reviews ensure permanent retention.'
                  : 'No study cards are due for review right now. Add new cards or explore other subjects.'}
              </p>
            </div>

            {/* Session Summary Metrics */}
            {sessionStats.reviewed > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto py-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Reviewed
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {sessionStats.reviewed}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
                    Easy
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {sessionStats.easy}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">
                    Shaky
                  </span>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {sessionStats.shaky}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase block">
                    Forgot
                  </span>
                  <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                    {sessionStats.forgot}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button variant="primary" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/items">
                <Button variant="secondary" icon={BookOpen}>
                  Manage Items
                </Button>
              </Link>
              <Button variant="ghost" icon={RotateCw} onClick={handleRestart}>
                Review Again
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Active Review Card with 3D Flip */
        <div className="space-y-4">
          {/* Progress Header & Running Timer */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Card <span className="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</span> of{' '}
              {queue.length}
            </span>

            {/* Monospace Running Timer */}
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIndex + 1) / queue.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* 3D Flip Card Container */}
          <div
            className="w-full relative select-none"
            style={{ perspective: 1200 }}
          >
            <motion.div
              className="w-full min-h-[380px] rounded-2xl cursor-pointer relative"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* FRONT FACE (Question / Prompt) */}
              <div
                onClick={() => setIsFlipped(true)}
                className="w-full min-h-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-soft-lg p-6 sm:p-8 flex flex-col justify-between"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div>
                  {/* Card Meta Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: currentCard.subject?.color || '#6366F1',
                          }}
                        />
                        {currentCard.subject?.name || 'Subject'}
                      </span>

                      {currentCard.type === 'problem' ? (
                        <Badge variant="primary" size="sm">
                          <Code2 className="w-3 h-3 mr-1" />
                          Problem
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <HelpCircle className="w-3 h-3 mr-1" />
                          Q&A
                        </Badge>
                      )}

                      {currentCard.difficulty && (
                        <Badge
                          variant={
                            currentCard.difficulty === 'easy'
                              ? 'easy'
                              : currentCard.difficulty === 'hard'
                              ? 'forgot'
                              : 'shaky'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {currentCard.difficulty}
                        </Badge>
                      )}
                    </div>

                    {currentCard.url && (
                      <a
                        href={currentCard.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        External Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Card Title */}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight leading-snug">
                    {currentCard.title}
                  </h2>

                  {/* Question / Prompt Body */}
                  {currentCard.prompt && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {currentCard.prompt}
                    </div>
                  )}

                  {/* Tags */}
                  {currentCard.tags && currentCard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {currentCard.tags.map((t) => (
                        <TagChip
                          key={t.id}
                          name={t.name}
                          subjectColor={currentCard.subject?.color}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Flip Hint CTA */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Sparkles className="w-4 h-4" /> Click or press Space to reveal answer
                  </span>
                  <span className="hidden sm:inline font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Space
                  </span>
                </div>
              </div>

              {/* BACK FACE (Answer & SM-2 Rating Buttons) */}
              <div
                className="w-full min-h-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-soft-lg p-6 sm:p-8 flex flex-col justify-between absolute inset-0"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div>
                  {/* Top Bar on back */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Answer / Solution
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium"
                    >
                      <RotateCw className="w-3 h-3" /> Flip back
                    </button>
                  </div>

                  {/* Question Recall Reminder */}
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                    {currentCard.title}
                  </h3>

                  {/* Answer Body */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {currentCard.answer || 'No answer provided for this card.'}
                  </div>
                </div>

                {/* Rating Buttons in Rose, Amber, Emerald */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                    <span>How well did you recall this concept?</span>
                    <span className="hidden sm:inline font-mono text-[11px]">
                      Keys 1, 2, 3
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Forgot (Rose) */}
                    <button
                      type="button"
                      disabled={submittingRating}
                      onClick={() => handleRate('forgot')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs transition-all hover:scale-102 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <span>Forgot</span>
                      <span className="text-[10px] font-normal opacity-70 mt-0.5">
                        Interval: 1d · Key [1]
                      </span>
                    </button>

                    {/* Shaky (Amber) */}
                    <button
                      type="button"
                      disabled={submittingRating}
                      onClick={() => handleRate('shaky')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all hover:scale-102 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <span>Shaky</span>
                      <span className="text-[10px] font-normal opacity-70 mt-0.5">
                        Pass with effort · Key [2]
                      </span>
                    </button>

                    {/* Easy (Emerald) */}
                    <button
                      type="button"
                      disabled={submittingRating}
                      onClick={() => handleRate('easy')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all hover:scale-102 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <span>Easy</span>
                      <span className="text-[10px] font-normal opacity-70 mt-0.5">
                        Instant recall · Key [3]
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
