import React from 'react'
import { BookOpen } from 'lucide-react'
import { Card } from '../components/ui/Card'

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-xs text-slate-500">Categories such as DSA, Operating Systems, Computer Networks.</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Subject categories will appear here.
        </p>
      </Card>
    </div>
  )
}
