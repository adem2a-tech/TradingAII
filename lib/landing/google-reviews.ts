const FIRST = [
  'Karim', 'Sophie', 'Marc', 'Yassine', 'Nadia', 'Hugo', 'Inès', 'Mehdi', 'Claire', 'Romain',
  'Fatima', 'Lucas', 'Émilie', 'Antoine', 'Sarah', 'David', 'Amina', 'Pierre', 'Camille', 'Omar',
  'Léa', 'Maxime', 'Chloé', 'Bilal', 'Thomas', 'Julie', 'Alexandre', 'Nicolas', 'Manon', 'Kevin',
  'Laura', 'Sami', 'Zoé', 'Florian', 'Jade', 'Rayan', 'Alice', 'Benjamin', 'Eva', 'Matteo',
  'Lina', 'Adrien', 'Salma', 'Gabriel', 'Noémie', 'Enzo', 'Maya', 'Paul', 'Inaya', 'Louis',
]

const CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Strasbourg', 'Nice',
  'Montpellier', 'Rennes', 'Reims', 'Grenoble', 'Bruxelles', 'Genève', 'Montréal', 'Luxembourg',
  'Casablanca', 'Tunis', 'Liège', 'Lausanne', 'Angers', 'Rouen', 'Tours', 'Dijon', 'Metz',
  'Orléans', 'Avignon', 'Brest', 'Limoges', 'Perpignan', 'Besançon', 'Mulhouse', 'Amiens',
]

const TEXTS = [
  'Le check marché live m\'a évité des trades périmés. Concret et rapide.',
  'Setup clair, SL/TP calculés. Je gagne du temps chaque matin.',
  'Enfin un outil pensé par de vrais traders, pas un gadget.',
  'ADM Trading a cartonné. Win rate solide sur mes sessions.',
  'Interface pro, analyse rapide. Je recommande à ma communauté.',
  'La vérif temps réel sur XAU/USD m\'a sauvé plusieurs fois.',
  'Simple, efficace, pas de blabla. Exactement ce qu\'il me fallait.',
  'Journal + dashboard Pro valent largement les 79 €.',
  'Mes setups sont plus propres depuis TradeAI.',
  'Comparatif live = game changer. Fini les captures d\'hier.',
  'Risk management auto, je dors mieux la nuit.',
  'Scalping M1/M5 : l\'outil comprend le price action.',
  'Support réactif et app stable. 5 étoiles méritées.',
  'Utilisé par notre desk prop. Rien à redire.',
  'Passée de débutante à rentable en 3 mois.',
  'Force trade quand je veux, l\'IA me met en garde. Parfait.',
  'Forex et or, tout fonctionne nickel.',
  'Meilleur rapport qualité/prix du marché francophone.',
  'TradingView + TradeAI = combo imbattable.',
  'Analyse locale, 0 token, résultats rapides.',
  'Structure, momentum, invalidation — tout y est.',
  'Inscription en 2 min, réglages mémorisés.',
  'J\'ai testé 5 IA trading. Celle-ci tient la route.',
  'Mes élèves en formation l\'utilisent tous.',
  'Discipline retrouvée, moins d\'overtrading.',
  'Le comparatif courbe vs live est bluffant.',
  'Pro à vie pour 79 €, aucun regret.',
  'Analyse en 10 secondes, incroyable.',
  'Parfait pour la session de Londres.',
  'Mon coach ADM m\'a recommandé TradeAI. Validé.',
]

export type GoogleReview = {
  id: number
  name: string
  loc: string
  text: string
  daysAgo: number
}

/** Génère des centaines d'avis Google variés */
export function generateGoogleReviews(count = 240): GoogleReview[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `${FIRST[i % FIRST.length]} ${String.fromCharCode(65 + (i % 26))}.`,
    loc: CITIES[(i * 7 + 3) % CITIES.length],
    text: TEXTS[(i * 11 + 5) % TEXTS.length],
    daysAgo: (i % 120) + 1,
  }))
}

export const GOOGLE_REVIEW_COUNT = 2847
