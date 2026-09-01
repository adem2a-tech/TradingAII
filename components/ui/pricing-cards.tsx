'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CircleCheck, Crown, Gift, Sparkles, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PRO_PRICE_LABEL } from '@/lib/access/types'

interface PricingFeature {
  text: string
}

interface PricingPlan {
  id: string
  name: string
  description: string
  price: string
  subPrice?: string
  features: PricingFeature[]
  buttonText: string
  highlighted?: boolean
  icon?: 'gift' | 'crown'
}

interface PricingCardsProps {
  heading?: string
  description?: string
  plans?: PricingPlan[]
  onSubscribe?: () => void
  onPromo?: () => void
  onPromoSubmit?: (code: string) => void
  loading?: boolean
  isProActive?: boolean
  isLifetime?: boolean
  promoCode?: string
  onPromoCodeChange?: (code: string) => void
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Découvre TradeAI sans engagement',
    price: '0€',
    subPrice: '1 analyse tous les 3 jours',
    features: [
      { text: '1 analyse / 3 jours' },
      { text: 'Lecture intelligente de ta capture' },
      { text: 'Moteur local + marché live' },
      { text: 'Historique basique' },
    ],
    buttonText: 'Plan actuel',
    icon: 'gift',
  },
  {
    id: 'pro',
    name: 'Pro à vie',
    description: 'Paiement unique — accès permanent',
    price: PRO_PRICE_LABEL,
    subPrice: 'Pas d\'abonnement · accès à vie',
    features: [
      { text: 'Analyses illimitées' },
      { text: 'Chat expert IA' },
      { text: 'TradingView + annonces macro' },
      { text: 'Dashboard, classement & outils pro' },
      { text: 'Détection erreurs sur capture' },
    ],
    buttonText: `Débloquer Pro · ${PRO_PRICE_LABEL}`,
    highlighted: true,
    icon: 'crown',
  },
]

function PricingCards({
  heading = 'Passe Pro',
  description = 'Un seul paiement. Analyses illimitées. L\'IA lit ta capture TradingView, détecte tes erreurs et croise le marché live.',
  plans = DEFAULT_PLANS,
  onSubscribe,
  onPromo,
  onPromoSubmit,
  loading = false,
  isProActive = false,
  isLifetime = false,
  promoCode = '',
  onPromoCodeChange,
}: PricingCardsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [localPromo, setLocalPromo] = useState(promoCode)

  useEffect(() => {
    setLocalPromo(promoCode)
  }, [promoCode])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const setSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect?.width ?? window.innerWidth))
      const h = Math.max(1, Math.floor(rect?.height ?? window.innerHeight))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()

    type P = { x: number; y: number; v: number; o: number }
    let parts: P[] = []
    let raf = 0

    const make = (): P => ({
      x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
      y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    })

    const init = () => {
      parts = []
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      const count = Math.floor((w * h) / 10000)
      for (let i = 0; i < count; i++) parts.push(make())
    }

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      ctx.clearRect(0, 0, w, h)
      parts.forEach((p) => {
        p.y -= p.v
        if (p.y < 0) {
          p.x = Math.random() * w
          p.y = h + Math.random() * 40
          p.v = Math.random() * 0.25 + 0.05
          p.o = Math.random() * 0.35 + 0.15
        }
        ctx.fillStyle = `rgba(34,211,238,${p.o * 0.55})`
        ctx.fillRect(p.x, p.y, 0.7, 2.2)
      })
      raf = requestAnimationFrame(draw)
    }

    const onResize = () => {
      setSize()
      init()
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(canvas.parentElement || document.body)
    init()
    raf = requestAnimationFrame(draw)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const hasPro = isProActive || isLifetime

  return (
    <section className="pricing-section relative isolate overflow-hidden text-zinc-50">
      <div className="pricing-vignette pointer-events-none absolute inset-0" />

      <div aria-hidden className="pricing-accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 md:py-16">
        <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-5 text-center md:mb-14">
          <span className="pricing-eyebrow inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <Sparkles className="size-3.5" />
            Paiement unique
          </span>
          <h2 className="text-pretty text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {heading}
          </h2>
          <p className="max-w-2xl text-base text-zinc-400 md:text-lg lg:text-xl">
            {description}
          </p>
          {hasPro && (
            <div className="pricing-active-pill">
              {isLifetime ? 'Accès à vie activé' : 'TradeAI Pro actif'} · analyses illimitées
            </div>
          )}
        </div>

        <div className="flex flex-col items-stretch justify-center gap-6 md:flex-row md:items-start md:gap-8">
          {plans.map((plan, i) => (
            <Card
              key={plan.id}
              className={`pricing-card-animate relative flex w-full flex-col justify-between border-zinc-800/90 bg-zinc-950/75 text-left backdrop-blur-md md:w-80 ${
                plan.highlighted
                  ? 'pricing-card-pro md:-mt-3'
                  : 'pricing-card-free'
              }`}
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              {plan.highlighted && (
                <span className="pricing-popular-badge">Recommandé</span>
              )}

              <CardHeader className="space-y-3 pb-2">
                <CardTitle className="flex items-center gap-2.5 text-xl">
                  {plan.icon === 'crown' ? (
                    <span className="pricing-icon-ring">
                      <Crown className="size-5 text-cyan-400" />
                    </span>
                  ) : (
                    <span className="pricing-icon-ring muted">
                      <Gift className="size-5 text-zinc-400" />
                    </span>
                  )}
                  <span className="text-zinc-50">{plan.name}</span>
                </CardTitle>
                <p className="text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                <div className="pt-2">
                  <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                  {plan.subPrice && (
                    <p className="mt-1 text-sm text-zinc-500">{plan.subPrice}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <Separator className="mb-6 bg-zinc-800/80" />
                <ul className="space-y-3.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-zinc-200">
                      <CircleCheck
                        className={`mt-0.5 size-4 shrink-0 ${
                          plan.highlighted ? 'text-cyan-400' : 'text-zinc-500'
                        }`}
                      />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto flex-col gap-2 pt-2">
                {plan.id === 'pro' ? (
                  <>
                    <Button
                      type="button"
                      className="pricing-cta-pro h-11 w-full rounded-xl text-base font-semibold"
                      onClick={onSubscribe}
                      disabled={loading || hasPro}
                    >
                      {isLifetime
                        ? 'Accès à vie actif ✓'
                        : isProActive
                          ? 'Pro actif ✓'
                          : loading
                            ? 'Redirection...'
                            : plan.buttonText}
                      {!hasPro && !loading && <ArrowRight className="ml-2 size-4" />}
                    </Button>
                    {onPromo && !hasPro && (
                      <button
                        type="button"
                        onClick={onPromo}
                        className="text-xs text-zinc-500 transition-colors hover:text-cyan-400"
                      >
                        J&apos;ai un code promo
                      </button>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl border-zinc-700/80 bg-zinc-900/50 text-zinc-400"
                    disabled={!hasPro}
                  >
                    {hasPro ? 'Plan gratuit (passé)' : plan.buttonText}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {!hasPro && onPromoSubmit && (
          <div className="pricing-promo-strip mx-auto mt-10 max-w-xl md:mt-14">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Tag className="size-4 text-cyan-400" />
              Code promo fondateur
            </div>
            <div className="pricing-promo-row mt-3">
              <input
                id="promo-code-input"
                value={onPromoCodeChange ? promoCode : localPromo}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase()
                  if (onPromoCodeChange) onPromoCodeChange(v)
                  else setLocalPromo(v)
                }}
                placeholder="Entre ton code promo"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const code = (onPromoCodeChange ? promoCode : localPromo).trim()
                    if (code) onPromoSubmit(code)
                  }
                }}
              />
              <Button
                type="button"
                className="pricing-cta-pro shrink-0 rounded-lg px-5"
                onClick={() => {
                  const code = (onPromoCodeChange ? promoCode : localPromo).trim()
                  if (code) onPromoSubmit(code)
                }}
              >
                Activer
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export { PricingCards, PricingCards as Pricing2 }
