import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineClock,
} from 'react-icons/hi'
import PriorityBadge from '../Emergency/PriorityBadge'

const AgentStep = ({
  stepNumber,
  agent,
  status = 'waiting',
  output = null,
  isLast = false,
  lineProgress = 0,
}) => {
  const [expanded, setExpanded] = useState(status === 'complete')

  const statusStyles = {
    waiting: {
      circle: 'bg-surface-hover border-border text-text-muted',
      line: 'border-dashed border-border',
      text: 'Waiting...',
    },
    running: {
      circle: 'bg-accent/20 border-accent text-accent animate-agent-running',
      line: 'border-dashed border-accent',
      text: agent.runningText || 'Processing...',
    },
    complete: {
      circle: 'bg-success/20 border-success text-success',
      line: 'border-solid border-success',
      text: 'Complete',
    },
  }

  const style = statusStyles[status] || statusStyles.waiting
  const Icon = agent.icon

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{
            scale: status === 'complete' ? [1, 1.2, 1] : 1,
            borderColor: status === 'complete' ? '#22c55e' : undefined,
          }}
          transition={{ duration: 0.4 }}
          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${style.circle}`}
        >
          {status === 'complete' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <HiOutlineCheck className="h-5 w-5" />
            </motion.div>
          ) : status === 'running' ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            stepNumber
          )}
        </motion.div>
        {!isLast && (
          <div className="relative h-full min-h-[80px] w-0.5">
            <div className={`absolute inset-0 border-l-2 ${style.line}`} />
            {lineProgress > 0 && (
              <motion.div
                className="absolute left-0 top-0 w-0.5 bg-success"
                initial={{ height: 0 }}
                animate={{ height: `${lineProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8 flex-1"
      >
        <div
          className={`rounded-xl border bg-surface p-5 ${
            status === 'running' ? 'border-accent/50 shadow-lg' : 'border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${agent.iconBg}`}>
              <Icon className={`h-5 w-5 ${agent.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Step {stepNumber}
              </p>
              <h4 className="font-semibold text-text-primary">{agent.name}</h4>
              <div className="mt-1 flex items-center gap-2">
                {status === 'running' && (
                  <div className="h-3 w-3 animate-spin rounded-full border border-accent border-t-transparent" />
                )}
                {status === 'waiting' && <HiOutlineClock className="h-3 w-3 text-text-muted" />}
                <p className={`text-sm ${status === 'running' ? 'text-accent' : 'text-text-muted'}`}>
                  {style.text}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {status === 'complete' && output && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mb-2 text-xs text-accent hover:underline"
                >
                  {expanded ? 'Collapse output' : 'Expand output'}
                </button>
                {expanded && (
                  <div className="rounded-lg border border-border bg-bg-secondary p-4">
                    {output.render ? output.render() : (
                      <p className="text-sm text-text-secondary">{output.text}</p>
                    )}
                    {output.processingTime && (
                      <p className="mt-2 text-xs text-text-muted">
                        Processing time: {output.processingTime}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default AgentStep
