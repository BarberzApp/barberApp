"use client"

import { useEffect, useState } from "react"

// Use a purple color similar to the image
const PURPLE = "#9B5DE5"

interface MonthlyEarnings {
  current: number
  previous: number
  trend: "up" | "down"
}

export function EarningsSummary() {
  const [earnings, setEarnings] = useState<MonthlyEarnings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/earnings/monthly")
      .then((res) => res.json())
      .then((data) => setEarnings(data))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading || !earnings) {
    return (
      <div style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    )
  }

  const arrowUp = earnings.trend === "up"
  const amount = `$${earnings.current.toLocaleString()}`

  return (
    <div style={{ textAlign: "center", padding: 32 }}>
      <div style={{ color: PURPLE, fontWeight: 600, fontSize: 28, letterSpacing: 2, marginBottom: 24 }}>
        EARNINGS
      </div>
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Circle */}
        <svg width={220} height={220}>
          <circle
            cx={110}
            cy={110}
            r={100}
            stroke={PURPLE}
            strokeWidth={7}
            fill="none"
          />
          {/* Arrow */}
          {arrowUp ? (
            // Up arrow
            <g>
              <line x1={40} y1={180} x2={180} y2={40} stroke={PURPLE} strokeWidth={7} />
              <polygon points="180,40 170,60 190,60" fill={PURPLE} />
            </g>
          ) : (
            // Down arrow
            <g>
              <line x1={40} y1={40} x2={180} y2={180} stroke={PURPLE} strokeWidth={7} />
              <polygon points="180,180 170,160 190,160" fill={PURPLE} />
            </g>
          )}
        </svg>
        {/* Amount */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 220,
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 700,
            color: "#111",
          }}
        >
          {amount}
        </div>
      </div>
    </div>
  )
} 