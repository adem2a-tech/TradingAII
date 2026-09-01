'use client'

import { useEffect, useState } from 'react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('tradeai_cookies')) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem('tradeai_cookies', '1')
    localStorage.setItem('tradeai_terms', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="cookie-overlay">
      <div className="cookie-box">
        <h3>Conditions & Cookies</h3>
        <p>
          TradeAI utilise des cookies pour mémoriser tes préférences et sécuriser ton compte.
          En continuant, tu acceptes nos conditions d&apos;utilisation.
          TradeAI est un outil d&apos;analyse, pas un conseil financier.
        </p>
        <div className="cookie-actions">
          <button type="button" className="btn-primary" onClick={accept}>J&apos;accepte</button>
        </div>
      </div>
    </div>
  )
}
