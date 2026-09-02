/** Variables Stripe — local (.env.local) ou Vercel (Settings → Environment Variables). */

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim().startsWith('sk_'))
}

export function getStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (key?.startsWith('sk_')) return key

  if (process.env.VERCEL) {
    throw new Error(
      'Paiement indisponible — ajoute STRIPE_SECRET_KEY dans Vercel (Settings → Environment Variables → Production), puis redéploie le site.',
    )
  }

  throw new Error(
    'Paiement indisponible — ajoute STRIPE_SECRET_KEY dans .env.local puis redémarre le serveur (npm run dev).',
  )
}

export function getStripeConfigHint(): string {
  if (process.env.VERCEL) {
    return 'Vercel → projet TradeAI → Settings → Environment Variables'
  }
  return '.env.local à la racine du projet'
}
