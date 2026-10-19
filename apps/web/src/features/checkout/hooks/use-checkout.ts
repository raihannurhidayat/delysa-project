"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createOrder,
  uploadPaymentProof,
  type OrderResponse,
} from "../api/endpoints";
import { orderQueries } from "../api/query-keys";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import {
  checkoutFormSchema,
  DEFAULT_CHECKOUT_FORM,
  type CheckoutFormData,
} from "../schemas";
import type { CheckoutDraft } from "../types";
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
    const parsed = JSON.parse(raw);
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
  const { lines, totals, coupon, instructions, count, subtotal } =
    useMiniCart();
  const queryClient = useQueryClient();
  const guestToken = useMemo(() => getGuestToken() ?? crypto.randomUUID(), []);

  // Initialize guest token if not exists
  useEffect(() => {
    if (!getGuestToken()) {
      setGuestToken(guestToken);
    }
  }, [guestToken]);

  // Load draft on mount BEFORE form initialization
  const initialDraft = loadDraft(guestToken);

  // Initialize form with default values, ensuring all fields have proper defaults
  const defaultValues = initialDraft ?? {
    ...DEFAULT_CHECKOUT_FORM,
    recipientName: DEFAULT_CHECKOUT_FORM.recipientName ?? "",
    recipientPhone: DEFAULT_CHECKOUT_FORM.recipientPhone ?? "",
    shippingAddress: DEFAULT_CHECKOUT_FORM.shippingAddress ?? "",
    customNote: DEFAULT_CHECKOUT_FORM.customNote ?? "",
    confirmed: DEFAULT_CHECKOUT_FORM.confirmed ?? false,
    paymentProof: null,
  };

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues,
    mode: "onChange",
    // Force initial values to be set
    values: defaultValues,
  });

  // Manually set initial values after form creation to ensure they're registered
  useEffect(() => {
    Object.entries(defaultValues).forEach(([key, value]) => {
      form.setValue(
        key as keyof CheckoutFormData,
        value as CheckoutFormData[keyof CheckoutFormData],
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );
    });
  }, []);

  // Track draft state separately for return value
  const [draft, setDraft] = useState<CheckoutDraft | null>(initialDraft);

  // Initialize guest token if not exists
  useEffect(() => {
    if (!getGuestToken()) {
      setGuestToken(guestToken);
    }
  }, [guestToken]);

  // Persist draft on form change (debounced)
  const { watch } = form;
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const subscription = watch((value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const paymentProof = value.paymentProof;
        const file = paymentProof?.file;
        const preview = paymentProof?.preview;
        // Ensure step is always a valid CheckoutStep
        const currentStep = value.step ?? step;
        const draftData: CheckoutDraft = {
          step: currentStep,
          recipientName: value.recipientName ?? "",
          recipientPhone: value.recipientPhone ?? "",
          shippingAddress: value.shippingAddress ?? "",
          customNote: value.customNote ?? "",
          confirmed: value.confirmed ?? false,
          guestToken,
          updatedAt: Date.now(),
          paymentProof: file && preview ? { file, preview } : null,
        };
        saveDraft(guestToken, draftData);
        setDraft(draftData);
      }, 300);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [guestToken, watch]);

  // Step navigation (updates URL via navigate in component, here just local state)
  const [step, setStep] = useState<CheckoutFormData["step"]>("review");

  // Sync step from form on mount
  useEffect(() => {
    setStep(form.getValues("step") ?? "review");
  }, []);

  const goToStep = useCallback(
    async (newStep: CheckoutFormData["step"]) => {
      // Validate current step before allowing next
      const currentStep = form.getValues("step");
      if (["alamat", "bayar", "ringkasan"].includes(newStep)) {
        const validation = checkoutFormSchema.safeParse({
          ...form.getValues(),
          step: currentStep,
        });
        if (!validation.success && currentStep !== "review") {
          // Trigger validation errors for current step
          await form.trigger();
          return false;
        }
      }
      await form.setValue("step", newStep, { shouldValidate: false });
      setStep(newStep);
      return true;
    },
    [form],
  );

  // Create AbortController for timeout
  const orderAbortController = new AbortController();
  setTimeout(() => orderAbortController.abort(), 15_000);

  const createOrderMutation = useMutation({
    mutationFn: (input: Parameters<typeof createOrder>[0]) =>
      createOrder(input, orderAbortController.signal),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: orderQueries.all });
      return { previousLines: lines };
    },
    onError: (err, _input, context) => {
      // Convert STOCK_INSUFFICIENT error to user-friendly message
      let errorMessage = "";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else {
        errorMessage = String(err);
      }

      if (errorMessage.includes("STOCK_INSUFFICIENT")) {
        // Replace the error with user-friendly message
        Object.assign(err, {
          message: "Stok tidak mencukupi, silakan perbarui keranjang",
        });
      }
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
      recipientName: formData.recipientName ?? "",
      recipientPhone: formData.recipientPhone ?? "",
      shippingAddress: formData.shippingAddress ?? "",
      customNote: formData.customNote || undefined,
      idempotencyKey,
    };

    try {
      const order = await createOrderMutation.mutateAsync(input);
      clearDraft(guestToken);
      return order;
    } catch {
      // Error is handled by mutation's onError, just re-throw for caller
      throw createOrderMutation.error;
    }
  }, [step, form, createOrderMutation, guestToken]);

  // Upload payment proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: ({ orderId, file }: { orderId: number; file: File }) =>
      uploadPaymentProof(orderId, file),
    onError: (err) => console.error("Upload proof failed:", err),
  });

  const uploadProof = useCallback(
    async (orderId: number, file: File) => {
      return uploadProofMutation.mutateAsync({ orderId, file });
    },
    [uploadProofMutation],
  );

  const error =
    createOrderMutation.error?.message ??
    uploadProofMutation.error?.message ??
    null;

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
