export interface Product {
  id: number
  slug: string
  name: string
  description: string
  longDescription: string
  price: number
  image: string
  images: string[]
  badge: string | null
  badgeColor: string | null
  sizes: string[]
  color: string
  colorHex: string
  details: string[]
  care: string[]
  inStock: boolean
}

export const products: Product[] = [
  // BLACK T-SHIRTS (4)
  {
    id: 1,
    slug: "shadow-geometric-tee",
    name: "SHADOW GEOMETRIC TEE",
    description: "OVERSIZED FIT",
    longDescription: "The SHADOW GEOMETRIC TEE features an abstract geometric print that speaks to the modern street aesthetic. Crafted from premium 240GSM heavyweight cotton with an oversized drop-shoulder fit that drapes perfectly. For those who appreciate minimal art with maximum impact.",
    price: 1299,
    image: "/images/products/black-tee-1.jpg",
    images: ["/images/products/black-tee-1.jpg"],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["S", "M", "L"],
    color: "Black",
    colorHex: "#0a0a0a",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Abstract geometric chest print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 2,
    slug: "void-back-print-tee",
    name: "VOID BACK PRINT TEE",
    description: "OVERSIZED FIT",
    longDescription: "The VOID BACK PRINT TEE makes a statement from behind. Bold typography cascades down the back, creating a striking visual that turns heads. Premium heavyweight cotton ensures this piece holds its shape and presence wear after wear.",
    price: 1499,
    image: "/images/products/black-tee-2.jpg",
    images: ["/images/products/black-tee-2.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L"],
    color: "Black",
    colorHex: "#0a0a0a",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Bold typography back print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 3,
    slug: "skull-art-tee",
    name: "SKULL ART TEE",
    description: "OVERSIZED FIT",
    longDescription: "The SKULL ART TEE blends street culture with artistic expression. The detailed skull graphic represents the duality of life - raw yet refined, dark yet meaningful. A bestseller that defines the PADDDLER aesthetic.",
    price: 1399,
    image: "/images/products/black-tee-3.jpg",
    images: ["/images/products/black-tee-3.jpg"],
    badge: "BESTSELLER",
    badgeColor: "bg-accent text-background",
    sizes: ["S", "M", "L"],
    color: "Black",
    colorHex: "#0a0a0a",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Artistic skull graphic print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 4,
    slug: "kanji-spirit-tee",
    name: "KANJI SPIRIT TEE",
    description: "OVERSIZED FIT",
    longDescription: "The KANJI SPIRIT TEE draws inspiration from Japanese street culture. The kanji characters embody the spirit of movement and identity that PADDDLER represents. A fusion of Eastern philosophy and Western streetwear.",
    price: 1299,
    image: "/images/products/black-tee-4.jpg",
    images: ["/images/products/black-tee-4.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L"],
    color: "Black",
    colorHex: "#0a0a0a",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Japanese kanji front print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  // WHITE T-SHIRTS (3)
  {
    id: 5,
    slug: "minimal-line-tee",
    name: "MINIMAL LINE TEE",
    description: "OVERSIZED FIT",
    longDescription: "The MINIMAL LINE TEE embodies the less-is-more philosophy. Clean line art on pristine white cotton creates a subtle yet sophisticated look. Perfect for those who let their presence speak louder than their clothes.",
    price: 1199,
    image: "/images/products/white-tee-1.jpg",
    images: ["/images/products/white-tee-1.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L"],
    color: "White",
    colorHex: "#f5f5f5",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Minimalist line art print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 6,
    slug: "urban-graffiti-tee",
    name: "URBAN GRAFFITI TEE",
    description: "OVERSIZED FIT",
    longDescription: "The URBAN GRAFFITI TEE captures the raw energy of street art. Bold graffiti-style graphics bring the walls of the city to your wardrobe. A piece that celebrates urban culture and creative rebellion.",
    price: 1399,
    image: "/images/products/white-tee-2.jpg",
    images: ["/images/products/white-tee-2.jpg"],
    badge: "NEW ARRIVAL",
    badgeColor: "bg-foreground text-background",
    sizes: ["S", "M", "L"],
    color: "White",
    colorHex: "#f5f5f5",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Urban graffiti style print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 7,
    slug: "statement-bold-tee",
    name: "STATEMENT BOLD TEE",
    description: "OVERSIZED FIT",
    longDescription: "The STATEMENT BOLD TEE lets the typography do the talking. Clean white canvas meets bold black lettering for a piece that communicates without compromise. Wear your mindset.",
    price: 1299,
    image: "/images/products/white-tee-3.jpg",
    images: ["/images/products/white-tee-3.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L"],
    color: "White",
    colorHex: "#f5f5f5",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Bold typography statement",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  // EMERALD GREEN T-SHIRTS (2)
  {
    id: 8,
    slug: "forest-vintage-tee",
    name: "FOREST VINTAGE TEE",
    description: "OVERSIZED FIT",
    longDescription: "The FOREST VINTAGE TEE brings nature into streetwear. Deep emerald green meets vintage-inspired graphics in cream tones. A limited piece for those who find strength in the wild.",
    price: 1499,
    image: "/images/products/green-tee-1.jpg",
    images: ["/images/products/green-tee-1.jpg"],
    badge: "LIMITED",
    badgeColor: "bg-emerald-600 text-white",
    sizes: ["S", "M", "L"],
    color: "Emerald Green",
    colorHex: "#047857",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Vintage graphic print in cream",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  {
    id: 9,
    slug: "emerald-logo-tee",
    name: "EMERALD LOGO TEE",
    description: "OVERSIZED FIT",
    longDescription: "The EMERALD LOGO TEE is understated luxury. Rich emerald fabric with subtle embroidered logo placement. For those who know that true style whispers rather than shouts.",
    price: 1199,
    image: "/images/products/green-tee-2.jpg",
    images: ["/images/products/green-tee-2.jpg"],
    badge: null,
    badgeColor: null,
    sizes: ["S", "M", "L"],
    color: "Emerald Green",
    colorHex: "#047857",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Embroidered logo on chest",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
  // BEIGE T-SHIRT (1)
  {
    id: 10,
    slug: "earth-nature-tee",
    name: "EARTH NATURE TEE",
    description: "OVERSIZED FIT",
    longDescription: "The EARTH NATURE TEE is an exclusive piece inspired by the raw beauty of nature. Warm beige tones with earth-inspired artistic prints create a unique piece that stands apart from the crowd.",
    price: 1399,
    image: "/images/products/beige-tee-1.jpg",
    images: ["/images/products/beige-tee-1.jpg"],
    badge: "EXCLUSIVE",
    badgeColor: "bg-amber-700 text-white",
    sizes: ["S", "M", "L"],
    color: "Beige",
    colorHex: "#d4b896",
    details: [
      "240 GSM premium heavyweight cotton",
      "Oversized drop-shoulder fit",
      "Artistic nature-inspired print",
      "Ribbed crew neckline",
      "Double-stitched hems",
      "Made in India",
    ],
    care: [
      "Machine wash cold with like colors",
      "Do not bleach",
      "Tumble dry low",
      "Iron inside out on low heat",
    ],
    inStock: true,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getRelatedProducts(currentSlug: string, limit: number = 4): Product[] {
  return products.filter((p) => p.slug !== currentSlug).slice(0, limit)
}

export function getProductsByColor(color: string): Product[] {
  return products.filter((p) => p.color === color)
}
