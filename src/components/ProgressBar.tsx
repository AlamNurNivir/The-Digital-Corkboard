import { motion } from 'framer-motion'
import { getProgress, getProgressColor, type LearningLog } from '../lib/store'

interface Props {
  log: LearningLog
  compact?: boolean
}

export default function ProgressBar({ log, compact = false }: Props) {
  const pct  = getProgress(log)
  const fill = getProgressColor(pct)
  const done = pct >= 100

  if (compact) {
    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Progress</span>
          <span
            className="font-mono text-[11px] font-bold"
            style={{ color: fill }}
          >
            {log.minutes_completed}/{log.minutes_spent}m · {pct}%
          </span>
        </div>
        <div className="h-2.5 bg-white border border-slate-900 overflow-hidden rounded-sm">
          <motion.div
            className="h-full"
            style={{ background: fill }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        {done && (
          <p className="font-caveat text-xs font-bold mt-0.5" style={{ color: fill }}>
            ✅ Complete!
          </p>
        )}
      </div>
    )
  }

  // Full-size variant for detail page
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">Session Progress</span>
          {done && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-500 text-green-700 font-bold text-xs">
              ✅ Completed!
            </span>
          )}
        </div>
        <span className="font-caveat text-2xl font-bold" style={{ color: fill }}>
          {pct}%
        </span>
      </div>

      <div className="h-5 bg-white border-2 border-slate-900 overflow-hidden" style={{ boxShadow: '2px 2px 0 rgba(15,23,42,1)' }}>
        <motion.div
          className="h-full relative"
          style={{ background: fill }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {pct > 12 && (
            <span className="absolute inset-0 flex items-center px-2 font-mono text-xs font-bold text-white">
              {log.minutes_completed}m
            </span>
          )}
        </motion.div>
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-xs text-slate-500">0m</span>
        <span className="font-mono text-xs text-slate-500">{log.minutes_spent}m goal</span>
      </div>
    </div>
  )
}
