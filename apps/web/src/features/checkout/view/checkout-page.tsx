"use client";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ShoppingBag } from "lucide-react";
import { FormProvider } from "react-hook-form";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { OrderSummary } from "~/features/shop/components/cart/order-summary";
import { CheckoutStepper } from "../components/CheckoutStepper";
import { CheckoutSuccess } from "../components/CheckoutSuccess";
import { AlamatStep } from "../components/steps/AlamatStep";
import { MetodeBayarStep } from "../components/steps/MetodeBayarStep";
import { ReviewCartStep } from "../components/steps/ReviewCartStep";
import { RingkasanStep } from "../components/steps/RingkasanStep";
import { useCheckout } from "../hooks/use-checkout";
import type { SubmitOrderResult } from "../hooks/use-checkout";
import { CHECKOUT_STEPS, type CheckoutStep } from "../types";

interface CheckoutPageProps {
  step: CheckoutStep;
  onStepChange: (step: CheckoutStep) => void;
}

export function CheckoutPage({ step, onStepChange }: CheckoutPageProps) {
  const {
    form,
    goToStep,
    submitOrder,
    isSubmitting,
    error,
    cartLines,
    cartTotals,
    coupon,
    applyCoupon,
    removeCoupon,
    updateQty,
    removeLine,
  } = useCheckout({ step });

  const [mounted, setMounted] = useState(false);
  const [isFinalizing, setFinalizing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitOrderResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const go = async (next: CheckoutStep) => {
    const allowed = await goToStep(next);
    if (allowed) onStepChange(next);
  };

  const goBack = () => {
    const index = CHECKOUT_STEPS.indexOf(step);
    if (index > 0) onStepChange(CHECKOUT_STEPS[index - 1]);
  };

  const goNext = () => {
    const index = CHECKOUT_STEPS.indexOf(step);
    const next = CHECKOUT_STEPS[index + 1];
    if (next) void go(next);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setFinalizing(true);
    try {
      const submitted = await submitOrder();
      setResult(submitted);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal membuat pesanan",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const stockError = (submitError ?? error ?? "")
    .toLowerCase()
    .includes("stok tidak mencukupi");

  const breadcrumb = (
    <Breadcrumb className="pt-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/keranjang" />}>
            Keranjang
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Checkout</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (!mounted) {
    return (
      <main
        className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6"
        aria-busy="true"
        aria-label="Memuat checkout"
      >
        {breadcrumb}
        <div className="mt-4 h-10 w-56 animate-pulse rounded-lg bg-[#F3F4F6]" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-[#F3F4F6]" />
      </main>
    );
  }

  if (result) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6">
        {breadcrumb}
        <div className="mt-6">
          <CheckoutSuccess
            order={result.order}
            proofError={result.proofError}
          />
        </div>
      </main>
    );
  }

  if (cartLines.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6">
        {breadcrumb}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <ShoppingBag
            size={64}
            className="text-[#E5E7EB]"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#1A1A1A]">
              Keranjang kosong
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Tambahkan rangkaian ke keranjang sebelum melanjutkan checkout.
            </p>
          </div>
          <Button
            render={<Link to="/katalog" />}
            className="mt-2 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            Jelajahi Katalog
          </Button>
        </div>
      </main>
    );
  }

  const activeError = submitError ?? error;

  return (
    <FormProvider {...form}>
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6">
        {breadcrumb}

        <div className="mt-2">
          <h1 className="text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
            Checkout
          </h1>
          <p className="mt-0.5 text-xs text-[#6B7280] sm:text-[13px]">
            Selesaikan pesananmu dalam 4 langkah — data tersimpan otomatis.
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <CheckoutStepper
                currentStep={step}
                onStepClick={(target) => void go(target)}
              />
            </div>

            {activeError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle className="text-sm font-semibold">
                  {stockError ? "Stok tidak mencukupi" : "Terjadi kesalahan"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {activeError}
                  {stockError && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void go("review")}
                      className="mt-2 w-full rounded-full"
                    >
                      Perbarui Keranjang
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div
              className="mt-4"
              role="region"
              aria-label={`Langkah ${CHECKOUT_STEPS.indexOf(step) + 1} dari ${CHECKOUT_STEPS.length}`}
            >
              {step === "review" && (
                <ReviewCartStep
                  lines={cartLines}
                  onQtyChange={updateQty}
                  onRemove={removeLine}
                  onNext={goNext}
                />
              )}
              {step === "alamat" && (
                <AlamatStep onBack={goBack} onNext={goNext} />
              )}
              {step === "bayar" && (
                <MetodeBayarStep
                  cartTotals={cartTotals}
                  onBack={goBack}
                  onNext={goNext}
                />
              )}
              {step === "ringkasan" && (
                <RingkasanStep
                  lines={cartLines}
                  cartTotals={cartTotals}
                  coupon={coupon}
                  isSubmitting={isSubmitting || isFinalizing}
                  onBack={goBack}
                  onSubmit={() => void handleSubmit()}
                />
              )}
            </div>
          </div>

          <aside
            className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start"
            aria-label="Ringkasan belanja"
          >
            <OrderSummary
              totals={cartTotals}
              coupon={coupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              checkoutDisabled
              hideActions
            />
          </aside>
        </div>
      </main>
    </FormProvider>
  );
}
