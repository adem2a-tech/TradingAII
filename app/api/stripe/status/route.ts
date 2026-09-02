import { NextResponse } from 'next/server'

export async function GET() {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY?.trim().startsWith('sk_'))
  return NextResponse.json({
    configured,
    hosting: process.env.VERCEL ? 'vercel' : 'local',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    hasPriceId: Boolean(process.env.STRIPE_PRICE_ID),
    hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  })
}
