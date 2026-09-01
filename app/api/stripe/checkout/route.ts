import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAccess } from '@/lib/access/manager'
import { createCheckoutSession } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
  }
  try {
    const access = await getAccess(session.user.id)
    if (access.plan === 'lifetime' || access.plan === 'pro') {
      return NextResponse.json(
        { error: 'Vous avez déjà un accès Pro actif. Aucun paiement supplémentaire requis.' },
        { status: 400 },
      )
    }
    const { url, sessionId } = await createCheckoutSession({
      clientId: session.user.id,
      customerId: access.stripeCustomerId,
    })
    return NextResponse.json({ url, sessionId })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur paiement' }, { status: 500 })
  }
}
