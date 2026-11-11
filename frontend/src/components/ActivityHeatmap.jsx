import React, { useMemo, useState } from 'react'
import { Flame, Trophy, Calendar, Sparkles } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'

export function ActivityHeatmap({ activity, loading }) {
  const [hoveredDay, setHoveredDay] = useState(null)

  // Map history array into a fast lookup map: { "YYYY-MM-DD": count }
  const countMap = useMemo(() => {
    const map = {}
    if (activity?.history) {
      activity.history.forEach((h) => {
        map[h.date] = h.count
      })
    }
    return map
  }, [activity])

  // Generate 52 weeks (364 days + remainder to fill current week)
  const { weeks, monthLabels, totalReviewsYear } = useMemo(() => {
    const today = new Date()
    const days = []
    let totalYear = 0

    // Find the end date (Saturday of current week or today)
    const end = new Date(today)
    // We want 52 full weeks (364 days) ending today
    const start = new Date(today)
    start.setDate(start.getDate() - 52 * 7 + 1)
    // Adjust start to previous Sunday/Monday for alignment
    const dayOfWeek = start.getDay() // 0 = Sunday
    // Let week start on Sunday
    start.setDate(start.getDate() - dayOfWeek)

    const curr = new Date(start)
    while (curr <= end || curr.getDay() !== 0) {
      const dateStr = curr.toISOString().split('T')[0]
      const count = countMap[dateStr] || 0
      totalYear += count

      days.push({
        date: dateStr,
        dayOfWeek: curr.getDay(),
        month: curr.getMonth(),
        year: curr.getFullYear(),
        dayOfMonth: curr.getDate(),
        count,
        isToday: dateStr === today.toISOString().split('T')[0],
        isFuture: curr > today,
      })

      curr.setDate(curr.getDate() + 1)
    }

    // Chunk into 7-day columns (weeks)
    const weekCols = []
    for (let i = 0; i < days.length; i += 7) {
      weekCols.push(days.slice(i, i + 7))
    }

    // Determine month label positions
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const mLabels = []
    let lastMonth = -1

    weekCols.forEach((week, wIndex) => {
      const firstValidDay = week.find((d) => !d.isFuture)
      if (firstValidDay && firstValidDay.month !== lastMonth) {
        lastMonth = firstValidDay.month
        mLabels.push({
          label: months[lastMonth],
          weekIndex: wIndex,
        })
      }
    })

    return { weeks: weekCols, monthLabels: mLabels, totalReviewsYear: totalYear }
  }, [countMap])

  // Color intensity classes for review counts
  const getColorClass = (count, isFuture) => {
    if (isFuture) return 'bg-transparent border border-dashed border-slate-100 dark:border-slate-800/40'
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/80 hover:ring-1 hover:ring-slate-400'
    if (count <= 2) return 'bg-indigo-300 dark:bg-indigo-900/90 hover:ring-1 hover:ring-indigo-400'
    if (count <= 5) return 'bg-indigo-400 dark:bg-indigo-700 hover:ring-1 hover:ring-indigo-300'
    if (count <= 9) return 'bg-indigo-500 dark:bg-indigo-600 hover:ring-1 hover:ring-indigo-200'
    return 'bg-indigo-600 dark:bg-indigo-500 hover:ring-1 hover:ring-white'
  }

  const currentStreak = activity?.current_streak ?? 0
  const longestStreak = activity?.longest_streak ?? 0
  const totalActiveDays = activity?.total_active_days ?? 0

  return (
    <Card padding="p-6" className="space-y-5">
      {/* Header and Streak Callouts */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Study Activity & Review Consistency
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalReviewsYear} reviews completed across {totalActiveDays} active days over the last 52 weeks.
          </p>
        </div>

        {/* Streak Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{currentStreak} day streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-indigo-500" />
            <span>Best: {longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* 52-Week Heatmap Container with Horizontal Scroll */}
      <div className="overflow-x-auto pb-2 pt-1 -mx-2 px-2 scrollbar-thin">
        <div className="min-w-[760px] space-y-2">
          {/* Month labels header */}
          <div className="flex text-[10px] text-slate-400 font-medium pl-8 h-4 relative">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute"
                style={{ left: `${m.weekIndex * 14 + 32}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid: Day labels on left + 52 Columns */}
          <div className="flex items-start gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-mono h-[98px] pr-1 select-none">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const colorCls = getColorClass(day.count, day.isFuture)
                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => !day.isFuture && setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3 h-3 rounded-[3px] transition-transform ${colorCls} ${
                          day.isToday ? 'ring-1.5 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                        }`}
                        title={
                          !day.isFuture
                            ? `${day.count} ${
                                day.count === 1 ? 'review' : 'reviews'
                              } on ${day.date}`
                            : undefined
                        }
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Hover Info Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-4">
          {hoveredDay ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {hoveredDay.count}
              </span>{' '}
              {hoveredDay.count === 1 ? 'review' : 'reviews'} on {hoveredDay.date}
            </span>
          ) : (
            <span>Hover over any day square for review counts.</span>
          )}
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-300 dark:bg-indigo-900" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400 dark:bg-indigo-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500 dark:bg-indigo-600" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
          <span>More</span>
        </div>
      </div>
    </Card>
  )
}

export default ActivityHeatmap
