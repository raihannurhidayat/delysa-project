import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bold,
  Camera,
  Check,
  CheckCircle2,
  CloudUpload,
  Italic,
  List,
  ListOrdered,
  Pencil,
  RotateCw,
  Sparkles,
  Star,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  addAdminProduct,
  generateProductSku,
  getDefaultStockUnit,
  slugifyProductName,
} from "../lib/products/product-store";
import {
  PRODUCT_CATEGORIES,
  type AdminProduct,
} from "../lib/products/product.types";

const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  "Bloom Box": "Luxury Bloom Box",
  Buket: "Signature Buket",
  "Standing Flower": "Grand Standing Flower",
  "Single Stem": "Botanical Single Stem",
};

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80";

function AtelierSwitch({
  id,
  checked,
  onCheckedChange,
  ariaLabel,
  activeColor = "emerald",
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  activeColor?: "emerald" | "dark";
}) {
  const activeBg =
    activeColor === "emerald" ? "bg-emerald-500" : "bg-[#111827]";
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:outline-none ${
        checked ? activeBg : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`inline-block size-4.5 rounded-full bg-white shadow-xs transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export type AdminProductCreatePageProps = {
  onSuccess?: (product: AdminProduct, mode: "publish" | "draft") => void;
  onCancel?: () => void;
};

export function AdminProductCreatePage({
  onSuccess,
  onCancel,
}: AdminProductCreatePageProps = {}) {
  const [name, setName] = useState("The Grand Monolith Peach & Ivory");
  const [slug, setSlug] = useState("the-grand-monolith-peach-ivory");
  const [autoSlug, setAutoSlug] = useState(true);
  const [category, setCategory] = useState<string>("Bloom Box");
  const [sku, setSku] = useState("DF-BOX-GRD");
  const [autoSku, setAutoSku] = useState(true);

  const [isActive, setIsActive] = useState(true);
  const [isCustomizable, setIsCustomizable] = useState(true);

  const [price, setPrice] = useState("500000");
  const [stock, setStock] = useState("14");
  const [stockUnit, setStockUnit] = useState("Buket");
  const [minThreshold, setMinThreshold] = useState("5");

  const [description, setDescription] = useState(
    "Komposisi mawar peach impor Ekuador dipadukan dengan bunga hydrangea putih salju, diikat pita satin double-face 4cm dalam vas keramik hitam matte basalt. Hadir sebagai instalasi floral berestetika modern sculptural yang dirancang khusus untuk perayaan eksklusif dan momen bermakna di Tasikmalaya.",
  );
  const [botanicalTags, setBotanicalTags] = useState<string[]>([
    "Ecuadorian Roses",
    "White Hydrangea",
    "Eucalyptus Parvifolia",
  ]);
  const [tagInput, setTagInput] = useState("");

  const [imageUrl, setImageUrl] = useState(DEFAULT_COVER_IMAGE);
  const [imageFileName, setImageFileName] = useState(
    "monolith-peach-ivory-01.jpg",
  );
  const [imageMeta, setImageMeta] = useState("1.4 MB • JPG (2400 × 2400)");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const trimmedName = name.trim();
  const trimmedSku = sku.trim();
  const trimmedDescription = description.trim();
  const numericPrice = Number(price.replace(/\./g, "").replace(/,/g, ""));
  const numericStock = Number(stock);
  const numericThreshold = Number(minThreshold);

  const validationErrors: string[] = [];
  if (!trimmedName) {
    validationErrors.push("Nama produk wajib diisi.");
  }
  if (!trimmedSku) {
    validationErrors.push("SKU produk wajib diisi.");
  }
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    validationErrors.push("Harga jual harus lebih dari Rp 0.");
  }
  if (!Number.isFinite(numericStock) || numericStock < 0) {
    validationErrors.push("Stok awal tidak boleh negatif.");
  }
  if (!Number.isFinite(numericThreshold) || numericThreshold < 0) {
    validationErrors.push("Threshold minimal stok tidak boleh negatif.");
  }
  if (!trimmedDescription) {
    validationErrors.push("Deskripsi rangkaian wajib diisi.");
  }

  const errorCount = validationErrors.length;
  const isFormValid = errorCount === 0;

  function handleNameChange(nextName: string) {
    setName(nextName);
    if (autoSlug) {
      setSlug(slugifyProductName(nextName));
    }
    if (autoSku) {
      setSku(generateProductSku(nextName, category));
    }
  }

  function handleCategoryChange(nextCategory: string | null) {
    if (!nextCategory) return;
    setCategory(nextCategory);
    setStockUnit(getDefaultStockUnit(nextCategory));
    if (autoSku) {
      setSku(generateProductSku(name, nextCategory));
    }
  }

  function handleToggleAutoSlug() {
    const nextAuto = !autoSlug;
    setAutoSlug(nextAuto);
    if (nextAuto) {
      setSlug(slugifyProductName(name));
    }
  }

  function handleAddTag() {
    const cleaned = tagInput.trim();
    if (!cleaned) return;
    if (!botanicalTags.includes(cleaned)) {
      setBotanicalTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTag();
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setBotanicalTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }

  function handleFormatText(
    format: "bold" | "italic" | "underline" | "bullet" | "numbered",
  ) {
    const snippetByFormat: Record<typeof format, string> = {
      bold: " **teks tebal**",
      italic: " *teks miring*",
      underline: " <u>teks garis bawah</u>",
      bullet: "\n- Item komposisi",
      numbered: "\n1. Langkah perawatan",
    };
    setDescription((prev) => `${prev}${snippetByFormat[format]}`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split(".").pop()?.toUpperCase() ?? "JPG";
    setImageFileName(file.name);
    setImageMeta(`${sizeInMb} MB • ${ext} (2400 × 2400)`);
    if (
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function"
    ) {
      setImageUrl(URL.createObjectURL(file));
    }
  }

  function handleClearImage() {
    setImageUrl("");
    setImageFileName("Belum ada foto dipilih");
    setImageMeta("0 MB • Pilih atau unggah foto baru");
  }

  function handleRestoreDefaultImage() {
    setImageUrl(DEFAULT_COVER_IMAGE);
    setImageFileName("monolith-peach-ivory-01.jpg");
    setImageMeta("1.4 MB • JPG (2400 × 2400)");
  }

  function saveProduct(mode: "publish" | "draft") {
    if (!isFormValid) {
      setFeedbackMessage(
        validationErrors[0] ??
          "Mohon lengkapi semua kolom wajib terlebih dahulu.",
      );
      return;
    }

    const publishedState = mode === "draft" ? false : isActive;
    const created = addAdminProduct({
      name: trimmedName,
      sku: trimmedSku.toUpperCase(),
      slug: slug.trim() || slugifyProductName(trimmedName),
      category,
      price: Math.round(numericPrice),
      stock: Math.round(numericStock),
      stockUnit: stockUnit.trim() || "Buket",
      minThreshold: Math.round(numericThreshold),
      sales: 0,
      rating: 5.0,
      imageUrl: imageUrl.trim() || undefined,
      isPublished: publishedState,
      isCustomizable,
      description: trimmedDescription,
      botanicalTags,
    });

    setFeedbackMessage(
      mode === "draft"
        ? `Produk "${created.name}" berhasil disimpan sebagai Draft.`
        : `Produk "${created.name}" berhasil disimpan dan ditayangkan ke katalog.`,
    );

    onSuccess?.(created, mode);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProduct("publish");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-6xl space-y-6 pb-10"
    >
      {/* Top Breadcrumb & Back Link */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#6B7280]"
        >
          <Link
            to="/admin"
            className="transition-colors hover:text-[#111827] hover:underline"
          >
            Back-Office
          </Link>
          <span className="text-[#D1D5DB]">/</span>
          <Link
            to="/admin/produk"
            className="transition-colors hover:text-[#111827] hover:underline"
          >
            Products
          </Link>
          <span className="text-[#D1D5DB]">/</span>
          <span className="font-semibold text-[#111827]">
            Tambah Produk Baru
          </span>
        </nav>

        <Link
          to="/admin/produk"
          onClick={() => onCancel?.()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] transition-colors hover:text-[#FF6B35]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Kembali ke Katalog Produk
        </Link>
      </div>

      {/* Page Header */}
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
          Tambah Produk Baru
        </h1>
        <p className="text-sm text-[#6B7280]">
          Masukkan detail rangkaian bunga, batas ambang stok segar, konfigurasi
          kustomisasi, dan galeri visual etalase.
        </p>
      </header>

      {/* Atelier Philosophy Callout Banner */}
      <section
        aria-label="Filosofi Dreamineering Atelier"
        className="flex items-start gap-3.5 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:items-center"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-[#FF6B35]">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
            <span className="text-[#FF6B35]">
              FILOSOFI DREAMINEERING ATELIER
            </span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="font-medium tracking-normal text-[#6B7280] normal-case">
              Tasikmalaya Rapid Dispatch
            </span>
          </div>
          <p className="text-xs font-semibold text-[#111827] sm:text-sm">
            Validasi instan tanpa salah format. Produk aktif langsung tayang di
            katalog publik Tasikmalaya dengan sistem pengingat stok otomatis.
          </p>
        </div>
      </section>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            isFormValid
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Row 1: Informasi Dasar & Klasifikasi + Status & Konfigurasi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Card: Informasi Dasar & Klasifikasi */}
        <section
          aria-labelledby="section-basic-info"
          className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6 lg:col-span-8"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-4">
            <h2
              id="section-basic-info"
              className="text-base font-bold text-[#111827]"
            >
              Informasi Dasar &amp; Klasifikasi
            </h2>
            <span className="text-xs font-semibold text-[#EF4444]">
              * Wajib diisi
            </span>
          </div>

          {/* Nama Produk */}
          <div className="space-y-1.5">
            <Label
              htmlFor="product-name"
              className="text-xs font-semibold text-[#111827]"
            >
              Nama Produk <span className="text-[#EF4444]">*</span>
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: The Grand Monolith Peach & Ivory"
              className="h-10 rounded-xl border-[#E5E7EB] text-sm font-medium text-[#111827]"
              required
            />
            <p className="text-xs text-[#6B7280]">
              Nama rangkaian bunga yang tampil di etalase dan faktur pemesanan
              klien.
            </p>
          </div>

          {/* Slug URL Otomatis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="product-slug"
                className="text-xs font-semibold text-[#111827]"
              >
                Slug URL Otomatis{" "}
                <span className="font-normal text-[#6B7280]">(opsional)</span>
              </Label>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <RotateCw className="size-3" aria-hidden="true" />
                {autoSlug ? "Auto-generated" : "Manual slug"}
              </span>
            </div>

            <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <span className="inline-flex items-center border-r border-[#E5E7EB] bg-[#F3F4F6] px-3 font-mono text-xs text-[#6B7280]">
                delysaflorist.com/products/
              </span>
              <input
                id="product-slug"
                type="text"
                value={slug}
                readOnly={autoSlug}
                onChange={(e) => setSlug(slugifyProductName(e.target.value))}
                className="min-w-0 flex-1 bg-white px-3 py-2 font-mono text-xs font-medium text-[#111827] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleToggleAutoSlug}
                aria-label="Ubah mode edit slug"
                title={
                  autoSlug
                    ? "Klik untuk mengedit slug secara manual"
                    : "Klik untuk kembali ke slug otomatis"
                }
                className="inline-flex items-center justify-center border-l border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Kategori Produk & SKU */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-7">
              <Label
                htmlFor="product-category"
                className="text-xs font-semibold text-[#111827]"
              >
                Kategori Produk <span className="text-[#EF4444]">*</span>
              </Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger
                  id="product-category"
                  aria-label="Kategori Produk"
                  className="h-10 w-full rounded-xl border-[#E5E7EB] text-sm font-medium text-[#111827]"
                >
                  <SelectValue>
                    {CATEGORY_DISPLAY_LABELS[category] ?? category}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_DISPLAY_LABELS[cat] ?? cat} ({cat})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="product-sku"
                  className="text-xs font-semibold text-[#111827]"
                >
                  Kode SKU <span className="text-[#EF4444]">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoSku(true);
                    setSku(generateProductSku(name, category));
                  }}
                  className="text-[11px] font-medium text-[#FF6B35] hover:underline"
                >
                  Generate SKU
                </button>
              </div>
              <Input
                id="product-sku"
                value={sku}
                onChange={(e) => {
                  setAutoSku(false);
                  setSku(e.target.value);
                }}
                placeholder="DF-BOX-GRD"
                className="h-10 rounded-xl border-[#E5E7EB] font-mono text-sm font-medium uppercase text-[#111827]"
                required
              />
            </div>
          </div>
        </section>

        {/* Card: Status & Konfigurasi */}
        <section
          aria-labelledby="section-status-config"
          className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6 lg:col-span-4"
        >
          <div className="border-b border-[#F3F4F6] pb-4">
            <h2
              id="section-status-config"
              className="text-base font-bold text-[#111827]"
            >
              Status &amp; Konfigurasi
            </h2>
          </div>

          {/* Status Aktif (isActive) */}
          <div className="space-y-2 border-b border-[#F3F4F6] pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label
                  htmlFor="switch-is-active"
                  className="text-xs font-bold text-[#111827]"
                >
                  Status Aktif (isActive)
                </Label>
                <p
                  className={`mt-0.5 text-[10px] font-bold tracking-wider uppercase ${
                    isActive ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {isActive
                    ? "TAYANG DI ETALASE PUBLIK"
                    : "TERSIMPAN SEBAGAI DRAFT"}
                </p>
              </div>
              <AtelierSwitch
                id="switch-is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                ariaLabel="Status Aktif (isActive)"
                activeColor="emerald"
              />
            </div>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Jika dinonaktifkan, produk hanya tersimpan sebagai draft di
              back-office tanpa dapat dilihat oleh pembeli.
            </p>
          </div>

          {/* Dapat Dikustomisasi (isCustomizable) */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label
                  htmlFor="switch-is-customizable"
                  className="text-xs font-bold text-[#111827]"
                >
                  Dapat Dikustomisasi (isCustomizable)
                </Label>
                <p className="mt-0.5 text-[10px] font-bold tracking-wider text-[#111827] uppercase">
                  IZINKAN KUSTOMISASI PEMESAN
                </p>
              </div>
              <AtelierSwitch
                id="switch-is-customizable"
                checked={isCustomizable}
                onCheckedChange={setIsCustomizable}
                ariaLabel="Dapat Dikustomisasi (isCustomizable)"
                activeColor="dark"
              />
            </div>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Aktifkan kolom catatan khusus (warna pita, slot kartu wisuda
              gelar, request wrap khusus) pada halaman checkout.
            </p>
          </div>
        </section>
      </div>

      {/* Row 2: Harga & Inventaris Stok Segar (Clean 3-Column Row) */}
      <section
        aria-labelledby="section-pricing-inventory"
        className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-4">
          <h2
            id="section-pricing-inventory"
            className="text-base font-bold text-[#111827]"
          >
            Harga &amp; Inventaris Stok Segar
          </h2>
          <span className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase">
            MANAJEMEN STOK REAL-TIME
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Harga Jual */}
          <div className="space-y-1.5">
            <Label
              htmlFor="product-price"
              className="text-xs font-semibold text-[#111827]"
            >
              Harga Jual <span className="text-[#EF4444]">*</span>
            </Label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <span className="inline-flex items-center border-r border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-xs font-bold text-[#111827]">
                Rp
              </span>
              <input
                id="product-price"
                type="number"
                min={0}
                step={5000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="min-w-0 flex-1 px-3.5 py-2 text-sm font-bold text-[#111827] focus:outline-none"
                required
              />
            </div>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Harga retail sudah termasuk pita &amp; kartu ucapan standar.
            </p>
          </div>

          {/* Stok Awal */}
          <div className="space-y-1.5">
            <Label
              htmlFor="product-stock"
              className="text-xs font-semibold text-[#111827]"
            >
              Stok Awal <span className="text-[#EF4444]">*</span>
            </Label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <input
                id="product-stock"
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="min-w-0 flex-1 px-3.5 py-2 text-sm font-bold text-[#111827] focus:outline-none"
                required
              />
              <span className="inline-flex items-center border-l border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-xs font-medium text-[#6B7280]">
                {stockUnit}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Jumlah ketersediaan rangkaian segar yang siap dikirim.
            </p>
          </div>

          {/* Threshold Min. Stok */}
          <div className="space-y-1.5">
            <Label
              htmlFor="product-threshold"
              className="text-xs font-semibold text-[#111827]"
            >
              Threshold Min. Stok
            </Label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <input
                id="product-threshold"
                type="number"
                min={0}
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="min-w-0 flex-1 px-3.5 py-2 text-sm font-bold text-[#111827] focus:outline-none"
              />
              <span className="inline-flex items-center border-l border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-xs font-medium text-[#6B7280]">
                Unit
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-[#FF6B35]">
              Sistem memicu alert Low-Stock jika stok ≤ nilai ini (default: 5).
            </p>
          </div>
        </div>
      </section>

      {/* Row 3: Deskripsi & Komposisi Botani + Galeri Visual Etalase */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Card: Deskripsi & Komposisi Botani */}
        <section
          aria-labelledby="section-description-botanical"
          className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6 lg:col-span-8"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-4">
            <h2
              id="section-description-botanical"
              className="text-base font-bold text-[#111827]"
            >
              Deskripsi &amp; Komposisi Botani
            </h2>
            <span className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase">
              EDITORIAL COPY
            </span>
          </div>

          {/* Deskripsi Rangkaian */}
          <div className="space-y-2">
            <Label
              htmlFor="product-description"
              className="text-xs font-semibold text-[#111827]"
            >
              Deskripsi Rangkaian <span className="text-[#EF4444]">*</span>
            </Label>

            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              {/* Rich Text / Markdown Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFormatText("bold")}
                    aria-label="Format tebal"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <Bold className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("italic")}
                    aria-label="Format miring"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <Italic className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("underline")}
                    aria-label="Format garis bawah"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <Underline className="size-3.5" aria-hidden="true" />
                  </button>
                  <span
                    className="mx-1 h-4 w-px bg-[#D1D5DB]"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => handleFormatText("bullet")}
                    aria-label="Daftar poin"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <List className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText("numbered")}
                    aria-label="Daftar bernomor"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <ListOrdered className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <span className="text-[11px] font-medium text-[#6B7280]">
                  Format Markdown / Rich Text
                </span>
              </div>

              <Textarea
                id="product-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan deskripsi estetika, komposisi bunga segar, ukuran vas/buket, dan kesan acara..."
                className="min-h-[140px] rounded-none border-0 text-sm leading-relaxed text-[#111827] focus-visible:ring-0"
                required
              />
            </div>
          </div>

          {/* Spesifikasi Botani Tambahan */}
          <div className="space-y-2">
            <Label
              htmlFor="botanical-tag-input"
              className="text-xs font-semibold text-[#111827]"
            >
              Spesifikasi Botani Tambahan{" "}
              <span className="font-normal text-[#6B7280]">(opsional)</span>
            </Label>

            <div className="space-y-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                {botanicalTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#111827] shadow-2xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Hapus ${tag}`}
                      className="text-[#9CA3AF] transition-colors hover:text-[#EF4444]"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="botanical-tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="+ Ketik nama bunga & Enter"
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#374151] placeholder:text-[#6B7280] focus:outline-none"
                />
                {tagInput.trim() !== "" && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-md bg-[#111827] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1F2937]"
                  >
                    Tambah
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Galeri Visual Etalase + Panduan Fotografi Atelier */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Galeri Visual Etalase */}
          <section
            aria-labelledby="section-visual-gallery"
            className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3.5">
              <h2
                id="section-visual-gallery"
                className="text-base font-bold text-[#111827]"
              >
                Galeri Visual Etalase
              </h2>
              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className="text-xs font-semibold text-[#FF6B35] hover:underline"
              >
                {showUrlInput ? "Tutup URL" : "Input URL"}
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Unggah foto produk dari komputer"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-5 text-center transition-colors hover:border-[#FF6B35] hover:bg-[#FFF7F3]"
            >
              <div className="mb-2 flex size-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#374151] shadow-2xs">
                <CloudUpload className="size-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-[#111827]">
                Tarik &amp; lepas foto ke sini
              </p>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                atau{" "}
                <span className="font-semibold text-[#111827] underline">
                  Jelajahi File
                </span>{" "}
                dari komputer
              </p>
            </div>

            {showUrlInput && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="product-image-url"
                  className="text-xs font-semibold text-[#111827]"
                >
                  URL Foto Cover
                </Label>
                <Input
                  id="product-image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Main Photo Preview Card */}
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xs">
              <div className="relative aspect-square w-full bg-[#111827]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name || "Preview foto utama produk"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-gray-400">
                    <Camera className="size-7 text-gray-500" />
                    <span>Belum ada foto utama dipilih</span>
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-xs">
                    <Star
                      className="size-3 fill-[#FF6B35] text-[#FF6B35]"
                      aria-hidden="true"
                    />
                    FOTO UTAMA / COVER
                  </span>
                  {imageUrl && (
                    <span className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                      Siap Diunggah
                    </span>
                  )}
                </div>
              </div>

              {/* File Info Footer */}
              <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#111827]">
                    {imageFileName}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">{imageMeta}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      imageUrl
                        ? fileInputRef.current?.click()
                        : handleRestoreDefaultImage()
                    }
                    aria-label="Ganti foto utama"
                    title="Ganti foto utama"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
                  >
                    <ArrowLeftRight className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    aria-label="Hapus foto utama"
                    title="Hapus foto utama"
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#EF4444] transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Card: Panduan Fotografi Atelier */}
          <section
            aria-labelledby="section-photo-guidelines"
            className="space-y-3.5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-[#374151]" aria-hidden="true" />
              <h3
                id="section-photo-guidelines"
                className="text-xs font-bold text-[#111827]"
              >
                Panduan Fotografi Atelier
              </h3>
            </div>

            <ul className="space-y-3 text-xs leading-relaxed text-[#4B5563]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-bold text-[#111827]">
                    Pencahayaan Studio Netral:
                  </strong>{" "}
                  Hindari flash ponsel langsung; gunakan soft diffuse light agar
                  rona kelopak asli terlihat nyata.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-bold text-[#111827]">
                    Background Bebas Noise:
                  </strong>{" "}
                  Utamakan latar polos kontras (matte charcoal, basalt, atau
                  dinding off-white).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-bold text-[#111827]">
                    Resolusi Tajam:
                  </strong>{" "}
                  Pastikan tekstur dedaunan &amp; dewy petals fokus tajam pada
                  center frame.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Bottom Validation & Action Bar */}
      <section
        aria-label="Panel aksi publikasi produk"
        className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-md sm:flex-row sm:items-center sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 shrink-0 rounded-full ${
                isFormValid ? "bg-emerald-500" : "bg-amber-500"
              }`}
              aria-hidden="true"
            />
            <p className="text-xs font-bold text-[#111827]">
              {isFormValid
                ? "Semua perubahan tervalidasi secara lokal & siap dipublikasikan"
                : validationErrors[0]}
            </p>
          </div>
          <span className="text-xs text-[#6B7280]">
            • {errorCount} kesalahan formulir
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel?.()}
            className="h-10 rounded-xl border-[#E5E7EB] px-4 text-xs font-semibold text-[#111827]"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => saveProduct("draft")}
            className="h-10 rounded-xl border-[#111827] bg-white px-4 text-xs font-bold text-[#111827] hover:bg-[#F9FAFB]"
          >
            Simpan sebagai Draft
          </Button>
          <Button
            type="submit"
            className="h-10 gap-2 rounded-xl bg-[#111827] px-5 text-xs font-bold text-white hover:bg-[#1F2937]"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Simpan Produk (Tayangkan)
          </Button>
        </div>
      </section>
    </form>
  );
}
