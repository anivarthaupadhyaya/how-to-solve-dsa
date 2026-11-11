import React, { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    id,
    rows = 4,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-desc` : undefined}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-600'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-800 dark:focus:border-indigo-400'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${textareaId}-desc`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  )
})
