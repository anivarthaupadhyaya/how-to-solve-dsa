import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Repeat,
  Layers,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { useSubjects } from '../../context/SubjectsContext'

const navLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Review', path: '/review', icon: Repeat },
  { name: 'Items', path: '/items', icon: Layers },
  { name: 'Subjects', path: '/subjects', icon: BookOpen },
]

export function Sidebar({ subjects: propSubjects }) {
  let contextSubjects = []
  try {
    const ctx = useSubjects()
    contextSubjects = ctx.subjects || []
  } catch {
    // Rendered outside SubjectsProvider
  }

  const subjects = propSubjects || (contextSubjects.length > 0 ? contextSubjects : [])
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md min-h-screen sticky top-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-brand-glow shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              how-to-solve
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              SM-2 Spaced Repetition
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : ''
                          }`}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Subjects with Color Dots */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Subjects
              </p>
            </div>
            <div className="space-y-1">
              {subjects.map((sub, idx) => (
                <NavLink
                  key={sub.id || idx}
                  to={`/items?subject_id=${sub.id || ''}`}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: sub.color || '#6366F1' }}
                  />
                  <span className="truncate">{sub.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 text-center">
          v1.0 · Ready to Review
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around h-16 px-2 safe-area-pb">
        {navLinks.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

