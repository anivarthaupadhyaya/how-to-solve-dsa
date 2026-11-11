import React from 'react'
import {
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'

export function TopBar({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8">
      {/* Search Input Placeholder */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Search problems, questions, or tags"
            placeholder="Search problems, questions, or tags... (Ctrl+K)"
            className="w-full pl-10 pr-12 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:truncate"
          />
          <kbd className="hidden sm:inline-flex items-center absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 transition-transform rotate-0" />
          )}
        </button>

        {/* User Profile / Status */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-brand-glow">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                {user.email}
              </span>
              <span className="block text-[10px] text-slate-400">Student</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Log out of account"
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
              Log in
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.location.href = '/register'}>
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
