'use client'

import { CheckCircleIcon } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { PRO_PRICE_LABEL } from '@/lib/access/types'
import { cn } from '@/lib/utils'

const FREE_FEATURES = [
  '1 analyse / 3 jours',
  'Lecture intelligente de ta capture',
  'Moteur local + marché live',
  'Historique basique',
]

const PRO_FEATURES = [
  'Analyses illimitées',
  'Chat expert IA',
  'TradingView + annonces macro',
  'Dashboard, classement & outils pro',
  'Détection erreurs sur capture',
  'Support prioritaire',
  'Mises à jour régulières',
  'Accès à vie — paiement unique',
]

type Props = {
  onSubscribe?: () => void
  onPromo?: () => void
  onPromoSubmit?: (code: string) => void
  loading?: boolean
  isProActive?: boolean
  isLifetime?: boolean
  promoCode?: string
  onPromoCodeChange?: (code: string) => void
}

export function PricingWithChart({
  onSubscribe,
  onPromo,
  onPromoSubmit,
  loading = false,
  isProActive = false,
  isLifetime = false,
  promoCode = '',
  onPromoCodeChange,
}: Props) {
  const hasPro = isProActive || isLifetime

  return (
    <div className="relative mx-auto w-full max-w-6xl px-1 sm:px-0">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 size-full',
          'bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_8%,transparent)_2px,transparent_2px)]',
          'bg-[size:12px_12px]',
        )}
      />

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <span className="mb-4 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Paiement unique
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Passe Pro
        </h1>
        <p className="text-muted-foreground mt-4 text-sm md:text-base">
          Un seul paiement. Analyses illimitées. L&apos;IA lit ta capture TradingView,
          détecte tes erreurs et croise le marché live.
        </p>
        {hasPro && (
          <p className="mt-4 inline-flex rounded-full border border-cyan-500/35 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            {isLifetime ? 'Accès à vie activé' : 'TradeAI Pro actif'} · analyses illimitées
          </p>
        )}
      </div>

      <div className="bg-background grid overflow-hidden rounded-xl border border-border md:grid-cols-6">
        {/* Gratuit */}
        <div className="flex flex-col justify-between border-b border-border p-6 md:col-span-2 md:border-r md:border-b-0">
          <div className="space-y-4">
            <div>
              <h2 className="inline rounded-[2px] p-1 text-xl font-semibold">
                Gratuit
              </h2>
              <span className="my-3 block text-3xl font-bold text-cyan-400">
                0€
              </span>
              <p className="text-muted-foreground text-sm">
                Découvre TradeAI sans engagement
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              disabled={!hasPro}
            >
              {hasPro ? 'Plan gratuit (passé)' : 'Plan actuel'}
            </Button>

            <div className="bg-border my-6 h-px w-full" />

            <ul className="text-muted-foreground space-y-3 text-sm">
              {FREE_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-cyan-500/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro */}
        <div className="z-10 grid gap-8 overflow-hidden bg-card/30 p-6 md:col-span-4 lg:grid-cols-2">
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Pro à vie</h2>
              <span className="my-3 block text-3xl font-bold text-cyan-400">
                {PRO_PRICE_LABEL}
              </span>
              <p className="text-muted-foreground text-sm">
                Paiement unique — accès permanent, sans abonnement
              </p>
            </div>
            <div className="bg-muted/30 h-fit w-full rounded-lg border border-border/60 p-2">
              <ProInterestChart />
            </div>
          </div>

          <div className="relative w-full">
            <div className="text-sm font-medium">Tout le Gratuit, plus :</div>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              {PRO_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                type="button"
                className="h-10 bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
                onClick={onSubscribe}
                disabled={loading || hasPro}
              >
                {isLifetime
                  ? 'Accès à vie actif ✓'
                  : isProActive
                    ? 'Pro actif ✓'
                    : loading
                      ? 'Redirection...'
                      : `Débloquer Pro · ${PRO_PRICE_LABEL} →`}
              </Button>
              {!hasPro && onPromo && (
                <Button type="button" variant="outline" className="h-10" onClick={onPromo}>
                  J&apos;ai un code promo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasPro && onPromoSubmit && (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
          <p className="mb-3 text-sm font-medium">Code promo fondateur</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="promo-code-input"
              value={promoCode}
              onChange={(e) => onPromoCodeChange?.(e.target.value.toUpperCase())}
              placeholder="Entre ton code promo"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && promoCode.trim()) onPromoSubmit(promoCode.trim())
              }}
            />
            <Button
              type="button"
              className="h-10 shrink-0 bg-cyan-500 px-6 text-zinc-950 hover:bg-cyan-400"
              onClick={() => promoCode.trim() && onPromoSubmit(promoCode.trim())}
            >
              Activer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProInterestChart() {
  const chartData = [
    { month: 'Janvier', interest: 120 },
    { month: 'Février', interest: 180 },
    { month: 'Mars', interest: 150 },
    { month: 'Avril', interest: 210 },
    { month: 'Mai', interest: 250 },
    { month: 'Juin', interest: 300 },
    { month: 'Juillet', interest: 280 },
    { month: 'Août', interest: 320 },
    { month: 'Septembre', interest: 340 },
    { month: 'Octobre', interest: 390 },
    { month: 'Novembre', interest: 420 },
    { month: 'Décembre', interest: 500 },
  ]

  const chartConfig = {
    interest: {
      label: 'Traders intéressés',
      color: 'hsl(187 85% 53%)',
    },
  } satisfies ChartConfig

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-0 border-b border-border/60 p-3">
        <CardTitle className="text-base">Popularité du plan Pro</CardTitle>
        <CardDescription className="text-xs">
          Tendance mensuelle des traders qui passent Pro
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <ChartContainer config={chartConfig} className="aspect-[16/10] min-h-[180px] w-full">
          <LineChart data={chartData} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => String(value).slice(0, 3)}
              fontSize={10}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line
              dataKey="interest"
              type="monotone"
              stroke="var(--color-interest)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
