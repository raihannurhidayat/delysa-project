import type { Category, Faq, Product, Review } from "~/features/product/types";

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const STOREFRONT_PRODUCTS: Product[] = [
  {
    id: "p01",
    slug: "buket-mawar-peach-aura-grace",
    name: "Buket Mawar Peach 'Aura Grace'",
    price: 195000,
    originalPrice: 300000,
    discountPercent: 35,
    stockLeft: 3,
    stockTotal: 20,
    image: img("photo-1490750967868-88aa4486c946"),
    rating: 4.9,
    sold: 1200,
    category: "Mawar",
    isNew: true,
  },
  {
    id: "p02",
    slug: "12-mawar-merah-midnight-noir",
    name: "12 Mawar Merah 'Midnight Noir'",
    price: 245000,
    originalPrice: 350000,
    discountPercent: 30,
    stockLeft: 4,
    stockTotal: 20,
    image: img("photo-1533616688419-b7a585564566"),
    rating: 4.8,
    sold: 860,
    category: "Mawar",
  },
  {
    id: "p03",
    slug: "balloon-bloom-bouquet-congrats",
    name: "Balloon Bloom Bouquet 'Congrats'",
    price: 165000,
    originalPrice: 220000,
    discountPercent: 25,
    stockLeft: 2,
    stockTotal: 15,
    image: img("photo-1520763185298-1b434c919102"),
    rating: 4.9,
    sold: 640,
    category: "Wisuda",
    isNew: true,
  },
  {
    id: "p04",
    slug: "anggrek-bulan-putih-premium-pot",
    name: "Anggrek Bulan Putih Premium Pot",
    price: 285000,
    originalPrice: 475000,
    discountPercent: 40,
    stockLeft: 5,
    stockTotal: 20,
    image: img("photo-1457089328109-e5d9bd499191"),
    rating: 5.0,
    sold: 320,
    category: "Anggrek",
  },
  {
    id: "p05",
    slug: "buket-mawar-elegant-golden-hour",
    name: "Buket Mawar Elegant 'Golden Hour'",
    price: 285000,
    image: img("photo-1518895949257-7621c3c786d7"),
    rating: 4.9,
    sold: 740,
    category: "Mawar",
  },
  {
    id: "p06",
    slug: "buket-mawar-velvet-passion-15-tangkai",
    name: "Buket Mawar 'Velvet Passion' 15 Tangkai",
    price: 320000,
    image: img("photo-1520763185298-1b434c919102", 900),
    rating: 4.8,
    sold: 510,
    category: "Mawar",
  },
  {
    id: "p07",
    slug: "mix-bloom-hydrangea-lilac-dream",
    name: "Mix Bloom Hydrangea 'Lilac Dream'",
    price: 200000,
    image: img("photo-1487530811176-3780de880c2d"),
    rating: 4.7,
    sold: 430,
    category: "Wisuda",
    isNew: true,
  },
  {
    id: "p08",
    slug: "buket-wisuda-sapphire-sky",
    name: "Buket Wisuda 'Sapphire Sky'",
    price: 140000,
    image: img("photo-1526047932273-341f2a7631f9"),
    rating: 4.9,
    sold: 980,
    category: "Wisuda",
  },
  {
    id: "p09",
    slug: "pure-white-tulip-amour",
    name: "Pure White Tulip 'Amour'",
    price: 185000,
    image: img("photo-1561181286-d3fee7d55342"),
    rating: 4.8,
    sold: 390,
    category: "Anggrek",
  },
  {
    id: "p10",
    slug: "ferrero-bloom-royal-truffle",
    name: "Ferrero Bloom 'Royal Truffle'",
    price: 295000,
    image: img("photo-1562690868-60bbe7293e94"),
    rating: 4.9,
    sold: 470,
    category: "Kado",
  },
  {
    id: "p11",
    slug: "single-sunflower-sunlight-hope",
    name: "Single Sunflower 'Sunlight Hope'",
    price: 85000,
    image: img("photo-1463320726281-696a485928c7"),
    rating: 4.7,
    sold: 1120,
    category: "Wisuda",
  },
  {
    id: "p12",
    slug: "eternal-rose-beauty-dome",
    name: "Eternal Rose 'Beauty Dome'",
    price: 275000,
    image: img("photo-1591886960571-74d43a9d4166"),
    rating: 5.0,
    sold: 260,
    category: "Kado",
    isNew: true,
  },
];

export const STOREFRONT_CATEGORIES: Category[] = [
  {
    id: "c-wisuda",
    name: "Wisuda",
    image: img("photo-1520763185298-1b434c919102", 400),
    count: 42,
  },
  {
    id: "c-mawar",
    name: "Mawar",
    image: img("photo-1533616688419-b7a585564566", 400),
    count: 38,
  },
  {
    id: "c-anggrek",
    name: "Anggrek",
    image: img("photo-1457089328109-e5d9bd499191", 400),
    count: 25,
  },
  {
    id: "c-kado",
    name: "Kado Spesial",
    image: img("photo-1562690868-60bbe7293e94", 400),
    count: 31,
  },
  {
    id: "c-papan",
    name: "Bunga Papan",
    image: img("photo-1463320726281-696a485928c7", 400),
    count: 18,
  },
  {
    id: "c-meja",
    name: "Bunga Meja",
    image: img("photo-1463320726281-696a485928c7", 400),
    count: 22,
  },
  {
    id: "c-duka",
    name: "Duka Cita",
    image: img("photo-1487530811176-3780de880c2d", 400),
    count: 12,
  },
  {
    id: "c-semua",
    name: "Semua Produk",
    image: img("photo-1490750967868-88aa4486c946", 400),
    count: 120,
  },
];

export const STOREFRONT_FAQS: Faq[] = [
  {
    question: "Berapa lama pengiriman untuk area Tasikmalaya?",
    answer:
      "Same-day delivery untuk pemesanan sebelum pukul 18.00 WIB di area Tasikmalaya dan sekitarnya. Di luar itu estimasi H+1.",
  },
  {
    question: "Bagaimana cara pembayaran via Bank BCA?",
    answer:
      "Transfer manual ke rekening BCA a.n. Kartinah, lalu unggah bukti pembayaran di halaman instruksi bayar untuk verifikasi atelier.",
  },
  {
    question: "Apakah ada garansi jika bunga layu saat diterima?",
    answer:
      "Ada. Laporkan maksimal 1x24 jam dengan foto, dan kami ganti rangkaian baru atau refund sesuai ketentuan.",
  },
  {
    question: "Bagaimana cara melacak pesanan dan foto sebelum kirim?",
    answer:
      "Pantau status di halaman Riwayat Pesanan. Foto rangkaian sebelum kirim tersedia di detail pesanan setelah status processing.",
  },
];

export const STOREFRONT_REVIEWS: Review[] = [
  {
    name: "Sinta Ayu",
    product: "Buket Wisuda Sapphire Sky",
    rating: 5,
    text: "Bunganya segar dan wanginya tahan lama. Kurirnya ramah, sampai tepat waktu untuk wisuda adik saya.",
  },
  {
    name: "Dian Puspita",
    product: "12 Mawar Merah Midnight Noir",
    rating: 5,
    text: "Rangkaiannya rapi banget, melebihi ekspektasi. Pasti order lagi untuk anniversary berikutnya.",
  },
  {
    name: "Maya Savitri",
    product: "Anggrek Bulan Putih Premium",
    rating: 4,
    text: "Pot anggreknya cantik dan segar. CS fast respon saat saya tanya-tanya perawatan.",
  },
];

export type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const STOREFRONT_HERO = {
  eyebrow: "Promo Spesial Musim Ini",
  title: "Spesial Musim Wisuda & Kasih Sayang — Diskon Hingga 35%",
  description:
    "Koleksi buket bunga dengan segar dengan harga spesial. Estate atelier Tasikmalaya, antar hari ini.",
  image: img("photo-1490750967868-88aa4486c946", 1600),
  sideCards: [
    {
      title: "Buket Wisuda Silver & Gold",
      subtitle: "Mulai Rp95rb",
      image: img("photo-1520763185298-1b434c919102", 800),
    },
    {
      title: "Wedding Atelier Collection",
      subtitle: "Lihat Koleksi",
      image: img("photo-1518895949257-7621c3c786d7", 800),
    },
  ],
};

export const STOREFRONT_HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: STOREFRONT_HERO.eyebrow,
    title: STOREFRONT_HERO.title,
    description: STOREFRONT_HERO.description,
    image: STOREFRONT_HERO.image,
    imageAlt: "Rangkaian buket Delysa Florist",
  },
  {
    eyebrow: "Koleksi Wisuda",
    title: "Buket Wisuda Silver & Gold — Mulai Rp95rb",
    description:
      "Buket kelulusan elegan dengan aksen silver dan gold, siap antar di hari bahagiamu.",
    image: STOREFRONT_HERO.sideCards[0].image,
    imageAlt: "Buket wisuda silver dan gold",
  },
  {
    eyebrow: "Atelier",
    title: "Wedding Atelier Collection",
    description:
      "Rangkaian bunga pernikahan premium hasil kurasi atelier Tasikmalaya.",
    image: STOREFRONT_HERO.sideCards[1].image,
    imageAlt: "Koleksi bunga pernikahan atelier",
  },
];

export const STOREFRONT_TRUST = [
  {
    title: "Buka Setiap Hari 07.00–21.00 WIB",
    subtitle: "Atelier Tasikmalaya",
  },
  { title: "Pengiriman Cepat Same-Day", subtitle: "Order sebelum 18.00 WIB" },
  {
    title: "Transfer BCA a.n. Kartinah",
    subtitle: "Pembayaran aman & terverifikasi",
  },
  {
    title: "Order via @delysafloristt",
    subtitle: "Fast respon Instagram & WA",
  },
];

export const STOREFRONT_FOOTER = {
  address: "Jl. Tentara Pelajar No. 12, Tasikmalaya, Jawa Barat",
  hours: "Jam Operasional: Setiap Hari 07.00 – 21.00 WIB",
  payment: "BCA 054-082-9912 a.n. Kartinah",
};
