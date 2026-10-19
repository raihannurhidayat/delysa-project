import { Truck, Clock } from "lucide-react";

export function DeliverySlotNote() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
        <Truck size={16} className="text-emerald-600" aria-hidden="true" />
        <span>Slot Pengiriman Tasikmalaya Hari Ini Masih Tersedia</span>
        <Clock
          size={14}
          className="ml-auto text-emerald-600"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
