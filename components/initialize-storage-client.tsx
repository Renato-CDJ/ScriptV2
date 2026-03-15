'use client'

import { useEffect } from 'react'
import { initializeDefaultData } from '@/lib/initialize-storage'

export function InitializeStorage() {
  useEffect(() => {
    initializeDefaultData()
  }, [])

  return null
}
