import Stripe from 'stripe'

let cachedPriceId: string | null = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Paiement indisponible — STRIPE_SECRET_KEY manquante dans .env.local')
  return new Stripe(key)
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/** Trouve ou crée le prix unique 79€ */
export async function ensurePriceId(stripe: Stripe): Promise<string> {
  if (process.env.STRIPE_PRICE_ID) {
    try {
      const existing = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
      if (!existing.recurring) return existing.id
    } catch { /* fallback création */ }
  }
  if (cachedPriceId) return cachedPriceId

  const products = await stripe.products.list({ limit: 20, active: true })
  let product = products.data.find((p) => p.name === 'TradeAI Pro')

  if (!product) {
    product = await stripe.products.create({
      name: 'TradeAI Pro',
      description: 'Analyses trading illimitées · 79€ paiement unique',
    })
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 })
  let price = prices.data.find(
    (p) => p.unit_amount === 7900 && p.currency === 'eur' && !p.recurring,
  )

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 7900,
      currency: 'eur',
    })
  }

  cachedPriceId = price.id
  return price.id
}

export async function createCheckoutSession(params: {
  clientId: string
  customerId?: string
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe()
  const priceId = await ensurePriceId(stripe)
  const appUrl = getAppUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?canceled=1`,
    locale: 'fr',
    billing_address_collection: 'auto',
    metadata: { clientId: params.clientId, userId: params.clientId },
    ...(params.customerId ? { customer: params.customerId } : { customer_creation: 'always' }),
  })

  if (!session.url) throw new Error('Impossible de générer le lien de paiement Stripe')

  return { url: session.url, sessionId: session.id }
}

export async function createBillingPortal(customerId: string): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/settings`,
  })
  if (!session.url) throw new Error('Portal indisponible')
  return session.url
}
