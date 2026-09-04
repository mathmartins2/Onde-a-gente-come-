const cuisineTranslations: Record<string, string> = {
  japanese: 'Japanese',
  sushi: 'Japanese',
  ramen: 'Japanese',
  asian: 'Asian',
  chinese: 'Chinese',
  thai: 'Thai',
  korean: 'Korean',
  steak: 'Steak',
  steak_house: 'Steak',
  barbecue: 'Steak',
  bbq: 'Steak',
  churrascaria: 'Steak',
  grill: 'Steak',
  american: 'Steak',
  burger: 'Burger',
  hamburger: 'Burger',
  pizza: 'Pizza',
  italian: 'Italian',
  pasta: 'Italian',
  brazilian: 'Brazilian',
  regional: 'Brazilian',
  seafood: 'Seafood',
  fish: 'Seafood',
  mexican: 'Mexican',
  arab: 'Arab',
  lebanese: 'Arab',
  vegetarian: 'Vegetarian',
  vegan: 'Vegetarian',
  coffee_shop: 'Coffee',
  cafe: 'Coffee',
  ice_cream: 'Dessert',
  dessert: 'Dessert',
  bakery: 'Bakery',
  portuguese: 'Portuguese',
  french: 'French',
  spanish: 'Spanish',
  indian: 'Indian',
  international: 'Varied',
}


export const canonicalCuisines = [
  'Steak',
  'Japanese',
  'Pizza',
  'Italian',
  'Burger',
  'Brazilian',
  'Seafood',
  'Asian',
  'Chinese',
  'Thai',
  'Korean',
  'Mexican',
  'Arab',
  'Indian',
  'Portuguese',
  'French',
  'Spanish',
  'Vegetarian',
  'Bakery',
  'Coffee',
  'Dessert',
  'Varied',
] as const

export const fallbackCuisine = 'Varied'

export const normalizeCuisines = (rawValue: string | null | undefined) => {
  if (!rawValue) return []

  const translated = rawValue
    .split(';')
    .map((piece) => piece.trim().toLowerCase().replace(/[\s-]+/g, '_'))
    .filter((piece) => piece.length > 0)
    .map((piece) => cuisineTranslations[piece] ?? null)
    .filter((piece): piece is string => piece !== null)

  return [...new Set(translated)]
}
