'use client'

import { useEffect, useState } from 'react'
import { SpiralAnimation } from '@/components/ui/spiral-animation'

const INTRO_DURATION_MS = 8000

const SpiralDemo = () => {
  const [introVisible, setIntroVisible] = useState(true)
  const [brandVisible, setBrandVisible] = useState(false)

  const revealLanding = () => {
    setIntroVisible(false)
  }

  useEffect(() => {
    const brandTimer = window.setTimeout(() => {
      setBrandVisible(true)
    }, 6500)

    const introTimer = window.setTimeout(() => {
      revealLanding()
    }, INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(brandTimer)
      window.clearTimeout(introTimer)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        revealLanding()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main className="app-shell">
      <iframe
        className="landing-frame"
        src="/landing.html"
        title="ALTAIR landing page"
      />

      <div className={`intro-overlay${introVisible ? '' : ' is-hidden'}`}>
        <div className="spiral-layer">
          <SpiralAnimation />
        </div>

        <button
          aria-label="Open ALTAIR landing page"
          className={`intro-brand${brandVisible ? ' is-visible' : ''}`}
          onClick={revealLanding}
          type="button"
        >
          ALTAIR
        </button>

        <div className={`intro-status${brandVisible ? ' is-visible' : ''}`}>
          Initializing mission control
        </div>
      </div>
    </main>
  )
}

export { SpiralDemo }
