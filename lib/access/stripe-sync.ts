import { getStripe } from '@/lib/stripe'
import { isStripeConfigured } from '@/lib/stripe/env'

/** Vérifie sur Stripe si l'email a un paiement unique Pro confirmé (source de vérité cloud). */
export async function findLifetimePurchaseByEmail(
  email: string,
): Promise<{ customerId: string } | null> {
  if (!isStripeConfigured() || !email.trim()) return null

  try {
    const stripe = getStripe()
    const customers = await stripe.customers.list({
      email: email.toLowerCase().trim(),
      limit: 10,
    })

    for (const customer of customers.data) {
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 25,
      })

      const paid = sessions.data.find(
        (s) =>
          s.status === 'complete' &&
          s.payment_status === 'paid' &&
          s.mode === 'payment',
      )

      if (paid) return { customerId: customer.id }
    }
  } catch (err) {
    console.error('[stripe-sync] lookup failed:', err)
  }

  return null
}
