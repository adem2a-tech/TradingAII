import { NextResponse } from 'next/server'

export async function GET() {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_'))
  return NextResponse.json({
    configured,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  })
}
