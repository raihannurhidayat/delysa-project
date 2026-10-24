"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createOrder, type OrderResponse } from "../api/endpoints";
import { ApiError } from "../api/http";
import { orderQueries } from "../api/query-keys";
import { buildOrderRecord } from "../lib/order-record";
import { saveOrder } from "~/features/shop/lib/order-store";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import {
  checkoutFormSchema,
  DEFAULT_CHECKOUT_FORM,
  type CheckoutFormData,
} from "../schemas";
import {
  CHECKOUT_STEPS,
  isPaymentMethod,
  type CheckoutDraft,
  type CheckoutStep,
  type PaymentMethod,
} from "../types";
import {
  getGuestToken,
  setGuestToken,
} from "~/features/shop/lib/mini-cart-storage";

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
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>;
    return {
      step: parsed.step ?? "review",
      recipientName: parsed.recipientName ?? "",
      recipientPhone: parsed.recipientPhone ?? "",
      shippingAddress: parsed.shippingAddress ?? "",
      customNote: parsed.customNote ?? "",
      paymentMethod: isPaymentMethod(parsed.paymentMethod)
        ? parsed.paymentMethod
        : "",
      confirmed: parsed.confirmed ?? false,
      guestToken,
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
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

/** Ubah error mentah (termasuk 409 STOCK_INSUFFICIENT) jadi pesan ramah. */
function toFriendlyError(err: unknown): Error {
  const raw =
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  if (raw.includes("STOCK_INSUFFICIENT")) {
    return new ApiError(
      409,
      "Stok tidak mencukupi, silakan perbarui keranjang",
    );
  }
  return err instanceof Error ? err : new Error(raw);
}

export type SubmitOrderResult = {
  order: OrderResponse;
  paymentMethod: PaymentMethod | "";
};

export function useCheckout({ step }: { step: CheckoutStep }) {
  const {
    lines,
    totals,
    coupon,
    instructions,
    count,
    subtotal,
    updateQty,
    remove,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useMiniCart();
  const queryClient = useQueryClient();
  const guestToken = useMemo(() => getGuestToken() ?? crypto.randomUUID(), []);

  useEffect(() => {
    if (!getGuestToken()) {
      setGuestToken(guestToken);
    }
  }, [guestToken]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: DEFAULT_CHECKOUT_FORM,
    mode: "onChange",
  });
  const { watch, reset, setValue, getValues, trigger } = form;

  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const restoredRef = useRef(false);

  // URL adalah sumber kebenaran langkah; selaraskan dengan nilai form.
  useEffect(() => {
    setValue("step", step, { shouldValidate: false, shouldDirty: false });
  }, [step, setValue]);

  // Pulihkan draft sekali di klien (hindari mismatch hidrasi SSR).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const restored = loadDraft(guestToken);
    if (!restored) return;
    reset({
      step,
      recipientName: restored.recipientName,
      recipientPhone: restored.recipientPhone,
      shippingAddress: restored.shippingAddress,
      customNote: restored.customNote,
      paymentMethod: restored.paymentMethod,
      confirmed: false,
    });
    setDraft(restored);
  }, [guestToken, reset, step]);

  // Simpan draft (debounce 300 ms) setiap form berubah.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const subscription = watch((value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const draftData: CheckoutDraft = {
          step,
          recipientName: value.recipientName ?? "",
          recipientPhone: value.recipientPhone ?? "",
          shippingAddress: value.shippingAddress ?? "",
          customNote: value.customNote ?? "",
          paymentMethod: value.paymentMethod ?? "",
          confirmed: value.confirmed ?? false,
          guestToken,
          updatedAt: Date.now(),
        };
        saveDraft(guestToken, draftData);
        setDraft(draftData);
      }, 300);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [guestToken, step, watch]);

  /**
   * Validasi langkah saat ini sebelum maju. Navigasi tetap dilakukan
   * pemanggil (URL search param) — hook tidak menyimpan langkah lokal.
   */
  const goToStep = useCallback(
    async (nextStep: CheckoutStep): Promise<boolean> => {
      const currentIndex = CHECKOUT_STEPS.indexOf(step);
      const nextIndex = CHECKOUT_STEPS.indexOf(nextStep);
      if (nextIndex <= currentIndex) return true;

      const validation = checkoutFormSchema.safeParse({
        ...getValues(),
        step,
      });
      if (validation.success) return true;

      const fields =
        step === "alamat"
          ? ([
              "recipientName",
              "recipientPhone",
              "shippingAddress",
              "customNote",
            ] as const)
          : step === "bayar"
            ? (["paymentMethod"] as const)
            : (["confirmed"] as const);
      await trigger([...fields]);
      return false;
    },
    [getValues, step, trigger],
  );

  const createOrderMutation = useMutation({
    mutationFn: (input: Parameters<typeof createOrder>[0]) =>
      createOrder(input),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: orderQueries.all });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderQueries.all });
    },
  });

  const submitOrder = useCallback(async (): Promise<SubmitOrderResult> => {
    if (step !== "ringkasan") {
      throw new Error("Pesanan hanya bisa dibuat dari langkah ringkasan");
    }
    if (!getValues("confirmed")) {
      throw new Error("Harap centang konfirmasi pesanan");
    }

    const formData = getValues();
    const idempotencyKey = getIdempotencyKey();

    let order: OrderResponse;
    try {
      order = await createOrderMutation.mutateAsync({
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        shippingAddress: formData.shippingAddress,
        customNote: formData.customNote || undefined,
        idempotencyKey,
      });
    } catch (err) {
      throw toFriendlyError(err);
    }

    try {
      saveOrder(buildOrderRecord({ order, form: formData, lines, totals }));
    } catch {
      // Order sudah dibuat; kegagalan menyimpan riwayat demo tidak menggagalkan checkout.
    }

    clearDraft(guestToken);
    clearCart();

    return { order, paymentMethod: formData.paymentMethod };
  }, [
    clearCart,
    createOrderMutation,
    getValues,
    guestToken,
    lines,
    step,
    totals,
  ]);

  const error = useMemo(() => {
    return createOrderMutation.error
      ? toFriendlyError(createOrderMutation.error).message
      : null;
  }, [createOrderMutation.error]);

  return {
    form,
    step,
    goToStep,
    submitOrder,
    draft,
    isSubmitting: createOrderMutation.isPending,
    error,
    cartLines: lines,
    cartTotals: totals,
    cartCount: count,
    cartSubtotal: subtotal,
    coupon,
    instructions,
    updateQty,
    removeLine: remove,
    applyCoupon,
    removeCoupon,
  };
}
