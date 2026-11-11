import React from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
