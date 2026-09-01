import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { activateLifetimePurchase, activatePro } from '@/lib/access/manager'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })

    const stripe = getStripe()
    const checkout = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkout.payment_status !== 'paid' && checkout.status !== 'complete') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    const userId = checkout.metadata?.userId || checkout.metadata?.clientId
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: 'Session non autorisée' }, { status: 403 })
    }

    const customerId = checkout.customer ? String(checkout.customer) : undefined
    if (!customerId) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 400 })
    }

    const subId = checkout.subscription ? String(checkout.subscription) : undefined
    if (checkout.mode === 'payment' || !subId) {
      await activateLifetimePurchase(userId, customerId)
      return NextResponse.json({ ok: true, plan: 'lifetime' })
    }
    await activatePro(userId, customerId, subId)
    return NextResponse.json({ ok: true, plan: 'pro' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur vérification'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
