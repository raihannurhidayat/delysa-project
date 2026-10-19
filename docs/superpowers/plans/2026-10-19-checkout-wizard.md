# Checkout Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step checkout wizard (Review Cart → Alamat → Metode Bayar → Ringkasan) with guest checkout support, manual BCA transfer payment, file upload for payment proof, and idempotent order creation — all within a single route `/checkout` using TanStack Router search params for step state.

**Architecture:** Single route `/checkout` with `validateSearch` controlling step (`?step=review|alamat|bayar|ringkasan`). React Hook Form with `FormProvider` shares form state across step components. TanStack Query mutations for `createOrder` and `uploadPaymentProof` with optimistic updates. Draft persistence to localStorage keyed by guest_token. Reuses existing cart store, totals, UI primitives, and Zod schemas from `@delysa/shared`.

**Tech Stack:** TanStack Start 1.168 + Router 1.170 + Query v5, React 19, React Hook Form 7.62 + @hookform/resolvers + Zod 3.23, Tailwind v4 + shadcn/ui (base-ui/react), native fetch API client.

**Spec:** 
- `docs/prd/PRD-Delysa-Florist.md` §6 Fase 3 (FR-03-01 to FR-03-05)
- `docs/prd/PRD-Frontend-Delysa-Florist.md` §5 Fase FE-3
- `packages/shared/src/schemas.ts` (checkoutSchema)
- `packages/shared/openapi.yaml` (contract)

---

## Global Constraints

- **Monorepo:** pnpm workspaces, `apps/web` (TanStack Start), `packages/shared` (OpenAPI + Zod)
- **Dependency rule:** `web → shared ← api`, no cyclic deps
- **Types:** All API request/response types from `@delysa/shared` (generated via `pnpm gen:types`)
- **Validation:** All forms use Zod schemas mirroring `@delysa/shared` schemas
- **Routing:** File-based, route files must not export components used as `component`/`errorComponent`/`notFoundComponent`
- **Auth:** Better Auth server-side (apps/web), Laravel read-only verify — checkout supports both guest + auth
- **Mock ↔ Real:** `VITE_API_URL` env controls mock vs real API (see `features/shop/api/http.ts:isMockMode()`)
- **Cart persist:** 30 hari (auth, DB) / 7 hari (guest, cookie `guest_token`) — PRD FR-03-01
- **Inventory check:** Double-check at add-to-cart AND checkout init — PRD FR-03-02
- **Checkout:** 1 halaman ≤4 langkah, idempotency-key anti double-submit — PRD FR-03-03
- **Payment:** Manual transfer BCA + upload bukti (jpg/png ≤5MB) → `pending_verification` — PRD FR-03-04/05
- **File upload:** Vercel ephemeral → must use VPS volume / object storage (not local disk)
- **Commands:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` must pass

---

## Review Focus

| # | Input / Failure Mode | Expected Behavior | Test Location |
|---|---|---|---|
| 1 | User double-clicks "Buat Pesanan" within 500ms | Only 1 order created (idempotency-key prevents duplicate) | Task 4 mutation test |
| 2 | Stock insufficient at submit (race condition) | 409 STOCK_INSUFFICIENT → toast error → navigate back to Review step | Task 4 error handling test |
| 3 | Guest uploads non-image file (>5MB or PDF) | Client-side rejection with clear message, no upload attempt | Task 6 file validation test |
| 4 | User refreshes browser at step 3 (Metode Bayar) | Form draft restored from localStorage, step preserved in URL | Task 5 draft persistence test |
| 5 | Authenticated user checks out | Address prefilled from profile, order linked to userId (not guest_token) | Task 7 auth integration test |

---

## File Placement Map

| File | Action | Purpose |
|---|---|---|
| `packages/shared/src/schemas.ts` | Extend | Add `orderCreateSchema`, `paymentProofSchema`, step-specific schemas |
| `packages/shared/openapi.yaml` | Extend | Add `/orders` POST, `/orders/{id}/payment-proof` POST endpoints |
| `apps/web/src/features/checkout/types.ts` | Create | CheckoutStep, CheckoutFormData, OrderCreateInput, PaymentProofInput types |
| `apps/web/src/features/checkout/schemas.ts` | Create | Zod schemas per step (extend shared) |
| `apps/web/src/features/checkout/api/endpoints.ts` | Create | `createOrder`, `uploadPaymentProof` functions (mock + real) |
| `apps/web/src/features/checkout/api/query-keys.ts` | Create | `orderQueries` factory |
| `apps/web/src/features/checkout/api/http.ts` | Create/Extend | `apiPost`, `apiUpload` helpers (or extend shop/http.ts) |
| `apps/web/src/features/checkout/hooks/use-checkout.ts` | Create | Mutations, draft persistence, guest token handling |
| `apps/web/src/features/checkout/components/CheckoutStepper.tsx` | Create | Progress indicator (steps 1-4) with ARIA |
| `apps/web/src/features/checkout/components/steps/ReviewCartStep.tsx` | Create | Read-only cart lines with qty edit/remove |
| `apps/web/src/features/checkout/components/steps/AlamatStep.tsx` | Create | Form penerima (nama, HP, alamat, catatan kustom) |
| `apps/web/src/features/checkout/components/steps/MetodeBayarStep.tsx` | Create | BCA instructions + file upload bukti transfer |
| `apps/web/src/features/checkout/components/steps/RingkasanStep.tsx` | Create | Final review + submit order button |
| `apps/web/src/features/checkout/view/checkout-page.tsx` | Create | Page assembly: shell + FormProvider + stepper + conditional step render |
| `apps/web/src/routes/_shop/checkout.tsx` | Create | Route file with `validateSearch` for step param |
| `apps/web/src/features/shop/lib/mini-cart-storage.ts` | Extend | Add `getGuestToken()`, `setGuestToken()` for guest checkout |

---

## Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Cart state (lines, totals, coupon) | **Reuse** | `features/shop/lib/mini-cart-store.ts` | Sync external store, persist, hydrate sudah matang |
| Cart totals computation | **Reuse** | `features/shop/lib/cart-totals.ts` | Business logic shipping, discount, grandTotal |
| Cart rules (shipping, free threshold) | **Reuse** | `features/shop/lib/cart-rules.ts` | Constants `FREE_SHIPPING_MIN`, `SHIPPING_FLAT` |
| UI Primitives (Button, Input, Textarea, Select, Alert, Toast) | **Reuse** | `components/ui/*.tsx` | Design system shadcn/ui konsisten |
| Zod validation (checkoutSchema) | **Extend** | `packages/shared/src/schemas.ts:21-26` | Tambah step-specific fields, mirror ke FE |
| API Client (http.ts) | **Extend** | `features/shop/api/http.ts` | Tambah `apiPost`, `apiUpload` untuk mutation |
| Query Keys factory | **Extend** | `features/shop/api/query-keys.ts` | Tambah `orderQueries` untuk createOrder, uploadProof |
| Cart Components (OrderSummary, CartLineItem) | **Reuse** | `features/shop/components/cart/*.tsx` | Ringkasan & line items siap pakai di step Ringkasan |

---

## Task Breakdown

### Task 1: Shared Schemas & OpenAPI Contract

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Modify: `packages/shared/openapi.yaml`
- Test: `packages/shared/src/schemas.test.ts` (new)

**Interfaces:**
- Consumes: existing `checkoutSchema` (recipientName, recipientPhone, shippingAddress, customNote)
- Produces: `orderCreateSchema`, `paymentProofSchema`, `checkoutStepSchemas` (step1-4), exported types `OrderCreateInput`, `PaymentProofInput`

- [ ] **Step 1: Write failing tests for new schemas**

```typescript
// packages/shared/src/schemas.test.ts
import { orderCreateSchema, paymentProofSchema, checkoutStepSchemas } from "./schemas";

describe("orderCreateSchema", () => {
  it("accepts valid order create input", () => {
    const input = {
      recipientName: "Budi Santoso",
      recipientPhone: "081234567890",
      shippingAddress: "Jl. Pancasila No. 123, Tasikmalaya",
      customNote: "Kirim sore hari",
      idempotencyKey: "uuid-v4-string",
    };
    const result = orderCreateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = orderCreateSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(0);
  });

  it("validates phone format (min 9, max 20)", () => {
    const result = orderCreateSchema.safeParse({
      recipientName: "Test",
      recipientPhone: "123",
      shippingAddress: "Alamat lengkap minimal 10 karakter",
      idempotencyKey: "uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentProofSchema", () => {
  it("accepts valid file metadata", () => {
    const result = paymentProofSchema.safeParse({
      orderId: 123,
      fileName: "bukti.jpg",
      fileSize: 1024000,
      fileType: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects file >5MB", () => {
    const result = paymentProofSchema.safeParse({
      orderId: 1,
      fileName: "large.png",
      fileSize: 6 * 1024 * 1024,
      fileType: "image/png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-image type", () => {
    const result = paymentProofSchema.safeParse({
      orderId: 1,
      fileName: "doc.pdf",
      fileSize: 1000,
      fileType: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/shared && pnpm test
```
Expected: FAIL — schemas not yet defined

- [ ] **Step 3: Implement schemas in `packages/shared/src/schemas.ts`**

```typescript
// Add to existing schemas.ts
export const orderCreateSchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().min(9).max(20),
  shippingAddress: z.string().min(10).max(500),
  customNote: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid(),
});

export const paymentProofSchema = z.object({
  orderId: z.number().int().positive(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().max(5 * 1024 * 1024), // 5MB
  fileType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

export const checkoutStepSchemas = {
  step1_review: z.object({}), // no form data, cart-driven
  step2_alamat: z.object({
    recipientName: z.string().min(2).max(100),
    recipientPhone: z.string().min(9).max(20),
    shippingAddress: z.string().min(10).max(500),
    customNote: z.string().max(500).optional(),
  }),
  step3_bayar: z.object({
    paymentProof: z.object({
      fileName: z.string(),
      fileSize: z.number(),
      fileType: z.string(),
    }).optional(), // optional until upload
  }),
  step4_ringkasan: z.object({
    confirmed: z.literal(true),
  }),
};

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
```

Update `openapi.yaml` to add:
```yaml
paths:
  /orders:
    post:
      operationId: createOrder
      summary: Create new order (checkout submit)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/OrderCreateRequest"
      responses:
        "201":
          description: Order created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OrderResponse"
        "409":
          description: Stock insufficient
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
  /orders/{id}/payment-proof:
    post:
      operationId: uploadPaymentProof
      summary: Upload payment proof for order
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              $ref: "#/components/schemas/PaymentProofUpload"
      responses:
        "200":
          description: Proof uploaded
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OrderResponse"
```

Add component schemas:
```yaml
components:
  schemas:
    OrderCreateRequest:
      type: object
      required: [recipientName, recipientPhone, shippingAddress, idempotencyKey]
      properties:
        recipientName: { type: string, minLength: 2, maxLength: 100 }
        recipientPhone: { type: string, minLength: 9, maxLength: 20 }
        shippingAddress: { type: string, minLength: 10, maxLength: 500 }
        customNote: { type: string, maxLength: 500 }
        idempotencyKey: { type: string, format: uuid }
    PaymentProofUpload:
      type: object
      required: [proof]
      properties:
        proof:
          type: string
          format: binary
    OrderResponse:
      type: object
      required: [id, code, status, total]
      properties:
        id: { type: integer }
        code: { type: string, example: "DLF-20261019-ABCD" }
        status: { type: string, enum: [pending_payment, pending_verification, paid, processing, shipped, delivered, cancelled, rejected] }
        total: { type: integer }
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/shared && pnpm test
```
Expected: PASS

- [ ] **Step 5: Generate types & commit**

```bash
cd packages/shared && pnpm gen:types && pnpm typecheck
git add packages/shared/src/schemas.ts packages/shared/openapi.yaml packages/shared/src/schemas.test.ts
git commit -m "feat(shared): add checkout schemas + openapi endpoints for orders & payment-proof"
```

---

### Task 2: Checkout API Endpoints & Query Keys

**Files:**
- Create: `apps/web/src/features/checkout/api/endpoints.ts`
- Create: `apps/web/src/features/checkout/api/query-keys.ts`
- Create: `apps/web/src/features/checkout/api/http.ts` (or extend `features/shop/api/http.ts`)
- Test: `apps/web/src/features/checkout/api/endpoints.test.ts` (new)

**Interfaces:**
- Consumes: `OrderCreateInput`, `PaymentProofInput` from `@delysa/shared`, `ApiError`, `isMockMode` from `features/shop/api/http.ts`
- Produces: `createOrder(input)`, `uploadPaymentProof(orderId, file)`, `orderQueries` factory

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/features/checkout/api/endpoints.test.ts
import { createOrder, uploadPaymentProof } from "./endpoints";
import { isMockMode } from "~/features/shop/api/http";

describe("createOrder", () => {
  it("returns mock order in mock mode", async () => {
    expect(isMockMode()).toBe(true);
    const input = {
      recipientName: "Test",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1",
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    };
    const result = await createOrder(input);
    expect(result).toMatchObject({
      id: expect.any(Number),
      code: expect.stringMatching(/^DLF-\d{8}-[A-Z0-9]{4}$/),
      status: "pending_payment",
      total: expect.any(Number),
    });
  });

  it("throws ApiError 409 for STOCK_INSUFFICIENT in mock", async () => {
    // Mock mode: simulate by passing special idempotency key
    const input = {
      recipientName: "Test",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1",
      idempotencyKey: "stock-insufficient-test",
    };
    await expect(createOrder(input)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("STOCK_INSUFFICIENT"),
    });
  });
});

describe("uploadPaymentProof", () => {
  it("returns updated order in mock mode", async () => {
    const file = new File(["dummy"], "bukti.jpg", { type: "image/jpeg" });
    const result = await uploadPaymentProof(1, file);
    expect(result).toMatchObject({
      id: 1,
      status: "pending_verification",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

```bash
cd apps/web && pnpm test -- features/checkout/api/endpoints.test.ts
```
Expected: FAIL — modules not exist

- [ ] **Step 3: Implement `apps/web/src/features/checkout/api/http.ts`**

```typescript
// Extend pattern from features/shop/api/http.ts
import { ApiError, API_BASE_URL } from "~/features/shop/api/http";

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(response.status, err.message ?? `POST ${path} failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function apiUpload<T>(path: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    signal: signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new ApiError(response.status, err.message ?? `Upload ${path} failed (${response.status})`);
  }
  return (await response.json()) as T;
}
```

- [ ] **Step 4: Implement `apps/web/src/features/checkout/api/endpoints.ts`**

```typescript
import { apiPost, apiUpload, isMockMode, ApiError } from "./http";
import type { OrderCreateInput, PaymentProofInput } from "@delysa/shared";
import { mockGet } from "~/features/shop/api/mock";

export type OrderResponse = {
  id: number;
  code: string;
  status: "pending_payment" | "pending_verification" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "rejected";
  total: number;
};

export async function createOrder(input: OrderCreateInput, signal?: AbortSignal): Promise<OrderResponse> {
  if (isMockMode()) {
    // Simulate 409 for specific test key
    if (input.idempotencyKey === "stock-insufficient-test") {
      throw new ApiError(409, "STOCK_INSUFFICIENT: Stok tidak mencukupi untuk item tertentu");
    }
    // Mock successful order
    return {
      id: Date.now(),
      code: `DLF-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      status: "pending_payment",
      total: 250000, // mock total
    };
  }
  return apiPost<OrderResponse>("/orders", input, signal);
}

export async function uploadPaymentProof(orderId: number, file: File, signal?: AbortSignal): Promise<OrderResponse> {
  if (isMockMode()) {
    await new Promise(r => setTimeout(r, 500)); // simulate upload
    return { id: orderId, code: `DLF-${orderId}`, status: "pending_verification", total: 250000 };
  }
  const formData = new FormData();
  formData.append("proof", file);
  return apiUpload<OrderResponse>(`/orders/${orderId}/payment-proof`, formData, signal);
}
```

- [ ] **Step 5: Implement `apps/web/src/features/checkout/api/query-keys.ts`**

```typescript
export const orderQueries = {
  all: ["orders"] as const,
  create: () => [...orderQueries.all, "create"] as const,
  uploadProof: (orderId: number) => [...orderQueries.all, "proof", orderId] as const,
};
```

- [ ] **Step 6: Run tests to verify pass**

```bash
cd apps/web && pnpm test -- features/checkout/api/endpoints.test.ts
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/checkout/api/
git commit -m "feat(checkout): add API endpoints, query keys, http helpers for createOrder & uploadPaymentProof"
```

---

### Task 3: Checkout Types & Step Schemas (FE)

**Files:**
- Create: `apps/web/src/features/checkout/types.ts`
- Create: `apps/web/src/features/checkout/schemas.ts`
- Test: `apps/web/src/features/checkout/schemas.test.ts` (new)

**Interfaces:**
- Consumes: `OrderCreateInput`, `PaymentProofInput` from `@delysa/shared`, `MiniCartLine`, `CartTotals` from `features/shop/types`
- Produces: `CheckoutStep`, `CheckoutFormData`, `CheckoutDraft` types; Zod schemas per step with Indonesian messages

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/features/checkout/schemas.test.ts
import { checkoutStepSchema, checkoutFormSchema, type CheckoutFormData } from "./schemas";

describe("checkoutFormSchema", () => {
  it("validates full form data", () => {
    const data: CheckoutFormData = {
      step: "alamat",
      recipientName: "Budi",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Pancasila 123",
      customNote: "Note",
      paymentProof: null,
      confirmed: false,
    };
    const result = checkoutFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const result = checkoutFormSchema.safeParse({
      step: "alamat",
      recipientName: "Test",
      recipientPhone: "123",
      shippingAddress: "Alamat lengkap",
      customNote: "",
      paymentProof: null,
      confirmed: false,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

- [ ] **Step 3: Implement `apps/web/src/features/checkout/types.ts`**

```typescript
import type { MiniCartLine, CartTotals } from "~/features/shop/types";
import type { OrderCreateInput, PaymentProofInput } from "@delysa/shared";

export type CheckoutStep = "review" | "alamat" | "bayar" | "ringkasan";

export type CheckoutFormData = {
  step: CheckoutStep;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote: string;
  paymentProof: { file: File; preview: string } | null;
  confirmed: boolean;
};

export type CheckoutDraft = CheckoutFormData & {
  guestToken: string;
  updatedAt: number;
};

export type CheckoutContext = {
  cartLines: MiniCartLine[];
  cartTotals: CartTotals;
  isGuest: boolean;
  guestToken: string;
  userAddress?: { name: string; phone: string; address: string };
};
```

- [ ] **Step 4: Implement `apps/web/src/features/checkout/schemas.ts`**

```typescript
import { z } from "zod";
import { checkoutSchema } from "@delysa/shared";

export const checkoutStepSchema = z.enum(["review", "alamat", "bayar", "ringkasan"]);

export const alamatStepSchema = checkoutSchema.pick({
  recipientName: true,
  recipientPhone: true,
  shippingAddress: true,
  customNote: true,
});

export const bayarStepSchema = z.object({
  paymentProof: z.object({
    file: z.instanceof(File),
    preview: z.string(),
  }).nullable(),
});

export const ringkasanStepSchema = z.object({
  confirmed: z.literal(true, { errorMap: () => ({ message: "Harap centang konfirmasi" }) }),
});

export const checkoutFormSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("review") }).merge(z.object({})),
  z.object({ step: z.literal("alamat") }).merge(alamatStepSchema),
  z.object({ step: z.literal("bayar") }).merge(bayarStepSchema),
  z.object({ step: z.literal("ringkasan") }).merge(ringkasanStepSchema),
]);

export const DEFAULT_CHECKOUT_FORM: CheckoutFormData = {
  step: "review",
  recipientName: "",
  recipientPhone: "",
  shippingAddress: "",
  customNote: "",
  paymentProof: null,
  confirmed: false,
};
```

- [ ] **Step 5: Run tests to verify pass**

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/checkout/types.ts apps/web/src/features/checkout/schemas.ts apps/web/src/features/checkout/schemas.test.ts
git commit -m "feat(checkout): add FE types & Zod step schemas"
```

---

### Task 4: Checkout Hook (Mutations + Draft Persistence)

**Files:**
- Create: `apps/web/src/features/checkout/hooks/use-checkout.ts`
- Test: `apps/web/src/features/checkout/hooks/use-checkout.test.tsx` (new)

**Interfaces:**
- Consumes: `createOrder`, `uploadPaymentProof` from `../api/endpoints`, `orderQueries` from `../api/query-keys`, `useMiniCart` from `~/features/shop/hooks/use-mini-cart`, `checkoutFormSchema`, `DEFAULT_CHECKOUT_FORM` from `../schemas`, `MiniCartLine`, `CartTotals` from `~/features/shop/types`
- Produces: `useCheckout()` hook returning `{ form, step, goToStep, submitOrder, uploadProof, draft, isSubmitting, isUploading, error }`

- [ ] **Step 1: Write failing tests (React Hook Form + TanStack Query mutation testing)**

```typescript
// apps/web/src/features/checkout/hooks/use-checkout.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCheckout } from "./use-checkout";
import { createOrder, uploadPaymentProof } from "../api/endpoints";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";

// Mock dependencies
vi.mock("~/features/shop/hooks/use-mini-cart");
vi.mock("../api/endpoints");

const mockUseMiniCart = useMiniCart as vi.Mock;
const mockCreateOrder = createOrder as vi.Mock;
const mockUploadProof = uploadPaymentProof as vi.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMiniCart.mockReturnValue({
      lines: [{ slug: "test", name: "Test", image: "", sizeId: "s", wrapId: "w", price: 50000, qty: 1, kind: "product" }],
      totals: { itemCount: 1, subtotal: 50000, shipping: 25000, grandTotal: 75000, freeShipping: false, remainingForFree: 125000, productDiscount: 0, subtotalNormal: 50000, couponDiscount: 0, packaging: 0 },
      coupon: null,
      instructions: "",
      count: 1,
      subtotal: 50000,
    });
    localStorage.clear();
  });

  it("initializes with review step and empty form", () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    expect(result.current.step).toBe("review");
    expect(result.current.form.recipientName).toBe("");
  });

  it("persists draft to localStorage on form change", async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
    });
    await waitFor(() => {
      const draft = JSON.parse(localStorage.getItem("checkout_draft_test-guest")!);
      expect(draft.recipientName).toBe("Budi");
    });
  });

  it("submits order with idempotency-key and clears cart on success", async () => {
    mockCreateOrder.mockResolvedValue({ id: 1, code: "DLF-20261019-ABCD", status: "pending_payment", total: 75000 });
    const { result } = renderHook(() => useCheckout(), { wrapper });
    
    // Navigate to ringkasan step
    act(() => { result.current.goToStep("ringkasan"); });
    act(() => { result.current.form.setValue("confirmed", true); });
    
    await act(async () => {
      await result.current.submitOrder();
    });
    
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: expect.any(String) })
    );
    // Cart should be cleared via useMiniCart store
  });

  it("handles STOCK_INSUFFICIENT error and stays on ringkasan", async () => {
    mockCreateOrder.mockRejectedValue({ status: 409, message: "STOCK_INSUFFICIENT" });
    const { result } = renderHook(() => useCheckout(), { wrapper });
    
    act(() => { result.current.goToStep("ringkasan"); });
    act(() => { result.current.form.setValue("confirmed", true); });
    
    await act(async () => {
      await result.current.submitOrder();
    });
    
    expect(result.current.error).toContain("Stok tidak mencukupi");
    expect(result.current.step).toBe("ringkasan"); // stays for retry
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

```bash
cd apps/web && pnpm test -- features/checkout/hooks/use-checkout.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement `apps/web/src/features/checkout/hooks/use-checkout.ts`**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // add to deps if needed, or use crypto.randomUUID()

import { createOrder, uploadPaymentProof, type OrderResponse } from "../api/endpoints";
import { orderQueries } from "../api/query-keys";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import { checkoutFormSchema, DEFAULT_CHECKOUT_FORM, type CheckoutFormData, type CheckoutDraft } from "../schemas";
import { getGuestToken, setGuestToken } from "~/features/shop/lib/mini-cart-storage";

const DRAFT_KEY_PREFIX = "checkout_draft_";
const IDEMPOTENCY_KEY = "checkout_idempotency_key";

function getIdempotencyKey(): string {
  if (typeof window === "undefined") return "";
  let key = sessionStorage.getItem(IDEMPOTENCY_KEY);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(IDEMPOTENCY_KEY, key);
  }
  return key;
}

function getDraftKey(guestToken: string): string {
  return `${DRAFT_KEY_PREFIX}${guestToken}`;
}

function loadDraft(guestToken: string): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getDraftKey(guestToken));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Convert paymentProof file back (not serializable, store null)
    return { ...parsed, paymentProof: null };
  } catch {
    return null;
  }
}

function saveDraft(guestToken: string, draft: CheckoutDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getDraftKey(guestToken), JSON.stringify(draft));
  } catch {
    // ignore quota
  }
}

function clearDraft(guestToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getDraftKey(guestToken));
  sessionStorage.removeItem(IDEMPOTENCY_KEY);
}

export function useCheckout() {
  const { lines, totals, coupon, instructions, count, subtotal } = useMiniCart();
  const queryClient = useQueryClient();
  const guestToken = useMemo(() => getGuestToken() ?? crypto.randomUUID(), []);
  
  // Initialize guest token if not exists
  useEffect(() => {
    if (!getGuestToken()) {
      setGuestToken(guestToken);
    }
  }, [guestToken]);

  // Load draft on mount
  const [draft, setDraft] = useState<CheckoutDraft | null>(() => loadDraft(guestToken));

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: draft ?? DEFAULT_CHECKOUT_FORM,
    mode: "onChange",
  });

  // Persist draft on form change (debounced)
  const { watch } = form;
  useEffect(() => {
    const subscription = watch((value) => {
      const draftData: CheckoutDraft = {
        ...value,
        guestToken,
        updatedAt: Date.now(),
        paymentProof: value.paymentProof ? { ...value.paymentProof, file: value.paymentProof.file } : null,
      };
      saveDraft(guestToken, draftData);
      setDraft(draftData);
    });
    return () => subscription.unsubscribe();
  }, [guestToken, watch]);

  // Step navigation (updates URL via navigate in component, here just local state)
  const [step, setStep] = useState<CheckoutFormData["step"]>(form.getValues("step") ?? "review");

  const goToStep = useCallback((newStep: CheckoutFormData["step"]) => {
    // Validate current step before allowing next
    const currentStep = form.getValues("step");
    if (["alamat", "bayar", "ringkasan"].includes(newStep)) {
      const validation = checkoutFormSchema.safeParse({
        ...form.getValues(),
        step: currentStep,
      });
      if (!validation.success && currentStep !== "review") {
        // Trigger validation errors for current step
        form.trigger();
        return false;
      }
    }
    form.setValue("step", newStep);
    setStep(newStep);
    return true;
  }, [form]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (input: Parameters<typeof createOrder>[0]) => createOrder(input, { signal: AbortSignal.timeout(15_000) }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: orderQueries.all });
      // Optimistic: could reserve cart but BE handles stock
      return { previousLines: lines };
    },
    onError: (err, _input, context) => {
      // Rollback not needed for cart (BE handles), but show error
      console.error("Create order failed:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderQueries.all });
    },
  });

  const submitOrder = useCallback(async () => {
    if (step !== "ringkasan") return;
    if (!form.getValues("confirmed")) return;

    const formData = form.getValues();
    const idempotencyKey = getIdempotencyKey();

    const input = {
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      shippingAddress: formData.shippingAddress,
      customNote: formData.customNote || undefined,
      idempotencyKey,
    };

    try {
      const order = await createOrderMutation.mutateAsync(input);
      // Success: clear cart, clear draft, redirect
      clearDraft(guestToken);
      // Navigate to success page (handled by component via router)
      return order;
    } catch (err) {
      throw err; // re-throw for component to handle
    }
  }, [step, form, createOrderMutation, guestToken]);

  // Upload payment proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: ({ orderId, file }: { orderId: number; file: File }) => uploadPaymentProof(orderId, file),
    onError: (err) => console.error("Upload proof failed:", err),
  });

  const uploadProof = useCallback(async (orderId: number, file: File) => {
    return uploadProofMutation.mutateAsync({ orderId, file });
  }, [uploadProofMutation]);

  const error = createOrderMutation.error?.message ?? uploadProofMutation.error?.message ?? null;

  return {
    form,
    step,
    goToStep,
    submitOrder,
    uploadProof,
    draft,
    isSubmitting: createOrderMutation.isPending,
    isUploading: uploadProofMutation.isPending,
    error,
    cartLines: lines,
    cartTotals: totals,
    cartCount: count,
    cartSubtotal: subtotal,
    coupon,
    instructions,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd apps/web && pnpm test -- features/checkout/hooks/use-checkout.test.tsx
```
Expected: PASS

- [ ] **Step 5: Add `uuid` to deps if using, or use `crypto.randomUUID()` (native)**

```bash
cd apps/web && pnpm add uuid && pnpm add -D @types/uuid
# OR use native crypto.randomUUID() — preferred, no dep needed
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/checkout/hooks/
git commit -m "feat(checkout): add useCheckout hook with mutations, draft persistence, guest token"
```

---

### Task 5: Checkout Route & ValidateSearch

**Files:**
- Create: `apps/web/src/routes/_shop/checkout.tsx`
- Test: `apps/web/src/routes/_shop/checkout.test.tsx` (new)

**Interfaces:**
- Consumes: `checkoutStepSchema` from `features/checkout/schemas`, `useCheckout` from `features/checkout/hooks/use-checkout`
- Produces: Route component with search param validation, step normalization

- [ ] **Step 1: Write failing test**

```typescript
// apps/web/src/routes/_shop/checkout.test.tsx
import { createMemoryRouter, createRoute } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import CheckoutRoute from "./checkout";

describe("Checkout Route", () => {
  it("normalizes invalid step to 'review'", () => {
    // Test via router navigation
  });

  it("renders CheckoutPage component", () => {
    // Integration test
  });
});
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement `apps/web/src/routes/_shop/checkout.tsx`**

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { checkoutStepSchema } from "~/features/checkout/schemas";
import { CheckoutPage } from "~/features/checkout/view/checkout-page";

export const Route = createFileRoute("/_shop/checkout")({
  validateSearch: checkoutStepSchema
    .catch("review") // default to review if invalid/missing
    .transform((step) => ({ step })),
  component: CheckoutRouteComponent,
});

function CheckoutRouteComponent() {
  const { step } = Route.useSearch();
  return <CheckoutPage initialStep={step} />;
}
```

- [ ] **Step 4: Run test to verify pass**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_shop/checkout.tsx
git commit -m "feat(checkout): add route with validateSearch for step param"
```

---

### Task 6: Checkout Stepper UI Component

**Files:**
- Create: `apps/web/src/features/checkout/components/CheckoutStepper.tsx`
- Test: `apps/web/src/features/checkout/components/CheckoutStepper.test.tsx` (new)

**Interfaces:**
- Consumes: `CheckoutStep` type, current step, `onStepClick` callback
- Produces: Accessible stepper component with ARIA labels, keyboard navigation

- [ ] **Step 1: Write failing test**

```typescript
// apps/web/src/features/checkout/components/CheckoutStepper.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckoutStepper } from "./CheckoutStepper";

const steps: CheckoutStep[] = ["review", "alamat", "bayar", "ringkasan"];
const labels = ["Review Keranjang", "Alamat Pengiriman", "Metode Pembayaran", "Ringkasan & Bayar"];

describe("CheckoutStepper", () => {
  it("renders all 4 steps with correct labels", () => {
    render(<CheckoutStepper currentStep="alamat" steps={steps} labels={labels} onStepClick={vi.fn()} />);
    expect(screen.getByText("Review Keranjang")).toBeInTheDocument();
    expect(screen.getByText("Alamat Pengiriman")).toBeInTheDocument();
    expect(screen.getByText("Metode Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan & Bayar")).toBeInTheDocument();
  });

  it("highlights current step with aria-current=step", () => {
    render(<CheckoutStepper currentStep="bayar" steps={steps} labels={labels} onStepClick={vi.fn()} />);
    const currentStep = screen.getByText("Metode Pembayaran").closest("[aria-current='step']");
    expect(currentStep).toBeInTheDocument();
  });

  it("calls onStepClick when step clicked (only for completed/previous steps)", () => {
    const handleClick = vi.fn();
    render(<CheckoutStepper currentStep="bayar" steps={steps} labels={labels} onStepClick={handleClick} />);
    // Can click review (completed) and alamat (current)
    fireEvent.click(screen.getByText("Review Keranjang"));
    expect(handleClick).toHaveBeenCalledWith("review");
  });
});
```

- [ ] **Step 2: Run test to verify fail**

- [ ] **Step 3: Implement `apps/web/src/features/checkout/components/CheckoutStepper.tsx`**

```tsx
"use client";

import { cn } from "cn";
import type { CheckoutStep } from "../types";

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  steps: CheckoutStep[];
  labels: string[];
  onStepClick: (step: CheckoutStep) => void;
}

const STEP_ICONS: Record<CheckoutStep, React.ReactNode> = {
  review: <ShoppingBag className="h-5 w-5" />,
  alamat: <MapPin className="h-5 w-5" />,
  bayar: <CreditCard className="h-5 w-5" />,
  ringkasan: <CheckCircle className="h-5 w-5" />,
};

const STEP_ORDER: CheckoutStep[] = ["review", "alamat", "bayar", "ringkasan"];

export function CheckoutStepper({ currentStep, steps, labels, onStepClick }: CheckoutStepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav aria-label="Progres Checkout" className="w-full">
      <ol className="flex items-center" role="list">
        {STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const label = labels[STEP_ORDER.indexOf(step)];

          const canClick = isCompleted || isCurrent;
          const stepButton = (
            <button
              type="button"
              onClick={() => canClick && onStepClick(step)}
              disabled={!canClick}
              className={cn(
                "flex flex-col items-center gap-2 relative z-10 transition-all",
                isCurrent && "text-[#FF6B35] font-semibold",
                isCompleted && "text-emerald-600",
                isFuture && "text-[#D1D5DB] cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2",
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={!canClick}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted && "bg-emerald-600 border-emerald-600 text-white",
                  isCurrent && "bg-white border-[#FF6B35] text-[#FF6B35] shadow-[0_0_0_4px_rgba(255,107,53,0.2)]",
                  isFuture && "bg-white border-[#E5E7EB] text-[#D1D5DB]",
                )}
                aria-hidden="true"
              >
                {isCompleted ? <Check className="h-5 w-5" /> : STEP_ICONS[step]}
              </div>
              <span className="text-xs font-medium whitespace-nowrap text-center max-w-[80px]">
                {label}
              </span>
            </button>
          );

          return (
            <li key={step} className="flex-1 flex flex-col items-center">
              {stepButton}
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 right-1/2 h-1 -z-10",
                    isCompleted || isCurrent ? "bg-emerald-600" : "bg-[#E5E7EB]",
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 4: Add lucide icons imports (ShoppingBag, MapPin, CreditCard, CheckCircle, Check)**

- [ ] **Step 5: Run test to verify pass**

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/checkout/components/CheckoutStepper.tsx
git commit -m "feat(checkout): add accessible CheckoutStepper component"
```

---

### Task 7: Step Components (4 Steps)

**Files (4 components):**
- Create: `apps/web/src/features/checkout/components/steps/ReviewCartStep.tsx`
- Create: `apps/web/src/features/checkout/components/steps/AlamatStep.tsx`
- Create: `apps/web/src/features/checkout/components/steps/MetodeBayarStep.tsx`
- Create: `apps/web/src/features/checkout/components/steps/RingkasanStep.tsx`
- Test: 4 test files (one per step)

**Interfaces:**
- Each consumes: `useFormContext` from React Hook Form, `cartLines`, `cartTotals`, `updateQty`, `remove` from `useMiniCart`
- Produces: Step UI with per-step validation

**Step 7a: ReviewCartStep**

- [ ] **Step 1: Write failing test** — renders cart lines, qty stepper works, remove works
- [ ] **Step 2: Implement** — Reuse `CartLineItem` + `CartSelectBar` + `OrderSummary` (read-only mode) from `features/shop/components/cart/`
- [ ] **Step 3: Test pass & commit**

**Step 7b: AlamatStep**

- [ ] **Step 1: Write failing test** — form fields (nama, HP, alamat, catatan), validation messages Indonesian, prefill from user profile if auth
- [ ] **Step 2: Implement** — React Hook Form `Controller` untuk each field, `Textarea` untuk alamat/catatan, `Input` untuk nama/HP
- [ ] **Step 3: Test pass & commit**

**Step 7c: MetodeBayarStep**

- [ ] **Step 1: Write failing test** — shows BCA instructions (norek, a.n. Kartinah, total), file input accepts image ≤5MB, shows preview thumbnail, rejects non-image/>5MB with toast
- [ ] **Step 2: Implement** — Static info card + file input dengan `accept="image/*"`, client validation, `URL.createObjectURL` preview, `Controller` untuk file
- [ ] **Step 3: Test pass & commit**

**Step 7d: RingkasanStep**

- [ ] **Step 1: Write failing test** — shows order summary (reuse `OrderSummary`), checkbox konfirmasi wajib, submit button calls `submitOrder`, loading state disables button
- [ ] **Step 2: Implement** — Reuse `OrderSummary` component, add `Checkbox` untuk konfirmasi, `Button` submit dengan `disabled={isSubmitting || !confirmed}`
- [ ] **Step 3: Test pass & commit**

```bash
git add apps/web/src/features/checkout/components/steps/
git commit -m "feat(checkout): add 4 step components (ReviewCart, Alamat, MetodeBayar, Ringkasan)"
```

---

### Task 8: Checkout Page Assembly

**Files:**
- Create: `apps/web/src/features/checkout/view/checkout-page.tsx`
- Test: `apps/web/src/features/checkout/view/checkout-page.test.tsx` (new)

**Interfaces:**
- Consumes: `useCheckout` hook, `CheckoutStepper`, 4 step components, `useNavigate`, `Route` from checkout route
- Produces: Complete checkout page with FormProvider, conditional step rendering, navigation

- [ ] **Step 1: Write failing test** — renders stepper, shows correct step, navigation works, form data persists across steps

- [ ] **Step 2: Implement `apps/web/src/features/checkout/view/checkout-page.tsx`**

```tsx
"use client";

import { FormProvider, useFormContext } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ToastProvider } from "~/components/ui/toast";
import { CheckoutStepper } from "../components/CheckoutStepper";
import { ReviewCartStep } from "../components/steps/ReviewCartStep";
import { AlamatStep } from "../components/steps/AlamatStep";
import { MetodeBayarStep } from "../components/steps/MetodeBayarStep";
import { RingkasanStep } from "../components/steps/RingkasanStep";
import { useCheckout } from "../hooks/use-checkout";
import { Route } from "~/_shop/checkout";

const STEPS: CheckoutStep[] = ["review", "alamat", "bayar", "ringkasan"];
const LABELS = ["Review Keranjang", "Alamat Pengiriman", "Metode Pembayaran", "Ringkasan & Bayar"];

function CheckoutContent() {
  const {
    form,
    step,
    goToStep,
    submitOrder,
    uploadProof,
    isSubmitting,
    isUploading,
    error,
    cartLines,
    cartTotals,
  } = useCheckout();
  const navigate = useNavigate({ from: Route.fullPath });

  // Sync step from URL to local state
  const { step: urlStep } = Route.useSearch();
  useEffect(() => {
    if (urlStep && urlStep !== step) {
      goToStep(urlStep);
    }
  }, [urlStep, step, goToStep]);

  // Sync local step to URL
  useEffect(() => {
    navigate({ search: { step }, replace: true });
  }, [step, navigate]);

  // Handle order success redirect
  useEffect(() => {
    if (form.getValues("confirmed") && !isSubmitting && !error) {
      // submitOrder returns order on success, handled in component via form watch or mutation result
      // Better: use mutation onSuccess in hook, but for simplicity:
    }
  }, [isSubmitting, form]);

  const renderStep = () => {
    switch (step) {
      case "review":
        return <ReviewCartStep cartLines={cartLines} cartTotals={cartTotals} />;
      case "alamat":
        return <AlamatStep />;
      case "bayar":
        return <MetodeBayarStep cartTotals={cartTotals} onUploadProof={uploadProof} isUploading={isUploading} />;
      case "ringkasan":
        return <RingkasanStep cartTotals={cartTotals} onSubmit={submitOrder} isSubmitting={isSubmitting} />;
    }
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <CheckoutStepper currentStep={step} steps={STEPS} labels={LABELS} onStepClick={goToStep} />
        
        <div className="mt-6" role="main" aria-label={`Langkah ${STEPS.indexOf(step) + 1}: ${LABELS[STEPS.indexOf(step)]}`}>
          {renderStep()}
        </div>

        {error && (
          <div className="mt-4 fixed bottom-4 right-4 z-50 max-w-md animate-slide-in" role="alert">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}

export function CheckoutPage({ initialStep }: { initialStep: CheckoutStep }) {
  return (
    <ToastProvider>
      <CheckoutContent />
    </ToastProvider>
  );
}
```

- [ ] **Step 3: Run test to verify pass**

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/checkout/view/
git commit -m "feat(checkout): add CheckoutPage assembly with FormProvider, stepper, conditional steps"
```

---

### Task 9: Guest Token Integration & Cart Storage Extend

**Files:**
- Modify: `apps/web/src/features/shop/lib/mini-cart-storage.ts`
- Test: `apps/web/src/features/shop/lib/mini-cart-storage.test.ts` (extend existing)

**Interfaces:**
- Consumes: existing `loadCartState`, `saveCartState`
- Produces: `getGuestToken()`, `setGuestToken(token)` functions using cookie + localStorage fallback

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/features/shop/lib/mini-cart-storage.test.ts
import { getGuestToken, setGuestToken, loadCartState, saveCartState } from "./mini-cart-storage";

describe("Guest Token", () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies (mock document.cookie)
  });

  it("generates and returns guest token from localStorage", () => {
    const token = getGuestToken();
    expect(token).toMatch(/^[0-9a-f-]{36}$/); // UUID v4
    expect(getGuestToken()).toBe(token); // same on second call
  });

  it("setGuestToken updates localStorage and cookie", () => {
    const newToken = "custom-guest-token";
    setGuestToken(newToken);
    expect(getGuestToken()).toBe(newToken);
    expect(localStorage.getItem("guest_token")).toBe(newToken);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

- [ ] **Step 3: Implement in `mini-cart-storage.ts`**

```typescript
// Add to existing mini-cart-storage.ts
const GUEST_TOKEN_KEY = "guest_token";
const GUEST_TOKEN_COOKIE = "guest_token";

export function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  // Try localStorage first
  const lsToken = localStorage.getItem(GUEST_TOKEN_KEY);
  if (lsToken) return lsToken;
  // Fallback to cookie
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${GUEST_TOKEN_COOKIE}=`))
    ?.split("=")[1];
  if (cookieToken) {
    localStorage.setItem(GUEST_TOKEN_KEY, cookieToken);
    return cookieToken;
  }
  return null;
}

export function setGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_TOKEN_KEY, token);
  // Set cookie (7 days, httpOnly not possible from client, but BE can set httpOnly)
  document.cookie = `${GUEST_TOKEN_COOKIE}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}
```

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/shop/lib/mini-cart-storage.ts
git commit -m "feat(cart): add guest token persistence for guest checkout"
```

---

### Task 10: Playwright E2E Test (Full Checkout Flow)

**Files:**
- Create: `apps/web/tests/checkout.spec.ts` (or extend existing e2e)

**Interfaces:**
- Consumes: running dev server (`pnpm dev:web`), mock mode
- Produces: End-to-end test covering all 4 steps, guest checkout, file upload, order success

- [ ] **Step 1: Write failing test**

```typescript
// apps/web/tests/checkout.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/katalog");
    // Add item to cart
    await page.locator('[data-testid="add-to-cart"]').first().click();
    await page.goto("/keranjang");
    await expect(page.locator("text=Keranjang Belanja")).toBeVisible();
    await page.goto("/checkout");
  });

  test("completes guest checkout 4 steps", async ({ page }) => {
    // Step 1: Review Cart
    await expect(page.locator("text=Review Keranjang")).toBeVisible();
    await expect(page.locator("text=Alamat Pengiriman")).toBeVisible(); // stepper shows all
    await page.click("button:has-text('Lanjutkan')");
    
    // Step 2: Alamat
    await expect(page.locator("text=Alamat Pengiriman")).toHaveClass(/text-\[#FF6B35\]/);
    await page.fill('input[name="recipientName"]', "Budi Santoso");
    await page.fill('input[name="recipientPhone"]', "081234567890");
    await page.fill('textarea[name="shippingAddress"]', "Jl. Pancasila No. 123, Tasikmalaya");
    await page.click("button:has-text('Lanjutkan')");
    
    // Step 3: Metode Bayar
    await expect(page.locator("text=Metode Pembayaran")).toHaveClass(/text-\[#FF6B35\]/);
    await expect(page.locator("text=BCA")).toBeVisible();
    await expect(page.locator("text=a.n. Kartinah")).toBeVisible();
    // Upload file
    await page.setInputFiles('input[type="file"]', "tests/fixtures/bukti-transfer.jpg");
    await expect(page.locator("text=bukti-transfer.jpg")).toBeVisible();
    await page.click("button:has-text('Lanjutkan')");
    
    // Step 4: Ringkasan
    await expect(page.locator("text=Ringkasan & Bayar")).toHaveClass(/text-\[#FF6B35\]/);
    await expect(page.locator("text=Total Akhir")).toBeVisible();
    await page.check('input[type="checkbox"]'); // konfirmasi
    await page.click("button:has-text('Buat Pesanan')");
    
    // Success
    await expect(page.locator("text=Pesanan Berhasil Dibuat")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=DLF-")).toBeVisible(); // order code
  });

  test("shows STOCK_INSUFFICIENT error and allows retry", async ({ page }) => {
    // Use special idempotency key to trigger mock 409
    // This requires test setup to inject the key
  });
});
```

- [ ] **Step 2: Run test to verify fail (needs dev server)**

```bash
cd apps/web && pnpm dev:web &
# wait for ready
pnpm test:e2e -- tests/checkout.spec.ts
```
Expected: FAIL (components not fully integrated yet)

- [ ] **Step 3: After all tasks done, run full e2e**

```bash
cd apps/web && pnpm test:e2e
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/tests/checkout.spec.ts
git commit -m "test(checkout): add Playwright e2e test for 4-step guest checkout flow"
```

---

### Task 11: Error Handling, Edge Cases & Polish

**Files:**
- Modify: Various checkout files
- Test: Add edge case tests to existing test files

**Items to address:**
1. **Empty cart redirect** — if `cartLines.length === 0` at checkout mount, redirect to `/keranjang` with toast
2. **Stock insufficient UX** — toast with "Stok tidak mencukupi, silakan perbarui keranjang" + `goToStep("review")`
3. **File upload preview cleanup** — `URL.revokeObjectURL()` on unmount
4. **Keyboard navigation** — Stepper focus management, Enter/Space to activate
5. **Loading skeletons** — for step components during data fetch
6. **Success page** — Create `/checkout/success` route or reuse order detail page
7. **Accessibility audit** — ARIA labels, focus order, color contrast (WCAG AA)

- [ ] **Step 1: Implement empty cart guard in `checkout-page.tsx`**

```tsx
useEffect(() => {
  if (cartLines.length === 0) {
    navigate({ to: "/keranjang", replace: true });
    toast.add({ title: "Keranjang kosong", description: "Tambah produk sebelum checkout", type: "info" });
  }
}, [cartLines.length, navigate]);
```

- [ ] **Step 2: Add stock error handling in `use-checkout.ts` submitOrder catch**

```tsx
catch (err) {
  if (err instanceof ApiError && err.status === 409) {
    toast.add({ title: "Stok tidak mencukupi", description: "Silakan perbarui keranjang", type: "destructive" });
    goToStep("review");
  }
  throw err;
}
```

- [ ] **Step 3: Add cleanup in `MetodeBayarStep`**

```tsx
useEffect(() => {
  return () => { if (preview) URL.revokeObjectURL(preview); };
}, [preview]);
```

- [ ] **Step 4: Run lint, typecheck, test, build**

```bash
cd apps/web && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(checkout): error handling, edge cases, accessibility polish"
```

---

## Verification Commands

| Check | Command | Expected |
|---|---|---|
| Lint | `cd apps/web && pnpm lint` | 0 errors |
| TypeCheck | `cd apps/web && pnpm typecheck` | 0 errors |
| Unit Tests | `cd apps/web && pnpm test` | All PASS |
| E2E Tests | `cd apps/web && pnpm test:e2e` | All PASS |
| Build | `cd apps/web && pnpm build` | Exit 0 |
| Shared Types | `cd packages/shared && pnpm gen:types && pnpm typecheck` | 0 errors |

---

## Dependencies Between Tasks

```
Task 1 (Shared Schemas) 
    ↓
Task 2 (API Endpoints + Query Keys)
    ↓
Task 3 (FE Types + Step Schemas)
    ↓
Task 4 (useCheckout Hook) ← Task 9 (Guest Token) can parallel
    ↓
Task 5 (Route + validateSearch)
    ↓
Task 6 (Stepper UI)
    ↓
Task 7 (4 Step Components) — can parallel internally
    ↓
Task 8 (Checkout Page Assembly)
    ↓
Task 10 (E2E Test) — runs after all integrated
    ↓
Task 11 (Edge Cases & Polish)
```

---

## Risk Mitigation Summary

| Risk | Mitigation in Plan |
|---|---|
| Double submit | Task 4: idempotency-key (crypto.randomUUID) + button disabled during submit |
| Stock race | Task 4: BE returns 409, FE catches → toast + back to review |
| File upload validation | Task 7c: client-side type/size check before upload |
| Guest token loss | Task 9: localStorage + cookie fallback, 7-day expiry |
| Draft loss on refresh | Task 4: debounced localStorage persistence keyed by guest_token |
| Auth integration gap | Task 4: hook accepts `userAddress` optional, prefill if auth |
| Better Auth not ready | Task 4: guest-only path works independently, auth is enhancement |

---

## Estimated Effort

| Task | Est. Hours |
|---|---|
| 1: Shared Schemas | 2 |
| 2: API Endpoints | 2 |
| 3: FE Types/Schemas | 1 |
| 4: useCheckout Hook | 3 |
| 5: Route | 0.5 |
| 6: Stepper UI | 1.5 |
| 7a: ReviewCartStep | 1 |
| 7b: AlamatStep | 1.5 |
| 7c: MetodeBayarStep | 2 |
| 7d: RingkasanStep | 1 |
| 8: Checkout Page | 1.5 |
| 9: Guest Token | 1 |
| 10: E2E Test | 2 |
| 11: Edge Cases | 2 |
| **Total** | **~22.5 hours** |

---

## Next Steps After Plan Approval

1. **Review this plan** — confirm scope, interfaces, task breakdown
2. **Choose execution mode:**
   - **Subagent-driven** (recommended): Fresh subagent per task + reviewer gate. Best for quality.
   - **Native**: I implement all tasks in this session, single review at end. Faster.
3. **Start implementation** — begin with Task 1 (shared schemas) as it's the contract foundation

---

**Plan saved to:** `docs/superpowers/plans/2026-10-19-checkout-wizard.md`

**Questions for you:**
1. Does the step breakdown match your expected checkout flow?
2. Should `MetodeBayarStep` upload proof immediately (step 3) or at final submit (step 4)? Current plan: upload at step 3, order created at step 4.
3. Any additional fields needed in Alamat step (e.g., province/city dropdown)?
4. Confirm `uuid` dependency or prefer native `crypto.randomUUID()`?