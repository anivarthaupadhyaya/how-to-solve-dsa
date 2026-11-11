import React from 'react'
import { Repeat } from 'lucide-react'
import { Card } from '../components/ui/Card'

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
          <Repeat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today's Review Queue</h1>
          <p className="text-xs text-slate-500">Spaced repetition queue driven by the SM-2 algorithm.</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Due study cards will appear here.
        </p>
      </Card>
    </div>
  )
}
