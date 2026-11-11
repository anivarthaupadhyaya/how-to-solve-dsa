import React from 'react'

export function Card({
  children,
  className = '',
  hoverLift = false,
  padding = 'p-6',
  onClick,
  ...props
}) {
  const liftStyles = hoverLift
    ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg hover:border-indigo-300/80 dark:hover:border-indigo-500/40 cursor-pointer'
    : ''

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-soft ${padding} ${liftStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
