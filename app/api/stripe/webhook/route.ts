import { NextRequest, NextResponse } from 'next/server'
import { activateLifetimePurchase, activatePro, deactivatePro, findByStripeCustomer } from '@/lib/access/manager'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const clientId = session.metadata?.clientId || session.metadata?.userId
    if (clientId && session.customer && session.payment_status === 'paid') {
      const customerId = String(session.customer)
      if (session.mode === 'payment' || !session.subscription) {
        await activateLifetimePurchase(clientId, customerId)
      } else {
        await activatePro(clientId, customerId, String(session.subscription))
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const record = await findByStripeCustomer(String(sub.customer))
    if (record) await deactivatePro(record.userId)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object
    const record = await findByStripeCustomer(String(sub.customer))
    if (record) {
      if (sub.status === 'active' || sub.status === 'trialing') {
        await activatePro(record.userId, String(sub.customer), sub.id)
      } else {
        await deactivatePro(record.userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
