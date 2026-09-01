#!/usr/bin/env node
/**
 * Crée le produit + prix Stripe (79€ unique) si STRIPE_SECRET_KEY est configurée.
 * Usage: node scripts/setup-stripe.mjs
 */
import Stripe from 'stripe'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const envPath = join(process.cwd(), '.env.local')
let secret = process.env.STRIPE_SECRET_KEY

if (!secret && existsSync(envPath)) {
  const match = readFileSync(envPath, 'utf-8').match(/^STRIPE_SECRET_KEY=(.+)$/m)
  if (match) secret = match[1].trim()
}

if (!secret) {
  console.error('❌ STRIPE_SECRET_KEY manquante dans .env.local')
  process.exit(1)
}

const stripe = new Stripe(secret)

const existing = await stripe.products.list({ limit: 10, active: true })
let product = existing.data.find((p) => p.name === 'TradeAI Pro')

if (!product) {
  product = await stripe.products.create({
    name: 'TradeAI Pro',
    description: 'Analyses de trading illimitées · IA expert · Chat inclus',
  })
  console.log('✓ Produit créé:', product.id)
} else {
  console.log('✓ Produit existant:', product.id)
}

const prices = await stripe.prices.list({ product: product.id, active: true })
let price = prices.data.find((p) => p.unit_amount === 7900 && p.currency === 'eur' && !p.recurring)

if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    unit_amount: 7900,
    currency: 'eur',
  })
  console.log('✓ Prix créé: 79€ →', price.id)
} else {
  console.log('✓ Prix existant:', price.id)
}

const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : ''
const lines = envContent.split('\n').filter((l) => !l.startsWith('STRIPE_PRICE_ID='))
lines.push(`STRIPE_PRICE_ID=${price.id}`)
writeFileSync(envPath, lines.filter(Boolean).join('\n') + '\n')
console.log('\n✅ STRIPE_PRICE_ID ajouté dans .env.local')
