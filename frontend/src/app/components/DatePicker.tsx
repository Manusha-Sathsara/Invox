import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { DayPicker } from 'react-day-picker'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface DatePickerProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  isDark: boolean
  label?: string
}

export function DatePicker({ value, onChange, disabled, isDark, label }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const selected = value ? parseISO(value) : undefined

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggle = () => {
    if (disabled) return
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(v => !v)
  }

  const handleSelect = (day: Date | undefined) => {
    if (!day) return
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const inputBase = `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm outline-none transition-all text-left ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 hover:border-indigo-500/50'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 hover:border-indigo-300'
  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`

  const dayPickerClassNames = {
    root: 'p-1',
    months: 'flex flex-col',
    month: 'space-y-2',
    caption: 'flex justify-center pt-1 relative items-center mb-2',
    caption_label: `text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`,
    nav: 'flex items-center',
    nav_button: `absolute p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`,
    nav_button_previous: 'left-1',
    nav_button_next: 'right-1',
    table: 'w-full border-collapse',
    head_row: 'flex mb-1',
    head_cell: `text-[11px] rounded w-8 font-medium text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`,
    row: 'flex w-full mt-1',
    cell: 'h-8 w-8 text-center text-xs p-0 relative',
    day: `h-8 w-8 p-0 rounded-lg font-normal transition-colors aria-selected:opacity-100 ${
      isDark
        ? 'text-slate-300 hover:bg-white/10'
        : 'text-slate-700 hover:bg-black/5'
    }`,
    day_selected: `!bg-indigo-500 !text-white hover:!bg-indigo-600 font-semibold`,
    day_today: `border ${isDark ? 'border-indigo-500/40 text-indigo-400' : 'border-indigo-300 text-indigo-600'}`,
    day_outside: `opacity-30`,
    day_disabled: 'opacity-20 cursor-not-allowed',
  }

  const popoverStyle = rect
    ? {
        position: 'fixed' as const,
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 280),
        zIndex: 99999,
        width: 270,
      }
    : {}

  return (
    <div>
      {label && (
        <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
          {label}
        </label>
      )}
      <button ref={btnRef} onClick={toggle} disabled={disabled} className={inputBase}>
        <Calendar size={14} className={isDark ? 'text-slate-500' : 'text-slate-500'} />
        <span className={!selected ? (isDark ? 'text-slate-600' : 'text-slate-400') : ''}>
          {selected ? format(selected, 'MMM d, yyyy') : 'Pick a date…'}
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              style={popoverStyle}
              className={`rounded-2xl border shadow-2xl overflow-hidden ${
                isDark
                  ? 'bg-slate-900 border-white/[0.08] shadow-black/60'
                  : 'bg-white border-black/[0.08] shadow-black/20'
              }`}
            >
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                classNames={dayPickerClassNames}
                components={{
                  IconLeft: () => <ChevronLeft size={14} />,
                  IconRight: () => <ChevronRight size={14} />,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
