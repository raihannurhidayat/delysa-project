import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionPanelContent,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Tabs, TabsList, TabsPanel, TabsTab } from "~/components/ui/tabs";
import type { ProductDetail } from "~/features/shop/types";
import { ChevronDown } from "lucide-react";

/**
 * Tab deskripsi PDP: Tabs di desktop, Accordion di mobile — satu sumber konten.
 * (Valido/Baymard: heading tetap terlihat, bukan tab yang menyembunyikan info.)
 */
export function ProductTabs({ detail }: { detail: ProductDetail }) {
  const sections = [
    {
      id: "deskripsi",
      title: "Deskripsi & Perawatan Rangkaian",
      body: (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Filosofi & Karakter Rangkaian
            </h3>
            <p className="mt-1 max-w-[80ch] text-[13px] leading-relaxed text-[#4B5563]">
              {detail.description}
            </p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Panduan Perawatan Bunga Segar
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {detail.care.map((c) => (
                <li
                  key={c.slice(0, 24)}
                  className="text-[12px] leading-relaxed text-[#4B5563]"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "spesifikasi",
      title: "Spesifikasi & Dimensi",
      body: (
        <dl className="grid gap-2 sm:grid-cols-2">
          {detail.specs.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#E5E7EB] bg-white p-3"
            >
              <dt className="text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
                {s.label}
              </dt>
              <dd className="mt-0.5 text-[13px] text-[#1A1A1A]">{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "pengiriman",
      title: "Jadwal & Area Pengiriman Tasikmalaya",
      body: (
        <ul className="flex flex-col gap-2">
          {detail.shipping.map((s) => (
            <li
              key={s.slice(0, 24)}
              className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-[13px] text-[#1A1A1A]"
            >
              {s}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <section aria-label="Detail produk">
      <div className="hidden md:block">
        <Tabs defaultValue={sections[0].id}>
          <TabsList aria-label="Navigasi detail produk">
            {sections.map((s) => (
              <TabsTab key={s.id} value={s.id}>
                {s.title}
              </TabsTab>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsPanel key={s.id} value={s.id}>
              {s.body}
            </TabsPanel>
          ))}
        </Tabs>
      </div>
      <div className="md:hidden">
        <Accordion>
          {sections.map((s) => (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionHeader>
                <AccordionTrigger className="text-[13px] font-bold text-[#1A1A1A]">
                  {s.title}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform"
                  />
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionPanel>
                <AccordionPanelContent>{s.body}</AccordionPanelContent>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
