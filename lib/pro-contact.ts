/** Contact Pro via WhatsApp — remplace Stripe pour l'instant. */

export const PRO_WHATSAPP_NUMBER = '33769081072'
export const PRO_WHATSAPP_MESSAGE = 'Salut, je veux passer pro'

export function getProWhatsAppUrl() {
  const text = encodeURIComponent(PRO_WHATSAPP_MESSAGE)
  return `https://wa.me/${PRO_WHATSAPP_NUMBER}?text=${text}`
}

/** Ouvre WhatsApp (app ou web) avec le message pré-rempli. */
export function openProWhatsApp() {
  window.open(getProWhatsAppUrl(), '_blank', 'noopener,noreferrer')
}
