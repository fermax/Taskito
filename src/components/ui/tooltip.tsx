"use client"

import React, { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export default function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current && content) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      })
      setShow(true)
    }
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div
          className={cn(
            "fixed z-[70] px-3 py-2 rounded-lg text-sm shadow-xl border bg-popover text-popover-foreground max-w-xs break-words pointer-events-none",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
            transform: "translateX(-50%)",
          }}
        >
          {content}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-l border-t bg-popover"
          />
        </div>
      )}
    </div>
  )
}
