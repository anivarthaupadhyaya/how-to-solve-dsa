import React, { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
          className={`w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-600'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-800 dark:focus:border-indigo-400'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-desc`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  )
})
