import React from 'react'
import {
  HiOutlineExclamationCircle,
  HiOutlineExclamation,
  HiOutlineMinus,
  HiOutlineCheck,
} from 'react-icons/hi'

const priorityConfig = {
  CRITICAL: {
    className: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse-ring',
    icon: HiOutlineExclamationCircle,
  },
  HIGH: {
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    icon: HiOutlineExclamation,
  },
  MEDIUM: {
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    icon: HiOutlineMinus,
  },
  LOW: {
    className: 'bg-green-500/20 text-green-400 border-green-500/50',
    icon: HiOutlineCheck,
  },
}

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const config = priorityConfig[priority] || priorityConfig.LOW
  const Icon = config.icon
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.className} ${sizeClass}`}
    >
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} />
      {priority}
    </span>
  )
}

export default PriorityBadge
