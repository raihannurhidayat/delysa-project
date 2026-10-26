import { MapPin, Phone, StickyNote, Truck, User } from "lucide-react";
import {
  maskOrderAddress,
  maskOrderName,
  maskOrderPhone,
} from "~/features/shop/lib/order-privacy";
import type { OrderRecord } from "~/features/shop/types";

export function OrderDeliveryCard({
  order,
  isAuthenticated,
}: {
  order: OrderRecord;
  isAuthenticated: boolean;
}) {
  const name = isAuthenticated
    ? order.recipientName
    : maskOrderName(order.recipientName);
  const phone = isAuthenticated
    ? order.recipientPhone
    : maskOrderPhone(order.recipientPhone);
  const address = isAuthenticated
    ? order.shippingAddress
    : maskOrderAddress(order.shippingAddress);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5 mb-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#FF6B35] uppercase">
        Pengiriman
      </p>
      <h2 className="mt-1 text-base font-extrabold text-[#1A1A1A]">
        Penerima &amp; alamat
      </h2>

      <dl className="mt-3 space-y-3 text-xs">
        <div className="flex gap-2.5">
          <User
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#9CA3AF]"
          />
          <div>
            <dt className="text-[10px] text-[#6B7280]">Nama penerima</dt>
            <dd className="font-semibold text-[#1A1A1A]">{name}</dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Phone
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#9CA3AF]"
          />
          <div>
            <dt className="text-[10px] text-[#6B7280]">Telepon</dt>
            <dd className="font-semibold text-[#1A1A1A]">{phone}</dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <MapPin
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#9CA3AF]"
          />
          <div>
            <dt className="text-[10px] text-[#6B7280]">Alamat</dt>
            <dd className="leading-relaxed text-[#1A1A1A]">{address}</dd>
          </div>
        </div>
        {order.courier || order.trackingNumber ? (
          <div className="flex gap-2.5">
            <Truck
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#9CA3AF]"
            />
            <div>
              <dt className="text-[10px] text-[#6B7280]">Kurir</dt>
              <dd className="font-semibold text-[#1A1A1A]">
                {[order.courier, order.trackingNumber]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          </div>
        ) : null}
        {order.customNote ? (
          <div className="flex gap-2.5">
            <StickyNote
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#9CA3AF]"
            />
            <div>
              <dt className="text-[10px] text-[#6B7280]">Catatan</dt>
              <dd className="leading-relaxed text-[#1A1A1A]">
                {order.customNote}
              </dd>
            </div>
          </div>
        ) : null}
      </dl>

      {!isAuthenticated ? (
        <p className="mt-3 rounded-xl bg-[#FFF3ED] px-3 py-2 text-[11px] leading-relaxed text-[#9A3412]">
          Masuk ke akun untuk melihat data penerima secara lengkap.
        </p>
      ) : null}
    </section>
  );
}
