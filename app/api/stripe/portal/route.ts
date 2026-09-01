import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAccess } from '@/lib/access/manager'
import { createBillingPortal } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }
  try {
    const access = await getAccess(session.user.id)
    if (!access.stripeCustomerId) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 })
    }
    const url = await createBillingPortal(access.stripeCustomerId)
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur portal' }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }
  try {
    const access = await getAccess(session.user.id)
    let subscription = null
    if (access.stripeSubscriptionId) {
      const { getStripe } = await import('@/lib/stripe')
      const sub = await getStripe().subscriptions.retrieve(access.stripeSubscriptionId)
      subscription = {
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }
    }
    return NextResponse.json({ access, subscription, user: session.user })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
