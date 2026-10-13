import { z } from "zod";

/**
 * Skema query URL /katalog (client-only tahap ini).
 * Mirror dari `packages/shared/src/schemas.ts:productQuerySchema`
 * (search/category/page) dengan ekstensi lokal: sort, minPrice, maxPrice,
 * demo. Nilai tak valid jatuh ke default (catch), bukan error boundary.
 * Sinkronisasi penuh via Bridge saat kontrak katalog merge.
 */
export const catalogSortKeys = ["termurah", "termahal", "terbaru"] as const;

export const catalogSearchSchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(catalogSortKeys).optional().catch(undefined),
  minPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  maxPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  demo: z.enum(["loading", "empty", "error"]).optional(),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;
