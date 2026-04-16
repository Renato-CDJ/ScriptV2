"use client"

import { useEffect, useRef, useCallback } from "react"

interface Point {
  x: number
  y: number
  timestamp: number
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)
  const lastMoveRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Set canvas size with device pixel ratio for performance
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()
    
    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 150)
    }
    window.addEventListener("resize", handleResize, { passive: true })

    // Throttled mouse movement (every 16ms = ~60fps)
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMoveRef.current < 16) return
      lastMoveRef.current = now

      pointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      })

      // Keep only recent points (last 300ms for better performance)
      pointsRef.current = pointsRef.current.filter((p) => now - p.timestamp < 300)
      
      // Start animation if not active
      if (!isActiveRef.current && pointsRef.current.length > 1) {
        isActiveRef.current = true
        animate()
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Animation loop - only runs when there are points to draw
    const animate = () => {
      if (!ctx || !canvas) return

      const points = pointsRef.current
      const now = Date.now()
      
      // Clean up old points
      pointsRef.current = points.filter((p) => now - p.timestamp < 300)

      // Stop animation if no points
      if (pointsRef.current.length < 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        isActiveRef.current = false
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw trail with simplified rendering
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (let i = 1; i < pointsRef.current.length; i++) {
        const point = pointsRef.current[i]
        const prevPoint = pointsRef.current[i - 1]
        const age = now - point.timestamp
        const maxAge = 300
        const opacity = Math.max(0, 1 - age / maxAge)

        // Simplified color (no gradient per segment for performance)
        ctx.strokeStyle = `rgba(249, 115, 22, ${opacity * 0.7})`
        ctx.lineWidth = 2.5 * opacity

        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      clearTimeout(resizeTimeout)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" style={{ willChange: 'auto' }} />
}
