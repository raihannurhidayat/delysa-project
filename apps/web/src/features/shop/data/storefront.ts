import type { Category, Faq, Review } from "~/features/shop/types";

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

/**
 * Informasi resmi mitra Delysa Florist (sesuai proposal & PRD).
 */
export const DELYSA_CONTACT = {
  brand: "Delysa Florist",
  sinceYear: 2016,
  address:
    "Jl. Pancasila Lengkongsari, Cikalang, Kec. Tawang, Tasikmalaya, Jawa Barat",
  shortLocation: "Cikalang, Tawang, Tasikmalaya",
  hours: "Setiap Hari · 07.00 – 21.00 WIB",
  whatsappNumber: "6282266229917",
  whatsappDisplay: "0822-6622-9917",
  instagramHandle: "@delysafloristt",
  instagramUrl: "https://www.instagram.com/delysafloristt/",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Delysa+Florist+Jalan+Pancasila+Lengkongsari+Cikalang+Tawang+Tasikmalaya",
  payment: "Transfer BCA 054-082-9912 a.n. Kartinah",
} as const;

export type StorefrontCategory = Category & {
  /** Nilai parameter `?category=` pada `/katalog` (undefined = semua produk). */
  catalogCategory?: string;
  /** Deskripsi singkat untuk halaman direktori kategori. */
  tagline: string;
};

/**
 * Data statis non-produk storefront (kategori, FAQ, ulasan, hero, trust,
 * footer). Data PRODUK dilayani mock API per-endpoint
 * (`features/shop/api/endpoints.ts`), bukan dari file ini.
 */
export const STOREFRONT_CATEGORIES: StorefrontCategory[] = [
  {
    id: "c-wisuda",
    name: "Buket Wisuda",
    catalogCategory: "Wisuda",
    tagline: "Buket bunga segar, boneka & matahari siap momen kelulusan.",
    image: img("photo-1520763185298-1b434c919102", 400),
    count: 4,
  },
  {
    id: "c-mawar",
    name: "Buket Mawar",
    catalogCategory: "Mawar",
    tagline:
      "Mawar segar & satin untuk ulang tahun, anniversary, dan kasih sayang.",
    image: img("photo-1533616688419-b7a585564566", 400),
    count: 4,
  },
  {
    id: "c-kado",
    name: "Buket Jajanan & Uang",
    catalogCategory: "Kado",
    tagline: "Buket snack, buket uang by request, dan kado dome spesial.",
    image: img("photo-1562690868-60bbe7293e94", 400),
    count: 4,
  },
  {
    id: "c-papan",
    name: "Karangan & Papan",
    catalogCategory: "Papan",
    tagline: "Bunga papan ucapan wedding, grand opening, hingga duka cita.",
    image: img("photo-1487530811176-3780de880c2d", 400),
    count: 4,
  },
  {
    id: "c-anggrek",
    name: "Anggrek & Pot",
    catalogCategory: "Anggrek",
    tagline:
      "Anggrek bulan segar dan tanaman pot elegan untuk hadiah tahan lama.",
    image: img("photo-1457089328109-e5d9bd499191", 400),
    count: 4,
  },
  {
    id: "c-meja",
    name: "Bunga Meja",
    catalogCategory: "Meja",
    tagline:
      "Rangkaian vas meja & bunga artifisial untuk ruang tamu atau kantor.",
    image: img("photo-1561181286-d3fee7d55342", 400),
    count: 4,
  },
  {
    id: "c-artificial",
    name: "Bunga Palsu & Dome",
    catalogCategory: "Kado",
    tagline:
      "Rangkaian awet dan bebas layu untuk kenang-kenangan jangka panjang.",
    image: img("photo-1591886960571-74d43a9d4166", 400),
    count: 4,
  },
  {
    id: "c-semua",
    name: "Semua Produk",
    catalogCategory: undefined,
    tagline:
      "Jelajahi seluruh rangkaian buket dan karangan bunga Delysa Florist.",
    image: img("photo-1490750967868-88aa4486c946", 400),
    count: 24,
  },
];

export const STOREFRONT_FAQS: Faq[] = [
  {
    question: "Berapa lama pengiriman untuk area Tasikmalaya?",
    answer:
      "Tersedia pengiriman hari yang sama (same-day) untuk pemesanan sebelum pukul 18.00 WIB di area Tasikmalaya radius 15 km. Pemesanan setelah jam tersebut dijadwalkan pengantaran H+1.",
  },
  {
    question: "Bagaimana cara pembayaran dan konfirmasi pesanan?",
    answer:
      "Pembayaran dilakukan non-COD via Transfer Bank BCA (054-082-9912 a.n. Kartinah) atau QRIS. Setelah transfer, langsung unggah bukti bayar di halaman Status Pesanan agar admin segera memverifikasi.",
  },
  {
    question:
      "Apakah bisa pesan kustom buket jajanan, buket uang, atau papan bunga?",
    answer:
      "Bisa! Tulis detail warna kertas wrapping, isi jajanan/nominal buket uang, atau kalimat ucapan pada kolom catatan saat checkout, atau konsultasi langsung melalui WhatsApp 0822-6622-9917.",
  },
  {
    question: "Bagaimana cara melacak pesanan dan melihat foto sebelum kirim?",
    answer:
      "Pantau progres pesanan kapan saja melalui menu Pesanan Saya dengan kode pesanan (DLF-...). Sebelum kurir berangkat, tim kami juga mengirimkan foto hasil rangkaian ke WhatsApp pemesan.",
  },
];

export const STOREFRONT_REVIEWS: Review[] = [
  {
    name: "Sinta Ayu",
    product: "Buket Wisuda Sapphire Sky",
    rating: 5,
    text: "Bunganya segar dan wanginya tahan lama. Kurirnya ramah, sampai tepat waktu untuk wisuda adik saya di UNSIL.",
  },
  {
    name: "Dian Puspita",
    product: "Buket Mawar Velvet Passion",
    rating: 5,
    text: "Rangkaiannya rapi banget dan difotoin dulu sebelum dikirim. Pasti order lagi untuk anniversary berikutnya.",
  },
  {
    name: "Maya Savitri",
    product: "Buket Snack Wisuda Choco Delight",
    rating: 5,
    text: "Bisa request warna wrapping dan kartu ucapan langsung di web tanpa ribet chat panjang. Respons admin cepat!",
  },
];

export type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  category?: string;
};

export const STOREFRONT_HERO = {
  eyebrow: "Promo Musim Wisuda & Kado",
  title: "Rangkaian Bunga & Buket Segar — Diskon Hingga 35%",
  description:
    "Buket wisuda, buket jajanan, buket uang, mawar segar, hingga papan bunga ucapan. Dirangkai langsung di Delysa Florist Tasikmalaya, siap antar hari ini.",
  image: img("photo-1490750967868-88aa4486c946", 1600),
  sideCards: [
    {
      title: "Buket Wisuda & Jajanan",
      subtitle: "Mulai Rp45rb · Favorit Mahasiswa",
      image: img("photo-1520763185298-1b434c919102", 800),
      category: "Wisuda",
    },
    {
      title: "Karangan & Papan Bunga",
      subtitle: "Wedding, Grand Opening & Ucapan",
      image: img("photo-1487530811176-3780de880c2d", 800),
      category: "Papan",
    },
  ],
};

export const STOREFRONT_HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: STOREFRONT_HERO.eyebrow,
    title: STOREFRONT_HERO.title,
    description: STOREFRONT_HERO.description,
    image: STOREFRONT_HERO.image,
    imageAlt: "Rangkaian buket bunga segar Delysa Florist Tasikmalaya",
    ctaLabel: "Belanja Sekarang",
  },
  {
    eyebrow: "Koleksi Wisuda Tasikmalaya",
    title: "Buket Wisuda & Snack — Mulai Rp45rb",
    description:
      "Pilihan buket matahari, boneka wisuda, dan buket snack kekinian yang siap diantar di hari kelulusan.",
    image: STOREFRONT_HERO.sideCards[0].image,
    imageAlt: "Buket wisuda segar Delysa Florist",
    ctaLabel: "Lihat Koleksi Wisuda",
    category: "Wisuda",
  },
  {
    eyebrow: "Karangan & Papan Ucapan",
    title: "Bunga Papan & Standing Flower Tasikmalaya",
    description:
      "Ucapan pernikahan, pembukaan usaha, dan simpati dengan pengerjaan cepat serta konfirmasi foto sebelum kirim.",
    image: STOREFRONT_HERO.sideCards[1].image,
    imageAlt: "Karangan bunga papan ucapan Delysa Florist",
    ctaLabel: "Lihat Bunga Papan",
    category: "Papan",
  },
];

export const STOREFRONT_TRUST = [
  {
    title: "Buka Setiap Hari 07.00–21.00 WIB",
    subtitle: "Cikalang, Tawang, Tasikmalaya",
  },
  {
    title: "Pengiriman Cepat Same-Day",
    subtitle: "Pesan sebelum 18.00 WIB",
  },
  {
    title: "Transfer BCA a.n. Kartinah",
    subtitle: "Upload bukti & terverifikasi",
  },
  {
    title: "Foto Buket Sebelum Kirim",
    subtitle: "Konfirmasi langsung via WA",
  },
];

export const STOREFRONT_FOOTER = {
  address: DELYSA_CONTACT.address,
  hours: `Jam Operasional: ${DELYSA_CONTACT.hours}`,
  payment: DELYSA_CONTACT.payment,
};
