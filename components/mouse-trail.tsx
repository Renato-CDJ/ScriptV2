"use client"

import { useEffect, useRef } from "react"

interface Point {
  x: number
  y: number
  timestamp: number
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      pointsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      })

      // Keep only recent points (last 500ms)
      const now = Date.now()
      pointsRef.current = pointsRef.current.filter((p) => now - p.timestamp < 500)
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const points = pointsRef.current
      if (points.length < 2) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Draw trail
      const now = Date.now()

      for (let i = 1; i < points.length; i++) {
        const point = points[i]
        const prevPoint = points[i - 1]
        const age = now - point.timestamp
        const maxAge = 500

        // Calculate opacity based on age
        const opacity = Math.max(0, 1 - age / maxAge)

        // Create gradient for the line segment
        const gradient = ctx.createLinearGradient(prevPoint.x, prevPoint.y, point.x, point.y)

        // Orange to amber gradient with opacity
        gradient.addColorStop(0, `rgba(249, 115, 22, ${opacity * 0.6})`) // orange-500
        gradient.addColorStop(0.5, `rgba(251, 146, 60, ${opacity * 0.8})`) // orange-400
        gradient.addColorStop(1, `rgba(251, 191, 36, ${opacity * 0.6})`) // amber-400

        // Draw line segment
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3 * opacity
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        ctx.beginPath()
        ctx.moveTo(prevPoint.x, prevPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()

        // Add glow effect
        ctx.shadowBlur = 15 * opacity
        ctx.shadowColor = `rgba(251, 146, 60, ${opacity * 0.8})`
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}
