import { Textarea } from "~/components/ui/textarea";

interface CartInstructionsFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function CartInstructionsField({
  value,
  onChange,
}: CartInstructionsFieldProps) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <label className="block text-sm font-medium text-[#1A1A1A]">
        Instruksi Jam Antar & Catatan Lokasi Tasikmalaya
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Contoh: Antar jam 10:00–11:00, rumah nomor 15 RT 03 RW 02, dekat masjid Al-Ikhlas"
        maxLength={300}
        rows={3}
        className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] disabled:bg-[#F9FAFB]"
      />
      <p className="mt-1 text-right text-[11px] text-[#9CA3AF]">
        {value.length}/300
      </p>
    </div>
  );
}
