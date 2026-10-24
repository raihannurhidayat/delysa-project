import type { OrderStatus } from "@delysa/shared";
import type {
  CartCoupon,
  MiniCartLine,
  OrderPaymentMethod,
  OrderPaymentSnapshot,
  OrderRecord,
  OrderTimelineEvent,
} from "~/features/shop/types";
import { computeCartTotals } from "~/features/shop/lib/cart-totals";
import { getPaymentMethod } from "~/features/checkout/payment-methods";

const DEMO_ITEMS: MiniCartLine[] = [
  {
    slug: "single-sunflower-mentari-wisuda",
    name: "Single Sunflower 'Mentari Wisuda'",
    image:
      "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800&q=80&auto=format&fit=crop",
    sizeId: "standard",
    sizeLabel: "Standard",
    wrapId: "signature",
    wrapLabel: "Signature Wrap",
    price: 45000,
    qty: 1,
  },
  {
    slug: "buket-wisuda-mini-teddy-scholar",
    name: "Buket Boneka Wisuda Mini Teddy 'Scholar'",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop",
    sizeId: "standard",
    sizeLabel: "Standard",
    wrapId: "signature",
    wrapLabel: "Signature Wrap",
    price: 85000,
    qty: 1,
  },
  {
    slug: "buket-wisuda-elegant-golden-champagne",
    name: "Buket Wisuda Elegant 'Golden Champagne'",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80&auto=format&fit=crop",
    sizeId: "standard",
    sizeLabel: "Standard",
    wrapId: "signature",
    wrapLabel: "Signature Wrap",
    price: 195000,
    qty: 1,
  },
  {
    slug: "buket-wisuda-sapphire-sky-edition",
    name: "Buket Wisuda Sapphire Sky Edition",
    image:
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&q=80&auto=format&fit=crop",
    sizeId: "premium",
    sizeLabel: "Premium",
    wrapId: "premium",
    wrapLabel: "Premium Wrap",
    price: 240000,
    qty: 1,
  },
  {
    slug: "buket-mawar-single-satin-aura",
    name: "Buket Mawar Single Satin 'Aura'",
    image:
      "https://images.unsplash.com/photo-1533616688419-b7a585564566?w=800&q=80&auto=format&fit=crop",
    sizeId: "standard",
    sizeLabel: "Standard",
    wrapId: "signature",
    wrapLabel: "Signature Wrap",
    price: 55000,
    qty: 1,
  },
  {
    slug: "buket-mawar-velvet-passion-15-tangkai",
    name: "Buket Mawar 'Velvet Passion' 15 Tangkai",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80&auto=format&fit=crop",
    sizeId: "premium",
    sizeLabel: "Premium",
    wrapId: "premium",
    wrapLabel: "Premium Wrap",
    price: 320000,
    qty: 1,
  },
];

const RECIPIENTS = [
  [
    "Sari Amelia",
    "082116789558",
    "Jl. Sutisna Senjaya No. 12, Tasikmalaya",
    "Kirim sore hari",
  ],
  ["Budi Santoso", "081234567890", "Jl. Pancasila No. 45, Tasikmalaya", ""],
  ["Rina Kartika", "085712345678", "Jl. Cihideung No. 8, Tasikmalaya", ""],
  [
    "Dewi Lestari",
    "081398765432",
    "Jl. Siliwangi No. 21, Tasikmalaya",
    "Titip ke resepsionis",
  ],
  ["Fajar Nugraha", "082198765432", "Jl. BKR No. 77, Tasikmalaya", ""],
  ["Intan Permata", "081377788899", "Jl. Pahlawan No. 3, Tasikmalaya", ""],
  ["Agus Setiawan", "085223344556", "Jl. Empang No. 19, Tasikmalaya", ""],
  ["Nabila Putri", "081566677788", "Jl. Nagarawangi No. 5, Tasikmalaya", ""],
  [
    "Hendra Wijaya",
    "082133344455",
    "Jl. Mangunsarkoro No. 14, Tasikmalaya",
    "",
  ],
  ["Lestari Ningsih", "081911122233", "Jl. Paseh No. 2, Tasikmalaya", ""],
  ["Yoga Pratama", "085744455566", "Jl. Cilembang No. 31, Tasikmalaya", ""],
  ["Maya Sari", "081255566677", "Jl. Sutisna Senjaya No. 88, Tasikmalaya", ""],
  ["Dimas Saputra", "082177788899", "Jl. Galunggung No. 6, Tasikmalaya", ""],
  ["Anisa Rahma", "081399900011", "Jl. BKR No. 102, Tasikmalaya", ""],
  ["Rizky Maulana", "085266677788", "Jl. Siliwangi No. 55, Tasikmalaya", ""],
  ["Putri Anggraini", "081577788899", "Jl. Cihideung No. 27, Tasikmalaya", ""],
] as const;

const ORDER_ROWS: {
  suffix: string;
  daysAgo: number;
  status: OrderStatus;
  method: OrderPaymentMethod;
  itemIndexes: number[];
  coupon?: CartCoupon;
}[] = [
  {
    suffix: "8842",
    daysAgo: 0,
    status: "pending_payment",
    method: "manual_transfer_bca",
    itemIndexes: [0, 4],
  },
  {
    suffix: "7710",
    daysAgo: 1,
    status: "pending_verification",
    method: "qris",
    itemIndexes: [1],
  },
  {
    suffix: "6621",
    daysAgo: 2,
    status: "paid",
    method: "manual_transfer_bca",
    itemIndexes: [2],
  },
  {
    suffix: "5530",
    daysAgo: 4,
    status: "processing",
    method: "manual_transfer_bca",
    itemIndexes: [0, 3],
  },
  {
    suffix: "4419",
    daysAgo: 6,
    status: "shipped",
    method: "manual_transfer_bca",
    itemIndexes: [4],
  },
  {
    suffix: "3308",
    daysAgo: 8,
    status: "delivered",
    method: "manual_transfer_bca",
    itemIndexes: [1, 5],
    coupon: { code: "DELYSAWISUDA", label: "Diskon Wisuda", amount: 20000 },
  },
  {
    suffix: "2217",
    daysAgo: 10,
    status: "cancelled",
    method: "qris",
    itemIndexes: [1],
  },
  {
    suffix: "1106",
    daysAgo: 12,
    status: "rejected",
    method: "manual_transfer_bca",
    itemIndexes: [0],
  },
  {
    suffix: "9905",
    daysAgo: 14,
    status: "delivered",
    method: "manual_transfer_bca",
    itemIndexes: [2],
  },
  {
    suffix: "8804",
    daysAgo: 16,
    status: "delivered",
    method: "qris",
    itemIndexes: [0, 4],
  },
  {
    suffix: "7703",
    daysAgo: 18,
    status: "processing",
    method: "manual_transfer_bca",
    itemIndexes: [5],
  },
  {
    suffix: "6602",
    daysAgo: 21,
    status: "paid",
    method: "qris",
    itemIndexes: [3],
  },
  {
    suffix: "5501",
    daysAgo: 25,
    status: "pending_verification",
    method: "manual_transfer_bca",
    itemIndexes: [4],
  },
  {
    suffix: "4400",
    daysAgo: 29,
    status: "delivered",
    method: "manual_transfer_bca",
    itemIndexes: [1, 2],
  },
  {
    suffix: "3399",
    daysAgo: 60,
    status: "delivered",
    method: "manual_transfer_bca",
    itemIndexes: [0],
  },
  {
    suffix: "2288",
    daysAgo: 120,
    status: "cancelled",
    method: "qris",
    itemIndexes: [0, 4],
  },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function demoPayment(methodId: OrderPaymentMethod): OrderPaymentSnapshot {
  const method = getPaymentMethod(methodId);
  return {
    methodId,
    label: method?.label ?? "Metode pembayaran belum tercatat",
    description: method?.description ?? "",
    bank: method?.bank ? { ...method.bank } : undefined,
    steps: method?.steps ? [...method.steps] : [],
  };
}

function timelineFor(
  status: OrderStatus,
  createdAt: string,
): OrderTimelineEvent[] {
  const created = Date.parse(createdAt);
  const flow = [
    "pending_payment",
    "pending_verification",
    "paid",
    "processing",
    "shipped",
    "delivered",
  ] as const;
  const terminalNote =
    status === "cancelled" ? "Dibatalkan oleh admin" : "Pembayaran ditolak";

  if (status === "cancelled" || status === "rejected") {
    return [
      { status: "pending_payment", at: createdAt, note: "Pesanan dibuat" },
      {
        status,
        at: new Date(created + 2 * HOUR).toISOString(),
        note: terminalNote,
      },
    ];
  }

  const lastIndex = flow.indexOf(status as (typeof flow)[number]);
  const safeLastIndex = lastIndex === -1 ? 0 : lastIndex;
  return flow.slice(0, safeLastIndex + 1).map((eventStatus, index) => ({
    status: eventStatus,
    at: new Date(created + index * 6 * HOUR).toISOString(),
    note: index === 0 ? "Pesanan dibuat" : undefined,
  }));
}

export function createDemoOrders(now = new Date()): OrderRecord[] {
  return ORDER_ROWS.map((row, index) => {
    const createdAt = new Date(now.getTime() - row.daysAgo * DAY).toISOString();
    const items = row.itemIndexes.map((itemIndex) => ({
      ...DEMO_ITEMS[itemIndex],
      qty: 1,
    }));
    const timeline = timelineFor(row.status, createdAt);
    const lastEvent = timeline[timeline.length - 1];
    const recipient = RECIPIENTS[index];
    const hasCourier = row.status === "shipped" || row.status === "delivered";

    return {
      id: 1001 + index,
      code: `DLF-${createdAt.slice(0, 10).replace(/-/g, "")}-${row.suffix}`,
      status: row.status,
      createdAt,
      updatedAt: lastEvent.at,
      paymentDeadline: new Date(Date.parse(createdAt) + DAY).toISOString(),
      recipientName: recipient[0],
      recipientPhone: recipient[1],
      shippingAddress: recipient[2],
      customNote: recipient[3] || undefined,
      items,
      totals: computeCartTotals(items, row.coupon ?? null),
      payment: demoPayment(row.method),
      timeline,
      courier: hasCourier ? "JNE" : undefined,
      trackingNumber: hasCourier
        ? `JNE-${row.suffix}-${createdAt.slice(0, 10).replace(/-/g, "")}`
        : undefined,
      deliveredAt: row.status === "delivered" ? lastEvent.at : undefined,
    };
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
