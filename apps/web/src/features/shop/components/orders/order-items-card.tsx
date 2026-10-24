import { formatIDR } from "~/features/shop/lib/format";
import type { OrderRecord } from "~/features/shop/types";

export function OrderItemsCard({ order }: { order: OrderRecord }) {
  const { totals } = order;

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#FF6B35] uppercase">
        Detail Pesanan
      </p>
      <h2 className="mt-1 text-base font-extrabold text-[#1A1A1A]">
        Item &amp; total
      </h2>

      <ul className="mt-3 divide-y divide-[#F3F4F6]">
        {order.items.map((item) => {
          const variant = [item.sizeLabel, item.wrapLabel]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={`${item.slug}-${item.sizeId}-${item.wrapId}`}
              className="flex gap-3 py-3 first:pt-0"
            >
              <img
                src={item.image}
                alt={item.name}
                className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-[#E5E7EB]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {item.name}
                </p>
                {variant ? (
                  <p className="mt-0.5 text-[11px] text-[#6B7280]">{variant}</p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  {item.qty} × {formatIDR(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#1A1A1A]">
                {formatIDR(item.price * item.qty)}
              </p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-3 space-y-1.5 border-t border-[#E5E7EB] pt-3 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-[#6B7280]">Subtotal</dt>
          <dd className="font-medium text-[#1A1A1A]">
            {formatIDR(totals.subtotal)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#6B7280]">Diskon produk</dt>
          <dd className="font-medium text-[#1A1A1A]">
            {formatIDR(totals.productDiscount)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#6B7280]">Ongkos kirim</dt>
          <dd className="font-medium text-[#1A1A1A]">
            {totals.shipping === 0 ? "GRATIS" : formatIDR(totals.shipping)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#6B7280]">Kupon</dt>
          <dd className="font-medium text-[#1A1A1A]">
            {formatIDR(totals.couponDiscount)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-[#E5E7EB] pt-2 text-sm">
          <dt className="font-semibold text-[#1A1A1A]">Grand total</dt>
          <dd className="font-extrabold text-[#FF6B35]">
            {formatIDR(totals.grandTotal)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
