import React from 'react'

export function Skeleton({
  className = '',
  rounded = 'rounded-xl',
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-800/80 ${rounded} ${className}`}
    />
  )
}
