import React from 'react'
import { X } from 'lucide-react'

export function Badge({
  children,
  variant = 'default',
  dotColor,
  onRemove,
  size = 'md',
  className = '',
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const variantStyles = {
    default:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80',
    primary:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
    forgot:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
    shaky:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
    easy:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
    outline:
      'bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

export function TagChip({ name, onRemove, subjectColor, count }) {
  return (
    <Badge variant="default" dotColor={subjectColor} onRemove={onRemove}>
      #{name}
      {count !== undefined && (
        <span className="ml-1 text-[10px] opacity-60">({count})</span>
      )}
    </Badge>
  )
}
