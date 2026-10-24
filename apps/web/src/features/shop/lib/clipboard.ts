import { toast } from "~/components/ui/toast";

export async function copyText(value: string, label: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard API tidak tersedia");
    }
    await navigator.clipboard.writeText(value);
    toast.add({ title: `${label} disalin`, type: "success" });
    return true;
  } catch {
    toast.add({
      title: "Gagal menyalin",
      description: `Salin ${label.toLowerCase()} secara manual.`,
      type: "error",
    });
    return false;
  }
}
