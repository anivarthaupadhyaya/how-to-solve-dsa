import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { Card } from '../components/ui/Card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500">Learning retention, activity streak, and weak-tag analytics.</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Dashboard overview and weak-tag charts will appear here.
        </p>
      </Card>
    </div>
  )
}
