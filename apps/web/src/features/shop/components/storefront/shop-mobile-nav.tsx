import { AtSign, MapPin, Phone, XIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import type { ShopNavItem, ShopNavTo } from "./shop-header";

// Kelas link meniru token ShopHeader (aktif bold #111, idle #4B5563) dengan
// target sentuh min 44px (min-h-11) sesuai temuan riset aksesibilitas.
const MOBILE_NAV_ACTIVE_CLASS =
  "flex min-h-11 w-full items-center rounded-lg bg-[#F8F9FA] px-3 text-[15px] font-bold text-[#111111]";
const MOBILE_NAV_IDLE_CLASS =
  "flex min-h-11 w-full items-center rounded-lg px-3 text-[15px] font-medium text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#111111]";

/**
 * Drawer navigasi seluler: sheet modal dari kiri berisi daftar link toko,
 * kontak, dan status akun. State controlled dari ShopHeader (trigger +
 * penutup-otomatis-saat-pindah-route ada di sana).
 */
export function ShopMobileNav({
  open,
  onOpenChange,
  links,
  activeTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: ShopNavItem[];
  activeTo: ShopNavTo | null;
}) {
  return (
    // Diverifikasi via context7: Base UI docs "Controlled mode with multiple
    // triggers" — Dialog.Root open + onOpenChange; modal default true berarti
    // trap fokus, kunci scroll, tutup via Esc/backdrop.
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="mobile-nav"
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-[85vw] max-w-80 translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-white p-0 text-left shadow-xl sm:max-w-80 data-open:slide-in-from-left data-closed:slide-out-to-left data-closed:animate-out data-closed:fade-out-0 duration-300 ease-out motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#F1F2F4] px-4 py-3">
          <DialogTitle className="text-sm font-extrabold tracking-tight text-[#111111]">
            Menu navigasi
          </DialogTitle>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup menu"
                className="size-11 shrink-0 rounded-full"
              />
            }
          >
            <XIcon aria-hidden="true" />
          </DialogClose>
        </div>

        <nav
          aria-label="Navigasi seluler"
          className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
        >
          <ul className="flex flex-col gap-0.5">
            {links.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: true, includeSearch: false }}
                  activeProps={{ className: MOBILE_NAV_ACTIVE_CLASS }}
                  inactiveProps={{ className: MOBILE_NAV_IDLE_CLASS }}
                  className="focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Separator className="my-3" />

          <ul className="flex flex-col gap-0.5 px-3 pb-2 text-[13px] text-[#6B7280]">
            <li className="inline-flex min-h-11 items-center gap-2">
              <MapPin size={14} aria-hidden="true" /> Tasikmalaya
            </li>
            <li className="inline-flex min-h-11 items-center gap-2">
              <Phone size={14} aria-hidden="true" /> 0824 9904 9999
            </li>
            <li className="inline-flex min-h-11 items-center gap-2">
              <AtSign size={14} aria-hidden="true" /> @delysafloristt
            </li>
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
