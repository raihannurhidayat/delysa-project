import { UserPlus, LogIn, UserPlus as UserIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";

export function GuestBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mt-2">
      <div className="flex items-start gap-3">
        <UserPlus
          size={20}
          className="shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Belanja Sebagai Tamu
          </p>
          <p className="mt-0.5 text-sm text-amber-700">
            Masuk untuk simpan keranjang hingga 30 hari & akses riwayat pesanan.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="default"
              className="rounded-full bg-amber-600 text-white hover:bg-amber-700"
            >
              <Link to="/sign-in" className="flex items-center gap-1">
                <LogIn size={14} aria-hidden="true" /> Masuk
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="rounded-full text-amber-700 hover:bg-amber-100"
            >
              <Link to="/sign-up" className="flex items-center gap-1">
                <UserIcon size={14} aria-hidden="true" /> Buat Akun
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
